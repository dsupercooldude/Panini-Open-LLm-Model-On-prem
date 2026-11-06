#!/usr/bin/env tsx
/**
 * Panini Backend CLI (`panini-cli` v6.1-GA · SVN-r411.0-GA)
 *
 * Prepackaged offline & network troubleshooting CLI for:
 * 1. Network & App Diagnostics (`panini-cli doctor`, `panini-cli config --mode online|offline`)
 * 2. Knowledge Shard Debugging & Live Source Updates (`panini-cli shard list`, `panini-cli shard show <topic>`, `panini-cli shard save --topic "..." --source "..." --facts "..."`)
 * 3. Ollama-Style GGUF Model Registry Management (`panini-cli ollama list`, `panini-cli ollama pull <pkg>`, `panini-cli ollama show <id>`, `panini-cli ollama run <id> "<prompt>"`)
 * 4. Local Prepackaged Offline RBAC User Database (`panini-cli rbac list`, `panini-cli rbac add --handle ... --name ... --role ...`, `panini-cli rbac verify <handle>`)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  executePaniniBackendCliCommandV61,
  PREPACKAGED_LOCAL_RBAC_USERS_V61,
  getPersistentSovereignSettingsV61,
  updatePersistentSovereignSettingsV61,
  upsertLocalRbacUserV61,
  upsertAndIndexKnowledgeShardV61,
  listLocalRbacUsersV61,
} from '../src/utils/engineLogic';
import {
  listPaniniKnowledgeShards,
  hydratePaniniKnowledgeShards,
} from '../src/utils/multimodalSuite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.resolve(__dirname, '../data/panini-local-sovereign-db.json');

function loadAndHydrateLocalSovereignDb() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf-8'));
      if (raw?.settings && typeof raw.settings === 'object') {
        updatePersistentSovereignSettingsV61(raw.settings);
      }
      if (Array.isArray(raw?.rbacUsers)) {
        for (const u of raw.rbacUsers) {
          if (u?.handle && u?.fullName && u?.role) {
            upsertLocalRbacUserV61({
              id: u.id,
              handle: u.handle,
              fullName: u.fullName,
              email: u.email,
              role: u.role,
              department: u.department,
              clearanceLevel: u.clearanceLevel,
              offlinePinOrPasskeyId: u.offlinePinOrPasskeyId,
            });
          }
        }
      }
      if (raw?.knowledgeShards && typeof raw.knowledgeShards === 'object') {
        hydratePaniniKnowledgeShards(raw.knowledgeShards);
        for (const [key, entry] of Object.entries(raw.knowledgeShards)) {
          const shardEntry = entry as {
            queryKey?: string;
            cachedWikipediaSources?: { title?: string; doiOrUrl?: string; snippet?: string }[];
            cachedVerifiedFacts?: string[];
          };
          const facts =
            shardEntry?.cachedVerifiedFacts ||
            (shardEntry?.cachedWikipediaSources || []).map((s) => s.snippet || '').filter(Boolean);
          if (facts.length > 0) {
            upsertAndIndexKnowledgeShardV61({
              topic: shardEntry.queryKey || key,
              sourceTitle: shardEntry.cachedWikipediaSources?.[0]?.title || key,
              sourceUrl:
                shardEntry.cachedWikipediaSources?.[0]?.doiOrUrl || `local://shards/${key}.gguf`,
              facts,
              mergeExisting: true,
            });
          }
        }
      }
    }
  } catch {
    // Ignore read errors and fall back to prepackaged defaults
  }
}

function saveLocalSovereignDbToDisk() {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const shardsList = listPaniniKnowledgeShards();
    const shardsMap: Record<string, (typeof shardsList)[number]> = {};
    for (const s of shardsList) {
      shardsMap[s.queryKey] = s;
    }
    const payload = {
      schemaVersion: 'v6.1-GA (SVN-r411.0-GA)',
      persistedAtUtc: new Date().toISOString(),
      offlineFirstPrepackaged: true,
      cloudHosted: false,
      settings: getPersistentSovereignSettingsV61(),
      rbacUsers: listLocalRbacUsersV61().length > 0
        ? listLocalRbacUsersV61()
        : PREPACKAGED_LOCAL_RBAC_USERS_V61,
      knowledgeShards: shardsMap,
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // Non-fatal in read-only environments
  }
}

function main() {
  loadAndHydrateLocalSovereignDb();
  const rawArgs = process.argv.slice(2);
  const fullCmd =
    rawArgs.length === 0
      ? 'panini-cli help'
      : rawArgs[0].startsWith('panini-cli')
      ? rawArgs.join(' ')
      : `panini-cli ${rawArgs.join(' ')}`;

  const result = executePaniniBackendCliCommandV61(fullCmd);
  saveLocalSovereignDbToDisk();
  console.log(result.stdout);
  process.exit(result.exitCode);
}

main();
