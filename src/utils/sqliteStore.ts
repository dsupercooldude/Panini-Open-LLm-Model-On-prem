import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface SessionRecordStore {
  createSession(sessionId: string, expiresAt: number, createdAt: number): void;
  getSessionExpiry(sessionId: string): number | undefined;
  deleteSession(sessionId: string): void;
  deleteExpiredSessions(now: number): void;
}

export interface ResearchValidationRecord {
  query: string;
  sourceCount: number;
  independentDomainCount: number;
  validationStatus: 'multiple_hosts' | 'single_host' | 'unverified';
  sources: Array<{
    title: string;
    url: string;
    domain: string;
    sourceEngine?: string;
    excerpt?: string;
  }>;
  createdAt: string;
}

export class SqliteStore implements SessionRecordStore {
  private readonly db: DatabaseSync;

  constructor(filePath: string) {
    if (filePath !== ':memory:') mkdirSync(path.dirname(filePath), { recursive: true });
    this.db = new DatabaseSync(filePath);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_expires_at ON sessions(expires_at);
      CREATE TABLE IF NOT EXISTS research_validations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        source_count INTEGER NOT NULL,
        independent_domain_count INTEGER NOT NULL,
        validation_status TEXT NOT NULL,
        sources_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS model_training_jobs (
        job_id TEXT PRIMARY KEY,
        model_name TEXT NOT NULL,
        status TEXT NOT NULL,
        provider TEXT NOT NULL,
        created_at TEXT NOT NULL,
        detail_json TEXT NOT NULL
      );
    `);
  }

  createSession(sessionId: string, expiresAt: number, createdAt: number): void {
    this.db
      .prepare('INSERT INTO sessions(session_id, expires_at, created_at) VALUES (?, ?, ?)')
      .run(sessionId, expiresAt, createdAt);
  }

  getSessionExpiry(sessionId: string): number | undefined {
    const row = this.db
      .prepare('SELECT expires_at FROM sessions WHERE session_id = ?')
      .get(sessionId) as { expires_at: number } | undefined;
    return row?.expires_at;
  }

  deleteSession(sessionId: string): void {
    this.db.prepare('DELETE FROM sessions WHERE session_id = ?').run(sessionId);
  }

  deleteExpiredSessions(now: number): void {
    this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
  }

  saveResearchValidation(record: ResearchValidationRecord): void {
    this.db
      .prepare(
        `INSERT INTO research_validations
          (query, source_count, independent_domain_count, validation_status, sources_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        record.query,
        record.sourceCount,
        record.independentDomainCount,
        record.validationStatus,
        JSON.stringify(record.sources),
        record.createdAt
      );
  }

  listResearchValidations(limit = 50): ResearchValidationRecord[] {
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = this.db
      .prepare(
        `SELECT query, source_count, independent_domain_count, validation_status, sources_json, created_at
         FROM research_validations ORDER BY id DESC LIMIT ?`
      )
      .all(safeLimit) as Array<{
      query: string;
      source_count: number;
      independent_domain_count: number;
      validation_status: ResearchValidationRecord['validationStatus'];
      sources_json: string;
      created_at: string;
    }>;
    return rows.map((row) => ({
      query: row.query,
      sourceCount: row.source_count,
      independentDomainCount: row.independent_domain_count,
      validationStatus: row.validation_status,
      sources: JSON.parse(row.sources_json) as ResearchValidationRecord['sources'],
      createdAt: row.created_at,
    }));
  }

  saveTrainingJob(record: {
    jobId: string;
    modelName: string;
    status: string;
    provider: string;
    createdAt: string;
    detail: unknown;
  }): void {
    this.db
      .prepare(
        `INSERT INTO model_training_jobs(job_id, model_name, status, provider, created_at, detail_json)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(job_id) DO UPDATE SET status = excluded.status, detail_json = excluded.detail_json`
      )
      .run(
        record.jobId,
        record.modelName,
        record.status,
        record.provider,
        record.createdAt,
        JSON.stringify(record.detail)
      );
  }

  listTrainingJobs(limit = 50): Array<{
    jobId: string;
    modelName: string;
    status: string;
    provider: string;
    createdAt: string;
    detail: unknown;
  }> {
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = this.db
      .prepare(
        `SELECT job_id, model_name, status, provider, created_at, detail_json
         FROM model_training_jobs ORDER BY created_at DESC LIMIT ?`
      )
      .all(safeLimit) as Array<{
      job_id: string;
      model_name: string;
      status: string;
      provider: string;
      created_at: string;
      detail_json: string;
    }>;
    return rows.map((row) => ({
      jobId: row.job_id,
      modelName: row.model_name,
      status: row.status,
      provider: row.provider,
      createdAt: row.created_at,
      detail: JSON.parse(row.detail_json) as unknown,
    }));
  }

  close(): void {
    this.db.close();
  }
}
