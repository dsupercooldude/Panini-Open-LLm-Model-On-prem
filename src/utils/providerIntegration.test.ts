import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { OllamaRuntime } from './ollamaRuntime';
import { SqliteStore } from './sqliteStore';
import {
  createChatCompletion,
  createFineTuningJob,
  generateImage,
  getFineTuningJob,
  synthesizeSpeech,
  transcribeAudio,
} from './onlineAiProvider';
import type { ClaimEvidenceCheck } from './researchVerification';

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
  let mockModels = [
    { name: 'qwen3:8b', model: 'qwen3:8b', size: 1000, digest: 'abc', modified_at: 'today' },
  ];
  const mock = await listen(async (request, response) => {
    if (request.url === '/api/version') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ version: '0.5.0' }));
    } else if (request.url === '/api/tags') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ models: mockModels }));
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
  assert.equal(await runtime.chooseLocalModel('minimax-m2.7:cloud'), 'qwen3:8b');
  assert.equal(await runtime.chooseLocalModel('qwen3:8b'), 'qwen3:8b');
  assert.deepEqual(await runtime.pullModel('qwen3:8b'), { model: 'qwen3:8b', status: 'success' });
  assert.equal((await runtime.chat('qwen3:8b', [{ role: 'user', content: 'hello' }])).response, 'A real mocked runtime response.');
  assert.match((await runtime.exportModelfile('qwen3:8b')).modelfile, /FROM qwen3:8b/);
  await assert.rejects(() => runtime.pullModel('../outside'), /Invalid Ollama model identifier/);
  mockModels = [
    { name: 'minimax-m2.7:cloud', model: 'minimax-m2.7:cloud', size: 302, digest: 'cloud', modified_at: 'today' },
  ];
  await assert.rejects(
    () => runtime.chooseLocalModel('minimax-m2.7:cloud'),
    /No local Ollama model is installed/
  );
});

test('OpenAI-compatible chat, fine-tuning, speech, and transcription use provider responses', async (t) => {
  const previous = {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_API_BASE_URL,
    imageModel: process.env.OPENAI_IMAGE_MODEL,
  };
  const wav = Buffer.alloc(64);
  wav.write('RIFF', 0);
  wav.write('WAVE', 8);
  const png = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png);
  png.write('IHDR', 12);
  png.writeUInt32BE(1024, 16);
  png.writeUInt32BE(1024, 20);
  const mock = await listen(async (request, response) => {
    const body = await readBody(request);
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/v1/chat/completions') {
      response.end(JSON.stringify({ model: 'test-chat', choices: [{ message: { content: 'Provider response' } }] }));
    } else if (request.url === '/v1/images/generations') {
      response.end(JSON.stringify({ data: [{ b64_json: png.toString('base64') }] }));
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
  process.env.OPENAI_IMAGE_MODEL = 'test-image';
  t.after(async () => {
    await mock.close();
    if (previous.apiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous.apiKey;
    if (previous.baseUrl === undefined) delete process.env.OPENAI_API_BASE_URL;
    else process.env.OPENAI_API_BASE_URL = previous.baseUrl;
    if (previous.imageModel === undefined) delete process.env.OPENAI_IMAGE_MODEL;
    else process.env.OPENAI_IMAGE_MODEL = previous.imageModel;
  });

  assert.deepEqual(
    await createChatCompletion({ model: 'test-chat', messages: [{ role: 'user', content: 'Hi' }] }),
    { model: 'test-chat', response: 'Provider response' }
  );
  const generatedImage = await generateImage({ prompt: 'A botanical illustration', size: '1024x1024' });
  assert.equal(generatedImage.model, 'test-image');
  assert.equal(generatedImage.width, 1024);
  assert.match(generatedImage.imageDataUrl, /^data:image\/png;base64,/);
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
  const claimChecks: ClaimEvidenceCheck[] = [
    {
      claim: 'Sample claim text',
      status: 'cross_source_supported',
      supportingSources: [
        {
          title: 'Source one',
          url: 'https://one.example/article',
          host: 'one.example',
          matchedTerms: ['sample', 'claim', 'text'],
        },
        {
          title: 'Source two',
          url: 'https://two.example/article',
          host: 'two.example',
          matchedTerms: ['sample', 'claim', 'text'],
        },
      ],
    },
  ];
  first.saveResearchValidation({
    query: 'example topic',
    sourceCount: 3,
    independentDomainCount: 2,
    validationStatus: 'multiple_hosts',
    sources: [{
      title: 'Source',
      url: 'https://example.com',
      domain: 'example.com',
      snippet: 'Stored source excerpt.',
    }],
    claimChecks,
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
  assert.deepEqual(reopened.listResearchValidations()[0].claimChecks, claimChecks);
  assert.equal(reopened.listTrainingJobs()[0].status, 'queued');
  reopened.deleteExpiredSessions(9000);
  assert.equal(reopened.getSessionExpiry('session-one'), undefined);
  reopened.close();
});

test('SQLite migrates existing research validation tables to retain claim evidence', (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'panini-sqlite-migration-'));
  const file = path.join(directory, 'state.sqlite');
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const legacyDb = new DatabaseSync(file);
  legacyDb.exec(`
    CREATE TABLE research_validations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      source_count INTEGER NOT NULL,
      independent_domain_count INTEGER NOT NULL,
      validation_status TEXT NOT NULL,
      sources_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    INSERT INTO research_validations
      (query, source_count, independent_domain_count, validation_status, sources_json, created_at)
    VALUES ('legacy', 1, 1, 'single_host', '[]', '2026-01-01T00:00:00.000Z');
  `);
  legacyDb.close();

  const migrated = new SqliteStore(file);
  assert.equal(migrated.listResearchValidations()[0].query, 'legacy');
  assert.deepEqual(migrated.listResearchValidations()[0].claimChecks, []);
  migrated.saveResearchValidation({
    query: 'new claim',
    sourceCount: 0,
    independentDomainCount: 0,
    validationStatus: 'unverified',
    sources: [],
    claimChecks: [{
      claim: 'An unverified claim',
      status: 'unverified',
      supportingSources: [],
    }],
    createdAt: '2026-01-02T00:00:00.000Z',
  });
  const persistedChecks = migrated.listResearchValidations()[0].claimChecks;
  assert.ok(persistedChecks);
  assert.equal(persistedChecks[0]?.status, 'unverified');
  migrated.close();
});
