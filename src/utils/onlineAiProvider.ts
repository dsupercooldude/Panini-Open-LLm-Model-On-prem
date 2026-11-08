export class OnlineAiProviderError extends Error {
  constructor(message: string, readonly statusCode = 502) {
    super(message);
    this.name = 'OnlineAiProviderError';
  }
}

function providerConfig(): { baseUrl: string; apiKey: string } {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new OnlineAiProviderError(
      'Online AI provider is not configured. Set OPENAI_API_KEY and OPENAI_API_BASE_URL.',
      503
    );
  }
  const baseUrl = (process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1').replace(
    /\/+$/,
    ''
  );
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new OnlineAiProviderError('OPENAI_API_BASE_URL must be an absolute URL.', 500);
  }
  if (!['https:', 'http:'].includes(url.protocol)) {
    throw new OnlineAiProviderError('OPENAI_API_BASE_URL must use HTTP or HTTPS.', 500);
  }
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new OnlineAiProviderError('Production online AI providers must use HTTPS.', 500);
  }
  return { baseUrl: url.toString().replace(/\/+$/, ''), apiKey };
}

async function providerRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const { baseUrl, apiKey } = providerConfig();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...init.headers,
      },
      signal: init.signal || AbortSignal.timeout(5 * 60 * 1000),
    });
  } catch {
    throw new OnlineAiProviderError('Configured online AI provider could not be reached.', 503);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new OnlineAiProviderError(
      `Online AI provider returned HTTP ${response.status}${body ? `: ${body.slice(0, 400)}` : ''}`,
      response.status >= 400 && response.status < 500 ? response.status : 502
    );
  }
  return response;
}

function validateModelName(modelName: unknown): string {
  if (
    typeof modelName !== 'string' ||
    modelName.length > 200 ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(modelName)
  ) {
    throw new OnlineAiProviderError('A valid provider model identifier is required.', 400);
  }
  return modelName;
}

export async function createChatCompletion(input: {
  model: unknown;
  messages: Array<{ role: string; content: string }>;
}): Promise<{ model: string; response: string }> {
  const model = validateModelName(input.model);
  if (
    !Array.isArray(input.messages) ||
    input.messages.length < 1 ||
    input.messages.length > 100 ||
    !input.messages.every(
      (message) =>
        ['system', 'user', 'assistant'].includes(message.role) &&
        typeof message.content === 'string' &&
        message.content.length <= 50000
    )
  ) {
    throw new OnlineAiProviderError('Provide between 1 and 100 valid chat messages.', 400);
  }
  const response = await providerRequest('/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: input.messages, stream: false }),
  });
  const result = (await response.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = result.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new OnlineAiProviderError('Online AI provider returned an empty response.');
  }
  return { model: result.model || model, response: content };
}

export async function generateImage(input: {
  prompt: string;
  model?: string;
  size?: string;
}): Promise<{ imageDataUrl: string; model: string }> {
  if (!input.prompt.trim() || input.prompt.length > 10000) {
    throw new OnlineAiProviderError('Image prompts must contain 1 to 10,000 characters.', 400);
  }
  const model = validateModelName(input.model || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1');
  const response = await providerRequest('/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: input.prompt,
      size: input.size || '1536x1024',
      n: 1,
      output_format: 'png',
    }),
    signal: AbortSignal.timeout(3 * 60 * 1000),
  });
  const result = (await response.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  const image = result.data?.[0];
  if (typeof image?.b64_json === 'string' && image.b64_json.length > 0) {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(image.b64_json)) {
      throw new OnlineAiProviderError('Image provider returned malformed image data.', 502);
    }
    const bytes = Buffer.from(image.b64_json, 'base64');
    if (
      bytes.length < 16 ||
      bytes.length > 25 * 1024 * 1024 ||
      bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
    ) {
      throw new OnlineAiProviderError('Image provider returned an invalid or oversized image.', 502);
    }
    return { imageDataUrl: `data:image/png;base64,${bytes.toString('base64')}`, model };
  }
  throw new OnlineAiProviderError('Image provider returned no image artifact.', 502);
}

export async function createFineTuningJob(input: {
  model: unknown;
  examples: Array<{ messages: Array<{ role: string; content: string }> }>;
}): Promise<Record<string, unknown>> {
  const model = validateModelName(input.model);
  if (!Array.isArray(input.examples) || input.examples.length < 10 || input.examples.length > 10000) {
    throw new OnlineAiProviderError('Provide between 10 and 10,000 supervised training examples.', 400);
  }
  const lines = input.examples.map((example, index) => {
    if (
      !example ||
      !Array.isArray(example.messages) ||
      example.messages.length < 2 ||
      example.messages.length > 100 ||
      !example.messages.every(
        (message) =>
          ['system', 'user', 'assistant'].includes(message.role) &&
          typeof message.content === 'string' &&
          message.content.length > 0 &&
          message.content.length <= 20000
      ) ||
      !example.messages.some((message) => message.role === 'user') ||
      !example.messages.some((message) => message.role === 'assistant')
    ) {
      throw new OnlineAiProviderError(`Training example ${index + 1} has an invalid messages shape.`, 400);
    }
    return JSON.stringify({ messages: example.messages });
  });
  const jsonl = new Blob([lines.join('\n')], { type: 'application/jsonl' });
  const form = new FormData();
  form.append('file', jsonl, 'panini-training.jsonl');
  form.append('purpose', 'fine-tune');
  const fileResponse = await providerRequest('/files', { method: 'POST', body: form });
  const file = (await fileResponse.json()) as { id?: string };
  if (!file.id) throw new OnlineAiProviderError('The provider did not return a training file ID.');

  const jobResponse = await providerRequest('/fine_tuning/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, training_file: file.id, method: { type: 'supervised' } }),
  });
  return (await jobResponse.json()) as Record<string, unknown>;
}

export async function getFineTuningJob(jobId: string): Promise<Record<string, unknown>> {
  if (!/^ftjob-[a-zA-Z0-9_-]{1,200}$/.test(jobId)) {
    throw new OnlineAiProviderError('Invalid fine-tuning job identifier.', 400);
  }
  const response = await providerRequest(`/fine_tuning/jobs/${encodeURIComponent(jobId)}`);
  return (await response.json()) as Record<string, unknown>;
}

export async function synthesizeSpeech(input: {
  text: string;
  voice: string;
  model?: string;
}): Promise<{ audio: Uint8Array; contentType: string; model: string; voice: string }> {
  if (!input.text.trim() || input.text.length > 10000) {
    throw new OnlineAiProviderError('Speech text must contain 1 to 10,000 characters.', 400);
  }
  const model = validateModelName(input.model || process.env.OPENAI_TTS_MODEL || 'tts-1');
  const response = await providerRequest('/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: input.text, voice: input.voice || 'alloy', response_format: 'wav' }),
    signal: AbortSignal.timeout(2 * 60 * 1000),
  });
  const audio = new Uint8Array(await response.arrayBuffer());
  if (audio.length < 44 || audio.length > 50 * 1024 * 1024) {
    throw new OnlineAiProviderError('Speech provider returned an invalid or oversized audio artifact.');
  }
  return {
    audio,
    contentType: response.headers.get('content-type') || 'audio/wav',
    model,
    voice: input.voice || 'alloy',
  };
}

export async function transcribeAudio(input: {
  audio: Uint8Array;
  filename: string;
  contentType: string;
  model?: string;
}): Promise<{ text: string; model: string }> {
  if (input.audio.length < 1 || input.audio.length > 25 * 1024 * 1024) {
    throw new OnlineAiProviderError('Audio input must be between 1 byte and 25 MB.', 400);
  }
  const model = validateModelName(input.model || process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1');
  const form = new FormData();
  form.append(
    'file',
    new Blob([Uint8Array.from(input.audio)], { type: input.contentType || 'application/octet-stream' }),
    input.filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'audio.bin'
  );
  form.append('model', model);
  const response = await providerRequest('/audio/transcriptions', {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(2 * 60 * 1000),
  });
  const result = (await response.json()) as { text?: string };
  if (typeof result.text !== 'string' || !result.text.trim()) {
    throw new OnlineAiProviderError('Transcription provider returned no transcript.');
  }
  return { text: result.text, model };
}
