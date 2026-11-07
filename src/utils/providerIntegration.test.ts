import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { OllamaRuntime } from './ollamaRuntime';
import { SqliteStore } from './sqliteStore';
import {
  createChatCompletion,
  createFineTuningJob,
  getFineTuningJob,
  synthesizeSpeech,
  transcribeAudio,
} from './onlineAiProvider';

async function listen(handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>) {
  const server: Server = createServer((request, response) => {
    void handler(request, response);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    ),
  };
}

async function readBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

test('Ollama runtime lists, pulls, infers, and exports actual runtime metadata', async (t) => {
  const mock = await listen(async (request, response) => {
    if (request.url === '/api/version') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ version: '0.5.0' }));
    } else if (request.url === '/api/tags') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ models: [{ name: 'qwen3:8b', model: 'qwen3:8b', size: 1000, digest: 'abc', modified_at: 'today' }] }));
    } else if (request.url === '/api/pull') {
      await readBody(request);
      response.setHeader('Content-Type', 'application/x-ndjson');
      response.end('{"status":"pulling manifest"}\n{"status":"success"}\n');
    } else if (request.url === '/api/chat') {
      await readBody(request);
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ model: 'qwen3:8b', message: { content: 'A real mocked runtime response.' }, done: true }));
    } else if (request.url === '/api/show') {
      await readBody(request);
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ modelfile: 'FROM qwen3:8b\nSYSTEM You are a helpful assistant.' }));
    } else {
      response.statusCode = 404;
      response.end('not found');
    }
  });
  t.after(mock.close);

  const runtime = new OllamaRuntime(mock.baseUrl);
  assert.deepEqual(await runtime.status(), { connected: true, version: '0.5.0', modelCount: 1 });
  assert.equal((await runtime.listModels())[0].name, 'qwen3:8b');
  assert.deepEqual(await runtime.pullModel('qwen3:8b'), { model: 'qwen3:8b', status: 'success' });
  assert.equal((await runtime.chat('qwen3:8b', [{ role: 'user', content: 'hello' }])).response, 'A real mocked runtime response.');
  assert.match((await runtime.exportModelfile('qwen3:8b')).modelfile, /FROM qwen3:8b/);
  await assert.rejects(() => runtime.pullModel('../outside'), /Invalid Ollama model identifier/);
});

test('OpenAI-compatible chat, fine-tuning, speech, and transcription use provider responses', async (t) => {
  const previous = {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_API_BASE_URL,
  };
  const wav = Buffer.alloc(64);
  wav.write('RIFF', 0);
  wav.write('WAVE', 8);
  const mock = await listen(async (request, response) => {
    const body = await readBody(request);
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/v1/chat/completions') {
      response.end(JSON.stringify({ model: 'test-chat', choices: [{ message: { content: 'Provider response' } }] }));
    } else if (request.url === '/v1/files') {
      assert.match(request.headers['content-type'] || '', /multipart\/form-data/);
      response.end(JSON.stringify({ id: 'file-test' }));
    } else if (request.url === '/v1/fine_tuning/jobs') {
      assert.equal(JSON.parse(body.toString()).training_file, 'file-test');
      response.end(JSON.stringify({ id: 'ftjob-test123', status: 'queued', model: 'test-model' }));
    } else if (request.url === '/v1/fine_tuning/jobs/ftjob-test123') {
      response.end(JSON.stringify({ id: 'ftjob-test123', status: 'succeeded', model: 'test-model' }));
    } else if (request.url === '/v1/audio/speech') {
      response.setHeader('Content-Type', 'audio/wav');
      response.end(wav);
    } else if (request.url === '/v1/audio/transcriptions') {
      assert.match(request.headers['content-type'] || '', /multipart\/form-data/);
      response.end(JSON.stringify({ text: 'Recorded words from the microphone.' }));
    } else {
      response.statusCode = 404;
      response.end(JSON.stringify({ error: 'not found' }));
    }
  });
  process.env.OPENAI_API_KEY = 'test-key-not-a-secret';
  process.env.OPENAI_API_BASE_URL = `${mock.baseUrl}/v1`;
  t.after(async () => {
    await mock.close();
    if (previous.apiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous.apiKey;
    if (previous.baseUrl === undefined) delete process.env.OPENAI_API_BASE_URL;
    else process.env.OPENAI_API_BASE_URL = previous.baseUrl;
  });

  assert.deepEqual(
    await createChatCompletion({ model: 'test-chat', messages: [{ role: 'user', content: 'Hi' }] }),
    { model: 'test-chat', response: 'Provider response' }
  );
  const examples = Array.from({ length: 10 }, (_, index) => ({
    messages: [
      { role: 'user', content: `Question ${index}` },
      { role: 'assistant', content: `Answer ${index}` },
    ],
  }));
  const job = await createFineTuningJob({ model: 'test-model', examples });
  assert.equal(job.id, 'ftjob-test123');
  assert.equal((await getFineTuningJob('ftjob-test123')).status, 'succeeded');
  assert.equal((await synthesizeSpeech({ text: 'Hello', voice: 'alloy', model: 'tts-1' })).audio.byteLength, 64);
  assert.equal(
    (await transcribeAudio({
      audio: Uint8Array.from(wav),
      filename: 'recording.wav',
      contentType: 'audio/wav',
    })).text,
    'Recorded words from the microphone.'
  );
  await assert.rejects(
    () => createFineTuningJob({ model: 'test-model', examples: [] }),
    /between 10 and 10,000/
  );
});

test('SQLite persists sessions, validated-source records, and training jobs across connections', (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'panini-sqlite-'));
  const file = path.join(directory, 'state.sqlite');
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const first = new SqliteStore(file);
  first.createSession('session-one', 9000, 1000);
  first.saveResearchValidation({
    query: 'example topic',
    sourceCount: 3,
    independentDomainCount: 2,
    validationStatus: 'multiple_hosts',
    sources: [{ title: 'Source', url: 'https://example.com', domain: 'example.com' }],
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  first.saveTrainingJob({
    jobId: 'ftjob-test123',
    modelName: 'test-model',
    status: 'queued',
    provider: 'openai-compatible',
    createdAt: '2026-01-01T00:00:00.000Z',
    detail: { id: 'ftjob-test123' },
  });
  first.close();

  const reopened = new SqliteStore(file);
  assert.equal(reopened.getSessionExpiry('session-one'), 9000);
  assert.equal(reopened.listResearchValidations()[0].independentDomainCount, 2);
  assert.equal(reopened.listTrainingJobs()[0].status, 'queued');
  reopened.deleteExpiredSessions(9000);
  assert.equal(reopened.getSessionExpiry('session-one'), undefined);
  reopened.close();
});
