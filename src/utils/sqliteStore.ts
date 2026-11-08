import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { ClaimEvidenceCheck } from './researchVerification';

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
  sources: Array<{ title: string; url: string; domain: string; snippet?: string }>;
  claimChecks?: ClaimEvidenceCheck[];
  createdAt: string;
}

export interface ResearchSourceRecord {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  sourceEngine?: string;
  createdAt?: string;
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
        claim_checks_json TEXT NOT NULL DEFAULT '[]',
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
      CREATE TABLE IF NOT EXISTS research_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        domain TEXT NOT NULL,
        snippet TEXT NOT NULL,
        source_engine TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE VIRTUAL TABLE IF NOT EXISTS research_sources_fts USING fts5(
        title, url, domain, snippet, source_engine,
        tokenize = 'unicode61'
      );
    `);
    const researchColumns = this.db
      .prepare('PRAGMA table_info(research_validations)')
      .all() as Array<{ name: string }>;
    if (!researchColumns.some((column) => column.name === 'claim_checks_json')) {
      this.db.exec(
        "ALTER TABLE research_validations ADD COLUMN claim_checks_json TEXT NOT NULL DEFAULT '[]'"
      );
    }
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
          (query, source_count, independent_domain_count, validation_status, sources_json, claim_checks_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        record.query,
        record.sourceCount,
        record.independentDomainCount,
        record.validationStatus,
        JSON.stringify(record.sources),
        JSON.stringify(record.claimChecks || []),
        record.createdAt
      );
  }

  upsertResearchSources(sources: ResearchSourceRecord[]): number {
    const sourceStatement = this.db.prepare(
      `INSERT INTO research_sources (url, title, domain, snippet, source_engine, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(url) DO UPDATE SET
         title = excluded.title,
         domain = excluded.domain,
         snippet = excluded.snippet,
         source_engine = excluded.source_engine,
         updated_at = excluded.updated_at`
    );
    const selectId = this.db.prepare('SELECT id FROM research_sources WHERE url = ?');
    const deleteIndex = this.db.prepare('DELETE FROM research_sources_fts WHERE rowid = ?');
    const insertIndex = this.db.prepare(
      `INSERT INTO research_sources_fts (rowid, title, url, domain, snippet, source_engine)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    let indexed = 0;
    this.db.exec('BEGIN');
    try {
      for (const source of sources) {
        const snippet = source.snippet.trim().slice(0, 4000);
        let url: URL;
        try {
          url = new URL(source.url);
        } catch {
          continue;
        }
        if (url.protocol !== 'https:' || !snippet) continue;

        const canonicalUrl = url.toString();
        const title = source.title.trim().slice(0, 500) || canonicalUrl;
        const domain = url.hostname.toLowerCase().replace(/^www\./, '');
        sourceStatement.run(
          canonicalUrl,
          title,
          domain,
          snippet,
          (source.sourceEngine || 'Retrieved source').slice(0, 200),
          source.createdAt || new Date().toISOString()
        );
        const row = selectId.get(canonicalUrl) as { id: number } | undefined;
        if (!row) throw new Error('Failed to resolve indexed research source.');
        deleteIndex.run(row.id);
        insertIndex.run(
          row.id,
          title,
          canonicalUrl,
          domain,
          snippet,
          (source.sourceEngine || 'Retrieved source').slice(0, 200)
        );
        indexed += 1;
      }
      this.db.exec('COMMIT');
      return indexed;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  getResearchSourcesByUrls(urls: string[]): ResearchSourceRecord[] {
    const uniqueUrls = [...new Set(urls)].slice(0, 20);
    if (!uniqueUrls.length) return [];
    const placeholders = uniqueUrls.map(() => '?').join(', ');
    const rows = this.db
      .prepare(
        `SELECT title, url, domain, snippet, source_engine, updated_at
         FROM research_sources WHERE url IN (${placeholders})`
      )
      .all(...uniqueUrls) as Array<{
      title: string;
      url: string;
      domain: string;
      snippet: string;
      source_engine: string;
      updated_at: string;
    }>;
    return rows.map((row) => ({
      title: row.title,
      url: row.url,
      domain: row.domain,
      snippet: row.snippet,
      sourceEngine: row.source_engine,
      createdAt: row.updated_at,
    }));
  }

  searchResearchSources(
    query: string,
    limit = 5
  ): Array<ResearchSourceRecord & { score: number }> {
    const terms = [...new Set(query.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [])]
      .filter((term) => term.length > 1)
      .slice(0, 24);
    if (!terms.length) return [];

    const matchQuery = terms.map((term) => `"${term.replace(/"/g, '""')}"`).join(' OR ');
    const safeLimit = Math.max(1, Math.min(10, Math.floor(limit)));
    const rows = this.db
      .prepare(
        `SELECT s.title, s.url, s.domain, s.snippet, s.source_engine, s.updated_at,
                bm25(research_sources_fts, 5.0, 0.1, 1.0, 3.0, 0.5) AS score
         FROM research_sources_fts
         JOIN research_sources s ON s.id = research_sources_fts.rowid
         WHERE research_sources_fts MATCH ?
         ORDER BY score ASC, s.updated_at DESC
         LIMIT ?`
      )
      .all(matchQuery, safeLimit) as Array<{
      title: string;
      url: string;
      domain: string;
      snippet: string;
      source_engine: string;
      updated_at: string;
      score: number;
    }>;
    return rows.map((row) => ({
      title: row.title,
      url: row.url,
      domain: row.domain,
      snippet: row.snippet,
      sourceEngine: row.source_engine,
      createdAt: row.updated_at,
      score: row.score,
    }));
  }

  listResearchValidations(limit = 50): ResearchValidationRecord[] {
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = this.db
      .prepare(
        `SELECT query, source_count, independent_domain_count, validation_status, sources_json, claim_checks_json, created_at
         FROM research_validations ORDER BY id DESC LIMIT ?`
      )
      .all(safeLimit) as Array<{
      query: string;
      source_count: number;
      independent_domain_count: number;
      validation_status: ResearchValidationRecord['validationStatus'];
      sources_json: string;
      claim_checks_json: string;
      created_at: string;
    }>;
    return rows.map((row) => ({
      query: row.query,
      sourceCount: row.source_count,
      independentDomainCount: row.independent_domain_count,
      validationStatus: row.validation_status,
      sources: JSON.parse(row.sources_json) as ResearchValidationRecord['sources'],
      claimChecks: JSON.parse(row.claim_checks_json) as ClaimEvidenceCheck[],
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
