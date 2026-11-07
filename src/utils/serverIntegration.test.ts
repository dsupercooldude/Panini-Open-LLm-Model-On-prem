import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

async function listen(handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>) {
  const server = createServer((request, response) => void handler(request, response));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return {
    server,
    port: address.port,
    close: () => new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    ),
  };
}

async function reservePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
  return port;
}

async function startServer(env: NodeJS.ProcessEnv, port: number): Promise<ChildProcess> {
  const child = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, ...env, PORT: String(port), PANINI_BIND_HOST: '127.0.0.1' },
    stdio: 'ignore',
  });
  const url = `http://127.0.0.1:${port}/api/auth/session`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Server exited during startup with code ${child.exitCode}.`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (response.ok) return child;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  child.kill();
  await once(child, 'exit');
  throw new Error('Server did not become ready within 10 seconds.');
}

async function stopServer(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
}

test('production API serves online chat and restores authenticated sessions after restart', async (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'panini-server-'));
  const port = await reservePort();
  const mockProvider = await listen(async (request, response) => {
    if (request.url === '/v1/chat/completions') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({
        model: 'test-chat-model',
        choices: [{ message: { content: 'Integrated provider response' } }],
      }));
      return;
    }
    if (request.url === '/v1/files') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ id: 'file-integrated' }));
      return;
    }
    if (request.url === '/v1/fine_tuning/jobs') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ id: 'ftjob-integrated', status: 'queued', model: 'test-chat-model' }));
      return;
    }
    if (request.url === '/v1/fine_tuning/jobs/ftjob-integrated') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ id: 'ftjob-integrated', status: 'succeeded', model: 'test-chat-model' }));
      return;
    }
    if (request.url === '/v1/audio/speech') {
      const wav = Buffer.alloc(64);
      wav.write('RIFF', 0);
      wav.write('WAVE', 8);
      response.setHeader('Content-Type', 'audio/wav');
      response.end(wav);
      return;
    }
    if (request.url === '/v1/audio/transcriptions') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ text: 'Integrated transcription result' }));
      return;
    }
    response.statusCode = 404;
    response.end('not found');
  });
  const env = {
    NODE_ENV: 'production',
    PANINI_ADMIN_USERNAME: 'integration-admin',
    PANINI_ADMIN_PASSWORD: 'integration-test-password-long-enough',
    PANINI_TRUST_PROXY: '1',
    PANINI_DB_PATH: path.join(directory, 'panini.sqlite'),
    PANINI_JSON_DB_PATH: path.join(directory, 'legacy.json'),
    OPENAI_API_KEY: 'integration-test-key',
    OPENAI_CHAT_MODEL: 'test-chat-model',
    OPENAI_API_BASE_URL: `http://127.0.0.1:${mockProvider.port}/v1`,
  };

  let child: ChildProcess | undefined;
  t.after(async () => {
    if (child) await stopServer(child);
    await mockProvider.close();
    rmSync(directory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  child = await startServer(env, port);
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl,
      'X-Forwarded-Proto': 'https',
    },
    body: JSON.stringify({
      username: 'integration-admin',
      password: 'integration-test-password-long-enough',
    }),
  });
  assert.equal(loginResponse.status, 200);
  const cookie = loginResponse.headers.get('set-cookie')?.split(';', 1)[0];
  assert.ok(cookie);

  const chatResponse = await fetch(`${baseUrl}/api/llm/online/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: baseUrl },
    body: JSON.stringify({
      model: 'test-chat-model',
      messages: [{ role: 'user', content: 'Hello' }],
    }),
  });
  assert.equal(chatResponse.status, 200);
  assert.equal((await chatResponse.json()).response, 'Integrated provider response');

  const examples = Array.from({ length: 10 }, (_, index) => ({
    messages: [
      { role: 'user', content: `Question ${index}` },
      { role: 'assistant', content: `Answer ${index}` },
    ],
  }));
  const trainingResponse = await fetch(`${baseUrl}/api/llm/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: baseUrl },
    body: JSON.stringify({ model: 'test-chat-model', examples }),
  });
  assert.equal(trainingResponse.status, 202);
  assert.equal((await trainingResponse.json()).job.id, 'ftjob-integrated');
  const trainingStatusResponse = await fetch(
    `${baseUrl}/api/llm/train/jobs/ftjob-integrated`,
    { headers: { Cookie: cookie, Origin: baseUrl } }
  );
  assert.equal((await trainingStatusResponse.json()).job.status, 'succeeded');
  const savedJobs = await fetch(`${baseUrl}/api/llm/train/jobs`, {
    headers: { Cookie: cookie, Origin: baseUrl },
  });
  assert.equal((await savedJobs.json()).jobs[0].status, 'succeeded');

  const speechResponse = await fetch(`${baseUrl}/api/v63/tts/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: baseUrl },
    body: JSON.stringify({ text: 'Speak this test sentence.', voiceId: 'alloy' }),
  });
  const speechResult = await speechResponse.json();
  assert.equal(speechResponse.status, 200);
  assert.equal(speechResult.ttsResult.voiceUsed, 'alloy');
  assert.match(speechResult.ttsResult.audioDataUrl, /^data:audio\/wav;base64,/);

  const transcriptionResponse = await fetch(`${baseUrl}/api/multimodal/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: baseUrl },
    body: JSON.stringify({
      audioBase64: Buffer.alloc(64).toString('base64'),
      filename: 'recording.wav',
      contentType: 'audio/wav',
    }),
  });
  assert.equal(transcriptionResponse.status, 200);
  assert.equal((await transcriptionResponse.json()).transcription.transcript, 'Integrated transcription result');

  await stopServer(child);
  child = await startServer(env, port);
  const restoredSession = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: cookie },
  });
  assert.deepEqual(await restoredSession.json(), { authRequired: true, authenticated: true });

  const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookie, Origin: baseUrl },
  });
  assert.equal(logoutResponse.status, 200);
  const revokedSession = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: cookie },
  });
  assert.deepEqual(await revokedSession.json(), { authRequired: true, authenticated: false });
});
