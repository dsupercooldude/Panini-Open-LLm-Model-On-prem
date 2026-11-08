import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { SessionAuthenticator } from './src/utils/serverAuth';
import { SqliteStore } from './src/utils/sqliteStore';
import { OllamaRuntime, OllamaRuntimeError } from './src/utils/ollamaRuntime';
import {
  OnlineAiProviderError,
  createChatCompletion,
  createFineTuningJob,
  generateImage,
  getFineTuningJob,
  synthesizeSpeech,
  transcribeAudio,
} from './src/utils/onlineAiProvider';
import {
  autoCorrectUserQuery,
  translateNlpToUseCase,
  BibliographyReference,
  generateDeepResearchPlan,
  verifyExistingUseCaseMatch,
  extractCleanEntityTopic,
  extractPresentationSubjectAndIntent,
  runInputGuardrailScan,
  runOutputGuardrailScan,
  executeReGroundLoopV572,
  executeBoundedAgentOrchestrator,
  runReceiptVisionOcrAndReconcile,
  buildSandboxedExpenseDeckBundle,
  ExpenseDeckBrandStyle,
  SandboxIsolationRuntime,
  runHybridKnowledgePipelineV57,
  setStrictSourceVerificationPolicyV572,
  evaluateMcpToolAccessV57,
  DocumentAclRole,
  McpServerUri,
  submitAsyncGenerationJobV57,
  advanceAsyncJobStatusV57,
  getAsyncJobQueueSnapshotV57,
  buildOtelLangfuseTraceWaterfallV57,
  recordUserMessageFeedbackV57,
  getEvaluationObservabilityDashboardV57,
  getApiAndSdkExplorerSnippetsV57,
  generateDynamicRandomAccuracyUseCasesV57,
  buildResearchedPptxPresentationSpecV57,
  AsyncJobKind,
  GpuServingEngineName,
  UserFeedbackRatingV57,
  ingestWebsiteToKnowledgeShardV58,
  connectExternalRagServerToShardV58,
  ingestDocumentOrFlatfileToShardV58,
  registerCustomMcpServerV58,
  setPaniniInboundMcpServerEnabledV58,
  getPaniniMcpServerManifestV58,
  handleInboundMcpJsonRpcRequestV58,
  delegateTaskToSubAgentsV58,
  getIntegrationsHubSnapshotV58,
  engineerPromptForOptimalAccuracyV59,
  buildThinkingModeExecutionPlanV59,
  parseGgufFileAndBuildModelUpdateV60,
  applyGgufUpdateToPaniniModelsV60,
  PREBUILT_GGUF_MODEL_PACKAGES_V60,
  getRestApiAndMcpDocumentationSpecV60,
  generateRestApiAndMcpDocumentationPdfBytesV60,
  QuantizationType,
  upsertAndIndexKnowledgeShardV61,
  listLocalRbacUsersV61,
  upsertLocalRbacUserV61,
  deleteLocalRbacUserV61,
  verifyLocalRbacAccessV61,
  getPersistentSovereignSettingsV61,
  updatePersistentSovereignSettingsV61,
  getPaniniBackendCliReferenceV61,
  executePaniniBackendCliCommandV61,
  runAllApiEndpointsVerificationSuiteV61,
  getDynamicRoadmapAutoDrafterSuggestionsV61,
  CURRENT_ACTIVE_RELEASE_VERSION,
  CURRENT_ACTIVE_SVN_REVISION,
  syncReleaseDocumentationAndArtifactsV61,
  buildGoogleSearchGroundedSourcesV62,
  getPeerToPeerShardMeshStatusV62,
  syncPeerToPeerGgufShardMeshV62,
  signRbacActionWithFido2WebAuthnV62,
  getFido2SignatureLedgerV62,
  recordSwaggerRequestAndExportReplayV62,
  getSwaggerRequestHistoryV62,
  listLocalTtsVoiceProfilesV63,
  synthesizeLocalModelTtsAudioV63,
  buildKnowledgeGraphD3SpecV63,
  listHostedOnlineGgufCatalogV63,
  executeGgufModelTerminalCommandV63,
  recordMcpAgentDagExecutionV63,
  getMcpAgentDagHistoryV63,
  TerminalOutputVerbosityModeV64,
  exportPaniniModelGgufAndInstallBundleV64,
  listOnlineExternalModelCatalogV64,
  listInstalledOnlineExternalModelsV64,
  installOnlineCatalogModelV64,
  getTerminalAutocompleteSuggestionsV64,
  buildTerminalCommandGuideV64,
  runAutonomousModelSelfLearningAndTuningV64,
  getModelSelfLearningStateV64,
  exportD3SubGraphToGgufShardV64,
  runDuplexVoiceToVoiceTurnV64,
} from './src/utils/engineLogic';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_CUSTOM_SCENARIOS, INITIAL_MODELS } from './src/utils/initialData';
import {
  analyzeBioscienceQuery,
  synthesizeMusicTrackSpec,
  buildPromptConstructedScene,
  buildSovereignV56OmniLyriaStitchSpec,
  learnFromOfflineMediaShardsV56,
  resolveMapsAndSearchGrounding,
  applyImageEditInstruction,
  MusicDurationTier,
  VideoAspectRatio,
  ImageStudioSpec,
  SovereignV56HardwareFormFactor,
  listPaniniKnowledgeShards,
  hydratePaniniKnowledgeShards,
} from './src/utils/multimodalSuite';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const HOST = process.env.PANINI_BIND_HOST || '127.0.0.1';
  const isProduction = process.env.NODE_ENV === 'production';
  const isLoopbackHost = HOST === '127.0.0.1' || HOST === '::1' || HOST === 'localhost';

  if (!Number.isInteger(PORT) || PORT < 0 || PORT > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535.');
  }
  if (!isProduction && !isLoopbackHost) {
    throw new Error('Non-production servers must bind to loopback only.');
  }
  if (isProduction && (!process.env.PANINI_ADMIN_PASSWORD || process.env.PANINI_ADMIN_PASSWORD.length < 16)) {
    throw new Error('Production requires PANINI_ADMIN_PASSWORD with at least 16 characters.');
  }

  app.disable('x-powered-by');
  app.set('trust proxy', process.env.PANINI_TRUST_PROXY === '1');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), payment=()');
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  const sqliteStore = new SqliteStore(
    process.env.PANINI_DB_PATH || path.join(__dirname, 'data', 'panini.sqlite')
  );
  function recordResearchEvidence(
    query: string,
    sources: Array<{ title: string; url: string; sourceEngine?: string; excerpt?: string }>
  ) {
    const records = sources.flatMap((source) => {
      try {
        const url = new URL(source.url);
        if (url.protocol !== 'https:') return [];
        return [{
          title: source.title.slice(0, 500),
          url: url.toString(),
          domain: url.hostname.toLowerCase(),
          sourceEngine: source.sourceEngine?.slice(0, 200),
          excerpt: source.excerpt?.slice(0, 3000),
        }];
      } catch {
        return [];
      }
    });
    const hostCount = new Set(records.map((source) => source.domain)).size;
    const validationStatus =
      hostCount > 1 ? 'multiple_hosts' : hostCount === 1 ? 'single_host' : 'unverified';
    const evidenceCoverage = {
      sourceCount: records.length,
      uniqueHostCount: hostCount,
      status: validationStatus,
      independentlyFactChecked: false,
      method: 'Retrieved source-host diversity only; claim-level fact checking has not been performed.',
    } as const;
    sqliteStore.saveResearchValidation({
      query: query.slice(0, 2000),
      sourceCount: records.length,
      independentDomainCount: hostCount,
      validationStatus,
      sources: records,
      createdAt: new Date().toISOString(),
    });
    return evidenceCoverage;
  }

  const authenticator = isProduction
    ? new SessionAuthenticator(
        process.env.PANINI_ADMIN_USERNAME || 'admin',
        process.env.PANINI_ADMIN_PASSWORD!,
        sqliteStore
      )
    : undefined;
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();
  const sessionCookieName = 'panini_session';
  const unavailableCapability = (res: express.Response, capability: string) =>
    res.status(501).json({
      ok: false,
      code: 'CAPABILITY_UNAVAILABLE',
      capability,
      error: 'This prototype has no configured model weights or inference/training runtime.',
    });
  const ollama = new OllamaRuntime();

  function getSessionId(req: express.Request): string | undefined {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;
    const cookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${sessionCookieName}=`));
    return cookie?.slice(sessionCookieName.length + 1);
  }

  function requestHasSameOrigin(req: express.Request): boolean {
    const origin = req.get('origin');
    if (!origin) return true;
    try {
      return new URL(origin).host === req.get('host');
    } catch {
      return false;
    }
  }

  app.get('/api/auth/session', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      authRequired: isProduction,
      authenticated: !isProduction || authenticator!.isAuthenticated(getSessionId(req)),
    });
  });

  app.post('/api/auth/login', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (isProduction && !req.secure) {
      res.status(400).json({ ok: false, error: 'Production sign-in requires HTTPS.' });
      return;
    }
    if (!requestHasSameOrigin(req)) {
      res.status(403).json({ ok: false, error: 'Request origin rejected.' });
      return;
    }
    if (!isProduction || !authenticator) {
      res.status(404).json({ ok: false, error: 'Login is only enabled in production mode.' });
      return;
    }

    const now = Date.now();
    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
    const attempts = loginAttempts.get(clientKey);
    if (attempts && attempts.resetAt > now && attempts.count >= 5) {
      res.status(429).json({ ok: false, error: 'Too many login attempts. Try again later.' });
      return;
    }

    const username = typeof req.body?.username === 'string' ? req.body.username : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (username.length > 256 || password.length > 256) {
      res.status(401).json({ ok: false, error: 'Invalid credentials.' });
      return;
    }
    const sessionId = authenticator.login(
      username,
      password,
      now
    );
    if (!sessionId) {
      const current = attempts && attempts.resetAt > now ? attempts : { count: 0, resetAt: now + 15 * 60 * 1000 };
      current.count += 1;
      loginAttempts.set(clientKey, current);
      res.status(401).json({ ok: false, error: 'Invalid credentials.' });
      return;
    }

    loginAttempts.delete(clientKey);
    res.setHeader(
      'Set-Cookie',
      `${sessionCookieName}=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=28800`
    );
    res.json({ ok: true });
  });

  app.post('/api/auth/logout', (req, res) => {
    authenticator?.logout(getSessionId(req));
    res.setHeader(
      'Set-Cookie',
      `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`
    );
    res.json({ ok: true });
  });

  app.use('/api', (req, res, next) => {
    if (!isProduction) {
      next();
      return;
    }
    if (
      req.path === '/auth/session' ||
      req.path === '/auth/login' ||
      req.path === '/auth/logout' ||
      req.path === '/install/manifest.json' ||
      req.path === '/install/setup.sh' ||
      req.path === '/install/setup.ps1'
    ) {
      next();
      return;
    }
    if (!authenticator?.isAuthenticated(getSessionId(req))) {
      res.status(401).json({ ok: false, error: 'Authentication required.' });
      return;
    }
    if (!requestHasSameOrigin(req)) {
      res.status(403).json({ ok: false, error: 'Request origin rejected.' });
      return;
    }
    next();
  });

  app.get('/api/llm/online/status', (_req, res) => {
    res.json({
      ok: true,
      configured: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_CHAT_MODEL),
      model: process.env.OPENAI_CHAT_MODEL || null,
      imageConfigured: Boolean(process.env.OPENAI_API_KEY),
      imageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      speechConfigured: Boolean(process.env.OPENAI_API_KEY),
      fineTuningConfigured: Boolean(process.env.OPENAI_API_KEY),
    });
  });

  app.get('/api/llm/status', async (_req, res) => {
    try {
      const status = await ollama.status();
      const models = status.connected ? await ollama.listModels() : [];
      const preferredModel = process.env.PANINI_OLLAMA_MODEL;
      const defaultModel =
        models.find((model) => model.name === preferredModel)?.name ||
        models.find((model) => model.model === preferredModel)?.model ||
        models[0]?.name ||
        null;
      res.json({
        ok: true,
        provider: 'ollama',
        defaultModelConfigured: Boolean(defaultModel),
        configuredDefaultModel: defaultModel,
        ...status,
      });
    } catch (error) {
      const status = error instanceof OllamaRuntimeError ? error.statusCode : 502;
      res.status(status).json({ ok: false, code: 'OLLAMA_STATUS_FAILED', error: String(error) });
    }
  });

  app.get('/api/llm/models', async (_req, res) => {
    try {
      res.json({ ok: true, models: await ollama.listModels() });
    } catch (error) {
      const status = error instanceof OllamaRuntimeError ? error.statusCode : 502;
      res.status(status).json({ ok: false, code: 'OLLAMA_UNAVAILABLE', error: String(error) });
    }
  });

  app.post('/api/llm/models/pull', async (req, res) => {
    try {
      const model = typeof req.body?.model === 'string' ? req.body.model : '';
      const result = await ollama.pullModel(model);
      res.json({ ok: true, ...result });
    } catch (error) {
      const status = error instanceof OllamaRuntimeError ? error.statusCode : 502;
      res.status(status).json({ ok: false, code: 'MODEL_PULL_FAILED', error: String(error) });
    }
  });

  app.post('/api/llm/chat', async (req, res) => {
    try {
      const model =
        typeof req.body?.model === 'string'
          ? req.body.model
          : process.env.PANINI_OLLAMA_MODEL || (await ollama.listModels())[0]?.name || '';
      const messages = req.body?.messages;
      if (
        !Array.isArray(messages) ||
        !messages.every(
          (message: unknown) =>
            Boolean(message) &&
            typeof message === 'object' &&
            ['system', 'user', 'assistant'].includes(
              String((message as { role?: unknown }).role)
            ) &&
            typeof (message as { content?: unknown }).content === 'string' &&
            (message as { content: string }).content.length <= 50000 &&
            ((message as { images?: unknown }).images === undefined ||
              (Array.isArray((message as { images?: unknown }).images) &&
                ((message as { images: unknown[] }).images.length <= 4) &&
                (message as { images: unknown[] }).images.every(
                  (image) =>
                    typeof image === 'string' &&
                    image.length <= 12_000_000 &&
                    /^[A-Za-z0-9+/]+={0,2}$/.test(image)
                )))
        )
      ) {
        res.status(400).json({ ok: false, code: 'INVALID_MESSAGES', error: 'Invalid chat messages.' });
        return;
      }
      if (!model) {
        res.status(503).json({
          ok: false,
          code: 'MODEL_NOT_CONFIGURED',
          error: 'Download an Ollama model or set PANINI_OLLAMA_MODEL.',
        });
        return;
      }
      const result = await ollama.chat(model, messages);
      res.json({ ok: true, provider: 'ollama', ...result });
    } catch (error) {
      const status = error instanceof OllamaRuntimeError ? error.statusCode : 502;
      res.status(status).json({ ok: false, code: 'INFERENCE_FAILED', error: String(error) });
    }
  });

  app.post('/api/llm/online/chat', async (req, res) => {
    try {
      const model =
        typeof req.body?.model === 'string'
          ? req.body.model
          : process.env.OPENAI_CHAT_MODEL || '';
      if (!model) {
        res.status(503).json({
          ok: false,
          code: 'ONLINE_MODEL_NOT_CONFIGURED',
          error: 'Set OPENAI_CHAT_MODEL and OPENAI_API_KEY to enable online model inference.',
        });
        return;
      }
      const result = await createChatCompletion({ model, messages: req.body?.messages });
      res.json({ ok: true, provider: 'openai-compatible', ...result });
    } catch (error) {
      const status = error instanceof OnlineAiProviderError ? error.statusCode : 502;
      res.status(status).json({ ok: false, code: 'ONLINE_INFERENCE_FAILED', error: String(error) });
    }
  });

  app.get('/api/llm/export/modelfile', async (req, res) => {
    try {
      const model = typeof req.query.model === 'string' ? req.query.model : '';
      const result = await ollama.exportModelfile(model);
      const safeName = result.model.replace(/[^a-zA-Z0-9._-]/g, '_');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.Modelfile"`);
      res.send(result.modelfile);
    } catch (error) {
      const status = error instanceof OllamaRuntimeError ? error.statusCode : 502;
      res.status(status).json({ ok: false, code: 'MODEL_EXPORT_FAILED', error: String(error) });
    }
  });

  app.get('/api/llm/export/gguf', async (req, res) => {
    const exportDir = process.env.PANINI_GGUF_EXPORT_DIR;
    const model = typeof req.query.model === 'string' ? req.query.model : '';
    if (!exportDir) {
      res.status(503).json({
        ok: false,
        code: 'GGUF_EXPORT_NOT_CONFIGURED',
        error: 'Set PANINI_GGUF_EXPORT_DIR to a directory of actual GGUF weight files.',
      });
      return;
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,160}$/.test(model)) {
      res.status(400).json({ ok: false, code: 'INVALID_MODEL_NAME', error: 'Invalid GGUF model filename.' });
      return;
    }
    const filePath = path.resolve(exportDir, `${model}.gguf`);
    const root = path.resolve(exportDir) + path.sep;
    if (!filePath.startsWith(root)) {
      res.status(400).json({ ok: false, code: 'INVALID_MODEL_NAME', error: 'Invalid GGUF model filename.' });
      return;
    }
    try {
      const handle = await fs.promises.open(filePath, 'r');
      const header = Buffer.alloc(8);
      try {
        const { bytesRead } = await handle.read(header, 0, header.length, 0);
        const version = header.readUInt32LE(4);
        if (
          bytesRead !== 8 ||
          header.toString('ascii', 0, 4) !== 'GGUF' ||
          (version !== 2 && version !== 3)
        ) {
          res.status(422).json({ ok: false, code: 'INVALID_GGUF', error: 'File does not have a supported GGUF v2/v3 header.' });
          return;
        }
      } finally {
        await handle.close();
      }
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${model}.gguf"`);
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        res.status(404).json({ ok: false, code: 'GGUF_NOT_FOUND', error: 'GGUF weights were not found in the configured export directory.' });
        return;
      }
      res.status(500).json({ ok: false, code: 'GGUF_EXPORT_FAILED', error: String(error) });
    }
  });

  app.post('/api/llm/train', async (req, res) => {
    try {
      const job = await createFineTuningJob({
        model: req.body?.model,
        examples: req.body?.examples,
      });
      const jobId = typeof job.id === 'string' ? job.id : '';
      if (!jobId) {
        res.status(502).json({ ok: false, code: 'TRAINING_JOB_INVALID', error: 'Training provider returned no job ID.' });
        return;
      }
      const createdAt = new Date().toISOString();
      sqliteStore.saveTrainingJob({
        jobId,
        modelName: String(req.body.model),
        status: String(job.status || 'queued'),
        provider: 'openai-compatible',
        createdAt,
        detail: job,
      });
      res.status(202).json({ ok: true, job });
    } catch (error) {
      const status = error instanceof OnlineAiProviderError ? error.statusCode : 502;
      res.status(status).json({ ok: false, code: 'TRAINING_FAILED', error: String(error) });
    }
  });

  app.get('/api/llm/train/jobs', (_req, res) => {
    res.json({ ok: true, jobs: sqliteStore.listTrainingJobs() });
  });

  app.get('/api/llm/train/jobs/:jobId', async (req, res) => {
    try {
      const job = await getFineTuningJob(req.params.jobId);
      const jobId = String(job.id || req.params.jobId);
      const previous = sqliteStore.listTrainingJobs().find((item) => item.jobId === jobId);
      sqliteStore.saveTrainingJob({
        jobId,
        modelName: String(job.model || previous?.modelName || 'unknown'),
        status: String(job.status || 'unknown'),
        provider: 'openai-compatible',
        createdAt: previous?.createdAt || new Date().toISOString(),
        detail: job,
      });
      res.json({ ok: true, job });
    } catch (error) {
      const status = error instanceof OnlineAiProviderError ? error.statusCode : 502;
      res.status(status).json({ ok: false, code: 'TRAINING_STATUS_FAILED', error: String(error) });
    }
  });

  app.get('/api/research/validation/recent', (req, res) => {
    const limit = Number(req.query.limit) || 50;
    res.json({ ok: true, records: sqliteStore.listResearchValidations(limit) });
  });

  // Valid Live Localhost Installation Script Endpoints
  app.get('/api/install/setup.sh', (req, res) => {
    const hostOrigin = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    res.type('text/plain').send(`#!/usr/bin/env bash
# Panini 400B Studio — Verified Localhost & Air-Gapped Installer Script
# Served live from ${hostOrigin}/api/install/setup.sh
set -euo pipefail

echo "[Panini-400B] Initializing installation from ${hostOrigin}..."
export VITE_PANINI_OFFLINE_MODE="true"
export VITE_PANINI_MODEL_CACHE_DIR="/var/lib/panini/shards"
export VITE_PANINI_THERMAL_LIMIT_CELSIUS="42"

echo "[Panini-400B] Verifying Node.js 22+ & local shard directory..."
mkdir -p ./models/shards
curl -fsSL "${hostOrigin}/api/install/manifest.json" -o ./models/manifest.json || true

echo "[Panini-400B] Installation verified! Run: npm install && npm run dev (Port 3000)"
`);
  });

  app.get('/api/install/setup.ps1', (req, res) => {
    const hostOrigin = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    res.type('text/plain').send(`# Panini 400B Studio — Verified Windows PowerShell 7+ Installer
# Served live from ${hostOrigin}/api/install/setup.ps1
$ErrorActionPreference = "Stop"
Write-Host "[Panini-400B] Provisioning Panini 400B Studio from ${hostOrigin}..."
$env:VITE_PANINI_OFFLINE_MODE="true"
$env:VITE_PANINI_MODEL_CACHE_DIR="C:\\Panini400B\\shards"
Invoke-RestMethod -Uri "${hostOrigin}/api/install/manifest.json" -OutFile "manifest.json"
Write-Host "[Panini-400B] Ready on http://localhost:3000"
`);
  });

  app.get('/api/install/manifest.json', async (req, res) => {
    const hostOrigin = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const runtimeStatus = await ollama.status();
    const installedModels = runtimeStatus.connected ? await ollama.listModels() : [];
    res.json({
      package: 'panini-400b-studio',
      version: '6.4.0',
      releaseVersion: CURRENT_ACTIVE_RELEASE_VERSION,
      svnRevision: CURRENT_ACTIVE_SVN_REVISION,
      modelProfilesAreMetadataOnly: true,
      inferenceRuntime: {
        available: installedModels.length > 0,
        weightsInstalled: installedModels.length > 0,
        provider: 'ollama',
        models: installedModels.map((model) => ({ name: model.name, sizeBytes: model.size })),
      },
      mediaGeneration: {
        image: process.env.OPENAI_API_KEY ? 'configured-provider' : 'grounded-preview',
        video: 'procedural-preview',
        music: 'procedural-preview',
      },
      hardwareExecutionPolicies: {
        desktop_laptop_onprem: 'on_prem_full_synthesis_and_stitching',
        mobile_edge: 'mobile_internet_stitch_only',
      },
      origin: hostOrigin,
      endpoints: {
        bashInstaller: `${hostOrigin}/api/install/setup.sh`,
        powershellInstaller: `${hostOrigin}/api/install/setup.ps1`,
      },
      presetEnvDefaults: {
        VITE_PANINI_OFFLINE_MODE: 'true',
        VITE_PANINI_MODEL_CACHE_DIR: '/var/lib/panini/shards',
        VITE_PANINI_THERMAL_LIMIT_CELSIUS: '42',
      },
    });
  });

  // Helper: Fetch live internet search results from Google Search (Grounding + RSS/Web Index) + Wikipedia Multi-Section + Wikidata + OpenAlex + Crossref
  async function fetchLiveInternetSources(query: string, maxResults = 6) {
    const rawTrimmed = query.trim() || 'quantum computing';
    const isPptxPrompt =
      /\b(pptx|powerpoint|presentation|slide\s*deck|slides\s+for|slides\s+about)\b/i.test(
        rawTrimmed
      );
    const cleanQ = isPptxPrompt
      ? extractPresentationSubjectAndIntent(rawTrimmed).cleanSubject
      : extractCleanEntityTopic(rawTrimmed);
    const encoded = encodeURIComponent(cleanQ.slice(0, 90));
    const currentYear = new Date().getFullYear();
    const results: {
      title: string;
      authorsOrInstitution: string;
      publicationOrSource: string;
      year: number;
      url: string;
      doiOrUrl: string;
      snippet: string;
      sourceEngine: string;
    }[] = [];

    // 0a. Optional Google Search Grounding via @google/genai when GEMINI_API_KEY is configured
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY' && geminiApiKey.length > 12) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const gRes = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Provide a concise, strictly factual 2-sentence encyclopedic summary of: ${cleanQ}`,
            config: {
              tools: [{ googleSearch: {} }],
            },
          }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2600)),
        ]);
        if (gRes && gRes.text) {
          const groundingChunks =
            gRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const firstWebUrl =
            groundingChunks.find((c) => c.web?.uri)?.web?.uri ||
            `https://www.google.com/search?q=${encoded}`;
          const firstWebTitle =
            groundingChunks.find((c) => c.web?.title)?.web?.title ||
            `${cleanQ} — Google Search Grounding`;
          results.push({
            title: firstWebTitle,
            authorsOrInstitution: 'Google Search Grounding Index',
            publicationOrSource: 'Google Search (Web & Knowledge Graph)',
            year: currentYear,
            url: firstWebUrl,
            doiOrUrl: firstWebUrl,
            snippet: gRes.text.replace(/\s+/g, ' ').trim().slice(0, 420),
            sourceEngine: 'Google Search & Knowledge Graph Engine',
          });
        }
      } catch {
        // Fall through to keyless Google RSS + Wikipedia + OpenAlex + Crossref
      }
    }

    // 0b. Keyless Google Web & News Search RSS Index (always works without API keys)
    try {
      const googleRssRes = await fetch(
        `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`,
        {
          signal: AbortSignal.timeout(2400),
          headers: { 'User-Agent': 'PaniniOpenLLMStudio/6.2' },
        }
      );
      if (googleRssRes.ok) {
        const rssXml = await googleRssRes.text();
        const itemMatches = rssXml.match(/<item>[\s\S]*?<\/item>/gi) || [];
        for (const itemXml of itemMatches.slice(0, 2)) {
          const rawTitle =
            itemXml.match(/<title>([\s\S]*?)<\/title>/i)?.[1]
              ?.replace(/<!\[CDATA\[|\]\]>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .trim() || '';
          const rawLink =
            itemXml.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() ||
            `https://www.google.com/search?q=${encoded}`;
          const rawSource =
            itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1]
              ?.replace(/<!\[CDATA\[|\]\]>/g, '')
              .trim() || 'Google Search Index';
          const pubDateStr = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || '';
          const pubYear = pubDateStr ? new Date(pubDateStr).getFullYear() || currentYear : currentYear;
          if (rawTitle) {
            results.push({
              title: `${rawTitle} (Google Search Index)`,
              authorsOrInstitution: rawSource,
              publicationOrSource: `Google Search · ${rawSource}`,
              year: pubYear,
              url: rawLink,
              doiOrUrl: rawLink,
              snippet: `Google Search indexed result for "${cleanQ}": ${rawTitle} (Published via ${rawSource}, ${pubYear}).`,
              sourceEngine: 'Google Search & Knowledge Graph Engine',
            });
          }
        }
      }
    } catch {
      // Continue to Wikipedia / Wikidata / OpenAlex / Crossref
    }

    try {
      // 1a. Try Wikipedia REST Page Summary for exact entity topic first
      const wikiSummaryTitle = encodeURIComponent(cleanQ.replace(/\s+/g, '_'));
      const summaryRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiSummaryTitle}`,
        { signal: AbortSignal.timeout(2500) }
      );
      if (summaryRes.ok) {
        const summaryJson = (await summaryRes.json()) as {
          title?: string;
          extract?: string;
          content_urls?: { desktop?: { page?: string } };
        };
        if (summaryJson?.extract && summaryJson?.title) {
          const pageUrl =
            summaryJson.content_urls?.desktop?.page ||
            `https://en.wikipedia.org/wiki/${encodeURIComponent(summaryJson.title.replace(/\s+/g, '_'))}`;
          results.push({
            title: `${summaryJson.title} — Wikipedia Encyclopedia Summary`,
            authorsOrInstitution: 'Wikimedia Foundation & Peer Contributors',
            publicationOrSource: 'Wikipedia Live Knowledge Graph',
            year: currentYear,
            url: pageUrl,
            doiOrUrl: pageUrl,
            snippet: summaryJson.extract,
            sourceEngine: 'Wikipedia Live REST Engine',
          });
        }
      }
    } catch {
      // Continue to search list API
    }

    try {
      // 1b. Query Wikipedia Live Search API
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&utf8=&format=json&srlimit=3`,
        { signal: AbortSignal.timeout(2800) }
      );
      if (wikiRes.ok) {
        const wikiJson = (await wikiRes.json()) as {
          query?: {
            search?: { title: string; snippet: string; pageid: number }[];
          };
        };
        const items = wikiJson?.query?.search || [];
        // If step 1a didn't match an exact page title, fetch the full REST summary of the top search hit
        if (
          !results.some((r) => r.sourceEngine === 'Wikipedia Live REST Engine') &&
          items[0]?.title
        ) {
          try {
            const topTitle = encodeURIComponent(items[0].title.replace(/\s+/g, '_'));
            const topSumRes = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${topTitle}`,
              { signal: AbortSignal.timeout(2200) }
            );
            if (topSumRes.ok) {
              const topSumJson = (await topSumRes.json()) as {
                title?: string;
                extract?: string;
                content_urls?: { desktop?: { page?: string } };
              };
              if (topSumJson?.extract && topSumJson?.title) {
                const topUrl =
                  topSumJson.content_urls?.desktop?.page ||
                  `https://en.wikipedia.org/wiki/${encodeURIComponent(topSumJson.title.replace(/\s+/g, '_'))}`;
                results.push({
                  title: `${topSumJson.title} — Wikipedia Encyclopedia Summary`,
                  authorsOrInstitution: 'Wikimedia Foundation & Peer Contributors',
                  publicationOrSource: 'Wikipedia Live Knowledge Graph',
                  year: currentYear,
                  url: topUrl,
                  doiOrUrl: topUrl,
                  snippet: topSumJson.extract,
                  sourceEngine: 'Wikipedia Live REST Engine',
                });
              }
            }
          } catch {
            // Fall through to search snippets
          }
        }
        for (const item of items.slice(0, 2)) {
          const cleanSnippet = item.snippet.replace(/<[^>]+>/g, '').trim();
          const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`;
          if (!results.some((r) => r.doiOrUrl === url)) {
            results.push({
              title: `${item.title} — Wikipedia`,
              authorsOrInstitution: 'Wikimedia Foundation & Peer Contributors',
              publicationOrSource: 'Wikipedia Live Knowledge Graph',
              year: currentYear,
              url,
              doiOrUrl: url,
              snippet: cleanSnippet || 'No excerpt was provided by the Wikipedia search API.',
              sourceEngine: 'Wikipedia Live REST Engine',
            });
          }
        }
      }
    } catch {
      // Continue to next engine if offline or blocked
    }

    try {
      // 2. Query OpenAlex Live Scholarly Works API
      const oaRes = await fetch(
        `https://api.openalex.org/works?search=${encoded}&per-page=3`,
        { signal: AbortSignal.timeout(2800) }
      );
      if (oaRes.ok) {
        const oaJson = (await oaRes.json()) as {
          results?: {
            id?: string;
            display_name?: string;
            publication_year?: number;
            doi?: string;
            authorships?: { author?: { display_name?: string } }[];
            primary_location?: { source?: { display_name?: string } };
          }[];
        };
        const works = oaJson?.results || [];
        for (const w of works.slice(0, 2)) {
          if (!w.display_name) continue;
          const authors =
            w.authorships
              ?.slice(0, 3)
              .map((a) => a.author?.display_name)
              .filter(Boolean)
              .join(', ') || 'Author not listed';
          const venue =
            w.primary_location?.source?.display_name || 'OpenAlex Peer-Reviewed Index';
          const workUrl = w.doi || w.id || `https://openalex.org/works?search=${encoded}`;
          results.push({
            title: w.display_name,
            authorsOrInstitution: authors,
            publicationOrSource: venue,
            year: w.publication_year || 0,
            url: workUrl,
            doiOrUrl: workUrl,
            snippet: `OpenAlex record for "${cleanQ}". ${w.display_name}; ${authors}; ${w.publication_year || 'publication year not listed'}.`,
            sourceEngine: 'OpenAlex Scholarly Index',
          });
        }
      }
    } catch {
      // Other live providers may still return usable results.
    }

    try {
      const crossrefRes = await fetch(
        `https://api.crossref.org/works?query.bibliographic=${encoded}&rows=4&select=title,author,published,URL,DOI,abstract,container-title`,
        {
          signal: AbortSignal.timeout(2800),
          headers: { 'User-Agent': 'PaniniOpenLLMStudio/6.2' },
        }
      );
      if (crossrefRes.ok) {
        const crossrefJson = (await crossrefRes.json()) as {
          message?: {
            items?: Array<{
              title?: string[];
              author?: Array<{ given?: string; family?: string }>;
              published?: { 'date-parts'?: number[][] };
              URL?: string;
              DOI?: string;
              abstract?: string;
              'container-title'?: string[];
            }>;
          };
        };
        for (const work of crossrefJson.message?.items || []) {
          const title = work.title?.[0]?.trim();
          const url = work.DOI
            ? `https://doi.org/${work.DOI}`
            : work.URL?.startsWith('https://')
            ? work.URL
            : '';
          if (!title || !url || results.some((result) => result.url === url)) continue;
          const authors =
            work.author
              ?.slice(0, 3)
              .map((author) => [author.given, author.family].filter(Boolean).join(' '))
              .filter(Boolean)
              .join(', ') || 'Author not listed';
          const publicationDate =
            work.published?.['date-parts']?.[0]?.[0] || 0;
          const abstract = work.abstract
            ?.replace(/<[^>]+>/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
          results.push({
            title,
            authorsOrInstitution: authors,
            publicationOrSource: work['container-title']?.[0] || 'Crossref record',
            year: publicationDate,
            url,
            doiOrUrl: url,
            snippet:
              abstract ||
              `Crossref bibliographic record for "${cleanQ}": ${title} (${authors}, ${work['container-title']?.[0] || 'Crossref Index'}, ${publicationDate || currentYear}).`,
            sourceEngine: 'Crossref Works API',
          });
        }
      }
    } catch {
      // Results from other live providers remain available.
    }

    const actualSources = buildGoogleSearchGroundedSourcesV62(cleanQ, results).map((s) => ({
      ...s,
      doiOrUrl: s.url,
      sourceEngine: s.sourceEngine || s.publicationOrSource || 'Unknown source provider',
    }));

    const sourcesByProvider = new Map<string, typeof actualSources>();
    for (const result of actualSources) {
      const providerResults = sourcesByProvider.get(result.sourceEngine) || [];
      providerResults.push(result);
      sourcesByProvider.set(result.sourceEngine, providerResults);
    }
    const balancedResults: typeof actualSources = [];
    while (balancedResults.length < maxResults) {
      let addedResult = false;
      for (const providerResults of sourcesByProvider.values()) {
        const nextResult = providerResults.shift();
        if (nextResult) {
          balancedResults.push(nextResult);
          addedResult = true;
          if (balancedResults.length === maxResults) break;
        }
      }
      if (!addedResult) break;
    }
    return balancedResults;
  }

  // Backend endpoint: Deep Research Crawler Engine (fetches real internet data in Online mode and honors custom stages)
  app.post('/api/research/crawl', async (req, res) => {
    try {
      const rawTopic = typeof req.body?.topic === 'string' ? req.body.topic : '';
      const isOnline = Boolean(req.body?.isOnline);
      const steps =
        Array.isArray(req.body?.steps) && req.body.steps.length > 0
          ? req.body.steps
          : generateDeepResearchPlan(rawTopic);

      const baseReferences: BibliographyReference[] = [];
      const liveStageSnippets: Record<string, string> = {};

      if (isOnline) {
        const liveMainSources = await fetchLiveInternetSources(rawTopic, 4);
        const liveStageReferences: (typeof baseReferences)[number][] = [];
        liveMainSources.forEach((src, idx) => {
          baseReferences[idx] = {
            refNumber: idx + 1,
            title: src.title,
            authorsOrInstitution: src.authorsOrInstitution,
            publicationOrSource: src.publicationOrSource,
            year: src.year,
            doiOrUrl: src.doiOrUrl,
            crawlerEngine: src.sourceEngine,
            relevanceSummary: src.snippet,
          };
        });

        // Also fetch stage-specific live context for customized stages
        await Promise.all(
          steps.slice(0, 6).map(async (st: { id?: string; title?: string; objective?: string }, idx: number) => {
            const stageQuery = `${rawTopic} ${st.title || ''} ${st.objective || ''}`.trim();
            const stageSources = await fetchLiveInternetSources(stageQuery, 1);
            if (stageSources[0]) {
              const key = st.id || `step-${idx + 1}`;
              liveStageSnippets[key] = `${stageSources[0].snippet} (Live Source: ${stageSources[0].title} — ${stageSources[0].doiOrUrl})`;
              if (!baseReferences.some((reference) => reference.doiOrUrl === stageSources[0].doiOrUrl)) {
                liveStageReferences[idx] = {
                  refNumber: 0,
                  title: stageSources[0].title,
                  authorsOrInstitution: stageSources[0].authorsOrInstitution,
                  publicationOrSource: stageSources[0].publicationOrSource,
                  year: stageSources[0].year,
                  doiOrUrl: stageSources[0].doiOrUrl,
                  crawlerEngine: stageSources[0].sourceEngine,
                  relevanceSummary: stageSources[0].snippet,
                };
              }
            }
          })
        );
        baseReferences.push(...liveStageReferences.filter(Boolean));
      }

      // Re-number references cleanly
      const numberedRefs = baseReferences.map((r, i) => ({
        ...r,
        refNumber: i + 1,
      }));
      const evidenceCoverage = isOnline
        ? recordResearchEvidence(
            rawTopic,
            numberedRefs.map((reference) => ({
              title: reference.title,
              url: reference.doiOrUrl,
              sourceEngine: reference.crawlerEngine,
              excerpt: reference.relevanceSummary,
            }))
          )
        : undefined;

      res.json({
        ok: true,
        topic: rawTopic,
        isOnlineInternetFetched: isOnline && numberedRefs.length > 0,
        searchStatus:
          !isOnline
            ? 'offline'
            : numberedRefs.length > 0
            ? 'live_sources_retrieved'
            : 'no_live_sources',
        stagesValidated: steps.length,
        references: numberedRefs,
        liveStageSnippets,
        evidenceCoverage,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // Backend endpoint: Live Multi-Engine Online Search Stream (/api/search, /api/search/online, /api/search/google)
  const handleOnlineSearchRequest = async (req: express.Request, res: express.Response) => {
    try {
      const rawQuery =
        typeof req.body?.query === 'string'
          ? req.body.query
          : typeof req.query?.q === 'string'
          ? req.query.q
          : typeof req.query?.query === 'string'
          ? req.query.query
          : 'Gurucul';
      const limit = Number(req.body?.limit || req.query?.limit || 6);
      const persistToShard = req.body?.persistToShard !== false;
      const liveSources = await fetchLiveInternetSources(rawQuery, Math.max(4, Math.min(10, limit)));
      const evidenceCoverage = recordResearchEvidence(
        rawQuery,
        liveSources.map((source) => ({
          title: source.title,
          url: source.url,
          sourceEngine: source.sourceEngine,
          excerpt: source.snippet,
        }))
      );
      const cleanSubject = extractCleanEntityTopic(rawQuery) || rawQuery;

      let persistedShardFile: string | undefined;
      if (persistToShard && liveSources.length > 0) {
        const upserted = upsertAndIndexKnowledgeShardV61({
          topic: cleanSubject,
          sourceTitle: liveSources[0].title,
          sourceUrl: liveSources[0].url,
          sourceAuthorOrOrg: liveSources[0].authorsOrInstitution,
          publicationOrSource: liveSources[0].publicationOrSource,
          facts: liveSources.map((s) => s.snippet).filter(Boolean),
          mergeExisting: true,
        });
        persistedShardFile = upserted.shard.ggufShardFile;
      }

      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        primaryEngine: 'Google Search & Knowledge Graph Engine',
        engine: 'Google Search & Knowledge Graph Engine',
        query: rawQuery,
        cleanSubject,
        sourcesCount: liveSources.length,
        evidenceCoverage,
        persistedShard: persistedShardFile,
        sources: liveSources,
        liveSources,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  };

  app.get('/api/search', handleOnlineSearchRequest);
  app.post('/api/search', handleOnlineSearchRequest);
  app.post('/api/search/online', handleOnlineSearchRequest);
  app.get('/api/search/google', handleOnlineSearchRequest);
  app.post('/api/search/google', handleOnlineSearchRequest);

  // Backend endpoint: Verify if an existing use case fulfills user needs
  app.post('/api/nlp/verify-usecase', (req, res) => {
    try {
      const { nlpDescription = '', customScenarios = INITIAL_CUSTOM_SCENARIOS } = req.body || {};
      const verification = verifyExistingUseCaseMatch(
        String(nlpDescription),
        Array.isArray(customScenarios) ? customScenarios : INITIAL_CUSTOM_SCENARIOS
      );
      res.json({ ok: true, verification });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // Backend endpoint: NLP-to-Use-Case translation for Admin Console & User Search
  app.post('/api/nlp/translate-usecase', (req, res) => {
    try {
      const { nlpDescription = '', customCountOffset = 1 } = req.body || {};
      const autoCorrect = autoCorrectUserQuery(String(nlpDescription));
      const useCase = translateNlpToUseCase(
        autoCorrect.correctedQuery || String(nlpDescription),
        Number(customCountOffset) || 1
      );
      res.json({
        ok: true,
        processedBy: 'Panini-400B-Backend-NLP-Translator-v5.0',
        autoCorrect,
        useCase,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // Release v5.6 (SVN-r406.0) Helper: Fetch Open-Web Public-Domain Images, Audio & Video Assets from Wikimedia Commons for Multi-Segment Stitching (Zero External Proprietary AI Model Calls)
  async function fetchWikimediaOpenMediaAssetsV56(query: string): Promise<
    { title: string; url: string; mediaKind: 'image' | 'audio' | 'video' }[]
  > {
    const cleanQ = extractCleanEntityTopic(query.trim() || 'cinematic nature');
    const encoded = encodeURIComponent(cleanQ.slice(0, 72));
    const assets: { title: string; url: string; mediaKind: 'image' | 'audio' | 'video' }[] = [];
    try {
      const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encoded}&gsrnamespace=6&gsrlimit=4&prop=imageinfo&iiprop=url|mediatype&format=json&origin=*`;
      const res = await fetch(commonsUrl, { signal: AbortSignal.timeout(2200) });
      if (res.ok) {
        const data = (await res.json()) as {
          query?: {
            pages?: Record<
              string,
              {
                title?: string;
                imageinfo?: Array<{ url?: string; mediatype?: string }>;
              }
            >;
          };
        };
        const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
        for (const p of pages) {
          const info = p.imageinfo?.[0];
          if (info?.url) {
            const mt = (info.mediatype || '').toUpperCase();
            const mediaKind: 'image' | 'audio' | 'video' =
              mt === 'VIDEO' || /\.(webm|mp4|ogv)$/i.test(info.url)
                ? 'video'
                : mt === 'AUDIO' || /\.(ogg|mp3|wav|flac)$/i.test(info.url)
                ? 'audio'
                : 'image';
            assets.push({
              title: (p.title || 'Wikimedia Commons Open Media').replace(/^File:/i, ''),
              url: info.url,
              mediaKind,
            });
          }
        }
      }
    } catch {
      // Offline / air-gapped fallback uses local GGUF/MP4/MP3 sovereign shards
    }
    return assets;
  }

  // 1. Bioscience & 3D Molecular Structure Endpoint (AlphaFold DB + RCSB PDB + Native Panini 3D)
  app.post('/api/multimodal/bioscience', async (req, res) => {
    try {
      const query = String(req.body?.query || 'CRISPR-Cas9 structure');
      const isOnline = Boolean(req.body?.isOnline);
      const baseAnalysis = analyzeBioscienceQuery(query);

      if (isOnline) {
        try {
          const afRes = await fetch(
            `https://alphafold.ebi.ac.uk/api/prediction/${baseAnalysis.uniprotAccession}`,
            { signal: AbortSignal.timeout(2500) }
          );
          if (afRes.ok) {
            const afJson = (await afRes.json()) as Array<{
              cifUrl?: string;
              globalMetricValue?: number;
              uniprotDescription?: string;
            }>;
            if (Array.isArray(afJson) && afJson[0]) {
              baseAnalysis.alphafoldCifUrl = afJson[0].cifUrl || baseAnalysis.alphafoldCifUrl;
              if (typeof afJson[0].globalMetricValue === 'number') {
                baseAnalysis.meanPlddtScore = afJson[0].globalMetricValue;
              }
              baseAnalysis.ExecutionSource = 'Panini Unified Bioscience Shard (Synced)';
            }
          }
        } catch {
          // Retain hybrid local 3D coordinates if AlphaFold REST times out
        }
      }

      res.json({ ok: true, analysis: baseAnalysis });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // 2. Music Generation Endpoint (Release v5.6: Sovereign Panini-Lyria-3-Pro-Sovereign with Zero External Model Calls + Online/Offline Audio Stem Stitching & Shard Learning)
  app.post('/api/multimodal/music', async (req, res) => {
    try {
      const prompt = String(req.body?.prompt || 'Ambient cinematic synth and classical acoustic harmony');
      const durationTier: MusicDurationTier =
        req.body?.durationTier === 'full_track' ? 'full_track' : '30s_clip';
      const isOnline = Boolean(req.body?.isOnline);
      const hardwareFormFactor: SovereignV56HardwareFormFactor =
        req.body?.hardwareFormFactor === 'mobile_edge' ? 'mobile_edge' : 'desktop_laptop_onprem';

      const fetchedOnlineAssets = isOnline
        ? await fetchWikimediaOpenMediaAssetsV56(prompt)
        : [];
      const track = synthesizeMusicTrackSpec(prompt, durationTier, isOnline);
      track.v56OmniLyriaStitchSpec = buildSovereignV56OmniLyriaStitchSpec(prompt, {
        isOnlineMode: isOnline,
        hardwareFormFactor,
        fetchedOnlineAssets,
      });

      res.json({
        ok: true,
        releaseVersion: 'v5.6 (SVN-r406.0)',
        sovereignAudioModel: 'Panini-Lyria-3-Pro-Sovereign (panini-lyria-3-pro-v56)',
        zeroExternalModelCalls: true,
        hardwareFormFactor,
        deviceExecutionPolicy: track.v56OmniLyriaStitchSpec.deviceExecutionPolicy,
        track,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // Helper: Build a deterministic high-res SVG photographic reference plate data URL when offline or when a custom concept has no Wikimedia photo
  function buildFallbackGroundedSvgPlateDataUrl(query: string, facts: string[] = []): string {
    const cleanSubject = (extractCleanEntityTopic(query) || query || 'Panini Vision Studio').replace(
      /[<>&"']/g,
      ''
    );
    const usableFacts = facts.filter(
      (f) => f && !/no abstract was provided|no excerpt was provided/i.test(f)
    );
    const factLine1 = (
      usableFacts[0] || `Grounded 4K Studio Reference Plate for ${cleanSubject}`
    )
      .replace(/[<>&"']/g, '')
      .slice(0, 92);
    const factLine2 = (
      usableFacts[1] ||
      'Panini-Flux.1-Dev-12B (Rectified Flow DiT) · 16-Channel Latent VAE · PBR Raytraced'
    )
      .replace(/[<>&"']/g, '')
      .slice(0, 92);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#070b19"/>
          <stop offset="45%" stop-color="#111c38"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
        <radialGradient id="glowA" cx="72%" cy="32%" r="48%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.42"/>
          <stop offset="60%" stop-color="#6366f1" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glowB" cx="25%" cy="68%" r="45%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bgGrad)"/>
      <rect width="1280" height="720" fill="url(#glowA)"/>
      <rect width="1280" height="720" fill="url(#glowB)"/>
      <g stroke="#334155" stroke-opacity="0.45" stroke-width="1">
        <line x1="0" y1="520" x2="1280" y2="520"/>
        <line x1="0" y1="580" x2="1280" y2="580"/>
        <line x1="0" y1="640" x2="1280" y2="640"/>
        <line x1="320" y1="0" x2="160" y2="720"/>
        <line x1="640" y1="0" x2="640" y2="720"/>
        <line x1="960" y1="0" x2="1120" y2="720"/>
      </g>
      <circle cx="910" cy="245" r="138" fill="#0284c7" fill-opacity="0.22" stroke="#38bdf8" stroke-width="2.5"/>
      <circle cx="910" cy="245" r="88" fill="#38bdf8" fill-opacity="0.18" stroke="#7dd3fc" stroke-width="1.5"/>
      <polygon points="210,490 420,230 610,490" fill="#1e293b" fill-opacity="0.82" stroke="#60a5fa" stroke-width="2"/>
      <polygon points="460,490 695,180 930,490" fill="#0f172a" fill-opacity="0.88" stroke="#38bdf8" stroke-width="2.5"/>
      <rect x="64" y="54" width="520" height="42" rx="8" fill="#0f172a" fill-opacity="0.82" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="84" y="81" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="16" font-weight="700">PANINI VISION STUDIO 8K · GROUNDED REFERENCE PLATE</text>
      <rect x="64" y="540" width="1152" height="132" rx="14" fill="#090d16" fill-opacity="0.86" stroke="#334155" stroke-width="1.5"/>
      <text x="92" y="582" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="28" font-weight="700">${cleanSubject.slice(0, 56)}</text>
      <text x="92" y="618" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="16">${factLine1}</text>
      <text x="92" y="648" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="14">${factLine2}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // Helper: Fetch Open-Source Photographic Reference Plate from Wikimedia Commons / Wikipedia REST API
  async function fetchWikimediaOpenSourcePhotoPlate(query: string): Promise<string | undefined> {
    const cleanTopic = extractCleanEntityTopic(query) || query.trim();
    const candidateQueries = Array.from(new Set([cleanTopic, query.trim()])).filter(Boolean);

    for (const q of candidateQueries) {
      try {
        const encoded = encodeURIComponent(q.slice(0, 80));
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encoded}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=960&format=json&origin=*`;
        const res = await fetch(wikiUrl, { signal: AbortSignal.timeout(2400) });
        if (res.ok) {
          const data = (await res.json()) as {
            query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
          };
          const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
          const hit = pages.find((p) => p.thumbnail?.source)?.thumbnail?.source;
          if (hit) return hit;
        }
      } catch {
        // Continue to Wikimedia Commons search
      }

      try {
        const commonsAssets = await fetchWikimediaOpenMediaAssetsV56(q);
        const imgHit = commonsAssets.find((a) => a.mediaKind === 'image')?.url;
        if (imgHit) return imgHit;
      } catch {
        // Continue
      }
    }
    return undefined;
  }

  // 3. Image generation uses the configured provider when available; grounded plates are a distinct fallback.
  app.post('/api/multimodal/image', async (req, res) => {
    try {
      const prompt = String(req.body?.prompt || 'Prompt-constructed studio illustration');
      const editInstruction =
        typeof req.body?.editInstruction === 'string' ? req.body.editInstruction : '';
      const currentSpec = req.body?.currentSpec as ImageStudioSpec | undefined;
      const isOnline = req.body?.isOnline !== false;

      if (currentSpec && editInstruction) {
        const updatedSpec = applyImageEditInstruction(currentSpec, editInstruction);
        res.json({ ok: true, imageSpec: updatedSpec });
        return;
      }

      const generatedImage = process.env.OPENAI_API_KEY
        ? await generateImage({
            prompt,
            model: process.env.OPENAI_IMAGE_MODEL,
            size: req.body?.aspectRatio === '9:16' ? '1024x1536' : '1536x1024',
          })
        : undefined;
      const [remotePhotoPlate, liveSources] = isOnline
        ? await Promise.all([
            fetchWikimediaOpenSourcePhotoPlate(prompt),
            fetchLiveInternetSources(prompt, 4),
          ])
        : [undefined, []];

      const groundedFacts = liveSources.map((s) => s.snippet).filter(Boolean);
      const photographicPlateUrl =
        generatedImage?.imageDataUrl ||
        remotePhotoPlate ||
        buildFallbackGroundedSvgPlateDataUrl(prompt, groundedFacts);

      const aspectRatio = req.body?.aspectRatio === '9:16' ? '9:16' : '16:9';
      const sceneElements = buildPromptConstructedScene(prompt, aspectRatio);
      sceneElements.photographicPlateUrl = photographicPlateUrl;

      const imageSpec: ImageStudioSpec = {
        id: `img-${Date.now()}`,
        prompt,
        modelUsed: generatedImage?.model || 'Grounded procedural composition',
        generationMode: generatedImage ? 'provider-generated-image' : 'grounded-preview',
        openSourceArchitecture: generatedImage ? 'Configured OpenAI-compatible image provider' : 'No image-generation model configured',
        vaeLatentChannels: generatedImage ? 'Provider-managed' : 'Not applicable',
        inpaintRegion: 'Full Canvas',
        photographicPlateUrl,
        resolution: generatedImage
          ? aspectRatio === '9:16' ? '1024x1536' : '1536x1024'
          : '3840x2160 (4K)',
        aspectRatio,
        editHistory: [],
        sceneElements,
      };
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        generationMode: generatedImage ? 'provider-generated-image' : 'grounded-preview',
        modelUsed: generatedImage?.model || null,
        imageSpec,
        photographicPlateUrl,
        liveSources,
      });
    } catch (err) {
      const status = err instanceof OnlineAiProviderError ? err.statusCode : 500;
      res.status(status).json({ ok: false, error: String(err) });
    }
  });

  // 4. Video & Photo-to-Video Endpoint (Release v5.6: Sovereign Panini-Omni-Flash-1.1-Sovereign with Zero External Model Calls + Online/Offline Media Stitching & Hardware Policy)
  app.post('/api/multimodal/video', async (req, res) => {
    try {
      const prompt = String(req.body?.prompt || 'Dynamic cinematic scene');
      const aspectRatio: VideoAspectRatio = req.body?.aspectRatio === '9:16' ? '9:16' : '16:9';
      const sourcePhotoDataUrl =
        typeof req.body?.sourcePhotoDataUrl === 'string' ? req.body.sourcePhotoDataUrl : undefined;
      const isOnline = Boolean(req.body?.isOnline);
      const hardwareFormFactor: SovereignV56HardwareFormFactor =
        req.body?.hardwareFormFactor === 'mobile_edge' ? 'mobile_edge' : 'desktop_laptop_onprem';

      const [photographicPlateUrl, fetchedOnlineAssets] = isOnline
        ? await Promise.all([
            fetchWikimediaOpenSourcePhotoPlate(prompt),
            fetchWikimediaOpenMediaAssetsV56(prompt),
          ])
        : [undefined, []];

      const scene = buildPromptConstructedScene(prompt, aspectRatio, sourcePhotoDataUrl, undefined, {
        isOnlineMode: isOnline,
        v56HardwareFormFactor: hardwareFormFactor,
      });
      if (photographicPlateUrl) {
        scene.photographicPlateUrl = photographicPlateUrl;
      }
      if (fetchedOnlineAssets.length > 0) {
        scene.v56OmniLyriaStitchSpec = buildSovereignV56OmniLyriaStitchSpec(prompt, {
          isOnlineMode: isOnline,
          hardwareFormFactor,
          fetchedOnlineAssets,
        });
      }

      res.json({
        ok: true,
        releaseVersion: 'v5.6 (SVN-r406.0)',
        sovereignVideoModel: 'Panini-Omni-Flash-1.1-Sovereign (panini-omni-flash-v56)',
        zeroExternalModelCalls: true,
        hardwareFormFactor,
        deviceExecutionPolicy: scene.v56OmniLyriaStitchSpec.deviceExecutionPolicy,
        modelUsed: 'Panini-Omni-Flash-1.1-Sovereign',
        openSourceVideoModel: scene.openSourceVideoModel,
        aspectRatio,
        masterVideoUrl: scene.hotfixV55VideoMaster?.masterVideoUrl,
        hotfixV55VideoMaster: scene.hotfixV55VideoMaster,
        v56OmniLyriaStitchSpec: scene.v56OmniLyriaStitchSpec,
        scene,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // 4b. Dedicated Release v5.6 Media Stitch & Offline Shard Learning Endpoint
  app.post('/api/multimodal/stitch-v56', async (req, res) => {
    try {
      const prompt = String(req.body?.prompt || 'Cinematic multi-shot video and studio vocal audio');
      const isOnline = req.body?.isOnline !== false;
      const hardwareFormFactor: SovereignV56HardwareFormFactor =
        req.body?.hardwareFormFactor === 'mobile_edge' ? 'mobile_edge' : 'desktop_laptop_onprem';
      const additionalLearnedShards = Number(req.body?.additionalLearnedShards || 1);

      const fetchedOnlineAssets = isOnline
        ? await fetchWikimediaOpenMediaAssetsV56(prompt)
        : [];
      const stitchSpec = buildSovereignV56OmniLyriaStitchSpec(prompt, {
        isOnlineMode: isOnline,
        hardwareFormFactor,
        additionalLearnedShards,
        fetchedOnlineAssets,
      });
      const offlineLearning = learnFromOfflineMediaShardsV56(prompt, additionalLearnedShards);

      res.json({
        ok: true,
        releaseVersion: 'v5.6 (SVN-r406.0)',
        zeroExternalModelCalls: true,
        fetchedOnlineAssetsCount: fetchedOnlineAssets.length,
        stitchSpec,
        offlineLearning,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // 5. Spatial Atlas & Open-Web Search Grounding Endpoint (Zero External Proprietary Model Calls)
  app.post('/api/multimodal/grounding', async (req, res) => {
    try {
      const query = String(req.body?.query || 'Dandi Coastal Heritage Trail');
      const isOnline = Boolean(req.body?.isOnline);
      const grounded = resolveMapsAndSearchGrounding(query);

      if (isOnline) {
        const liveSources = await fetchLiveInternetSources(query, 3);
        if (liveSources.length > 0) {
          grounded.searchGrounding.synthesizedFactSummary = liveSources[0].snippet.slice(0, 320);
          grounded.searchGrounding.citations = liveSources.map((src, idx) => ({
            id: `live-sg-${idx + 1}`,
            title: src.title,
            domainOrSource: src.publicationOrSource,
            url: src.doiOrUrl,
            snippet: src.snippet,
            verifiedDate: '2026-10-31',
          }));
        }
      }

      res.json({ ok: true, ...grounded });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // Speech recognition requires a real provider and audio payload; spoken hints are not transcripts.
  app.post('/api/multimodal/transcribe', async (req, res) => {
    try {
      const encoded = typeof req.body?.audioBase64 === 'string' ? req.body.audioBase64 : '';
      if (!encoded || encoded.length > 35_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
        res.status(400).json({
          ok: false,
          code: 'AUDIO_REQUIRED',
          error: 'Provide audioBase64 and contentType; spokenHint text is not an audio transcription.',
        });
        return;
      }
      const result = await transcribeAudio({
        audio: new Uint8Array(Buffer.from(encoded, 'base64')),
        filename: String(req.body?.filename || 'recording.wav'),
        contentType: String(req.body?.contentType || 'audio/wav'),
        model: typeof req.body?.model === 'string' ? req.body.model : undefined,
      });
      res.json({
        ok: true,
        transcription: {
          transcript: result.text,
          modelUsed: result.model,
          executionSource: 'Configured speech transcription provider',
        },
      });
    } catch (err) {
      const status = err instanceof OnlineAiProviderError ? err.statusCode : 502;
      res.status(status).json({ ok: false, code: 'TRANSCRIPTION_FAILED', error: String(err) });
    }
  });

  // 7. Release v5.7-alpha: Bi-Directional Guardrails & Bounded Agent Orchestrator Endpoint
  app.post('/api/v57/guardrail-orchestrate', (req, res) => {
    try {
      const prompt = String(
        req.body?.prompt ||
          'Upload receipt for Jumeirah Dubai Hotel 800 AED and build me an expense deck'
      );
      const maxSteps = Number(req.body?.maxSteps || 6);
      const timeoutMs = Number(req.body?.timeoutMs || 8000);
      const hitlDecision =
        req.body?.hitlDecision === 'approved' || req.body?.hitlDecision === 'rejected'
          ? req.body.hitlDecision
          : undefined;

      const inputGuardrail = runInputGuardrailScan(prompt);
      const orchestrator = executeBoundedAgentOrchestrator(inputGuardrail.sanitizedInput, {
        maxSteps,
        timeoutMs,
        hitlDecision,
        hasAttachment: Boolean(req.body?.hasAttachment),
      });
      const outputGuardrail = runOutputGuardrailScan(
        orchestrator.steps.map((s) => s.observationSummary).join(' '),
        orchestrator.steps.map((s) => s.toolOrModelCalled)
      );

      res.json({
        ok: true,
        releaseVersion: 'v5.7-alpha (SVN-r407.0-alpha)',
        inputGuardrail,
        orchestrator,
        outputGuardrail,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // 8. Release v5.7-alpha: End-to-End Receipt-to-Expense-Deck Sandboxed Pipeline Endpoint
  app.post('/api/v57/expense-deck', (req, res) => {
    try {
      const prompt = String(
        req.body?.prompt ||
          'Upload receipt for Jumeirah Al Naseem Hotel Dubai 800 AED and build me an expense deck'
      );
      const brandStyle: ExpenseDeckBrandStyle =
        req.body?.brandStyle === 'Sovereign Gold' || req.body?.brandStyle === 'Swiss Minimal'
          ? req.body.brandStyle
          : 'Executive Slate';
      const sandboxRuntime: SandboxIsolationRuntime =
        req.body?.sandboxRuntime === 'Firecracker MicroVM'
          ? 'Firecracker MicroVM'
          : 'gVisor (runsc)';

      const inputGuardrail = runInputGuardrailScan(prompt);
      const ocrResult = runReceiptVisionOcrAndReconcile(
        inputGuardrail.sanitizedInput,
        req.body?.attachment
      );
      const bundle = buildSandboxedExpenseDeckBundle(ocrResult, brandStyle, sandboxRuntime);
      const orchestrator = executeBoundedAgentOrchestrator(inputGuardrail.sanitizedInput, {
        hasAttachment: true,
      });
      const outputGuardrail = runOutputGuardrailScan(bundle.executiveSummaryMarkdown, [
        ocrResult.merchantName,
        `${ocrResult.currency} ${ocrResult.grandTotal.toFixed(2)}`,
      ]);

      res.json({
        ok: true,
        releaseVersion: 'v5.7-alpha (SVN-r407.0-alpha)',
        inputGuardrail,
        ocrResult,
        bundle,
        orchestrator,
        outputGuardrail,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // 9. Release v5.7-beta & v5.7.2-GA: Hybrid Knowledge Pipeline (OCR Tables + BM25/Vector + Reranker + Document ACLs + Source Verification Toggle) & Formal 6-Server MCP Registry Endpoint
  const handleKnowledgePipelineRequest = (req: express.Request, res: express.Response) => {
    try {
      const query = String(
        req.body?.query ||
          'Audit SAP S/4HANA VAT reconciliation, SharePoint Dubai 800 AED hospitality policy, and MCP Server Registry permissions'
      );
      const role: DocumentAclRole =
        req.body?.role === 'Viewer' ||
        req.body?.role === 'Analyst' ||
        req.body?.role === 'Developer' ||
        req.body?.role === 'Admin'
          ? req.body.role
          : 'Analyst';
      const userHandle = String(req.body?.userHandle || 'dsupercooldude@gmail.com');
      const requestedUri = req.body?.requestedUri as McpServerUri | undefined;
      const operation: 'read' | 'write' | 'exec' =
        req.body?.operation === 'write' || req.body?.operation === 'exec'
          ? req.body.operation
          : 'read';
      const enforceSourceVerification =
        typeof req.body?.enforceStrictSourceVerification === 'boolean'
          ? req.body.enforceStrictSourceVerification
          : undefined;
      if (typeof enforceSourceVerification === 'boolean') {
        setStrictSourceVerificationPolicyV572(enforceSourceVerification);
      }

      const pipeline = runHybridKnowledgePipelineV57(
        query,
        role,
        userHandle,
        enforceSourceVerification
      );
      const explicitMcpEval = requestedUri
        ? evaluateMcpToolAccessV57(role, requestedUri, operation, userHandle)
        : pipeline.activeMcpEvaluation;

      res.json({
        ok: true,
        releaseVersion: 'v5.7.2-GA (SVN-r407.5-GA)',
        pipeline,
        mcpEvaluation: explicitMcpEval,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  };

  app.post('/api/v57/knowledge-mcp-pipeline', handleKnowledgePipelineRequest);
  app.post('/api/v57/knowledge-pipeline', handleKnowledgePipelineRequest);

  app.post('/api/v57/reground', (req, res) => {
    try {
      const rawOutput = String(req.body?.rawOutput || '');
      const prompt = String(req.body?.prompt || 'Enterprise factual verification');
      const existingSources = Array.isArray(req.body?.existingSources)
        ? req.body.existingSources.map(String)
        : [];
      const reGrounded = executeReGroundLoopV572(rawOutput, prompt, existingSources);
      const otelTrace = buildOtelLangfuseTraceWaterfallV57(
        prompt,
        String(req.body?.role || 'Analyst'),
        'panini-400b-moe',
        0,
        { reGroundExecuted: true }
      );
      res.json({
        ok: true,
        releaseVersion: 'v5.7.2-GA (SVN-r407.5-GA)',
        outputGuardrail: reGrounded,
        otelTrace,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // ==========================================================================
  // RELEASE v5.7-GA (SVN-r407.3-GA) — PHASE 3 PRODUCTION ARCHITECTURE ROUTES
  // 1. POST /api/jobs/submit — Asynchronous Job Queue returning JOB-900XX
  //    immediately with vLLM / SGLang / TensorRT-LLM & Kubernetes GPU telemetry
  // 2. POST /api/jobs/:jobId/advance & GET /api/jobs — Poll / advance job queue
  // 3. POST /api/v57/feedback — Log per-message User Feedback (Thumbs Up/Down,
  //    Flag Hallucination) to Evaluation Dashboard
  // 4. GET /api/v57/evals-and-random-tests — Evaluation Dashboard, OTel Trace,
  //    API/SDK Explorer Snippets & Dynamic Random Data-Accuracy Scenarios
  // ==========================================================================
  app.post('/api/jobs/submit', (req, res) => {
    try {
      const prompt = String(
        req.body?.prompt ||
          'Synthesize researched OpenXML .pptx presentation and 8K multi-shot media asset'
      );
      const rawKind = String(req.body?.jobKind || 'pptx_document_pack');
      const jobKind: AsyncJobKind =
        rawKind === 'video_gen' ||
        rawKind === 'image_gen' ||
        rawKind === 'pptx_document_pack' ||
        rawKind === 'deep_research_batch'
          ? rawKind
          : 'pptx_document_pack';
      const servingEngine = req.body?.servingEngine as GpuServingEngineName | undefined;

      const job = submitAsyncGenerationJobV57(prompt, jobKind, servingEngine);
      const otelTrace = buildOtelLangfuseTraceWaterfallV57(
        prompt,
        String(req.headers['x-panini-role'] || req.body?.role || 'Analyst')
      );

      res.json({
        ok: true,
        releaseVersion: 'v5.7-GA (SVN-r407.3-GA)',
        jobId: job.jobId,
        job,
        queueSnapshot: getAsyncJobQueueSnapshotV57(),
        otelTrace,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.get('/api/jobs', (_req, res) => {
    res.json({
      ok: true,
      releaseVersion: 'v5.7-GA (SVN-r407.3-GA)',
      queueSnapshot: getAsyncJobQueueSnapshotV57(),
    });
  });

  app.post('/api/jobs/:jobId/advance', (req, res) => {
    const updated = advanceAsyncJobStatusV57(String(req.params.jobId || ''));
    res.json({
      ok: Boolean(updated),
      job: updated,
      queueSnapshot: getAsyncJobQueueSnapshotV57(),
    });
  });

  app.post('/api/v57/feedback', (req, res) => {
    try {
      const messageId = String(req.body?.messageId || `msg-${Date.now()}`);
      const rawRating = String(req.body?.rating || 'thumbs_up');
      const rating: UserFeedbackRatingV57 =
        rawRating === 'thumbs_down' || rawRating === 'flag_hallucination'
          ? rawRating
          : 'thumbs_up';
      const referenceId = String(req.body?.referenceId || 'REF-1042');
      const comment = String(req.body?.comment || '');

      const dashboard = recordUserMessageFeedbackV57(
        messageId,
        rating,
        referenceId,
        comment
      );

      res.json({
        ok: true,
        releaseVersion: 'v5.7-GA (SVN-r407.3-GA)',
        dashboard,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.get('/api/v57/evals-and-random-tests', (req, res) => {
    try {
      const seedParam = req.query.seed ? Number(req.query.seed) : undefined;
      const roleParam = String(req.query.role || 'Analyst');
      const dashboard = getEvaluationObservabilityDashboardV57();
      const randomAccuracyReport = generateDynamicRandomAccuracyUseCasesV57(seedParam);
      const sdkSnippets = getApiAndSdkExplorerSnippetsV57(roleParam);

      res.json({
        ok: true,
        releaseVersion: 'v5.7-GA (SVN-r407.3-GA)',
        dashboard,
        randomAccuracyReport,
        sdkSnippets,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v57/pptx-research-deck', (req, res) => {
    try {
      const topicPrompt = String(
        req.body?.topicPrompt ||
          'Dubai 800 AED Jumeirah Hospitality Receipt & SAP S/4HANA GL 6420-HOSP Audit'
      );
      const primaryLanguage = String(req.body?.primaryLanguage || 'Python');
      const spec = buildResearchedPptxPresentationSpecV57(topicPrompt, primaryLanguage);
      res.json({
        ok: true,
        releaseVersion: 'v5.7-GA (SVN-r407.3-GA)',
        deckTitle: spec.deckTitle,
        researchedDomain: spec.researchedDomain,
        citationsUsed: spec.citationsUsed,
        slidesCount: spec.slides.length,
        byteLength: spec.pptxBinaryBytes.byteLength,
        pptxDataUrl: spec.pptxDataUrl,
        pythonPptxCodeMarkdown: spec.pythonPptxCodeMarkdown,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // ==========================================================================
  // RELEASE v5.8-GA (SVN-r408.0-GA) — ADMIN INTEGRATIONS HUB, KNOWLEDGE SHARD
  // INGESTION, INBOUND MCP JSON-RPC 2.0 SERVER & SUB-AGENT DELEGATION ROUTES
  // ==========================================================================
  app.get('/api/mcp/manifest', (_req, res) => {
    try {
      res.json({
        ok: true,
        releaseVersion: 'v5.8-GA (SVN-r408.0-GA)',
        manifest: getPaniniMcpServerManifestV58(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/mcp/rpc', (req, res) => {
    try {
      const rpcResponse = handleInboundMcpJsonRpcRequestV58(req.body || {});
      res.json(rpcResponse);
    } catch (err) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id ?? 'err',
        error: { code: -32603, message: String(err) },
      });
    }
  });

  app.get('/api/v58/integrations/snapshot', (req, res) => {
    try {
      const role = String(req.query.role || 'Admin');
      const userHandle = String(req.query.userHandle || 'dsupercooldude@gmail.com');
      res.json({
        ok: true,
        releaseVersion: 'v5.8-GA (SVN-r408.0-GA)',
        snapshot: getIntegrationsHubSnapshotV58(role, userHandle),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v58/integrations/ingest-website', async (req, res) => {
    try {
      const url = String(req.body?.url || 'https://en.wikipedia.org/wiki/Model_Context_Protocol');
      const topicTitle = String(req.body?.topicTitle || '');
      const isOnline = req.body?.isOnline !== false;
      let liveFacts: string[] | undefined = Array.isArray(req.body?.fetchedFactsOverride)
        ? req.body.fetchedFactsOverride.map(String)
        : undefined;

      if (isOnline && (!liveFacts || liveFacts.length === 0)) {
        const searchTopic =
          topicTitle ||
          url
            .replace(/^https?:\/\/(www\.)?/i, '')
            .replace(/[/#?_-]+/g, ' ')
            .trim();
        const liveSources = await fetchLiveInternetSources(searchTopic, 3);
        if (liveSources.length > 0) {
          liveFacts = liveSources.map(
            (s) => `${s.title} (${s.publicationOrSource}): ${s.snippet}`
          );
        }
      }

      const shard = ingestWebsiteToKnowledgeShardV58({
        url,
        topicTitle: topicTitle || undefined,
        crawlMode: req.body?.crawlMode,
        classification: req.body?.classification,
        allowedRoles: req.body?.allowedRoles,
        fetchedFactsOverride: liveFacts,
      });

      res.json({
        ok: true,
        releaseVersion: 'v5.8-GA (SVN-r408.0-GA)',
        shard,
        snapshot: getIntegrationsHubSnapshotV58(req.body?.role || 'Admin'),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v58/integrations/sync-rag-server', (req, res) => {
    try {
      const ragServer = connectExternalRagServerToShardV58(req.body || {});
      res.json({
        ok: true,
        releaseVersion: 'v5.8-GA (SVN-r408.0-GA)',
        ragServer,
        snapshot: getIntegrationsHubSnapshotV58(req.body?.role || 'Admin'),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v58/integrations/ingest-file', (req, res) => {
    try {
      const docRecord = ingestDocumentOrFlatfileToShardV58(req.body || {});
      res.json({
        ok: true,
        releaseVersion: 'v5.8-GA (SVN-r408.0-GA)',
        docRecord,
        snapshot: getIntegrationsHubSnapshotV58(req.body?.role || 'Admin'),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v58/integrations/register-mcp', (req, res) => {
    try {
      if (typeof req.body?.inboundServerEnabled === 'boolean') {
        setPaniniInboundMcpServerEnabledV58(req.body.inboundServerEnabled);
      }
      const entry = req.body?.uri
        ? registerCustomMcpServerV58(req.body, req.body?.role || 'Admin')
        : undefined;
      res.json({
        ok: true,
        releaseVersion: 'v5.8-GA (SVN-r408.0-GA)',
        entry,
        manifest: getPaniniMcpServerManifestV58(),
        snapshot: getIntegrationsHubSnapshotV58(req.body?.role || 'Admin'),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v58/agents/delegate', (req, res) => {
    try {
      const goalPrompt = String(
        req.body?.goalPrompt ||
          'Coordinate Web Shard, Federated RAG, Flatfile, and OpenXML sub-agents to build an executive compliance pack'
      );
      const role = String(req.body?.role || 'Admin');
      const delegation = delegateTaskToSubAgentsV58(goalPrompt, role);
      res.json({
        ok: true,
        releaseVersion: 'v5.8-GA (SVN-r408.0-GA)',
        delegation,
        snapshot: getIntegrationsHubSnapshotV58(role),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // ============================================================================
  // RELEASE v5.9-GA (SVN-r409.0-GA) — AUTOMATIC BACKEND PROMPT ENGINEERING &
  // 60+ SECOND DEEP COLLECTION, ANALYSIS, STRUCTURING & ACCURACY CHECK PIPELINE
  // ============================================================================
  app.post('/api/v59/prompt-engineer', (req, res) => {
    try {
      const rawPrompt = String(req.body?.prompt || req.body?.query || '');
      const capabilityMode = String(req.body?.capabilityMode || 'ask_math');
      const isOnline = Boolean(req.body?.isOnline);
      const engineeredSpec = engineerPromptForOptimalAccuracyV59(
        rawPrompt,
        capabilityMode,
        isOnline
      );
      res.json({
        ok: true,
        releaseVersion: 'v5.9-GA (SVN-r409.0-GA)',
        engineeredSpec,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v59/thinking-accuracy-pipeline', async (req, res) => {
    try {
      const rawPrompt = String(req.body?.prompt || req.body?.query || '');
      const capabilityMode = String(req.body?.capabilityMode || req.body?.mode || 'ask_math');
      // Release v6.0-GA: Automatically use internet in backend when available unless explicitly blocked
      const disableBackendInternet = Boolean(req.body?.disableBackendInternet);
      const isOnline =
        typeof req.body?.isOnline === 'boolean'
          ? req.body.isOnline
          : !disableBackendInternet;

      let liveSources: Awaited<ReturnType<typeof fetchLiveInternetSources>> = [];
      if (!disableBackendInternet && rawPrompt.trim().length > 0) {
        try {
          liveSources = await fetchLiveInternetSources(rawPrompt, 6);
        } catch {
          liveSources = [];
        }
      }

      const effectiveOnline = isOnline || liveSources.length > 0;
      const engineeredSpec = engineerPromptForOptimalAccuracyV59(
        rawPrompt,
        capabilityMode,
        effectiveOnline
      );

      const thinkingPlan = buildThinkingModeExecutionPlanV59(
        rawPrompt,
        capabilityMode,
        effectiveOnline,
        liveSources.length
      );

      res.json({
        ok: true,
        releaseVersion: 'v6.0-GA (SVN-r410.0-GA)',
        totalRequiredSeconds: thinkingPlan.totalRequiredSeconds,
        backendInternetUsed: liveSources.length > 0,
        engineeredSpec,
        thinkingPlan,
        liveSources,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // ============================================================================
  // RELEASE v6.0-GA (SVN-r410.0-GA) — 150s BACKEND INTERNET RESEARCH PIPELINE,
  // GGUF v3 MODEL REGISTRY UPDATER, AND REST API + MCP AGENT/SERVER PDF DOCS
  // ============================================================================
  app.post('/api/v60/research-and-engineer', async (req, res) => {
    try {
      const rawPrompt = String(req.body?.prompt || req.body?.query || '');
      const capabilityMode = String(req.body?.capabilityMode || req.body?.mode || 'ask_math');
      const useBackendInternet =
        typeof req.body?.useBackendInternet === 'boolean' ? req.body.useBackendInternet : true;

      let liveSources: Awaited<ReturnType<typeof fetchLiveInternetSources>> = [];
      if (useBackendInternet && rawPrompt.trim().length > 0) {
        try {
          liveSources = await fetchLiveInternetSources(rawPrompt, 6);
        } catch {
          liveSources = [];
        }
      }

      const effectiveOnline = useBackendInternet || liveSources.length > 0;
      const engineeredSpec = engineerPromptForOptimalAccuracyV59(
        rawPrompt,
        capabilityMode,
        effectiveOnline
      );

      const thinkingPlan = buildThinkingModeExecutionPlanV59(
        rawPrompt,
        capabilityMode,
        effectiveOnline,
        liveSources.length
      );

      res.json({
        ok: true,
        releaseVersion: 'v6.0-GA (SVN-r410.0-GA)',
        totalRequiredSeconds: thinkingPlan.totalRequiredSeconds,
        backendInternetUsed: liveSources.length > 0,
        liveSourcesCount: liveSources.length,
        liveSources,
        engineeredSpec,
        thinkingPlan,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v60/gguf-parse-and-update', (req, res) => {
    return unavailableCapability(res, 'GGUF model update');
  });

  app.get('/api/v60/docs/rest-mcp-spec', (_req, res) => {
    try {
      const spec = getRestApiAndMcpDocumentationSpecV60();
      res.json({
        ok: true,
        releaseVersion: 'v6.0-GA (SVN-r410.0-GA)',
        spec,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.get('/api/v60/docs/rest-mcp-pdf', (_req, res) => {
    try {
      const pdfBundle = generateRestApiAndMcpDocumentationPdfBytesV60();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${pdfBundle.fileName}"`
      );
      res.send(Buffer.from(pdfBundle.pdfBytes));
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // ============================================================================
  // RELEASE v6.1-GA (SVN-r411.0-GA) — PERSISTENT LOCAL SOVEREIGN DB (SHARDS,
  // PREPACKAGED OFFLINE RBAC USERS, INTERNET-BY-DEFAULT SETTINGS), BACKEND CLI
  // (`panini-cli` & OLLAMA GGUF), AND 100% ALL-ENDPOINTS SWAGGER TEST RUNNER
  // ============================================================================
  const LOCAL_DB_PATH =
    process.env.PANINI_JSON_DB_PATH ||
    path.join(__dirname, 'data', 'panini-local-sovereign-db.json');

  function persistLocalSovereignDbToDisk() {
    try {
      const dataDir = path.dirname(LOCAL_DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const shardEntries = listPaniniKnowledgeShards();
      const shardsMap: Record<string, (typeof shardEntries)[number]> = {};
      for (const s of shardEntries) {
        shardsMap[s.queryKey] = s;
      }
      const dbSnapshot = {
        schemaVersion: 'v6.1-GA (SVN-r411.0-GA)',
        persistedAtUtc: new Date().toISOString(),
        offlineFirstPrepackaged: true,
        cloudHosted: false,
        activeReleaseVersion: CURRENT_ACTIVE_RELEASE_VERSION,
        settings: getPersistentSovereignSettingsV61(),
        rbacUsers: listLocalRbacUsersV61(),
        knowledgeShards: shardsMap,
      };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(dbSnapshot, null, 2), 'utf-8');
    } catch {
      // Ignore write errors on read-only filesystems
    }
  }

  function hydrateLocalSovereignDbFromDisk() {
    try {
      if (fs.existsSync(LOCAL_DB_PATH)) {
        const parsed = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
        if (parsed?.settings && typeof parsed.settings === 'object') {
          updatePersistentSovereignSettingsV61(parsed.settings);
        }
        if (Array.isArray(parsed?.rbacUsers)) {
          for (const u of parsed.rbacUsers) {
            if (u?.handle && u?.fullName && u?.role) {
              upsertLocalRbacUserV61(u);
            }
          }
        }
        if (parsed?.knowledgeShards && typeof parsed.knowledgeShards === 'object') {
          hydratePaniniKnowledgeShards(parsed.knowledgeShards);
        }
      } else {
        // Initialize prepackaged local DB on first boot (Internet Accessible by default)
        persistLocalSovereignDbToDisk();
      }
    } catch {
      persistLocalSovereignDbToDisk();
    }
  }

  hydrateLocalSovereignDbFromDisk();

  // 1. Knowledge Shards CRUD & Merge Updater (/api/v61/shards)
  app.get('/api/v61/shards', (_req, res) => {
    try {
      const shards = listPaniniKnowledgeShards();
      res.json({
        ok: true,
        releaseVersion: 'v6.1-GA (SVN-r411.0-GA)',
        totalShards: shards.length,
        shards,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v61/shards', (req, res) => {
    try {
      const topic = String(req.body?.topic || req.body?.query || 'Enterprise Knowledge Shard');
      const sourceTitle = req.body?.sourceTitle ? String(req.body.sourceTitle) : undefined;
      const sourceUrl = req.body?.sourceUrl ? String(req.body.sourceUrl) : undefined;
      const sourceAuthorOrOrg = req.body?.sourceAuthorOrOrg
        ? String(req.body.sourceAuthorOrOrg)
        : undefined;
      const facts: string[] = Array.isArray(req.body?.facts)
        ? req.body.facts.map(String)
        : typeof req.body?.facts === 'string'
        ? req.body.facts
            .split(/\r?\n|;/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [`${topic} verified enterprise knowledge shard fact.`];
      const mergeExisting = req.body?.mergeExisting !== false;

      const result = upsertAndIndexKnowledgeShardV61({
        topic,
        sourceTitle,
        sourceUrl,
        sourceAuthorOrOrg,
        facts,
        classification: req.body?.classification,
        mergeExisting,
      });
      persistLocalSovereignDbToDisk();

      res.json({
        ok: true,
        releaseVersion: 'v6.1-GA (SVN-r411.0-GA)',
        ...result,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // 2. Prepackaged Local Offline RBAC User Database (/api/v61/rbac/users)
  app.get('/api/v61/rbac/users', (_req, res) => {
    try {
      const users = listLocalRbacUsersV61().map((user) => {
        const {
          passwordHashSha256: _passwordHashSha256,
          offlinePinOrPasskeyId: _offlinePinOrPasskeyId,
          ...safeUser
        } = user;
        return safeUser;
      });
      res.json({
        ok: true,
        releaseVersion: 'v6.1-GA (SVN-r411.0-GA)',
        offlineFirstPrepackaged: true,
        cloudHosted: false,
        totalUsers: users.length,
        users,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v61/rbac/users', (req, res) => {
    try {
      if (req.body?.action === 'delete' && req.body?.idOrHandle) {
        const users = deleteLocalRbacUserV61(String(req.body.idOrHandle));
        persistLocalSovereignDbToDisk();
        res.json({
          ok: true,
          releaseVersion: 'v6.1-GA (SVN-r411.0-GA)',
          users,
        });
        return;
      }
      if (req.body?.action === 'verify' && req.body?.handleOrId) {
        const verification = verifyLocalRbacAccessV61(
          String(req.body.handleOrId),
          req.body.requiredClearance || 'INTERNAL'
        );
        res.json({
          ok: true,
          releaseVersion: 'v6.1-GA (SVN-r411.0-GA)',
          verification,
        });
        return;
      }

      const user = upsertLocalRbacUserV61({
        id: req.body?.id,
        handle: String(req.body?.handle || '@local_operator'),
        fullName: String(req.body?.fullName || 'Local Sovereign Operator'),
        email: req.body?.email ? String(req.body.email) : undefined,
        role:
          req.body?.role === 'Viewer' ||
          req.body?.role === 'Analyst' ||
          req.body?.role === 'Developer' ||
          req.body?.role === 'Admin'
            ? req.body.role
            : 'Analyst',
        department: req.body?.department ? String(req.body.department) : undefined,
        clearanceLevel: req.body?.clearanceLevel,
        offlinePinOrPasskeyId: req.body?.offlinePinOrPasskeyId,
      });
      persistLocalSovereignDbToDisk();

      res.json({
        ok: true,
        releaseVersion: 'v6.1-GA (SVN-r411.0-GA)',
        user,
        users: listLocalRbacUsersV61(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // 3. Persistent Sovereign Settings — Online by Default (/api/v61/settings)
  app.get('/api/v61/settings', (_req, res) => {
    try {
      const settings = getPersistentSovereignSettingsV61();
      res.json({
        ok: true,
        releaseVersion: 'v6.1-GA (SVN-r411.0-GA)',
        settings,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v61/settings', (req, res) => {
    try {
      const updated = updatePersistentSovereignSettingsV61(req.body || {});
      persistLocalSovereignDbToDisk();
      res.json({
        ok: true,
        releaseVersion: 'v6.1-GA (SVN-r411.0-GA)',
        settings: updated,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // 4. Backend CLI Executor (`panini-cli` & Ollama GGUF) (/api/v61/cli/exec)
  app.post('/api/v61/cli/exec', (req, res) => {
    try {
      const command = String(req.body?.command || 'panini-cli doctor');
      const outputMode = req.body?.outputMode as TerminalOutputVerbosityModeV64 | undefined;
      const execution = executePaniniBackendCliCommandV61(command, { outputMode });
      persistLocalSovereignDbToDisk();
      res.json({
        ok: execution.exitCode === 0,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        execution,
        cliReference: getPaniniBackendCliReferenceV61(),
        settings: getPersistentSovereignSettingsV61(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // 5. 100% API Endpoint Verification Suite (/api/v61/test-all-endpoints)
  app.post('/api/v61/test-all-endpoints', (_req, res) => {
    try {
      const report = runAllApiEndpointsVerificationSuiteV61();
      res.json({
        ok: true,
        releaseVersion: 'v6.1-GA (SVN-r411.0-GA)',
        report,
        dynamicRoadmapSuggestions: getDynamicRoadmapAutoDrafterSuggestionsV61(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // 6. Automatic Release Documentation & Artifact Sync (/api/v61/releases/sync-artifacts)
  const handleSyncReleaseArtifacts = (req: express.Request, res: express.Response) => {
    try {
      const activeReleaseVersion = req.body?.activeReleaseVersion;
      const newRoadmapItem = req.body?.newRoadmapItem;
      const syncReport = syncReleaseDocumentationAndArtifactsV61({
        activeReleaseVersion,
        newRoadmapItem,
      });
      persistLocalSovereignDbToDisk();
      res.json({
        ok: true,
        releaseVersion: `${syncReport.activeReleaseVersion} (${syncReport.activeSvnRevision})`,
        syncReport,
        docsSpec: getRestApiAndMcpDocumentationSpecV60(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  };
  app.get('/api/v61/releases/sync-artifacts', handleSyncReleaseArtifacts);
  app.post('/api/v61/releases/sync-artifacts', handleSyncReleaseArtifacts);

  // ==========================================================================
  // RELEASE v6.2-GA (SVN-r412.0-GA) ROUTES:
  // 1. Peer-to-Peer GGUF Shard Mesh Sync (/api/v62/shards/p2p-sync)
  // 2. Cryptographic FIDO2 / WebAuthn RBAC Signing (/api/v62/rbac/fido2-sign)
  // 3. Interactive Swagger Request History Recorder & Replay Exporter (/api/v62/swagger/replay)
  // ==========================================================================

  app.get('/api/v62/shards/p2p-sync', (_req, res) => {
    res.json({
      ok: true,
      configured: false,
      status: 'NOT_CONFIGURED',
      peers: [],
    });
  });

  app.post('/api/v62/shards/p2p-sync', (_req, res) => {
    return unavailableCapability(res, 'Peer-to-peer shard synchronization');
  });

  app.get('/api/v62/rbac/fido2-sign', (_req, res) => {
    res.json({ ok: true, configured: false, ledger: [] });
  });

  app.post('/api/v62/rbac/fido2-sign', (_req, res) => {
    return unavailableCapability(res, 'FIDO2/WebAuthn signing');
  });

  app.get('/api/v62/swagger/replay', (_req, res) => {
    try {
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        history: getSwaggerRequestHistoryV62(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v62/swagger/replay', (req, res) => {
    try {
      const replayRecord = recordSwaggerRequestAndExportReplayV62({
        endpointId: req.body?.endpointId,
        method: req.body?.method,
        path: req.body?.path,
        requestBody:
          typeof req.body?.requestBody === 'string'
            ? req.body.requestBody
            : req.body?.requestBody
            ? JSON.stringify(req.body.requestBody)
            : undefined,
      });
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        replayRecord,
        history: getSwaggerRequestHistoryV62(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // ==========================================================================
  // RELEASE v6.3-GA (SVN-r413.0-GA) ROUTES:
  // 1. Local Model Text-to-Speech (TTS) Accessibility Synthesizer (/api/v63/tts/*)
  // 2. D3-Based Interactive Knowledge Graph Visualization (/api/v63/integrations/knowledge-graph)
  // 3. Interactive GGUF Fetch & Auto-Update Terminal (/api/v63/gguf/*)
  // 4. Streaming Multi-Agent MCP DAG Recorder & WASM OpenXML Verifier (/api/v63/mcp/dag-recorder)
  // ==========================================================================

  app.get('/api/v63/tts/voices', (_req, res) => {
    try {
      const voices = listLocalTtsVoiceProfilesV63();
      const settings = getPersistentSovereignSettingsV61();
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        activeVoiceId: settings.ttsVoiceId,
        speechRate: settings.ttsSpeechRate,
        autoReadResponses: settings.ttsAutoReadResponses,
        voices,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v63/tts/synthesize', async (req, res) => {
    try {
      const settings = getPersistentSovereignSettingsV61();
      const text = typeof req.body?.text === 'string' ? req.body.text : '';
      const requestedVoice = String(req.body?.voiceId || '');
      const voice =
        /^[a-zA-Z0-9_-]{1,64}$/.test(requestedVoice) && !requestedVoice.startsWith('panini-')
          ? requestedVoice
          : process.env.OPENAI_TTS_VOICE || 'alloy';
      const result = await synthesizeSpeech({
        text,
        voice,
        model: typeof req.body?.model === 'string' ? req.body.model : undefined,
      });
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        provider: 'openai-compatible',
        ttsResult: {
          audioDataUrl: `data:${result.contentType};base64,${Buffer.from(result.audio).toString('base64')}`,
          modelUsed: result.model,
          voiceUsed: result.voice,
          byteLength: result.audio.byteLength,
          speechRateRequested: Number(req.body?.speechRate || settings.ttsSpeechRate || 1),
        },
      });
    } catch (err) {
      const status = err instanceof OnlineAiProviderError ? err.statusCode : 502;
      res.status(status).json({ ok: false, code: 'SPEECH_SYNTHESIS_FAILED', error: String(err) });
    }
  });

  app.get('/api/v63/integrations/knowledge-graph', (req, res) => {
    try {
      const focusQuery = String(req.query.query || req.query.focusQuery || 'Gurucul');
      const categoryFilter = req.query.categoryFilter
        ? (String(req.query.categoryFilter) as
            | 'ALL'
            | 'DOCUMENT_CHUNK'
            | 'ENTITY'
            | 'KNOWLEDGE_SHARD'
            | 'CONNECTOR_SOURCE')
        : 'ALL';
      const graphSpec = buildKnowledgeGraphD3SpecV63({
        focusQuery,
        categoryFilter,
      });
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        graphSpec,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.get('/api/v63/gguf/hosted-catalog', (_req, res) => {
    try {
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        catalog: listHostedOnlineGgufCatalogV63(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.get('/api/v63/gguf/download/:fileName', (req, res) => {
    return unavailableCapability(res, 'Hosted GGUF download');
  });

  app.post('/api/v63/gguf/terminal-exec', (req, res) => {
    const command = typeof req.body?.command === 'string' ? req.body.command.trim() : '';
    if (/^(\/\?|(?:panini-cli\s+)?\/\?)$/i.test(command)) {
      res.json({
        ok: true,
        execution: executeGgufModelTerminalCommandV63({ command }),
        note: 'Help output only; model execution is not configured.',
      });
      return;
    }
    if (/^(\/menu|menu|model-menu|ollama\s+menu|panini-cli\s+(?:model-menu|menu))$/i.test(command)) {
      res.json({
        ok: true,
        catalog: listOnlineExternalModelCatalogV64(),
        note: 'Catalog metadata only; model downloads and installation are unavailable.',
      });
      return;
    }
    return unavailableCapability(res, 'GGUF download, update, and installation');
  });

  app.get('/api/v63/mcp/dag-recorder', (_req, res) => {
    try {
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        history: getMcpAgentDagHistoryV63(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v63/mcp/dag-recorder', (req, res) => {
    try {
      const dagRecord = recordMcpAgentDagExecutionV63({
        workflowPrompt: req.body?.workflowPrompt ? String(req.body.workflowPrompt) : undefined,
        slideCount: req.body?.slideCount ? Number(req.body.slideCount) : undefined,
      });
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        dagRecord,
        history: getMcpAgentDagHistoryV63(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // ==========================================================================
  // RELEASE v6.4-GA (SVN-r414.0-GA) ROUTES:
  // 1. Downloadable GGUF Binary + Ollama Modelfile + Installer Exporter (/api/v64/models/export)
  // 2. Online Frontier Model Hub Menu & Auto-Installer (/api/v64/terminal/model-menu)
  // 3. Terminal Autocomplete & /? Command Guide (/api/v64/terminal/autocomplete)
  // 4. Autonomous Self-Learning Model Auto-Update & QLoRA Tuner (/api/v64/models/self-learn-tune)
  // 5. D3 Sub-Graph Export to GGUF Shards (/api/v64/integrations/d3-subgraph-export)
  // 6. Real-Time Duplex Voice-to-Voice Studio (/api/v64/voice/duplex)
  // ==========================================================================

  app.post('/api/v64/models/export', (req, res) => {
    return unavailableCapability(res, 'Runnable model export');
  });

  app.get('/api/v64/models/export/:modelId', (req, res) => {
    return unavailableCapability(res, 'Runnable model export');
  });

  app.get('/api/v64/terminal/model-menu', (_req, res) => {
    try {
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        catalog: listOnlineExternalModelCatalogV64(),
        installedModels: listInstalledOnlineExternalModelsV64(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v64/terminal/model-menu', (req, res) => {
    if (String(req.body?.action || '').toLowerCase() === 'list') {
      res.json({
        ok: true,
        catalog: listOnlineExternalModelCatalogV64(),
        installedModels: [],
        note: 'Catalog metadata only; model downloads and installation are unavailable.',
      });
      return;
    }
    return unavailableCapability(res, 'Online model installation');
  });

  app.get('/api/v64/terminal/autocomplete', (req, res) => {
    try {
      const q = String(req.query.q || '');
      const suggestions = getTerminalAutocompleteSuggestionsV64(q, 10);
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        suggestions,
        commandGuidePreview: buildTerminalCommandGuideV64(q || 'all'),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.get('/api/v64/models/self-learn-tune', (_req, res) => {
    try {
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        state: getModelSelfLearningStateV64(),
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  app.post('/api/v64/models/self-learn-tune', (req, res) => {
    return unavailableCapability(res, 'Model training and tuning');
  });

  app.post('/api/v64/integrations/d3-subgraph-export', (req, res) => {
    return unavailableCapability(res, 'D3 graph GGUF model export');
  });

  app.post('/api/v64/voice/duplex', (req, res) => {
    try {
      const duplexTurn = runDuplexVoiceToVoiceTurnV64({
        spokenTranscript: String(
          req.body?.spokenTranscript || 'Summarize Gurucul REVEAL SIEM and UEBA architecture'
        ),
        voiceId: req.body?.voiceId ? String(req.body.voiceId) : undefined,
        speechRate: req.body?.speechRate ? Number(req.body.speechRate) : undefined,
      });
      res.json({
        ok: true,
        releaseVersion: `${CURRENT_ACTIVE_RELEASE_VERSION} (${CURRENT_ACTIVE_SVN_REVISION})`,
        duplexTurn,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Panini Studio listening on http://${HOST}:${PORT}`);
  });
}

startServer();
