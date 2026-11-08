export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
}

export class OllamaRuntimeError extends Error {
  constructor(
    message: string,
    readonly statusCode = 502,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'OllamaRuntimeError';
  }
}

function validateModelName(model: string): string {
  const normalized = model.trim();
  if (
    normalized.length < 1 ||
    normalized.length > 200 ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(normalized)
  ) {
    throw new OllamaRuntimeError('Invalid Ollama model identifier.', 400);
  }
  return normalized;
}

export class OllamaRuntime {
  private readonly baseUrl: string;

  constructor(baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434') {
    let parsed: URL;
    try {
      parsed = new URL(baseUrl);
    } catch (error) {
      throw new OllamaRuntimeError('OLLAMA_BASE_URL must be an absolute URL.', 500, {
        cause: error,
      });
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new OllamaRuntimeError('OLLAMA_BASE_URL must use HTTP or HTTPS.', 500);
    }
    this.baseUrl = parsed.toString().replace(/\/+$/, '');
  }

  async status(): Promise<{
    connected: boolean;
    version?: string;
    modelCount?: number;
    error?: string;
  }> {
    try {
      const [versionResponse, tagsResponse] = await Promise.all([
        fetch(`${this.baseUrl}/api/version`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) }),
      ]);
      if (!versionResponse.ok || !tagsResponse.ok) {
        return { connected: false, error: 'Ollama returned an unsuccessful status response.' };
      }
      const [versionData, tagsData] = await Promise.all([
        versionResponse.json() as Promise<{ version?: string }>,
        tagsResponse.json() as Promise<{ models?: OllamaModel[] }>,
      ]);
      return {
        connected: true,
        version: versionData.version,
        modelCount: Array.isArray(tagsData.models) ? tagsData.models.length : 0,
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unable to reach Ollama.',
      };
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    const response = await this.request('/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });
    const data = (await response.json()) as { models?: OllamaModel[] };
    if (!Array.isArray(data.models)) {
      throw new OllamaRuntimeError('Ollama returned an invalid model list.');
    }
    return data.models;
  }

  async pullModel(
    modelName: string,
    onProgress?: (progress: { status?: string; completed?: number; total?: number }) => void
  ): Promise<{ model: string; status: string }> {
    const model = validateModelName(modelName);
    const response = await this.request('/api/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, stream: true }),
      signal: AbortSignal.timeout(60 * 60 * 1000),
    });
    if (!response.body) throw new OllamaRuntimeError('Ollama returned no download progress stream.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let latestStatus = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          let update: { status?: string; completed?: number; total?: number; error?: string };
          try {
            update = JSON.parse(line) as typeof update;
          } catch (error) {
            throw new OllamaRuntimeError('Ollama returned malformed download progress.', 502, {
              cause: error,
            });
          }
          if (update.error) throw new OllamaRuntimeError(`Ollama pull failed: ${update.error}`);
          latestStatus = update.status || latestStatus;
          onProgress?.(update);
        }
        if (done) break;
      }
    } finally {
      reader.releaseLock();
    }
    if (buffer.trim()) {
      const finalUpdate = JSON.parse(buffer) as { status?: string; error?: string };
      if (finalUpdate.error) throw new OllamaRuntimeError(`Ollama pull failed: ${finalUpdate.error}`);
      latestStatus = finalUpdate.status || latestStatus;
    }
    if (latestStatus !== 'success') {
      throw new OllamaRuntimeError(`Ollama pull did not report success (last status: ${latestStatus || 'none'}).`);
    }
    return { model, status: latestStatus };
  }

  async chat(
    modelName: string,
    messages: OllamaChatMessage[]
  ): Promise<{ model: string; response: string; done: boolean }> {
    const model = validateModelName(modelName);
    if (messages.length < 1 || messages.length > 100) {
      throw new OllamaRuntimeError('Provide between 1 and 100 chat messages.', 400);
    }
    const response = await this.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false }),
      signal: AbortSignal.timeout(5 * 60 * 1000),
    });
    const data = (await response.json()) as {
      model?: string;
      message?: { content?: string };
      done?: boolean;
      error?: string;
    };
    if (data.error) throw new OllamaRuntimeError(`Ollama inference failed: ${data.error}`);
    if (typeof data.message?.content !== 'string' || !data.message.content.trim()) {
      throw new OllamaRuntimeError('Ollama returned an empty model response.');
    }
    return { model: data.model || model, response: data.message.content, done: data.done === true };
  }

  async exportModelfile(modelName: string): Promise<{ model: string; modelfile: string }> {
    const model = validateModelName(modelName);
    const response = await this.request('/api/show', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, verbose: false }),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await response.json()) as { modelfile?: string; error?: string };
    if (data.error) throw new OllamaRuntimeError(`Ollama export failed: ${data.error}`);
    if (typeof data.modelfile !== 'string' || !data.modelfile.trim()) {
      throw new OllamaRuntimeError('Ollama did not provide a Modelfile for this model.');
    }
    return { model, modelfile: data.modelfile };
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, init);
    } catch (error) {
      throw new OllamaRuntimeError(
        'Ollama runtime is unavailable. Start Ollama and verify OLLAMA_BASE_URL.',
        503,
        { cause: error }
      );
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new OllamaRuntimeError(
        `Ollama request failed with HTTP ${response.status}${body ? `: ${body.slice(0, 400)}` : ''}`,
        response.status >= 400 && response.status < 500 ? response.status : 502
      );
    }
    return response;
  }
}
