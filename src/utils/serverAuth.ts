import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const SESSION_ID_BYTES = 32;
const PASSWORD_HASH_BYTES = 64;

export interface AuthSessionStore {
  createSession(sessionId: string, expiresAt: number, createdAt: number): void;
  getSessionExpiry(sessionId: string): number | undefined;
  deleteSession(sessionId: string): void;
  deleteExpiredSessions(now: number): void;
}

export class SessionAuthenticator {
  private readonly configuredUsername: Buffer;
  private readonly configuredPasswordHash: Buffer;
  private readonly sessions = new Map<string, number>();
  private readonly sessionStore?: AuthSessionStore;

  constructor(username: string, password: string, sessionStore?: AuthSessionStore) {
    this.configuredUsername = Buffer.from(username);
    this.configuredPasswordHash = scryptSync(password, 'panini-admin-auth-v1', PASSWORD_HASH_BYTES);
    this.sessionStore = sessionStore;
  }

  login(username: string, password: string, now = Date.now()): string | null {
    const suppliedUsername = Buffer.from(username);
    const suppliedPasswordHash = scryptSync(
      password,
      'panini-admin-auth-v1',
      PASSWORD_HASH_BYTES
    );
    const usernameMatches =
      suppliedUsername.length === this.configuredUsername.length &&
      timingSafeEqual(suppliedUsername, this.configuredUsername);
    const passwordMatches = timingSafeEqual(suppliedPasswordHash, this.configuredPasswordHash);

    if (!usernameMatches || !passwordMatches) return null;

    this.removeExpiredSessions(now);
    if (this.sessionStore) this.sessionStore.deleteExpiredSessions(now);
    if (!this.sessionStore && this.sessions.size >= 1000) return null;

    const sessionId = randomBytes(SESSION_ID_BYTES).toString('base64url');
    const expiresAt = now + SESSION_TTL_MS;
    if (this.sessionStore) this.sessionStore.createSession(sessionId, expiresAt, now);
    else this.sessions.set(sessionId, expiresAt);
    return sessionId;
  }

  isAuthenticated(sessionId: string | undefined, now = Date.now()): boolean {
    if (!sessionId) return false;
    const expiresAt = this.sessionStore
      ? this.sessionStore.getSessionExpiry(sessionId)
      : this.sessions.get(sessionId);
    if (!expiresAt) return false;
    if (expiresAt <= now) {
      if (this.sessionStore) this.sessionStore.deleteSession(sessionId);
      else this.sessions.delete(sessionId);
      return false;
    }
    return true;
  }

  logout(sessionId: string | undefined): void {
    if (sessionId) {
      if (this.sessionStore) this.sessionStore.deleteSession(sessionId);
      else this.sessions.delete(sessionId);
    }
  }

  private removeExpiredSessions(now: number): void {
    for (const [sessionId, expiresAt] of this.sessions) {
      if (expiresAt <= now) this.sessions.delete(sessionId);
    }
  }
}
