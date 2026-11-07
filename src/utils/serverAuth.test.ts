import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SessionAuthenticator } from './serverAuth';
import { SqliteStore } from './sqliteStore';

test('session authenticator restores and revokes sessions through persistent storage', (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'panini-auth-'));
  const databasePath = path.join(directory, 'sessions.sqlite');
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const firstStore = new SqliteStore(databasePath);
  const firstAuth = new SessionAuthenticator('admin', 'correct horse battery staple', firstStore);
  const sessionId = firstAuth.login('admin', 'correct horse battery staple', 1000);
  assert.ok(sessionId);
  firstStore.close();

  const reopenedStore = new SqliteStore(databasePath);
  const restartedAuth = new SessionAuthenticator(
    'admin',
    'correct horse battery staple',
    reopenedStore
  );
  assert.equal(restartedAuth.isAuthenticated(sessionId || undefined, 1001), true);
  restartedAuth.logout(sessionId || undefined);
  assert.equal(restartedAuth.isAuthenticated(sessionId || undefined, 1002), false);
  reopenedStore.close();
});

test('session authenticator accepts configured credentials and revokes sessions on logout', () => {
  const auth = new SessionAuthenticator('admin', 'correct horse battery staple');
  const sessionId = auth.login('admin', 'correct horse battery staple', 1000);

  assert.ok(sessionId);
  assert.equal(auth.isAuthenticated(sessionId, 1001), true);
  auth.logout(sessionId || undefined);
  assert.equal(auth.isAuthenticated(sessionId || undefined, 1002), false);
});

test('session authenticator rejects invalid credentials and expires sessions', () => {
  const auth = new SessionAuthenticator('admin', 'correct horse battery staple');

  assert.equal(auth.login('other', 'correct horse battery staple', 1000), null);
  assert.equal(auth.login('admin', 'incorrect password', 1000), null);

  const sessionId = auth.login('admin', 'correct horse battery staple', 1000);
  assert.ok(sessionId);
  assert.equal(auth.isAuthenticated(sessionId, 8 * 60 * 60 * 1000 + 1001), false);
});

test('session authenticator does not accept a missing session identifier', () => {
  const auth = new SessionAuthenticator('admin', 'correct horse battery staple');
  assert.equal(auth.isAuthenticated(undefined), false);
});
