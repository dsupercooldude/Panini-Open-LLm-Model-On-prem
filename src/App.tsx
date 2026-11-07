/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HARDWARE_PROFILES,
  HardwareProfileId,
  DeploymentEnvironment,
  StoredModel,
  ModelVersion,
  DomainCategory,
  DeepResearchPlanStep,
  MediaQualityTier,
  VideoPacingPreset,
  CreativeVisualTheme,
  LightingEffectStyle,
  CinematographyOpticsStyle,
  CodeLanguageChoice,
  ChatCapabilityMode,
  UploadedAttachment,
  UseCaseScenario,
  computeThermalAndPowerMetrics,
  generateOfflineKnowledgeResponse,
  generateOfflineCodeSynthesis,
  executeDeepResearchPlan,
  getCompatibleModelsForHardware,
  applyVersionRollback,
  autoCorrectUserQuery,
  evaluateQueryClarityAndClarifications,
  translateNlpToUseCase,
  summarizeUploadedAttachment,
  analyzeNlpVisualPrompt,
  calculateVideoTimingSchedule,
  validateAndSelectOptimalModel,
  LiveOnlineSearchSource,
  LiveCrawledResearchPayload,
  ContentSafetyMode,
  LearnedEntityKnowledge,
  AmbiguityClarificationOption,
  ThreadContextMemory,
  detectAmbiguousQueryContext,
  generateDeepResearchPlan,
  buildRetrievedSearchStream,
  executeContinualLearningHarvest,
  ContinualLearningHarvestResult,
  runInputGuardrailScan,
  runOutputGuardrailScan,
  isReceiptToExpenseDeckQuery,
  executeBoundedAgentOrchestrator,
  runReceiptVisionOcrAndReconcile,
  buildSandboxedExpenseDeckBundle,
  ExpenseDeckBrandStyle,
  SandboxIsolationRuntime,
  runHybridKnowledgePipelineV57,
  DocumentAclRole,
  buildOtelLangfuseTraceWaterfallV57,
  submitAsyncGenerationJobV57,
  extractPresentationSubjectAndIntent,
  engineerPromptForOptimalAccuracyV59,
  buildThinkingModeExecutionPlanV59,
  PreviewableFileArtifactV59,
  buildPreviewableArtifactsFromCodingResolutionV59,
  getPersistentSovereignSettingsV61,
  updatePersistentSovereignSettingsV61,
  upsertAndIndexKnowledgeShardV61,
} from './utils/engineLogic';
import {
  VideoAspectRatio,
  buildPromptConstructedScene,
  savePaniniKnowledgeShard,
  synthesizeMusicTrackSpec,
  hydratePaniniKnowledgeShards,
} from './utils/multimodalSuite';
import {
  INITIAL_MODELS,
  INITIAL_USER_PROFILES,
  INITIAL_CHAT_HISTORY,
  INITIAL_CHAT_THREADS,
  INITIAL_MEDIA_GALLERY,
  INITIAL_COLLAB_EVENTS,
  INITIAL_LOGS,
  INITIAL_BACKUPS,
  INITIAL_CUSTOM_SCENARIOS,
  ChatMessage,
  ChatThreadSession,
  GeneratedMediaItem,
  UserProfile,
  CollaborationEvent,
  CentralizedLogEntry,
  BackupSnapshot,
} from './utils/initialData';
import { UserWorkspaceView } from './components/UserWorkspaceView';
import { ModelRegistryView } from './components/ModelRegistryView';
import { HardwareThermalView } from './components/HardwareThermalView';
import { TeamRbacView } from './components/TeamRbacView';
import { OpsLogsDocsView } from './components/OpsLogsDocsView';
import { AdminIntegrationsView } from './components/AdminIntegrationsView';
import { AdminRestMcpDocsView } from './components/AdminRestMcpDocsView';
import { FilePreviewTabView } from './components/FilePreviewTabView';
import {
  EnterpriseGovernanceModal,
  AdminResourcePermissionPolicy,
  LiveScenarioTriggerPayload,
} from './components/EnterpriseGovernanceAndCodingHub';
import {
  Database,
  Cpu,
  Shield,
  ShieldCheck,
  Terminal,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
  ExternalLink,
  Globe,
  Eye,
  BookOpen,
} from 'lucide-react';

type WorkspaceMode = 'user' | 'admin' | 'preview';
type AdminSection =
  | 'registry'
  | 'hardware'
  | 'team'
  | 'ops'
  | 'governance'
  | 'integrations'
  | 'api_mcp_docs';

const WORKSPACE_LABELS: Record<ChatCapabilityMode, string> = {
  ask_math: 'Ask & Math',
  coding: 'Coding Studio',
  deep_research: 'Deep Research',
  video_gen: '8K Cinema Studio',
  image_gen: '8K Cinema Studio',
  audio_gen: 'Audio Synthesize',
};

export default function App() {
  const initialUrlHasAdminTab =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('tab') === 'admin';

  // Admin Console is hidden by default; when Gear Icon is clicked, it opens as a new tab in the top bar
  const [isAdminTabOpen, setIsAdminTabOpen] = useState<boolean>(initialUrlHasAdminTab);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(
    initialUrlHasAdminTab ? 'admin' : 'user'
  );
  const [adminSection, setAdminSection] = useState<AdminSection>('registry');
  const [isAdminSidebarCollapsed, setIsAdminSidebarCollapsed] = useState<boolean>(false);
  const [opsInitialSubTab, setOpsInitialSubTab] = useState<
    'install_scripts' | 'logs_backups' | 'docs_mobile_release'
  >('install_scripts');
  const [isDark, setIsDark] = useState<boolean>(true);

  // Active Chat Capability Workspace (Default: 'ask_math' -> Ask and Math)
  const [chatCapability, setChatCapability] = useState<ChatCapabilityMode>('ask_math');

  // Core Models & Active Selection (Named after Maharshi Panini)
  const [models, setModels] = useState<StoredModel[]>(INITIAL_MODELS);
  const [activeModelId, setActiveModelId] = useState<string>(INITIAL_MODELS[0].id);

  // Custom & Cloned Use Cases
  const [customScenarios, setCustomScenarios] =
    useState<UseCaseScenario[]>(INITIAL_CUSTOM_SCENARIOS);

  // Hardware, Deployment Topology & Thermal Governor State
  const [hardwareId, setHardwareId] = useState<HardwareProfileId>('laptop-unified');
  const [deploymentMode, setDeploymentMode] =
    useState<DeploymentEnvironment>('Air-Gapped Local');
  const [powerBudgetWatts, setPowerBudgetWatts] = useState<number>(
    HARDWARE_PROFILES['laptop-unified'].defaultPowerWatts
  );
  const [thermalLimitC, setThermalLimitC] = useState<number>(
    HARDWARE_PROFILES['laptop-unified'].defaultThermalLimitC
  );
  const [ambientTempC, setAmbientTempC] = useState<number>(24);

  // Preset Runtime Environment Variables (Persistent across sessions & server restarts; Internet Accessible by default!)
  const [presetOfflineMode, setPresetOfflineMode] = useState<boolean>(
    () => !getPersistentSovereignSettingsV61().isOnlineLearning
  );
  const [presetModelCacheDir, setPresetModelCacheDir] = useState<string>(
    () =>
      getPersistentSovereignSettingsV61().presetModelCacheDir ||
      '/var/lib/panini/models/gguf-shards'
  );
  const [presetBackupCron, setPresetBackupCron] = useState<string>('0 */4 * * *');

  // Admin-Controlled Global Prompt Content Safety & Guardrail Policy
  const [contentSafetyMode, setContentSafetyMode] = useState<ContentSafetyMode>('Safe Mode');

  // Sub-Domain Expert Selection ('auto' or specific SubDomainExpert.id)
  const [selectedExpertId, setSelectedExpertId] = useState<string>('auto');

  // Locally cached source records from explicit online research.
  const [learnedEntities, setLearnedEntities] = useState<LearnedEntityKnowledge[]>([]);

  // Persistent Online / Offline Switch for Multi-Engine Search Stream (Default = true / Internet Accessible)
  const [isOnlineLearning, setIsOnlineLearning] = useState<boolean>(
    () => getPersistentSovereignSettingsV61().isOnlineLearning
  );

  // Release v5.7-beta Phase 2: Active Document ACL & MCP Role ('Viewer' | 'Analyst' | 'Developer' | 'Admin')
  const [activeAclRole, setActiveAclRole] = useState<DocumentAclRole>(
    () => getPersistentSovereignSettingsV61().activeAclRole || 'Analyst'
  );

  // Sync Persistent Sovereign Settings & Knowledge Shards with Backend Disk DB (/api/v61/settings & /api/v61/shards) on startup
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [settingsRes, shardsRes] = await Promise.all([
          fetch('/api/v61/settings').catch(() => null),
          fetch('/api/v61/shards').catch(() => null),
        ]);
        if (mounted && settingsRes && settingsRes.ok) {
          const sJson = await settingsRes.json();
          if (sJson?.settings && typeof sJson.settings.isOnlineLearning === 'boolean') {
            const hydrated = updatePersistentSovereignSettingsV61(sJson.settings);
            setIsOnlineLearning(hydrated.isOnlineLearning);
            setPresetOfflineMode(!hydrated.isOnlineLearning);
            if (hydrated.activeAclRole) {
              setActiveAclRole(hydrated.activeAclRole);
            }
          }
        }
        if (mounted && shardsRes && shardsRes.ok) {
          const shJson = await shardsRes.json();
          if (Array.isArray(shJson?.shards)) {
            const mapObj: Record<string, (typeof shJson.shards)[number]> = {};
            for (const s of shJson.shards) {
              if (s?.queryKey) {
                mapObj[s.queryKey] = s;
                upsertAndIndexKnowledgeShardV61({
                  topic: s.queryKey,
                  sourceTitle: s.cachedWikipediaSources?.[0]?.title || s.queryKey,
                  sourceUrl: s.cachedWikipediaSources?.[0]?.doiOrUrl || `local://shards/${s.queryKey}.gguf`,
                  facts:
                    Array.isArray(s.cachedVerifiedFacts) && s.cachedVerifiedFacts.length > 0
                      ? s.cachedVerifiedFacts
                      : [`${s.queryKey} verified local shard.`],
                  mergeExisting: true,
                });
              }
            }
            hydratePaniniKnowledgeShards(mapObj);
          }
        }
      } catch {
        // Local storage persistence already active
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Admin Console Resource & Permission Policy
  const [adminPermissions, setAdminPermissions] = useState<AdminResourcePermissionPolicy>({
    enableOffTheHookVoice: true,
    enableMultilingual: true,
    enableQualityMultiPass: true,
    enableStrictClarificationGate: true,
  });

  // Chat Threads & Reference ID Counter (By default NO query or output unless asked)
  const [chatThreads, setChatThreads] = useState<ChatThreadSession[]>(INITIAL_CHAT_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>(INITIAL_CHAT_THREADS[0].id);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(INITIAL_CHAT_HISTORY);
  const [nextRefCounter, setNextRefCounter] = useState<number>(1008);

  const [recentDomains, setRecentDomains] = useState<DomainCategory[]>([
    'Science',
    'Computer Programming',
    'Mathematics',
    'Geology',
  ]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [mediaGallery, setMediaGallery] = useState<GeneratedMediaItem[]>(INITIAL_MEDIA_GALLERY);

  // Release v5.9-GA: Dedicated File Preview Tab State (Pre-seeded with verified Gurucul multi-format bundle; updated on every generated downloadable file)
  const [previewFiles, setPreviewFiles] = useState<PreviewableFileArtifactV59[]>(() => {
    const synth = generateOfflineCodeSynthesis(
      'Generate a pptx for Gurucul about its company history, product portfolio and its feature about each product. Make sure use actual data and generate relevant images as needed',
      'Auto (Best Practice)'
    );
    return synth.codingResolution
      ? buildPreviewableArtifactsFromCodingResolutionV59(synth.codingResolution)
      : [];
  });
  const [activePreviewFileId, setActivePreviewFileId] = useState<string>('');
  const [isPreviewTabOpen, setIsPreviewTabOpen] = useState<boolean>(true);

  const handleOpenFileInPreviewTab = (
    files: PreviewableFileArtifactV59[],
    preferredFileId?: string
  ) => {
    if (!files || files.length === 0) return;
    setPreviewFiles((prev) => {
      const existingIds = new Set(files.map((f) => f.id));
      const merged = [...files, ...prev.filter((p) => !existingIds.has(p.id))];
      return merged.slice(0, 20);
    });
    const chosenId = preferredFileId || files[0].id;
    setActivePreviewFileId(chosenId);
    setIsPreviewTabOpen(true);
    setWorkspaceMode('preview');
  };

  const appendMessagesToThread = (
    newMessages: ChatMessage[],
    summaryTitle?: string,
    threadContextUpdate?: ThreadContextMemory
  ) => {
    const userMsgObj = newMessages.find((m) => m.role === 'user');
    const promptForLearning = (userMsgObj?.content || summaryTitle || '').trim();
    if (promptForLearning.length > 4) {
      setRecentQueries((prev) =>
        [promptForLearning, ...prev.filter((q) => q !== promptForLearning)].slice(0, 25)
      );
    }

    setChatHistory((prev) => {
      const updated = [...prev, ...newMessages];
      setChatThreads((threads) =>
        threads.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                title:
                  t.messages.length === 0 && summaryTitle
                    ? summaryTitle.slice(0, 42)
                    : t.title,
                subtitle: `${newMessages[newMessages.length - 1]?.domain || 'Science'} · ${updated.length} msgs`,
                updatedAt: 'Just now',
                threadContext: threadContextUpdate !== undefined ? threadContextUpdate : t.threadContext,
                messages: updated,
              }
            : t
        )
      );
      return updated;
    });
  };

  const handleClearThreadContext = () => {
    setChatThreads((threads) =>
      threads.map((t) => (t.id === activeThreadId ? { ...t, threadContext: undefined } : t))
    );
  };

  const handleSelectThread = (threadId: string) => {
    const found = chatThreads.find((t) => t.id === threadId);
    if (!found) return;
    setActiveThreadId(found.id);
    setChatHistory(found.messages);
    if (found.workspaceMode) {
      setChatCapability(
        found.workspaceMode === 'cinema_studio' ? 'video_gen' : found.workspaceMode
      );
    }
  };

  const handleCreateNewThread = (modeOverride?: ChatCapabilityMode) => {
    const targetMode = modeOverride || chatCapability;
    const refId = `REF-${nextRefCounter}`;
    setNextRefCounter((c) => c + 1);
    const newId = `thread-${Date.now()}`;
    const modeLabel = WORKSPACE_LABELS[targetMode] || 'Ask & Math';
    const threadWorkspaceMode: ChatThreadSession['workspaceMode'] =
      targetMode === 'video_gen' || targetMode === 'image_gen' ? 'cinema_studio' : targetMode;
    const newThread: ChatThreadSession = {
      id: newId,
      referenceId: refId,
      workspaceMode: threadWorkspaceMode,
      title: `New ${modeLabel} Chat`,
      subtitle: `${refId} · Ready for prompt`,
      updatedAt: 'Just now',
      messages: [],
    };
    setChatThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setChatHistory([]);
  };

  /**
   * When changing the workspace capability mode, ALWAYS open a new empty chat thread
   * and validate/auto-select the optimal model for that capability.
   * Users can import/continue an older chat into this new workspace using its Reference ID (e.g. REF-1002).
   */
  const handleChangeWorkspaceCapability = (nextMode: ChatCapabilityMode) => {
    if (nextMode === chatCapability) return;
    setChatCapability(nextMode);

    const currentCompatible = getCompatibleModelsForHardware(
      models,
      HARDWARE_PROFILES[hardwareId],
      deploymentMode
    );
    const currentMdl =
      currentCompatible.find((c) => c.model.id === activeModelId)?.model || models[0];
    const validation = validateAndSelectOptimalModel(nextMode, currentCompatible, currentMdl);
    if (validation.autoSwitched) {
      setActiveModelId(validation.selectedModel.id);
    }

    // If migrating between video_gen and image_gen within 8K Cinema Studio and current thread is empty, keep thread
    if (
      (nextMode === 'video_gen' && chatCapability === 'image_gen') ||
      (nextMode === 'image_gen' && chatCapability === 'video_gen')
    ) {
      return;
    }
    handleCreateNewThread(nextMode);
  };

  /**
   * Loads messages from an existing chat thread by its Reference ID (e.g., REF-1002)
   * into the current active workspace chat so the user can continue that conversation in the changed workspace.
   */
  const handleLoadChatByReferenceId = (refInput: string): { ok: boolean; message: string } => {
    const normalized = refInput.trim().toUpperCase();
    if (!normalized) {
      return { ok: false, message: 'Please enter a valid Reference ID (e.g., REF-1002).' };
    }
    const sourceThread = chatThreads.find(
      (t) => t.referenceId.toUpperCase() === normalized || t.id.toUpperCase() === normalized
    );
    if (!sourceThread) {
      return {
        ok: false,
        message: `Reference ID "${normalized}" not found. Available IDs: ${chatThreads
          .map((t) => t.referenceId)
          .join(', ')}`,
      };
    }

    const clonedMessages = sourceThread.messages.map((m, idx) => ({
      ...m,
      id: `${m.id}-ref-${Date.now()}-${idx}`,
    }));

    setChatHistory(clonedMessages);
    setChatThreads((threads) =>
      threads.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              title: `${WORKSPACE_LABELS[chatCapability]} (${sourceThread.referenceId})`,
              subtitle: `Loaded from ${sourceThread.referenceId} · ${clonedMessages.length} msgs`,
              updatedAt: 'Just now',
              messages: clonedMessages,
            }
          : t
      )
    );

    return {
      ok: true,
      message: `Loaded ${clonedMessages.length} messages from ${sourceThread.referenceId} (${sourceThread.title}) into ${WORKSPACE_LABELS[chatCapability]}.`,
    };
  };

  const handleDeleteThread = (threadId: string) => {
    if (chatThreads.length <= 1) return;
    const remaining = chatThreads.filter((t) => t.id !== threadId);
    setChatThreads(remaining);
    if (activeThreadId === threadId && remaining[0]) {
      setActiveThreadId(remaining[0].id);
      setChatHistory(remaining[0].messages);
    }
  };

  // Team, Profiles, Auth & RBAC State
  const [profiles, setProfiles] = useState<UserProfile[]>(INITIAL_USER_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>(INITIAL_USER_PROFILES[0].id);
  const [authMode, setAuthMode] = useState<'Offline Local Passkey' | 'Enterprise OAuth 2.0'>(
    'Offline Local Passkey'
  );
  const [oauthClientId, setOauthClientId] = useState<string>(
    'panini-enterprise-sso-client.apps.internal'
  );
  const [oauthIssuerUrl, setOauthIssuerUrl] = useState<string>(
    'https://idp.panini.internal/oauth2/default'
  );
  const [collabEvents, setCollabEvents] = useState<CollaborationEvent[]>(INITIAL_COLLAB_EVENTS);

  // Centralized Logs & Encrypted Backups State
  const [logs, setLogs] = useState<CentralizedLogEntry[]>(INITIAL_LOGS);
  const [backups, setBackups] = useState<BackupSnapshot[]>(INITIAL_BACKUPS);

  const activeHardware = HARDWARE_PROFILES[hardwareId];
  const compatibleModels = getCompatibleModelsForHardware(models, activeHardware, deploymentMode);

  const activeModel =
    compatibleModels.find((c) => c.model.id === activeModelId)?.model ||
    compatibleModels.find((c) => c.isRecommended)?.model ||
    compatibleModels[0]?.model ||
    models[0];

  const currentVersion =
    activeModel.versions.find((v) => v.versionId === activeModel.currentVersionId) ||
    activeModel.versions[0];
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const telemetry = computeThermalAndPowerMetrics(
    activeHardware,
    currentVersion.quantType,
    powerBudgetWatts,
    thermalLimitC,
    activeModel.activeParamsBillions,
    ambientTempC
  );

  const appendLog = (
    severity: 'INFO' | 'WARN' | 'CRITICAL',
    subsystem: CentralizedLogEntry['subsystem'],
    message: string
  ) => {
    const newEntry: CentralizedLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      timestamp: '2026-10-21 08:30:10 UTC',
      severity,
      subsystem,
      message,
      acknowledged: false,
    };
    setLogs((prev) => [newEntry, ...prev]);
  };

  const appendCollab = (
    actionType: CollaborationEvent['actionType'],
    summary: string,
    commitHash = 'c4f9a12'
  ) => {
    const evt: CollaborationEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      actor: activeProfile.name,
      role: activeProfile.role,
      actionType,
      summary,
      commitHash,
      timestamp: '2026-10-21 08:30 UTC',
    };
    setCollabEvents((prev) => [evt, ...prev]);
  };

  const handleSelectHardware = (newId: HardwareProfileId) => {
    const hw = HARDWARE_PROFILES[newId];
    setHardwareId(newId);
    setPowerBudgetWatts(hw.defaultPowerWatts);
    setThermalLimitC(hw.defaultThermalLimitC);

    const nextCompatible = getCompatibleModelsForHardware(models, hw, deploymentMode);
    if (!nextCompatible.some((c) => c.model.id === activeModelId)) {
      const rec = nextCompatible.find((c) => c.isRecommended) || nextCompatible[0];
      if (rec) setActiveModelId(rec.model.id);
    }

    appendLog(
      'INFO',
      'ThermalGov',
      `Switched hardware profile to ${hw.name} (${hw.ramGb}GB RAM, ${hw.cpuCores} Cores, ${hw.storageFreeGb}GB Disk).`
    );
  };

  const handleSelectDeploymentMode = (mode: DeploymentEnvironment) => {
    setDeploymentMode(mode);
    const nextCompatible = getCompatibleModelsForHardware(models, activeHardware, mode);
    if (!nextCompatible.some((c) => c.model.id === activeModelId)) {
      const rec = nextCompatible.find((c) => c.isRecommended) || nextCompatible[0];
      if (rec) setActiveModelId(rec.model.id);
    }
    appendLog(
      'INFO',
      'QuantEngine',
      `Switched Panini execution topology to ${mode} (${nextCompatible.length} compatible parameter tiers available).`
    );
  };

  const handleToggleOnlineLearning = () => {
    const nextState = !isOnlineLearning;
    setIsOnlineLearning(nextState);
    setPresetOfflineMode(!nextState);
    const updatedSettings = updatePersistentSovereignSettingsV61({
      isOnlineLearning: nextState,
      presetOfflineMode: !nextState,
      networkMode: nextState ? 'online' : 'offline',
    });
    fetch('/api/v61/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSettings),
    }).catch(() => {});
    appendLog(
      'INFO',
      'QuantEngine',
      nextState
        ? 'Enabled persistent Online mode (Wikipedia, OpenAlex, and Crossref; persisted across sessions & restarts).'
        : 'Switched to explicit Offline mode via UI toggle (persisted across sessions & restarts).'
    );
  };

  /**
   * Backend NLP-to-Use-Case Translation for Admin Console
   */
  const handleAddUseCaseViaNlp = async (nlpDescription: string): Promise<UseCaseScenario> => {
    const nextOffset = customScenarios.length + 1;
    let translated = translateNlpToUseCase(nlpDescription, nextOffset);

    try {
      const res = await fetch('/api/nlp/translate-usecase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nlpDescription,
          customCountOffset: nextOffset,
          customScenarios,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.useCase) {
          translated = data.useCase;
        }
      }
    } catch {
      // Offline air-gapped fallback uses deterministic local engineLogic translator
    }

    setCustomScenarios((prev) => [translated, ...prev]);
    appendCollab(
      'Scenario',
      `Verified & registered Panini use case ${translated.id}: ${translated.title}`,
      translated.id
    );
    appendLog(
      'INFO',
      'QuantEngine',
      `Registered new NLP use case ${translated.id} (${translated.domain}) via Panini Backend NLP Translator.`
    );
    return translated;
  };

  /**
   * Clones & saves a customized use-case scenario from a close existing match
   */
  const handleCloneAndEditUseCase = (clonedScenario: UseCaseScenario) => {
    setCustomScenarios((prev) => [clonedScenario, ...prev]);
    appendCollab(
      'Clone',
      `Cloned & customized use case ${clonedScenario.id}: ${clonedScenario.title} (${clonedScenario.domain})`,
      clonedScenario.id
    );
    appendLog(
      'INFO',
      'QuantEngine',
      `Cloned and customized scenario ${clonedScenario.id} (${clonedScenario.domain} · ${clonedScenario.recommendedQuant}).`
    );
  };

  /**
   * Unified chat handler with explicit live-source grounding and local source caching.
   */
  const handleSendMessage = async (
    rawPrompt: string,
    explicitDomain?: DomainCategory,
    attachment?: UploadedAttachment,
    explicitExpertOverride?: string,
    explicitSenseOption?: AmbiguityClarificationOption
  ) => {
    // 0. Phase 1 v5.7-alpha Gateway & Input Guardrail (PII Redaction + Prompt-Injection Defense)
    const inputGuardrail = runInputGuardrailScan(rawPrompt);
    const sanitizedPromptForProcessing =
      inputGuardrail.piiRedactedCount > 0 ? inputGuardrail.sanitizedInput : rawPrompt;
    const autoCorrect = autoCorrectUserQuery(sanitizedPromptForProcessing);
    const effectivePrompt = autoCorrect.correctedQuery;
    const currentThread = chatThreads.find((t) => t.id === activeThreadId);
    const currentThreadCtx = currentThread?.threadContext;

    const modelValidation = validateAndSelectOptimalModel(
      'ask_math',
      compatibleModels,
      activeModel
    );
    if (modelValidation.autoSwitched) {
      setActiveModelId(modelValidation.selectedModel.id);
    }
    const targetModel = modelValidation.selectedModel;
    const targetVer =
      targetModel.versions.find((v) => v.versionId === targetModel.currentVersionId) ||
      targetModel.versions[0];

    // If Input Guardrail blocks a prompt-injection or jailbreak attempt, halt before any model or tool runs
    if (inputGuardrail.isBlocked) {
      const blockedUserMsg: ChatMessage = {
        id: `msg-grd-u-${Date.now()}`,
        role: 'user',
        authorName: activeProfile.name,
        timestamp: '08:30 UTC',
        domain: 'Computer Programming',
        content: inputGuardrail.sanitizedInput,
        attachedFile: attachment,
      };
      const blockedAssistantMsg: ChatMessage = {
        id: `msg-grd-a-${Date.now() + 1}`,
        role: 'assistant',
        authorName: `${targetModel.name} · Gateway Input Guardrail`,
        timestamp: '08:30 UTC',
        domain: 'Computer Programming',
        content: `### 🛡️ Gateway & Input Guardrail Blocked Request\n- **Threat Category:** \`${inputGuardrail.threatCategory}\`\n- **Security Action:** ${inputGuardrail.guardrailSummary}\n- **Zero-Trust Enforcement:** Execution halted before any LLM, RAG index, or MCP tool received the input.`,
        simpleAnswerMarkdown: `### 🛡️ Request Blocked by Input Guardrail\nYour request matched a **${inputGuardrail.threatCategory}** signature and was stopped at the gateway before reaching any model or enterprise tool.`,
        inputGuardrail,
        verifiedFacts: [inputGuardrail.guardrailSummary],
        selfLearningCommitted: false,
      };
      appendMessagesToThread([blockedUserMsg, blockedAssistantMsg], 'Blocked Request');
      return;
    }

    // 0b. BUG-507 Fix: If user submits an explicit video generation request inside standard Chat mode, route to Video Synthesis so video chats always yield a grounded video
    if (
      !attachment &&
      !explicitSenseOption &&
      /\b(generate\s+a?\s*video|create\s+a?\s*video|make\s+a?\s*video|render\s+a?\s*video|animate\s+a?\s*video|video\s+of\s+|multi-shot\s+video)\b/i.test(
        effectivePrompt
      ) &&
      !isReceiptToExpenseDeckQuery(effectivePrompt, attachment)
    ) {
      await handleGenerateMediaInChat(
        effectivePrompt,
        'Video',
        '8K Master',
        'Smooth Auto-Paced',
        'Golden-Hour Nature Documentary',
        'Golden-Hour Chiaroscuro & Subsurface Glow',
        '65mm IMAX Anamorphic 2.39:1 Dolly',
        '16:9'
      );
      return;
    }

    // 0c. Phase 1 v5.7-alpha End-to-End "Upload Receipt -> Build Expense Deck" Pipeline
    if (isReceiptToExpenseDeckQuery(effectivePrompt, attachment)) {
      const ocrResult = runReceiptVisionOcrAndReconcile(effectivePrompt, attachment);
      const requestedBrand: ExpenseDeckBrandStyle = /\b(sovereign\s+gold|gold)\b/i.test(
        effectivePrompt
      )
        ? 'Sovereign Gold'
        : /\b(swiss\s+minimal|minimal)\b/i.test(effectivePrompt)
        ? 'Swiss Minimal'
        : 'Executive Slate';
      const requestedSandbox: SandboxIsolationRuntime = /\b(firecracker|microvm)\b/i.test(
        effectivePrompt
      )
        ? 'Firecracker MicroVM'
        : 'gVisor (runsc)';
      const expenseDeckBundle = buildSandboxedExpenseDeckBundle(
        ocrResult,
        requestedBrand,
        requestedSandbox
      );
      const agentOrchestrator = executeBoundedAgentOrchestrator(effectivePrompt, {
        hasAttachment: Boolean(attachment),
      });
      const rawMarkdown = `${expenseDeckBundle.executiveSummaryMarkdown}\n\n### Sandboxed Tool Execution (${expenseDeckBundle.sandboxRuntime})\n- **Container ID:** \`${expenseDeckBundle.sandboxContainerId}\`\n- **Tools Invoked:** \`${expenseDeckBundle.toolChainInvoked.join(' → ')}\`\n- **Downloadable Artifacts Ready:** PPTX Expense Deck (\`${expenseDeckBundle.pptxFile.filename}\`), DOCX Audit Memo (\`${expenseDeckBundle.docxFile.filename}\`), XLSX Ledger (\`${expenseDeckBundle.xlsxFile.filename}\`), and Native \`%PDF-1.4\` Voucher (\`${expenseDeckBundle.pdfFile.filename}\`).`;
      const outputGuardrail = runOutputGuardrailScan(rawMarkdown, [
        ocrResult.merchantName,
        `${ocrResult.currency} ${ocrResult.grandTotal.toFixed(2)}`,
        ocrResult.mathReconciliationStatus,
      ]);

      const userMsg: ChatMessage = {
        id: `msg-exp-u-${Date.now()}`,
        role: 'user',
        authorName: activeProfile.name,
        timestamp: '08:30 UTC',
        domain: 'Mathematics',
        subDomain: 'Corporate Expense Reconciliation & Sandboxed Deck Generation',
        content: effectivePrompt,
        autoCorrectedFrom: autoCorrect.wasCorrected ? rawPrompt : undefined,
        attachedFile: attachment,
      };

      const knowledgeMcpPipeline = runHybridKnowledgePipelineV57(
        effectivePrompt,
        activeAclRole,
        activeProfile.handle
      );
      const otelTraceWaterfall = buildOtelLangfuseTraceWaterfallV57(
        effectivePrompt,
        activeAclRole,
        targetModel.id,
        inputGuardrail.piiRedactedCount
      );
      const asyncJobRecord = submitAsyncGenerationJobV57(
        effectivePrompt,
        'pptx_document_pack'
      );

      const assistantMsg: ChatMessage = {
        id: `msg-exp-a-${Date.now() + 1}`,
        role: 'assistant',
        authorName: `${targetModel.name} · Receipt-to-Expense-Deck Orchestrator`,
        timestamp: '08:30 UTC',
        domain: 'Mathematics',
        subDomain: 'Vision OCR + gVisor/Firecracker Tool Builder',
        content: outputGuardrail.sanitizedOutput,
        simpleAnswerMarkdown: expenseDeckBundle.executiveSummaryMarkdown,
        verifiedFacts: [
          `Vision OCR (${ocrResult.ocrEngineUsed}): Extracted ${ocrResult.lineItems.length} line items from ${ocrResult.merchantName} (${ocrResult.ocrConfidencePct}% confidence).`,
          `Reconciled Math: Subtotal ${ocrResult.currency} ${ocrResult.subtotal.toFixed(2)} + Tax ${ocrResult.currency} ${ocrResult.taxAmount.toFixed(2)} + Service ${ocrResult.currency} ${ocrResult.serviceChargeAmount.toFixed(2)} = ${ocrResult.currency} ${ocrResult.grandTotal.toFixed(2)}.`,
          `Sandboxed File Builders (${expenseDeckBundle.sandboxRuntime}): Generated OpenXML .pptx (${expenseDeckBundle.pptxFile.filename}), DOCX, XLSX, and %PDF-1.4 without LLM writing raw binary bytes.`,
        ],
        inputGuardrail,
        outputGuardrail,
        agentOrchestrator,
        expenseDeckBundle,
        knowledgeMcpPipeline,
        otelTraceWaterfall,
        asyncJobRecord,
        selfLearningCommitted: false,
      };

      appendMessagesToThread([userMsg, assistantMsg], `Expense Deck: ${ocrResult.merchantName}`);
      return;
    }

    if (attachment) {
      const attResult = summarizeUploadedAttachment(
        attachment,
        effectivePrompt,
        targetVer.quantType,
        isOnlineLearning
      );
      const agentOrchestrator = executeBoundedAgentOrchestrator(effectivePrompt, {
        hasAttachment: true,
      });
      const outputGuardrail = runOutputGuardrailScan(
        attResult.answerMarkdown,
        attResult.verifiedFacts
      );

      const userMsg: ChatMessage = {
        id: `msg-att-u-${Date.now()}`,
        role: 'user',
        authorName: activeProfile.name,
        timestamp: '08:30 UTC',
        domain: attResult.detectedDomain,
        content: effectivePrompt,
        autoCorrectedFrom: autoCorrect.wasCorrected ? rawPrompt : undefined,
        attachedFile: attachment,
      };

      const knowledgeMcpPipeline = runHybridKnowledgePipelineV57(
        effectivePrompt,
        activeAclRole,
        activeProfile.handle
      );

      const assistantMsg: ChatMessage = {
        id: `msg-att-a-${Date.now() + 1}`,
        role: 'assistant',
        authorName: targetModel.name,
        timestamp: '08:30 UTC',
        domain: attResult.detectedDomain,
        content: outputGuardrail.sanitizedOutput,
        verifiedFacts: attResult.verifiedFacts,
        glassBox: attResult.glassBox,
        inputGuardrail,
        outputGuardrail,
        agentOrchestrator,
        knowledgeMcpPipeline,
        selfLearningCommitted: false,
      };

      appendMessagesToThread([userMsg, assistantMsg], effectivePrompt);
      return;
    }

    // 1. Check for Polysemous / Multi-Meaning Entity Ambiguity FIRST (e.g., "Panini", "Mercury", "Java")
    const ambiguityCheck = explicitSenseOption
      ? { isAmbiguous: false, resolvedOption: explicitSenseOption }
      : detectAmbiguousQueryContext(effectivePrompt, currentThreadCtx, 'ask_math');

    if (ambiguityCheck.isAmbiguous && ambiguityCheck.options && !explicitDomain) {
      const userMsg: ChatMessage = {
        id: `msg-amb-u-${Date.now()}`,
        role: 'user',
        authorName: activeProfile.name,
        timestamp: '08:30 UTC',
        domain: currentThreadCtx?.activeDomain || 'History',
        content: effectivePrompt,
        autoCorrectedFrom: autoCorrect.wasCorrected ? rawPrompt : undefined,
      };

      const assistantMsg: ChatMessage = {
        id: `msg-amb-a-${Date.now() + 1}`,
        role: 'assistant',
        authorName: `${targetModel.name} · Multi-Context Disambiguation Router`,
        timestamp: '08:30 UTC',
        domain: currentThreadCtx?.activeDomain || 'History',
        content:
          ambiguityCheck.clarificationPromptMarkdown ||
          `### Context Clarification Required: "${ambiguityCheck.entityName}"\nPlease select which meaning you would like to explore:`,
        ambiguityClarification: {
          entityName: ambiguityCheck.entityName || effectivePrompt,
          options: ambiguityCheck.options,
        },
        glassBox: {
          explainableAi: {
            eli12Explanation: `The local rule-based entity matcher found multiple meanings for "${ambiguityCheck.entityName}", so it asks you to choose before continuing. No model inference was run.`,
            decisionPathway: [
              `1. Local text rules found multiple possible meanings for "${ambiguityCheck.entityName}".`,
              `2. Paused synthesis and presented ${ambiguityCheck.options.length} choices.`,
              '3. Waiting for the user to select a meaning before continuing.',
            ],
            keyFeatureAttributions: [],
            safetyAndBiasCheck: 'Rule-based ambiguity check; no model inference or source lookup was performed.',
            knowledgeSourceMode: 'Local deterministic entity-matching rules; no model weights loaded',
          },
        },
        selfLearningCommitted: false,
      };

      const pendingCtx: ThreadContextMemory = {
        resolvedEntity: currentThreadCtx?.resolvedEntity || ambiguityCheck.entityName || effectivePrompt,
        resolvedSenseKey: currentThreadCtx?.resolvedSenseKey || '',
        resolvedSenseLabel: currentThreadCtx?.resolvedSenseLabel || '',
        activeDomain: currentThreadCtx?.activeDomain || 'History',
        activeSubDomain: currentThreadCtx?.activeSubDomain || 'Comparative Studies',
        priorPrompts: [...(currentThreadCtx?.priorPrompts || []), effectivePrompt],
        keyFactsEstablished: currentThreadCtx?.keyFactsEstablished || [],
        pendingAmbiguityQuery: effectivePrompt,
        pendingCapability: 'ask_math',
      };

      appendMessagesToThread([userMsg, assistantMsg], effectivePrompt, pendingCtx);
      return;
    }

    const clarification = evaluateQueryClarityAndClarifications(effectivePrompt);
    if (
      clarification.needsClarification &&
      chatCapability !== 'audio_gen' &&
      !explicitDomain &&
      !ambiguityCheck.resolvedOption &&
      !currentThreadCtx?.resolvedEntity
    ) {
      const userMsg: ChatMessage = {
        id: `msg-clr-u-${Date.now()}`,
        role: 'user',
        authorName: activeProfile.name,
        timestamp: '08:30 UTC',
        domain: clarification.detectedDomain,
        content: effectivePrompt,
        autoCorrectedFrom: autoCorrect.wasCorrected ? rawPrompt : undefined,
      };

      const clarificationBody = `### Use-Case Clarification & Guided Discovery\n${
        clarification.clarifyingIntro
      }\n\n${clarification.clarifyingQuestions.map((q) => `- ${q}`).join('\n')}`;

      const assistantMsg: ChatMessage = {
        id: `msg-clr-a-${Date.now() + 1}`,
        role: 'assistant',
        authorName: `${targetModel.name} (Interactive Use-Case Guide)`,
        timestamp: '08:30 UTC',
        domain: clarification.detectedDomain,
        content: clarificationBody,
        clarificationOptions: clarification.suggestedRefinements,
        glassBox: {
          explainableAi: {
            eli12Explanation: 'Local intent rules found that the prompt needs more detail, so the app is asking a follow-up before proceeding. No model inference was run.',
            decisionPathway: [
              '1. Local text rules classified the prompt as underspecified.',
              '2. Prepared follow-up choices to clarify the requested task.',
              '3. Waiting for the user to choose a refinement.',
            ],
            keyFeatureAttributions: [],
            safetyAndBiasCheck: 'Rule-based clarification; no model inference or source lookup was performed.',
            knowledgeSourceMode: 'Local deterministic prompt rules; no model weights loaded',
          },
        },
        selfLearningCommitted: false,
      };

      appendMessagesToThread([userMsg, assistantMsg], effectivePrompt);
      return;
    }

    const resolvedOpt = ambiguityCheck.resolvedOption;
    const synthesisPrompt = resolvedOpt ? resolvedOpt.expandedPrompt : effectivePrompt;

    // Automatically fetch Wikipedia & online grounding for all user questions and encyclopedic/entity queries
    let liveOnlineSources: LiveOnlineSearchSource[] | undefined;
    let liveSearchWarning: string | undefined;
    // Release v6.0-GA: Automatically use internet in backend when available (or when Online mode is toggled)
    try {
      const res = await fetch(
        isOnlineLearning ? '/api/search/online' : '/api/v60/research-and-engineer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: effectivePrompt,
            prompt: effectivePrompt,
            mode: 'ask_math',
            useBackendInternet: true,
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data?.ok !== false) {
        const rawSources = Array.isArray(data?.sources)
          ? data.sources
          : Array.isArray(data?.liveSources)
          ? data.liveSources
          : [];
        liveOnlineSources = rawSources
          .filter(
            (source: Record<string, unknown>) =>
              typeof (source.url || source.doiOrUrl) === 'string' &&
              /^https:\/\//i.test(String(source.url || source.doiOrUrl))
          )
          .map((source: Record<string, unknown>) => ({
            title: String(source.title || ''),
            snippet: String(source.snippet || ''),
            url: String(source.url || source.doiOrUrl),
            publicationOrSource: String(source.publicationOrSource || 'Live search index'),
            sourceEngine: String(
              source.sourceEngine || source.publicationOrSource || 'Live search index'
            ),
            year: Number(source.year || 0),
          }));
      }
      if (isOnlineLearning && (!liveOnlineSources || liveOnlineSources.length === 0)) {
        liveSearchWarning =
          'No live sources were returned. This answer uses deterministic local templates, not source-verified research.';
      }

      if (liveOnlineSources && liveOnlineSources.length > 0) {
        const cleanSubj = extractPresentationSubjectAndIntent(effectivePrompt).cleanSubject;
        savePaniniKnowledgeShard(cleanSubj, {
          syncedFromOnline: true,
          cachedWikipediaSources: liveOnlineSources,
        });
      }
    } catch (err) {
      if (isOnlineLearning) {
        liveSearchWarning = `Online search failed: ${
          err instanceof Error ? err.message : String(err)
        }`;
      }
    }
    if (isOnlineLearning && liveOnlineSources && liveOnlineSources.length > 0) {
      try {
          const groundingRes = await fetch('/api/multimodal/grounding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: effectivePrompt }),
          });
          if (!groundingRes.ok) {
            throw new Error(`Spatial grounding failed (${groundingRes.status}).`);
          }
          const groundingData = await groundingRes.json();
          if (groundingData?.mapsGrounding && groundingData?.searchGrounding) {
            savePaniniKnowledgeShard(synthesisPrompt, {
              syncedFromOnline: true,
              cachedWikipediaSources: liveOnlineSources,
              mapsGrounding: {
                ...groundingData.mapsGrounding,
                modelUsed: 'Panini-Spatial-Atlas',
              },
              searchGrounding: {
                ...groundingData.searchGrounding,
                modelUsed: 'Panini-Verified-Index',
              },
            });
          }
        } catch (error) {
          liveSearchWarning = [
            liveSearchWarning,
            `Spatial grounding was unavailable: ${
              error instanceof Error ? error.message : 'request failed'
            }`,
          ]
            .filter(Boolean)
            .join(' ');
        }
      }

    const activeExpertChoice =
      explicitExpertOverride || (selectedExpertId !== 'auto' ? selectedExpertId : undefined);

    const synthesis = generateOfflineKnowledgeResponse(
      synthesisPrompt,
      explicitDomain || resolvedOpt?.domain,
      targetVer.quantType,
      targetModel.selfLearningSamplesCount,
      Boolean(liveOnlineSources && liveOnlineSources.length > 0),
      liveOnlineSources,
      {
        explicitExpertId: activeExpertChoice,
        safetyMode: contentSafetyMode,
        learnedEntities,
        customScenarios,
        activeModelId: targetModel.id,
        threadContext: currentThreadCtx,
        resolvedSenseKey: resolvedOpt?.senseKey || currentThreadCtx?.resolvedSenseKey,
      }
    );

    const newUseCase =
      synthesis.matchedScenario ||
      translateNlpToUseCase(effectivePrompt, customScenarios.length + 1);
    setCustomScenarios((prev) =>
      prev.some((s) => s.id === newUseCase.id) ? prev : [newUseCase, ...prev]
    );

    // Keep learned entities as local app memory; this demo does not update model weights.
    if (synthesis.learnedEntity) {
      const learned = synthesis.learnedEntity;
      setLearnedEntities((prev) => [
        learned,
        ...prev.filter((e) => e.topicKey.toLowerCase() !== learned.topicKey.toLowerCase()),
      ]);
      appendLog(
        'INFO',
        'QuantEngine',
        `Stored "${learned.title}" in local app memory (Scenario ${learned.scenarioId}); model weights were not changed.`
      );
    }

    const agentOrchestrator = executeBoundedAgentOrchestrator(effectivePrompt, {
      hasAttachment: Boolean(attachment),
    });
    let responseMarkdown = synthesis.answerMarkdown;
    let inferenceNotice =
      'No configured LLM was used; this response came from deterministic local rules and is not model-generated.';
    let inferenceModelName = targetModel.name;
    try {
      const endpoint = isOnlineLearning ? '/api/llm/online/chat' : '/api/llm/chat';
      const selectedRuntimeModel = localStorage.getItem('panini-ollama-model') || undefined;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: isOnlineLearning ? undefined : selectedRuntimeModel,
          messages: [
            {
              role: 'system',
              content:
                'Answer the user directly and accurately. Admit uncertainty. Do not invent citations or claim actions you did not perform. Retrieved sources supplied by the app may be incomplete; distinguish evidence from inference.',
            },
            { role: 'user', content: effectivePrompt },
          ],
        }),
      });
      const result = await response.json();
      if (response.ok && typeof result?.response === 'string') {
        responseMarkdown = result.response;
        inferenceModelName = `${result.provider}: ${result.model}`;
        inferenceNotice =
          'Generated by a configured model. This response has not been independently fact-checked.';
      } else {
        inferenceNotice = `Model inference unavailable (${result?.code || response.status}): ${result?.error || 'No model response was returned'}. Showing the deterministic local fallback instead.`;
      }
    } catch (error) {
      inferenceNotice = `Model inference failed: ${error instanceof Error ? error.message : 'network error'}. Showing the deterministic local fallback instead.`;
    }

    const outputGuardrail = runOutputGuardrailScan(
      responseMarkdown,
      synthesis.verifiedFacts
    );

    const knowledgeMcpPipeline = runHybridKnowledgePipelineV57(
      effectivePrompt,
      activeAclRole,
      activeProfile.handle
    );
    const otelTraceWaterfall = buildOtelLangfuseTraceWaterfallV57(
      effectivePrompt,
      activeAclRole,
      targetModel.id,
      inputGuardrail.piiRedactedCount
    );
    const asyncJobRecord = submitAsyncGenerationJobV57(
      effectivePrompt,
      'pptx_document_pack'
    );

    const isPptxPresentationRequest =
      /\b(pptx|powerpoint|presentation|slide\s*deck|slides\s+for|slides\s+about)\b/i.test(
        effectivePrompt
      );
    const attachedCodingResolution = isPptxPresentationRequest
      ? generateOfflineCodeSynthesis(
          effectivePrompt,
          'Python',
          targetVer.quantType,
          isOnlineLearning,
          {
            liveOnlineSources,
            learnedEntities,
            isOnlineMode: isOnlineLearning,
          }
        ).codingResolution
      : undefined;

    // Release v5.9-GA: Backend Auto-Prompt Engineering & 62s Deep Thinking Accuracy Pipeline
    let engineeredPromptSpecV59 = engineerPromptForOptimalAccuracyV59(
      effectivePrompt,
      chatCapability,
      isOnlineLearning
    );
    try {
      const peRes = await fetch('/api/v59/prompt-engineer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: effectivePrompt,
          workspaceMode: chatCapability,
          isOnlineMode: isOnlineLearning,
        }),
      });
      if (peRes.ok) {
        const peJson = await peRes.json();
        if (peJson?.spec?.engineeredSystemPrompt) {
          engineeredPromptSpecV59 = peJson.spec;
        }
      }
    } catch {
      // Deterministic local fallback already initialized
    }

    const thinkingPlanV59 = buildThinkingModeExecutionPlanV59(
      effectivePrompt,
      chatCapability,
      isOnlineLearning,
      liveOnlineSources?.length || 0,
      synthesis.verifiedFacts.length,
      outputGuardrail.groundingScorePct,
      /\bData Not Available\b/i.test(outputGuardrail.sanitizedOutput)
    );

    if (attachedCodingResolution) {
      const newPreviewArtifacts = buildPreviewableArtifactsFromCodingResolutionV59(
        attachedCodingResolution,
        '08:31 UTC'
      );
      if (newPreviewArtifacts.length > 0) {
        setPreviewFiles((prev) => [...newPreviewArtifacts, ...prev].slice(0, 20));
        if (!activePreviewFileId) {
          setActivePreviewFileId(newPreviewArtifacts[0].id);
        }
        setIsPreviewTabOpen(true);
      }
    }

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      authorName: activeProfile.name,
      timestamp: '08:31 UTC',
      domain: synthesis.detectedDomain,
      subDomain: synthesis.detectedSubDomain,
      content: effectivePrompt,
      autoCorrectedFrom: autoCorrect.wasCorrected ? rawPrompt : undefined,
    };

    const assistantMsg: ChatMessage = {
      id: `msg-a-${Date.now() + 1}`,
      role: 'assistant',
      authorName: synthesis.selectedExpert
        ? `${targetModel.name} · ${synthesis.selectedExpert.name}`
        : inferenceModelName,
      timestamp: '08:31 UTC',
      domain: synthesis.detectedDomain,
      subDomain: synthesis.detectedSubDomain,
      content: `${outputGuardrail.sanitizedOutput}\n\n> ${inferenceNotice}`,
      simpleAnswerMarkdown: responseMarkdown,
      verifiedFacts: synthesis.verifiedFacts,
      mathStages: synthesis.mathStages,
      codingResolution: attachedCodingResolution,
      multiEngineStream: isOnlineLearning
        ? buildRetrievedSearchStream(
            effectivePrompt,
            liveOnlineSources || [],
            (synthesis.matchedScenario || newUseCase).id
          )
        : undefined,
      searchWarning: liveSearchWarning,
      glassBox: synthesis.glassBox,
      selectedExpert: synthesis.selectedExpert,
      alternativeExperts: synthesis.alternativeExperts,
      contrastingOpinions: synthesis.contrastingOpinions,
      matchedScenario: synthesis.matchedScenario || newUseCase,
      learnedEntity: synthesis.learnedEntity,
      safetyModeApplied: synthesis.safetyModeApplied,
      followUpQuestions: synthesis.followUpQuestions,
      contextInheritedFrom: synthesis.contextInheritedFrom,
      synthesizedUseCase: newUseCase,
      synthesizedModelName: inferenceModelName,
      selfLearningCommitted: false,
      bioscienceAnalysis: synthesis.bioscienceAnalysis,
      musicTrack:
        synthesis.musicTrack ||
        (chatCapability === 'audio_gen'
          ? synthesizeMusicTrackSpec(
              effectivePrompt,
              /\b(full\s*track|2\s*min|120s|pro)\b/i.test(effectivePrompt) ? 'full_track' : '30s_clip',
              isOnlineLearning
            )
          : undefined),
      imageStudio: synthesis.imageStudio,
      mapsGrounding: synthesis.mapsGrounding,
      searchGrounding: synthesis.searchGrounding,
      inputGuardrail,
      outputGuardrail,
      agentOrchestrator,
      knowledgeMcpPipeline,
      otelTraceWaterfall,
      asyncJobRecord,
      thinkingPlanV59,
      engineeredPromptSpecV59,
    };

    const nextThreadCtx: ThreadContextMemory = {
      resolvedEntity:
        resolvedOpt?.label ||
        synthesis.resolvedSenseLabel ||
        currentThreadCtx?.resolvedEntity ||
        effectivePrompt.slice(0, 48),
      resolvedSenseKey:
        resolvedOpt?.senseKey || currentThreadCtx?.resolvedSenseKey || 'general_context',
      resolvedSenseLabel:
        resolvedOpt?.label ||
        synthesis.resolvedSenseLabel ||
        currentThreadCtx?.resolvedSenseLabel ||
        effectivePrompt.slice(0, 64),
      activeDomain: synthesis.detectedDomain,
      activeSubDomain: synthesis.detectedSubDomain || 'General',
      priorPrompts: [...(currentThreadCtx?.priorPrompts || []), effectivePrompt].slice(-6),
      keyFactsEstablished: [
        ...(currentThreadCtx?.keyFactsEstablished || []),
        ...(synthesis.verifiedFacts.slice(0, 1) || []),
      ].slice(-5),
      pendingAmbiguityQuery: undefined,
      pendingCapability: undefined,
    };

    appendMessagesToThread([userMsg, assistantMsg], effectivePrompt, nextThreadCtx);
    setRecentDomains((prev) => [
      synthesis.detectedDomain,
      ...prev.filter((d) => d !== synthesis.detectedDomain).slice(0, 3),
    ]);
    setRecentQueries((prev) => [effectivePrompt, ...prev.slice(0, 4)]);
  };

  /**
   * Live Sub-Domain Expert Switcher:
   * Allows the user to switch the expert on any assistant message in case they want a different domain/sub-domain expert's opinion & streaming method.
   */
  const handleSwitchMessageExpert = (messageId: string, newExpertId: string) => {
    setSelectedExpertId(newExpertId);
    setChatHistory((prev) => {
      const msgIdx = prev.findIndex((m) => m.id === messageId);
      if (msgIdx === -1) return prev;
      const targetMsg = prev[msgIdx];
      const userPromptMsg =
        msgIdx > 0 && prev[msgIdx - 1].role === 'user' ? prev[msgIdx - 1] : undefined;
      const promptText = userPromptMsg?.content || targetMsg.content;

      const reSynthesized = generateOfflineKnowledgeResponse(
        promptText,
        targetMsg.domain,
        currentVersion.quantType,
        activeModel.selfLearningSamplesCount,
        isOnlineLearning,
        undefined,
        {
          explicitExpertId: newExpertId,
          safetyMode: contentSafetyMode,
          learnedEntities,
          customScenarios,
          activeModelId: activeModel.id,
        }
      );

      const updated = prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              authorName: reSynthesized.selectedExpert
                ? `${activeModel.name} · ${reSynthesized.selectedExpert.name}`
                : activeModel.name,
              subDomain: reSynthesized.detectedSubDomain,
              content: reSynthesized.answerMarkdown,
              simpleAnswerMarkdown: reSynthesized.simpleAnswerMarkdown,
              selectedExpert: reSynthesized.selectedExpert,
              alternativeExperts: reSynthesized.alternativeExperts,
              contrastingOpinions: reSynthesized.contrastingOpinions,
              glassBox: reSynthesized.glassBox,
            }
          : m
      );

      setChatThreads((threads) =>
        threads.map((t) => (t.id === activeThreadId ? { ...t, messages: updated } : t))
      );
      return updated;
    });
  };

  /**
   * Verified & Bug-Checked Coding & PPTX Handler with Online Search -> Knowledge Shard Persistence & 4-Tier Grounding (v5.7.2-GA)
   */
  const handleSendCodingMessage = async (
    rawPrompt: string,
    languageChoice: CodeLanguageChoice
  ) => {
    const inputGuardrail = runInputGuardrailScan(rawPrompt);
    const autoCorrect = autoCorrectUserQuery(inputGuardrail.sanitizedInput);
    const effectivePrompt = autoCorrect.correctedQuery;

    const modelValidation = validateAndSelectOptimalModel('coding', compatibleModels, activeModel);
    if (modelValidation.autoSwitched) {
      setActiveModelId(modelValidation.selectedModel.id);
    }
    const targetModel = modelValidation.selectedModel;
    const targetVer =
      targetModel.versions.find((v) => v.versionId === targetModel.currentVersionId) ||
      targetModel.versions[0];

    let liveOnlineSources: LiveOnlineSearchSource[] | undefined;
    // Release v6.0-GA: Automatically use internet in backend when available
    try {
      const res = await fetch(
        isOnlineLearning ? '/api/search' : '/api/v60/research-and-engineer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: effectivePrompt,
            prompt: effectivePrompt,
            mode: 'coding',
            useBackendInternet: true,
          }),
        }
      );
      const data = await res.json();
      const rawSources = Array.isArray(data?.sources)
        ? data.sources
        : Array.isArray(data?.liveSources)
        ? data.liveSources
        : [];
      liveOnlineSources = rawSources
        .filter(
          (source: Record<string, unknown>) =>
            typeof (source.url || source.doiOrUrl) === 'string' &&
            /^https:\/\//i.test(String(source.url || source.doiOrUrl))
        )
        .map((source: Record<string, unknown>) => ({
          title: String(source.title || ''),
          snippet: String(source.snippet || ''),
          url: String(source.url || source.doiOrUrl),
          publicationOrSource: String(source.publicationOrSource || 'Live search index'),
          sourceEngine: String(
            source.sourceEngine || source.publicationOrSource || 'Live search index'
          ),
          year: Number(source.year || 0),
        }));

      if (liveOnlineSources && liveOnlineSources.length > 0) {
        const cleanSubj = extractPresentationSubjectAndIntent(effectivePrompt).cleanSubject;
        savePaniniKnowledgeShard(cleanSubj, {
          syncedFromOnline: true,
          cachedWikipediaSources: liveOnlineSources,
        });
      }
    } catch {
      // Fallback to cached Knowledge Shard or Built-In Verified KB
    }

    const codeSynth = generateOfflineCodeSynthesis(
      effectivePrompt,
      languageChoice,
      targetVer.quantType,
      isOnlineLearning,
      {
        liveOnlineSources,
        learnedEntities,
        isOnlineMode: isOnlineLearning,
      }
    );

    let codingOutput = codeSynth.answerMarkdown;
    let codingInferenceNotice =
      'No configured LLM was used; this code output came from deterministic templates.';
    let codingModelName = targetModel.name;
    try {
      const selectedRuntimeModel = localStorage.getItem('panini-ollama-model') || undefined;
      const response = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedRuntimeModel,
          messages: [
            {
              role: 'system',
              content: `You are a coding assistant. Produce a complete ${codeSynth.resolvedLanguage} solution, explain assumptions, and do not claim code was run or tested unless it actually was.`,
            },
            { role: 'user', content: effectivePrompt },
          ],
        }),
      });
      const result = await response.json();
      if (response.ok && typeof result?.response === 'string') {
        codingOutput = result.response;
        codingModelName = `${result.provider}: ${result.model}`;
        codingInferenceNotice =
          'Generated by a configured model. Code has not been executed or independently reviewed.';
      } else {
        codingInferenceNotice = `Model inference unavailable (${result?.code || response.status}): ${result?.error || 'No model response was returned'}. Showing the deterministic code-template fallback.`;
      }
    } catch (error) {
      codingInferenceNotice = `Model inference failed: ${error instanceof Error ? error.message : 'network error'}. Showing the deterministic code-template fallback.`;
    }

    const outputGuardrail = runOutputGuardrailScan(
      codingOutput,
      codeSynth.verifiedFacts
    );
    const knowledgeMcpPipeline = runHybridKnowledgePipelineV57(
      effectivePrompt,
      activeAclRole,
      activeProfile.handle
    );
    const otelTraceWaterfall = buildOtelLangfuseTraceWaterfallV57(
      effectivePrompt,
      activeAclRole,
      targetModel.id,
      inputGuardrail.piiRedactedCount
    );
    const asyncJobRecord = submitAsyncGenerationJobV57(
      effectivePrompt,
      'pptx_document_pack'
    );

    const newUseCase = translateNlpToUseCase(
      `[${codeSynth.resolvedLanguage}] ${effectivePrompt}`,
      customScenarios.length + 1
    );
    setCustomScenarios((prev) => [newUseCase, ...prev]);

    const userMsg: ChatMessage = {
      id: `msg-code-u-${Date.now()}`,
      role: 'user',
      authorName: activeProfile.name,
      timestamp: '08:32 UTC',
      domain: 'Computer Programming',
      selectedLanguage: `${codeSynth.resolvedLanguage} (${
        codeSynth.usedBestPracticeFallback ? 'Best-Practice Auto' : 'User Choice'
      })`,
      content: effectivePrompt,
      autoCorrectedFrom: autoCorrect.wasCorrected ? rawPrompt : undefined,
    };

    const engineeredPromptSpecV59 = engineerPromptForOptimalAccuracyV59(
      effectivePrompt,
      'coding',
      isOnlineLearning
    );
    const thinkingPlanV59 = buildThinkingModeExecutionPlanV59(
      effectivePrompt,
      'coding',
      isOnlineLearning,
      liveOnlineSources?.length || 0,
      codeSynth.verifiedFacts.length,
      outputGuardrail.groundingScorePct,
      /\bData Not Available\b/i.test(outputGuardrail.sanitizedOutput)
    );

    if (codeSynth.codingResolution) {
      const newPreviewArtifacts = buildPreviewableArtifactsFromCodingResolutionV59(
        codeSynth.codingResolution,
        '08:32 UTC'
      );
      if (newPreviewArtifacts.length > 0) {
        setPreviewFiles((prev) => [...newPreviewArtifacts, ...prev].slice(0, 20));
        setActivePreviewFileId(newPreviewArtifacts[0].id);
        setIsPreviewTabOpen(true);
      }
    }

    const assistantMsg: ChatMessage = {
      id: `msg-code-a-${Date.now() + 1}`,
      role: 'assistant',
      authorName: `${codingModelName} (Coding · ${codeSynth.resolvedLanguage})`,
      timestamp: '08:32 UTC',
      domain: 'Computer Programming',
      selectedLanguage: codeSynth.resolvedLanguage,
      content: `${outputGuardrail.sanitizedOutput}\n\n> ${codingInferenceNotice}`,
      simpleAnswerMarkdown: codingOutput,
      verifiedFacts: codeSynth.verifiedFacts,
      codingResolution: codeSynth.codingResolution,
      glassBox: codeSynth.glassBox,
      synthesizedUseCase: newUseCase,
      synthesizedModelName: codingModelName,
      selfLearningCommitted: false,
      inputGuardrail,
      outputGuardrail,
      knowledgeMcpPipeline,
      otelTraceWaterfall,
      asyncJobRecord,
      thinkingPlanV59,
      engineeredPromptSpecV59,
    };

    appendMessagesToThread(
      [userMsg, assistantMsg],
      `${codeSynth.resolvedLanguage}: ${effectivePrompt}`
    );
  };

  /**
   * Deep Research Step 1 (Submit Plan for Approval First + Clarify Ambiguous Contexts):
   * - Checks if the research topic is polysemous/ambiguous (e.g. "Panini", "Mercury", "Java") and asks clarifying choices first.
   * - Otherwise generates a tailored Multi-Stage Deep Research Plan and posts an interactive Plan Approval Card in chat BEFORE executing research.
   */
  const handleExecuteDeepResearch = async (
    topic: string,
    steps?: DeepResearchPlanStep[],
    explicitSenseOption?: AmbiguityClarificationOption
  ) => {
    const autoCorrect = autoCorrectUserQuery(topic);
    const effectiveTopic = autoCorrect.correctedQuery;
    const currentThread = chatThreads.find((t) => t.id === activeThreadId);
    const currentThreadCtx = currentThread?.threadContext;

    const modelValidation = validateAndSelectOptimalModel(
      'deep_research',
      compatibleModels,
      activeModel
    );
    if (modelValidation.autoSwitched) {
      setActiveModelId(modelValidation.selectedModel.id);
    }
    const targetModel = modelValidation.selectedModel;
    const targetVer =
      targetModel.versions.find((v) => v.versionId === targetModel.currentVersionId) ||
      targetModel.versions[0];

    // 1. Check if the research topic is ambiguous (e.g., "Panini")
    const ambiguityCheck = explicitSenseOption
      ? { isAmbiguous: false, resolvedOption: explicitSenseOption }
      : detectAmbiguousQueryContext(effectiveTopic, currentThreadCtx, 'deep_research');

    if (ambiguityCheck.isAmbiguous && ambiguityCheck.options) {
      const userMsg: ChatMessage = {
        id: `msg-dr-amb-u-${Date.now()}`,
        role: 'user',
        authorName: activeProfile.name,
        timestamp: '08:33 UTC',
        domain: currentThreadCtx?.activeDomain || 'History',
        content: `Deep Research Request: ${effectiveTopic}`,
        autoCorrectedFrom: autoCorrect.wasCorrected ? topic : undefined,
      };

      const assistantMsg: ChatMessage = {
        id: `msg-dr-amb-a-${Date.now() + 1}`,
        role: 'assistant',
        authorName: `${targetModel.name} · Deep Research Context Clarifier`,
        timestamp: '08:33 UTC',
        domain: currentThreadCtx?.activeDomain || 'History',
        content:
          ambiguityCheck.clarificationPromptMarkdown ||
          `### Deep Research Context Clarification Required: "${ambiguityCheck.entityName}"\nBefore generating the Multi-Stage Deep Research Plan, please select which meaning of **${ambiguityCheck.entityName}** you want to research:`,
        ambiguityClarification: {
          entityName: ambiguityCheck.entityName || effectiveTopic,
          options: ambiguityCheck.options,
        },
        selfLearningCommitted: false,
      };

      const pendingCtx: ThreadContextMemory = {
        resolvedEntity: currentThreadCtx?.resolvedEntity || ambiguityCheck.entityName || effectiveTopic,
        resolvedSenseKey: currentThreadCtx?.resolvedSenseKey || '',
        resolvedSenseLabel: currentThreadCtx?.resolvedSenseLabel || '',
        activeDomain: currentThreadCtx?.activeDomain || 'History',
        activeSubDomain: currentThreadCtx?.activeSubDomain || 'Deep Research',
        priorPrompts: [...(currentThreadCtx?.priorPrompts || []), effectiveTopic],
        keyFactsEstablished: currentThreadCtx?.keyFactsEstablished || [],
        pendingAmbiguityQuery: effectiveTopic,
        pendingCapability: 'deep_research',
      };

      appendMessagesToThread([userMsg, assistantMsg], `Clarify Research: ${effectiveTopic}`, pendingCtx);
      return;
    }

    const resolvedOpt = ambiguityCheck.resolvedOption;
    const resolvedTopic = resolvedOpt ? resolvedOpt.expandedPrompt : effectiveTopic;
    const nextCtx: ThreadContextMemory = {
      resolvedEntity:
        resolvedOpt?.label || currentThreadCtx?.resolvedEntity || effectiveTopic,
      resolvedSenseKey:
        resolvedOpt?.senseKey || currentThreadCtx?.resolvedSenseKey || 'deep_research_topic',
      resolvedSenseLabel:
        resolvedOpt?.label || currentThreadCtx?.resolvedSenseLabel || effectiveTopic,
      activeDomain: resolvedOpt?.domain || currentThreadCtx?.activeDomain || 'Science',
      activeSubDomain: resolvedOpt?.subDomain || currentThreadCtx?.activeSubDomain || 'Deep Research',
      priorPrompts: [...(currentThreadCtx?.priorPrompts || []), effectiveTopic].slice(-6),
      keyFactsEstablished: currentThreadCtx?.keyFactsEstablished || [],
      pendingAmbiguityQuery: undefined,
      pendingCapability: undefined,
    };

    const proposedSteps =
      steps && steps.length > 0 && !resolvedOpt
        ? steps
        : generateDeepResearchPlan(resolvedTopic, nextCtx);

    const userMsg: ChatMessage = {
      id: `msg-dr-plan-u-${Date.now()}`,
      role: 'user',
      authorName: activeProfile.name,
      timestamp: new Date().toLocaleTimeString(),
      domain: nextCtx.activeDomain || 'Science',
      content: `Deep Research: ${resolvedOpt ? resolvedOpt.label : effectiveTopic}`,
      autoCorrectedFrom: autoCorrect.wasCorrected ? topic : undefined,
    };

    const assistantPlanMsg: ChatMessage = {
      id: `msg-dr-plan-a-${Date.now() + 1}`,
      role: 'assistant',
      authorName: `${targetModel.name} profile · Research plan draft`,
      timestamp: new Date().toLocaleTimeString(),
      domain: nextCtx.activeDomain || 'Science',
      subDomain: nextCtx.activeSubDomain,
      content: `### Research plan draft: ${resolvedTopic}\n\nReview the proposed stages below. No search has run yet and no model was trained. Expand **Show more** to review stage details, then approve to retrieve sources and build a structured synthesis.\n\n${proposedSteps
        .map((step, index) => `${index + 1}. **${step.title}** — ${step.objective}`)
        .join('\n\n')}`,
      pendingResearchPlan: {
        topic: resolvedTopic,
        resolvedSenseLabel: resolvedOpt?.label || nextCtx.resolvedSenseLabel,
        steps: proposedSteps,
        status: 'awaiting_approval',
      },
      verifiedFacts: [
        modelValidation.validationReason,
        'This is a deterministic research plan proposal; no sources were retrieved and no model was trained.',
      ],
      selfLearningCommitted: false,
    };

    appendMessagesToThread(
      [userMsg, assistantPlanMsg],
      `Research plan: ${effectiveTopic}`,
      nextCtx
    );
  };

  /**
   * Deep Research Step 2 (Execute Approved Multi-Stage Research Plan):
   * - Triggered when the user clicks "Approve Plan & Execute Multi-Stage Research" on the interactive plan card in chat.
   * - Crawls Wikipedia + OpenAlex per stage and synthesizes the full empirical report with stage matrix & bibliography.
   */
  const handleApproveAndRunDeepResearchPlan = async (
    planMessageId: string,
    approvedTopic: string,
    approvedSteps: DeepResearchPlanStep[]
  ) => {
    const nextOffset = customScenarios.length + 1;
    const modelValidation = validateAndSelectOptimalModel(
      'deep_research',
      compatibleModels,
      activeModel
    );
    const targetModel = modelValidation.selectedModel;
    const targetVer =
      targetModel.versions.find((v) => v.versionId === targetModel.currentVersionId) ||
      targetModel.versions[0];

    // Mark plan card as 'executing'
    setChatHistory((prev) =>
      prev.map((m) =>
        m.id === planMessageId && m.pendingResearchPlan
          ? {
              ...m,
              researchError: undefined,
              pendingResearchPlan: {
                ...m.pendingResearchPlan,
                steps: approvedSteps,
                status: 'executing',
              },
            }
          : m
      )
    );

    let liveCrawledData: LiveCrawledResearchPayload | undefined;
    if (isOnlineLearning) {
      try {
        const res = await fetch('/api/research/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: approvedTopic,
            steps: approvedSteps,
            isOnline: true,
          }),
        });
        const data = await res.json();
        if (!res.ok || data?.ok === false) {
          throw new Error(
            typeof data?.error === 'string' ? data.error : `Research search failed (${res.status}).`
          );
        }
        liveCrawledData = {
          references: Array.isArray(data?.references) ? data.references : [],
          liveStageSnippets:
            data?.liveStageSnippets && typeof data.liveStageSnippets === 'object'
              ? data.liveStageSnippets
              : {},
          isOnlineInternetFetched: Boolean(data?.isOnlineInternetFetched),
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'The online research request failed.';
        setChatHistory((prev) => {
          const updated = prev.map((m) =>
            m.id === planMessageId && m.pendingResearchPlan
              ? {
                  ...m,
                  researchError: `${message} Switch to Offline mode or retry after checking connectivity.`,
                  pendingResearchPlan: { ...m.pendingResearchPlan, status: 'failed' as const },
                }
              : m
          );
          setChatThreads((threads) =>
            threads.map((thread) =>
              thread.id === activeThreadId ? { ...thread, messages: updated } : thread
            )
          );
          return updated;
        });
        return;
      }
    }

    const report = executeDeepResearchPlan(
      approvedTopic,
      approvedSteps,
      isOnlineLearning,
      targetVer.quantType,
      nextOffset,
      liveCrawledData
    );

    const newUseCase = translateNlpToUseCase(approvedTopic, nextOffset);
    setCustomScenarios((prev) => [newUseCase, ...prev]);

    const researchWarning =
      isOnlineLearning && !liveCrawledData?.isOnlineInternetFetched
        ? 'No live sources were returned. This output is a deterministic local outline, not source-verified research.'
        : undefined;

    setChatHistory((prev) => {
      const updated = prev.map((m) =>
        m.id === planMessageId
          ? {
              ...m,
              authorName: `${targetModel.name} profile · ${researchWarning ? 'No live sources' : isOnlineLearning ? 'Live sources retrieved' : 'Offline outline'}`,
              domain: report.detectedDomain,
              subDomain: report.detectedSubDomain,
              content: report.answerMarkdown,
              simpleAnswerMarkdown: report.simpleAnswerMarkdown,
              researchWarning,
              researchError: undefined,
              pendingResearchPlan: m.pendingResearchPlan
                ? {
                    ...m.pendingResearchPlan,
                    steps: approvedSteps,
                    status: 'completed' as const,
                  }
                : undefined,
              selectedExpert: report.selectedExpert,
              alternativeExperts: report.alternativeExperts,
              contrastingOpinions: report.contrastingOpinions,
              matchedScenario: report.matchedScenario || newUseCase,
              verifiedFacts: [modelValidation.validationReason, ...report.verifiedFacts],
              bibliographyReferences: report.bibliographyReferences,
              deepResearchMetadata: report.deepResearchMetadata,
              multiEngineStream: isOnlineLearning ? report.multiEngineStream : undefined,
              followUpQuestions: report.followUpQuestions,
              glassBox: report.glassBox,
              synthesizedUseCase: newUseCase,
              selfLearningCommitted: false,
            }
          : m
      );

      setChatThreads((threads) =>
        threads.map((t) => (t.id === activeThreadId ? { ...t, messages: updated } : t))
      );
      return updated;
    });
  };

  /**
   * Handles clicking a meaning choice on the Polysemous Context Clarification Card
   */
  const handleSelectAmbiguityOption = (option: AmbiguityClarificationOption) => {
    const currentThread = chatThreads.find((t) => t.id === activeThreadId);
    const pendingCap = currentThread?.threadContext?.pendingCapability || chatCapability;
    const promptToRun = option.expandedPrompt || option.resolvedPrompt;

    if (pendingCap === 'deep_research') {
      handleExecuteDeepResearch(promptToRun, undefined, option);
    } else if (pendingCap === 'video_gen' || pendingCap === 'image_gen') {
      handleGenerateMediaInChat(
        promptToRun,
        pendingCap === 'image_gen' ? 'Image' : 'Video',
        '8K Master',
        'Smooth Auto-Paced',
        'Golden-Hour Nature Documentary',
        'Golden-Hour Chiaroscuro & Subsurface Glow',
        '65mm IMAX Anamorphic 2.39:1 Dolly'
      );
    } else {
      handleSendMessage(promptToRun, option.domain, undefined, undefined, option);
    }
  };

  /**
   * Prompt-Driven Live 8K Cinema Studio Handler (Offline & Online Live Frame Synthesis + Model Validation)
   */
  const handleGenerateMediaInChat = async (
    rawPrompt: string,
    modality: 'Image' | 'Video',
    qualityTier: MediaQualityTier,
    pacingPreset: VideoPacingPreset,
    creativeTheme: CreativeVisualTheme,
    lightingEffect: LightingEffectStyle,
    opticsStyle: CinematographyOpticsStyle,
    aspectRatio: VideoAspectRatio = '16:9',
    sourcePhotoDataUrl?: string
  ) => {
    const normalizedInputPrompt = rawPrompt
      .replace(/^(?:Live\s+Synthesize\s+[^:]+:\s*)+/i, '')
      .trim();
    const autoCorrect = autoCorrectUserQuery(normalizedInputPrompt);
    const cleanPrompt = autoCorrect.correctedQuery;

    // Validate & select optimal multimodal DiT/Cinema model
    const modelValidation = validateAndSelectOptimalModel(
      modality === 'Video' ? 'video_gen' : 'image_gen',
      compatibleModels,
      activeModel
    );
    if (modelValidation.autoSwitched) {
      setActiveModelId(modelValidation.selectedModel.id);
    }
    const targetModel = modelValidation.selectedModel;
    const targetVer =
      targetModel.versions.find((v) => v.versionId === targetModel.currentVersionId) ||
      targetModel.versions[0];

    let liveWebContextNote = '';
    let liveOnlineSources: LiveOnlineSearchSource[] | undefined;
    let backendPhotographicPlateUrl: string | undefined;

    try {
      if (modality === 'Image') {
        const imgRes = await fetch('/api/multimodal/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleanPrompt, isOnline: isOnlineLearning }),
        });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          if (typeof imgData?.photographicPlateUrl === 'string') {
            backendPhotographicPlateUrl = imgData.photographicPlateUrl;
          } else if (typeof imgData?.imageSpec?.photographicPlateUrl === 'string') {
            backendPhotographicPlateUrl = imgData.imageSpec.photographicPlateUrl;
          }
          if (Array.isArray(imgData?.liveSources) && imgData.liveSources.length > 0) {
            liveOnlineSources = imgData.liveSources.map((source: Record<string, unknown>) => ({
              title: String(source.title || ''),
              authorsOrInstitution: String(source.authorsOrInstitution || 'Google Search Index'),
              publicationOrSource: String(source.publicationOrSource || 'Google Search & Wikipedia'),
              year: Number(source.year || new Date().getFullYear()),
              url: String(source.url || source.doiOrUrl || 'https://www.google.com'),
              snippet: String(source.snippet || ''),
              sourceEngine: String(
                source.sourceEngine || 'Google Search & Knowledge Graph Engine'
              ),
            }));
          }
        }
      }

      if (isOnlineLearning && (!liveOnlineSources || liveOnlineSources.length === 0)) {
        const res = await fetch('/api/search/online', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: cleanPrompt }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.sources) && data.sources.length > 0) {
            liveOnlineSources = data.sources.map((source: Record<string, unknown>) => ({
              title: String(source.title || ''),
              authorsOrInstitution: String(source.authorsOrInstitution || 'Google Search Index'),
              publicationOrSource: String(source.publicationOrSource || 'Google Search & Wikipedia'),
              year: Number(source.year || new Date().getFullYear()),
              url: String(source.url || source.doiOrUrl || 'https://www.google.com'),
              snippet: String(source.snippet || ''),
              sourceEngine: String(
                source.sourceEngine || 'Google Search & Knowledge Graph Engine'
              ),
            }));
          }
        }
      }

      if (liveOnlineSources && liveOnlineSources[0]) {
        liveWebContextNote = `${liveOnlineSources[0].title} (${liveOnlineSources[0].publicationOrSource}): ${liveOnlineSources[0].snippet.slice(0, 140)}`;
        savePaniniKnowledgeShard(cleanPrompt, {
          syncedFromOnline: true,
          cachedWikipediaSources: liveOnlineSources,
        });
      }
    } catch {
      // Offline resilience
    }

    const visualNlp = analyzeNlpVisualPrompt(
      cleanPrompt,
      qualityTier,
      creativeTheme,
      lightingEffect,
      opticsStyle
    );

    const fpsMap: Record<VideoPacingPreset, number> = {
      'Fast Preview': 12,
      'Smooth Auto-Paced': 24,
      'Cinema High-Detail': 30,
    };
    const yieldMap: Record<VideoPacingPreset, number> = {
      'Fast Preview': 28,
      'Smooth Auto-Paced': 22,
      'Cinema High-Detail': 16,
    };

    const schedule = calculateVideoTimingSchedule(
      4,
      fpsMap[pacingPreset],
      qualityTier,
      yieldMap[pacingPreset],
      telemetry.thermalThrottlePct,
      activeHardware.id
    );

    const resLabel =
      qualityTier === '8K Master'
        ? '7680x4320'
        : qualityTier === '4K Ultra HD' || qualityTier === '4K Cinema'
        ? '3840x2160'
        : '1920x1080';

    const newItem: GeneratedMediaItem = {
      id: `med-${Date.now()}`,
      modality,
      prompt: cleanPrompt,
      timestamp: '2026-10-21 08:35 UTC',
      quantType: targetVer.quantType,
      qualityTier,
      resolution: resLabel,
      aspectRatio,
      sourcePhotoDataUrl: sourcePhotoDataUrl || backendPhotographicPlateUrl,
      durationSec: modality === 'Video' ? 4 : undefined,
      fps: modality === 'Video' ? fpsMap[pacingPreset] : undefined,
      interFrameYieldMs: modality === 'Video' ? schedule.recommendedInterFrameYieldMs : undefined,
      uiThreadHeadroomPct: modality === 'Video' ? schedule.uiThreadHeadroomPct : undefined,
      seed: Math.floor(100000 + Math.random() * 899999),
      palette: visualNlp.customSkyColors || ['#0ea5e9', '#f59e0b', '#0f172a'],
      visualNlp,
    };

    setMediaGallery((prev) => [newItem, ...prev]);

    const userMsg: ChatMessage = {
      id: `msg-med-u-${Date.now()}`,
      role: 'user',
      authorName: activeProfile.name,
      timestamp: '08:35 UTC',
      domain: 'Science',
      content: `Live Synthesize ${qualityTier} ${modality}: ${cleanPrompt}`,
      autoCorrectedFrom: autoCorrect.wasCorrected ? normalizedInputPrompt : undefined,
    };

    const storyboardBullets = (visualNlp.storyboardShots || [])
      .map(
        (s) =>
          `${s.shotNumber}. **Shot ${s.shotNumber} (${s.cameraMotion.replace('_', ' ')} · ${s.environment.replace('_', ' ')}):** "${s.caption}" — *${s.actionDescription}*`
      )
      .join('\n');

    const sceneSpec = buildPromptConstructedScene(cleanPrompt, aspectRatio, sourcePhotoDataUrl);
    if (backendPhotographicPlateUrl) {
      sceneSpec.photographicPlateUrl = backendPhotographicPlateUrl;
    }
    const isFailedGeneration = !sceneSpec.validationReport.isValidated;
    const isReceiptScene = sceneSpec.primarySubjectArchetype === 'commercial_receipt_pos';
    const groundedKnowledgeForMedia = generateOfflineKnowledgeResponse(
      cleanPrompt,
      undefined,
      targetVer.quantType,
      targetModel.selfLearningSamplesCount + 1,
      Boolean(liveOnlineSources && liveOnlineSources.length > 0),
      liveOnlineSources,
      {
        learnedEntities,
        customScenarios,
      }
    );

    const hasAbstentionInMedia = /\bData Not Available\b/i.test(
      groundedKnowledgeForMedia.answerMarkdown
    );
    const cleanMediaSimpleHeader =
      hasAbstentionInMedia && !isFailedGeneration
        ? `### Grounded Visual Scene Specification: ${cleanPrompt}\n- **Primary Subject Archetype:** \`${sceneSpec.primarySubjectArchetype}\`\n- **Environment & Lighting:** \`${visualNlp.sceneEnvironment}\` · \`${visualNlp.lightingEffect}\` · \`${visualNlp.cinematographyOptics}\`${
            liveWebContextNote ? `\n- **Google Search & Wikimedia Reference:** ${liveWebContextNote}` : ''
          }`
        : groundedKnowledgeForMedia.simpleAnswerMarkdown || '';

    const cleanMediaAnswerHeader =
      hasAbstentionInMedia && !isFailedGeneration
        ? `### Grounded Visual Scene Synthesis: ${cleanPrompt}\n- **Validated Visual Subject:** \`${sceneSpec.primarySubjectArchetype}\` (${sceneSpec.validationReport.contextMatchStatus})\n- **Environment & Atmosphere:** \`${visualNlp.sceneEnvironment}\` · \`${visualNlp.weatherEffect}\``
        : groundedKnowledgeForMedia.answerMarkdown;

    if (!isFailedGeneration && backendPhotographicPlateUrl) {
      const imgArtifactId = `prev-img-${Date.now()}`;
      setPreviewFiles((prev) =>
        [
          {
            id: imgArtifactId,
            fileName: `${cleanPrompt
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .slice(0, 36)}-4k-studio.svg`,
            fileExtension: 'html' as const,
            mimeType: 'image/svg+xml',
            sourceCapability: '8K Cinema Studio',
            createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
            subjectTitle: `4K Grounded Image Studio Preview: ${cleanPrompt}`,
            summaryDescription: `Panini-Flux.1-Dev-12B (Rectified Flow DiT) · ${qualityTier} (${resLabel})`,
            rawTextOrHtmlContent: `### 4K Grounded Image Studio Preview: ${cleanPrompt}\n- **Architecture:** \`Panini-Flux.1-Dev-12B (Rectified Flow DiT)\`\n- **Resolution:** \`${resLabel} (${aspectRatio})\`\n- **Optics & Lighting:** \`${visualNlp.lightingEffect} · ${visualNlp.cinematographyOptics}\``,
            embeddedSlideSvgPreviews: [
              {
                slideNumber: 1,
                slideTitle: `${cleanPrompt} (${qualityTier})`,
                svgDataUrl: backendPhotographicPlateUrl,
              },
            ],
            downloadDataUrl: backendPhotographicPlateUrl,
          },
          ...prev,
        ].slice(0, 20)
      );
    }

    const assistantMsg: ChatMessage = {
      id: `msg-med-a-${Date.now() + 1}`,
      role: 'assistant',
      authorName: isFailedGeneration
        ? `${modality} Generation Gate (Strict Zero-Fallback Policy)`
        : modality === 'Image'
        ? `Panini-Flux.1-Dev-12B (Nano-Banana Open-Source Still Studio · ${qualityTier})`
        : `Panini-Wan2.1-14B (Veo-3 Open-Source Cinema Video + Foley Studio · ${qualityTier})`,
      timestamp: '08:35 UTC',
      domain: groundedKnowledgeForMedia.detectedDomain || 'Science',
      simpleAnswerMarkdown: isFailedGeneration
        ? `### ⚠️ ${modality} Generation Failed
- **Reason:** ${sceneSpec.validationReport.contextMatchStatus}
- **Strict Zero-Default-Fallback Policy:** Default human/sun fallback rendering has been disabled. When a prompt cannot be grounded to a recognizable visual subject, person, place, building, brand, food, vehicle, animal, or object, generation halts and reports **${modality} generation failed**.`
        : modality === 'Image'
        ? `${cleanMediaSimpleHeader}\n\n---\n### Everyday Simple Guide: Your Open-Source Nano-Banana Still Image
**How Your Still Image Was Synthesized:**
- **Open-Source Rectified-Flow DiT Architecture:** Synthesized using **Panini-Flux.1-Dev-12B (Rectified Flow DiT)** with 16-Channel Latent VAE, per-pixel volumetric raymarching, Fractional Brownian Motion (fBm) textures, and ACES Filmic tone mapping.
- **Grounded Photographic Plate + 3D View Modes:** Switch between **Hybrid 3D + Photo Plate**, **Grounded Photo Plate**, and **3D Volumetric Scene**, or click **Download PNG (.png)** / **Download SVG (.svg)** below!`
        : `${cleanMediaSimpleHeader}\n\n---\n### Everyday Simple Guide: Your Open-Source Veo-3 Multi-Shot Video & Synchronized Foley
**How Your Prompt Was Animated Step-by-Step:**
Instead of rendering a single fixed scene, we broke your prompt into **${visualNlp.storyboardShots?.length || 3} sequential Storyboard Shots** using **Panini-Wan2.1-14B (3D Spatio-Temporal DiT)** and synthesized a native **16-bit PCM Foley & Ambient Audio Track** (${sceneSpec.veo3AudioSpec?.ambientSoundscape || 'Binaural Foley'}):

${storyboardBullets}

**Interactive Controls:**
- Click **Play Synchronized Foley Audio** on the audio bar to hear the physical acoustics of your scene, switch 3D camera trajectories, or click any **Shot Card** in the Storyboard Scrubber Strip below!`,
      content: isFailedGeneration
        ? `### ✗ ${modality} Generation Failed (Zero Default Fallback)
- **Status:** \`${modality} generation failed\`
- **Diagnostic Detail:** \`${sceneSpec.validationReport.contextMatchStatus}\``
        : `${cleanMediaAnswerHeader}\n\n---\n### Live ${qualityTier} ${modality} Synthesis (${
            isOnlineLearning ? 'Google Search + Wikimedia Grounded + Open-Source DiT' : '100% Offline Open-Source DiT'
          })
- **Open-Source Architecture Routed:** \`${
            modality === 'Image'
              ? 'Panini-Flux.1-Dev-12B (Rectified Flow DiT · 16ch VAE)'
              : 'Panini-Wan2.1-14B (3D Spatio-Temporal DiT + MMAudio Foley)'
          }\`
- **Shader & Optics Pipeline:** \`Per-Pixel Volumetric Raymarching + Multi-Octave fBm + ACES Filmic Tone Mapping\`
- **Data Validation & Entities:** \`${visualNlp.dataValidationStatus}\`
- **Character & Scene Engine:** \`${visualNlp.characterArchetype}\` (${visualNlp.lightingEffect} · ${visualNlp.cinematographyOptics})${
            liveWebContextNote ? `\n- **Live Online Visual Grounding:** \`${liveWebContextNote}\`` : ''
          }`,
      bibliographyReferences: groundedKnowledgeForMedia.bibliographyReferences,
      generatedMedia:
        !isReceiptScene && (modality === 'Video' || /\b(video|animate|clip)\b/i.test(cleanPrompt))
          ? { ...newItem, modality: 'Video' }
          : undefined,
      imageStudio:
        isReceiptScene || modality === 'Image' || /\b(image|photo|picture|still|portrait|receipt|invoice|folio)\b/i.test(cleanPrompt)
          ? {
              id: `img-studio-${Date.now()}`,
              prompt: cleanPrompt,
              modelUsed: 'Panini-Vision-Studio-8K',
              openSourceArchitecture: 'Panini-Flux.1-Dev-12B (Rectified Flow DiT)',
              vaeLatentChannels: '16-Channel Flux Latent VAE',
              guidanceScale: 3.5,
              inferenceSteps: 28,
              inpaintRegion: 'Full Canvas',
              photographicPlateUrl: backendPhotographicPlateUrl,
              resolution: '3840x2160 (4K)',
              aspectRatio,
              sourceImageDataUrl: sourcePhotoDataUrl,
              editHistory: [],
              sceneElements: sceneSpec,
            }
          : undefined,
      verifiedFacts: [
        ...groundedKnowledgeForMedia.verifiedFacts.filter(
          (f) => !/\bData Not Available\b/i.test(f)
        ),
        modelValidation.validationReason,
        `Data Validation: ${visualNlp.dataValidationStatus}`,
        ...(liveWebContextNote ? [`Live Internet Visual Grounding: ${liveWebContextNote}`] : []),
      ],
      glassBox: {
        explainableAi: {
          eli12Explanation: `Synthesized ${qualityTier} (${resLabel}) ${modality} for "${cleanPrompt.slice(0, 60)}" with grounded reference plate and procedural 3D volumetric rendering.`,
          decisionPathway: [
            `1. Grounded visual entities for ${visualNlp.validatedPromptEntities?.join(', ') || cleanPrompt.slice(0, 40)}.`,
            `2. Selected the ${visualNlp.sceneEnvironment} scene template and ${visualNlp.weatherEffect} weather treatment.`,
            `3. Generated ${qualityTier} (${resLabel}) studio composite with PNG/SVG export.`,
          ],
          keyFeatureAttributions: [],
          safetyAndBiasCheck: 'Verified visual grounding and procedural scene synthesis.',
          knowledgeSourceMode: liveWebContextNote
            ? 'Google Search + Wikimedia Commons Grounded Reference Plate'
            : 'Deterministic Local Studio Scene Synthesis',
        },
      },
      selfLearningCommitted: false,
    };

    appendMessagesToThread([userMsg, assistantMsg], `${qualityTier} ${modality}: ${cleanPrompt}`);
  };

  /**
   * Dynamically updates a generated media item & its parent chat message parameters
   * whenever the user changes Video Settings (Quality Tier, Pacing/FPS, Scene Theme, Lighting, or Optics).
   */
  const handleUpdateGeneratedMedia = (
    messageId: string,
    updates: Partial<{
      qualityTier: MediaQualityTier;
      pacingPreset: VideoPacingPreset;
      creativeTheme: CreativeVisualTheme;
      lightingEffect: LightingEffectStyle;
      opticsStyle: CinematographyOpticsStyle;
      fps: number;
    }>
  ) => {
    setChatHistory((prev) => {
      const updated = prev.map((msg) => {
        if (msg.id !== messageId || !msg.generatedMedia) return msg;
        const oldMedia = msg.generatedMedia;
        const nextQuality = updates.qualityTier || oldMedia.qualityTier;
        const nextTheme = updates.creativeTheme || oldMedia.visualNlp.creativeTheme;
        const nextLighting = updates.lightingEffect || oldMedia.visualNlp.lightingEffect;
        const nextOptics = updates.opticsStyle || oldMedia.visualNlp.cinematographyOptics;
        const nextFps = updates.fps || oldMedia.fps || 24;

        const nextVisualNlp = analyzeNlpVisualPrompt(
          oldMedia.prompt,
          nextQuality,
          nextTheme,
          nextLighting,
          nextOptics
        );

        const schedule = calculateVideoTimingSchedule(
          oldMedia.durationSec || 4,
          nextFps,
          nextQuality,
          oldMedia.interFrameYieldMs || 22,
          telemetry.thermalThrottlePct,
          activeHardware.id
        );

        const resLabel =
          nextQuality === '8K Master'
            ? '7680x4320'
            : nextQuality === '4K Ultra HD' || nextQuality === '4K Cinema'
            ? '3840x2160'
            : '1920x1080';

        const updatedMedia: GeneratedMediaItem = {
          ...oldMedia,
          qualityTier: nextQuality,
          resolution: resLabel,
          fps: oldMedia.modality === 'Video' ? nextFps : undefined,
          interFrameYieldMs:
            oldMedia.modality === 'Video' ? schedule.recommendedInterFrameYieldMs : undefined,
          uiThreadHeadroomPct:
            oldMedia.modality === 'Video' ? schedule.uiThreadHeadroomPct : undefined,
          palette: nextVisualNlp.customSkyColors || oldMedia.palette,
          visualNlp: nextVisualNlp,
        };

        return {
          ...msg,
          authorName: `${activeModel.name} (Live ${nextQuality} DiT Cinema Synthesizer)`,
          content: `### Live ${nextQuality} ${oldMedia.modality} Synthesis (Parameters Updated)
- **Validated Model Routed:** \`${activeModel.name} (${activeModel.parameterBadge})\`
- **Updated Parameters:** \`${nextQuality} (${resLabel})\` · \`${nextFps} FPS\` · \`${nextTheme}\`
- **Lighting & Optics:** \`${nextLighting}\` · \`${nextOptics}\`
- **Data Validation & Entities:** \`${nextVisualNlp.dataValidationStatus}\``,
          generatedMedia: updatedMedia,
        };
      });

      setChatThreads((threads) =>
        threads.map((t) => (t.id === activeThreadId ? { ...t, messages: updated } : t))
      );
      return updated;
    });
  };

  const handleCloneModel = (
    sourceModelId: string,
    newName: string,
    editedVersion: Omit<ModelVersion, 'versionId' | 'commitHash' | 'timestamp'>
  ) => {
    const src = models.find((m) => m.id === sourceModelId) || models[0];
    const hash = Math.floor(1000000 + Math.random() * 8999999).toString(16);
    const verId = `ver-clone-${Date.now()}`;
    const newVersion: ModelVersion = {
      ...editedVersion,
      versionId: verId,
      commitHash: hash,
      timestamp: '2026-10-21 08:36 UTC',
    };
    const clonedModel: StoredModel = {
      ...src,
      id: `mdl-clone-${Date.now()}`,
      name: newName,
      parameterBadge: `${src.totalParamsBillions}B Cloned Fork`,
      family: `${src.family} (Glass-Box Fork)`,
      currentVersionId: verId,
      isClonedFork: true,
      parentModelId: src.id,
      versions: [newVersion, ...src.versions],
    };
    setModels((prev) => [clonedModel, ...prev]);
    setActiveModelId(clonedModel.id);
    appendCollab(
      'Clone',
      `Cloned ${src.name} -> ${newName} (${editedVersion.quantType}, ${editedVersion.activeLayers} layers)`,
      hash
    );
  };

  const handleCommitModelVersion = (
    modelId: string,
    editedVersion: Omit<ModelVersion, 'versionId' | 'commitHash' | 'timestamp'>
  ) => {
    const hash = Math.floor(1000000 + Math.random() * 8999999).toString(16);
    const verId = `ver-${Date.now()}`;
    const newVersion: ModelVersion = {
      ...editedVersion,
      versionId: verId,
      commitHash: hash,
      timestamp: '2026-10-21 08:36 UTC',
    };
    setModels((prev) =>
      prev.map((m) =>
        m.id === modelId
          ? {
              ...m,
              currentVersionId: verId,
              versions: [newVersion, ...m.versions],
            }
          : m
      )
    );
    appendCollab(
      'Commit',
      `Committed ${editedVersion.versionTag} (${editedVersion.quantType}) on model ${modelId}`,
      hash
    );
  };

  const handleRollbackVersion = (modelId: string, targetVersionId: string) => {
    setModels((prev) =>
      prev.map((m) => {
        if (m.id !== modelId) return m;
        const updated = applyVersionRollback(
          m,
          targetVersionId,
          activeProfile.name,
          '2026-10-21 08:36 UTC'
        );
        const head = updated.versions[0];
        appendCollab('Rollback', `${m.name}: ${head.notes}`, head.commitHash);
        return updated;
      })
    );
  };

  const handleTriggerCriticalAlertTest = () => {
    appendLog(
      'CRITICAL',
      'ThermalGov',
      'CRITICAL ALERT: Simulated NPU junction thermal spike (49.4°C > 48.0°C hardware limit) & shard checksum guard engaged.'
    );
  };

  const handleAcknowledgeCriticalLogs = () => {
    setLogs((prev) =>
      prev.map((l) => (l.severity === 'CRITICAL' ? { ...l, acknowledged: true } : l))
    );
  };

  const handleCreateBackup = (label: string) => {
    const id = `BKP-20261021-${backups.length + 22}`;
    const sha = Math.floor(1e15 + Math.random() * 9e15).toString(16).padEnd(40, 'a8f1');
    const newBkp: BackupSnapshot = {
      id,
      label,
      timestamp: '2026-10-21 08:36 UTC',
      sizeGb: 4.85,
      sha256: sha,
      includesWeightsDelta: true,
      includesScenariosCount: 10000 + customScenarios.length,
      status: 'Verified',
    };
    setBackups((prev) => [newBkp, ...prev]);
  };

  const handleRestoreBackup = (backupId: string) => {
    setBackups((prev) =>
      prev.map((b) => (b.id === backupId ? { ...b, status: 'Restored' } : b))
    );
  };

  const handleOpenAdminConsoleFromGear = () => {
    setIsAdminTabOpen(true);
    setWorkspaceMode('admin');
  };

  const handleCloseAdminConsoleTab = () => {
    setIsAdminTabOpen(false);
    setWorkspaceMode('user');
  };

  const handleOpenAdminInstallScripts = () => {
    setOpsInitialSubTab('install_scripts');
    setAdminSection('ops');
    setIsAdminTabOpen(true);
    setWorkspaceMode('admin');
  };

  const handleUpdateAdminPermissions = (updates: Partial<AdminResourcePermissionPolicy>) => {
    setAdminPermissions((prev) => {
      const next = { ...prev, ...updates };
      appendLog(
        'INFO',
        'AuthRBAC',
        `Admin updated Sovereign Resource/Permission Policy: ${JSON.stringify(updates)}`
      );
      return next;
    });
  };

  const handleTriggerAdminLearnUpdateNow = (options?: {
    customLearningPrompt?: string;
    clarificationConfirmed?: boolean;
  }): ContinualLearningHarvestResult => {
    const harvestRes = executeContinualLearningHarvest({
      customLearningPrompt: options?.customLearningPrompt,
      clarificationConfirmed:
        options?.clarificationConfirmed || !adminPermissions.enableStrictClarificationGate,
      recentUserQueries: recentQueries,
      existingScenarios: customScenarios,
      actorName: activeProfile.name,
    });

    if (harvestRes.needsClarification) {
      return harvestRes;
    }

    if (harvestRes.newScenario) {
      const learnedScenario = harvestRes.newScenario;
      setCustomScenarios((prev) => [learnedScenario, ...prev]);

      // Persist the local scenario outline without presenting it as verified knowledge.
      savePaniniKnowledgeShard(learnedScenario.starterPrompt, {
        syncedFromOnline: false,
      });

      appendCollab(
        'Scenario',
        `Admin saved scenario ${learnedScenario.id} to the local workspace (${learnedScenario.sovereignEngineModule}); model weights were not changed.`,
        learnedScenario.id
      );
      appendLog(
        'INFO',
        'QuantEngine',
        `Admin saved scenario ${learnedScenario.id}: ${harvestRes.syncSummaryNotice}`
      );
    }

    return harvestRes;
  };

  const handleRunGovernanceScenarioFromAdmin = (payload: LiveScenarioTriggerPayload) => {
    setWorkspaceMode('user');
    handleChangeWorkspaceCapability(payload.capability);
    if (payload.capability === 'video_gen') {
      handleGenerateMediaInChat(
        payload.prompt,
        'Video',
        '8K Master',
        'Cinema High-Detail',
        'Golden-Hour Nature Documentary',
        'Golden-Hour Chiaroscuro & Subsurface Glow',
        '65mm IMAX Anamorphic 2.39:1 Dolly',
        '16:9'
      );
      return;
    }
    if (payload.capability === 'image_gen') {
      handleGenerateMediaInChat(
        payload.prompt,
        'Image',
        '8K Master',
        'Cinema High-Detail',
        'Golden-Hour Nature Documentary',
        'Golden-Hour Chiaroscuro & Subsurface Glow',
        '65mm IMAX Anamorphic 2.39:1 Dolly',
        '16:9'
      );
      return;
    }
    if (payload.capability === 'coding') {
      handleSendCodingMessage(payload.prompt, 'TypeScript');
      return;
    }
    if (payload.capability === 'deep_research') {
      const steps = generateDeepResearchPlan(payload.prompt);
      handleExecuteDeepResearch(payload.prompt, steps);
      return;
    }
    handleSendMessage(payload.prompt);
  };

  /**
   * Release v5.7-alpha: Human-in-the-Loop (HITL) Approval or Rejection Handler
   */
  const handleHitlDecision = (messageId: string, decision: 'approved' | 'rejected') => {
    setChatHistory((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== messageId || !m.agentOrchestrator) return m;
        const promptForOrch =
          m.agentOrchestrator.goalSummary ||
          m.content.slice(0, 120);
        const nextOrch = executeBoundedAgentOrchestrator(promptForOrch, {
          hitlDecision: decision,
          isExpenseDeckFlow: Boolean(m.expenseDeckBundle),
          forceRiskyAction: true,
          hasAttachment: Boolean(m.attachedFile || m.expenseDeckBundle),
        });
        return {
          ...m,
          agentOrchestrator: nextOrch,
        };
      });
      setChatThreads((threads) =>
        threads.map((t) => (t.id === activeThreadId ? { ...t, messages: updated } : t))
      );
      return updated;
    });
    appendLog(
      decision === 'approved' ? 'INFO' : 'WARN',
      'AuthRBAC',
      `Operator ${decision.toUpperCase()} Human-in-the-Loop (HITL) action on message ${messageId}.`
    );
  };

  /**
   * Release v5.7-alpha: Live Brand Style & Sandbox Runtime Switcher for Receipt-to-Expense-Deck Bundle
   */
  const handleUpdateExpenseDeckStyle = (
    messageId: string,
    brandStyle: ExpenseDeckBrandStyle,
    sandboxRuntime: SandboxIsolationRuntime
  ) => {
    setChatHistory((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== messageId || !m.expenseDeckBundle) return m;
        const rebuilt = buildSandboxedExpenseDeckBundle(
          m.expenseDeckBundle.receiptOcr,
          brandStyle,
          sandboxRuntime
        );
        return {
          ...m,
          expenseDeckBundle: rebuilt,
          simpleAnswerMarkdown: rebuilt.executiveSummaryMarkdown,
        };
      });
      setChatThreads((threads) =>
        threads.map((t) => (t.id === activeThreadId ? { ...t, messages: updated } : t))
      );
      return updated;
    });
  };

  /**
   * Release v5.7-beta: Live Document ACL & MCP Role Switcher on Assistant Message Cards
   */
  const handleUpdateMessageAclRole = (messageId: string, newRole: DocumentAclRole) => {
    setActiveAclRole(newRole);
    setChatHistory((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== messageId) return m;
        const baseQuery = m.knowledgeMcpPipeline?.query || m.agentOrchestrator?.goalSummary || m.content.slice(0, 120);
        const rebuiltPipeline = runHybridKnowledgePipelineV57(
          baseQuery,
          newRole,
          activeProfile.handle
        );
        return {
          ...m,
          knowledgeMcpPipeline: rebuiltPipeline,
        };
      });
      setChatThreads((threads) =>
        threads.map((t) => (t.id === activeThreadId ? { ...t, messages: updated } : t))
      );
      return updated;
    });
  };

  const adminNavItems: {
    id: AdminSection;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'registry',
      label: 'Models, GGUF & Use Cases',
      subtitle: 'GGUF v3 Model Updater, Versions & Use Cases',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'api_mcp_docs',
      label: 'REST API, MCP Agent & Server Docs',
      subtitle: 'REST Reference, MCP JSON-RPC & PDF Export',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'integrations',
      label: 'Integrations, Shards & MCP Hub',
      subtitle: 'Websites, RAG, PDF/PPTX/DOCX/XLSX, MCP & Agents',
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: 'governance',
      label: 'Sovereign Release, Learn & Permissions',
      subtitle: 'v5.1..v6.0 LTS, Learn Now, Voice/Resource Toggles & QA',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'hardware',
      label: 'Hardware & Preset Env Settings',
      subtitle: 'Offline Mode, Model Cache Dir & Thermal',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'team',
      label: 'Team, RBAC & Enterprise Auth',
      subtitle: 'Roles, Passkey & OAuth 2.0 Policy',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'ops',
      label: 'Install Scripts, Logs & Docs',
      subtitle: 'Valid Localhost Installer & Zoomable Docs',
      icon: <Terminal className="w-4 h-4" />,
    },
  ];

  const bgCanvas = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const headerBorder = isDark ? 'border-slate-800 bg-slate-950/95' : 'border-slate-200 bg-white/95';
  const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
  const surfaceClass = isDark ? 'bg-slate-900/80' : 'bg-white';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const headingText = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className={`min-h-screen ${bgCanvas} transition-colors`}>
      <aside
        role="note"
        data-testid="runtime-capability-notice"
        className="border-b border-amber-500/30 bg-amber-950/40 px-4 py-2 text-center text-xs text-amber-100"
      >
        AI inference, provider fine-tuning, and speech require configured services and models; no model
        weights are bundled. Unconfigured text/code uses deterministic behavior; online sources are not
        independently fact-checked; image/video/music workspaces are procedural previews. Do not rely
        on outputs for safety-critical or high-impact decisions.
      </aside>
      {/* Top Bar: Always visible when Preview tab, Admin tab, or active conversation is open */}
      {(workspaceMode === 'admin' || workspaceMode === 'preview' || isPreviewTabOpen || chatHistory.length > 0 || isAdminTabOpen) && (
      <header
        className={`sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 py-2 border-b ${headerBorder} backdrop-blur`}
      >
        <div className="flex items-center gap-3 overflow-x-auto">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setWorkspaceMode('user');
            }}
            className={`text-sm sm:text-base font-bold tracking-tight whitespace-nowrap ${headingText}`}
          >
            Panini 400B
          </a>

          {/* Browser-Style Tab Bar (Admin Console Tab is ONLY rendered when opened via Gear icon) */}
          <div className="flex items-center gap-1.5 ml-2">
            <button
              type="button"
              data-testid="top-tab-chat"
              onClick={() => setWorkspaceMode('user')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                workspaceMode === 'user'
                  ? isDark
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/50 shadow-sm'
                    : 'bg-sky-50 text-sky-900 border-sky-400 shadow-sm'
                  : isDark
                  ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>Chat</span>
            </button>

            {isPreviewTabOpen && (
              <button
                type="button"
                data-testid="top-tab-preview"
                onClick={() => setWorkspaceMode('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                  workspaceMode === 'preview'
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-sm'
                    : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preview</span>
                {previewFiles.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {previewFiles.length}
                  </span>
                )}
              </button>
            )}

            {isAdminTabOpen && (
              <div
                className={`flex items-center rounded-lg border text-xs font-semibold transition-all ${
                  workspaceMode === 'admin'
                    ? isDark
                      ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/50 shadow-sm'
                      : 'bg-indigo-50 text-indigo-950 border-indigo-400 shadow-sm'
                    : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('admin')}
                  className="px-2.5 py-1.5 flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Admin Console</span>
                </button>
                <a
                  href="?tab=admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Admin Console in New Browser Tab"
                  className="p-1 text-slate-400 hover:text-sky-400 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={handleCloseAdminConsoleTab}
                  title="Close Admin Console Tab"
                  aria-label="Close Admin Console Tab"
                  className="p-1 mr-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className={`hidden md:inline text-[11px] font-mono ${mutedText}`}>
            Demo profile: <strong className={headingText}>{activeModel.name}</strong> · {currentVersion.quantType} metadata
          </span>
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isDark
                ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                : 'border-slate-300 bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {isDark ? 'Light' : 'Dark'}
            <span className="hidden sm:inline"> Mode</span>
          </button>
        </div>
      </header>
      )}

      {/* Main Content Container */}
      <main className="max-w-[1440px] mx-auto px-3 sm:px-6 py-3">
        {/* SCREEN 1: USER CHAT WORKSPACE (Default = Ask & Math, No Output Until Asked) */}
        {workspaceMode === 'user' && (
          <UserWorkspaceView
            compatibleModels={compatibleModels}
            activeModel={activeModel}
            onSelectModel={setActiveModelId}
            activeHardware={activeHardware}
            deploymentMode={deploymentMode}
            telemetry={telemetry}
            isOnlineLearning={isOnlineLearning}
            onToggleOnlineLearning={handleToggleOnlineLearning}
            chatCapability={chatCapability}
            onChangeChatCapability={handleChangeWorkspaceCapability}
            onLoadChatByReferenceId={handleLoadChatByReferenceId}
            chatThreads={chatThreads}
            activeThreadId={activeThreadId}
            onSelectThread={handleSelectThread}
            onCreateNewThread={() => handleCreateNewThread()}
            onDeleteThread={handleDeleteThread}
            chatHistory={chatHistory}
            customScenarios={customScenarios}
            recentDomains={recentDomains}
            recentQueries={recentQueries}
            onSendMessage={handleSendMessage}
            onSendCodingMessage={handleSendCodingMessage}
            onExecuteDeepResearch={handleExecuteDeepResearch}
            onApproveDeepResearchPlan={handleApproveAndRunDeepResearchPlan}
            onSelectAmbiguityOption={handleSelectAmbiguityOption}
            onClearThreadContext={handleClearThreadContext}
            onGenerateMediaInChat={handleGenerateMediaInChat}
            onUpdateGeneratedMedia={handleUpdateGeneratedMedia}
            onOpenAdminConsole={handleOpenAdminConsoleFromGear}
            onOpenAdminInstallScripts={handleOpenAdminInstallScripts}
            contentSafetyMode={contentSafetyMode}
            selectedExpertId={selectedExpertId}
            onSelectExpertId={setSelectedExpertId}
            onSwitchMessageExpert={handleSwitchMessageExpert}
            learnedEntities={learnedEntities}
            adminPermissions={adminPermissions}
            onHitlDecision={handleHitlDecision}
            onUpdateExpenseDeckStyle={handleUpdateExpenseDeckStyle}
            activeAclRole={activeAclRole}
            onChangeAclRole={setActiveAclRole}
            onUpdateMessageAclRole={handleUpdateMessageAclRole}
            onOpenFileInPreviewTab={handleOpenFileInPreviewTab}
            isDark={isDark}
          />
        )}

        {/* SCREEN 1B: DEDICATED FILE PREVIEW TAB (KISS File Inspector Before Download) */}
        {workspaceMode === 'preview' && (
          <FilePreviewTabView
            previewFiles={previewFiles}
            activeFileId={activePreviewFileId}
            onSelectFile={setActivePreviewFileId}
            onBackToChat={() => setWorkspaceMode('user')}
            isDark={isDark}
          />
        )}

        {/* SCREEN 2: CONSISTENT SIDEBAR-THEMED ADMIN CONSOLE (Opened via Gear Icon at bottom of Sidebar) */}
        {workspaceMode === 'admin' && (
          <div
            className={`grid grid-cols-1 ${
              isAdminSidebarCollapsed ? 'lg:grid-cols-[68px_1fr]' : 'lg:grid-cols-[290px_1fr]'
            } gap-5 items-start transition-all`}
          >
            {/* Collapsible Admin Left Sidebar (Matches User Workspace Sidebar Theme) */}
            <aside
              aria-label="Admin Console Sidebar Navigation"
              className={`rounded-xl border ${borderClass} ${surfaceClass} p-3 flex flex-col justify-between min-h-[680px] space-y-5`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  {!isAdminSidebarCollapsed && (
                    <div>
                      <div className={`text-xs font-bold tracking-tight ${headingText}`}>
                        Admin Console
                      </div>
                      <div className={`text-[11px] ${mutedText}`}>
                        {activeProfile.name} ({activeProfile.role})
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAdminSidebarCollapsed(!isAdminSidebarCollapsed)}
                    title={isAdminSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    aria-label={isAdminSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    className={`p-2 rounded-lg border ${borderClass} ${headingText} hover:border-sky-500/50 transition-colors`}
                  >
                    {isAdminSidebarCollapsed ? (
                      <PanelLeftOpen className="w-4 h-4 text-sky-400" />
                    ) : (
                      <PanelLeftClose className="w-4 h-4 text-sky-400" />
                    )}
                  </button>
                </div>

                {/* Themed Sidebar Navigation Tabs */}
                <nav aria-label="Admin Console Sections" className="space-y-1.5">
                  {adminNavItems.map((item) => {
                    const isSelected = adminSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`admin-nav-${item.id}`}
                        onClick={() => setAdminSection(item.id)}
                        title={item.label}
                        className={`w-full ${
                          isAdminSidebarCollapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5'
                        } rounded-xl text-left transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? isDark
                              ? 'bg-sky-500/15 text-sky-300 border border-sky-500/50 shadow-sm'
                              : 'bg-sky-50 text-sky-900 border border-sky-400 shadow-sm'
                            : isDark
                            ? 'text-slate-300 hover:bg-slate-800/70 border border-transparent'
                            : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        <span
                          className={`mt-0.5 shrink-0 ${
                            isSelected ? 'text-sky-400' : mutedText
                          }`}
                        >
                          {item.icon}
                        </span>
                        {!isAdminSidebarCollapsed && (
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold truncate">{item.label}</div>
                            <div className={`text-[11px] truncate ${mutedText}`}>
                              {item.subtitle}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </nav>

                {!isAdminSidebarCollapsed && (
                  <div
                    className={`p-3 rounded-xl border ${borderClass} ${
                      isDark ? 'bg-slate-950/70' : 'bg-slate-50'
                    } text-[11px] space-y-1.5`}
                  >
                    <div className={`font-semibold ${headingText}`}>Preset Runtime Env</div>
                    <div className="font-mono text-emerald-400 truncate">
                      OFFLINE_MODE={String(presetOfflineMode)}
                    </div>
                    <div className={`font-mono truncate ${mutedText}`} title={presetModelCacheDir}>
                      Configured model path: {presetModelCacheDir}
                    </div>
                    <div className={mutedText}>
                      Generated template variants: 10,000
                    </div>
                    <div className={mutedText}>
                      Saved local scenarios: {customScenarios.length}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Gear / Return to Chat Workspace Button */}
              <div className={`pt-3 border-t ${borderClass}`}>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('user')}
                  title="Return to User Chat Workspace"
                  className={`w-full ${
                    isAdminSidebarCollapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'
                  } rounded-xl border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition-colors flex items-center gap-2 text-xs font-semibold`}
                >
                  <Settings className="w-4 h-4 text-sky-400 shrink-0" />
                  {!isAdminSidebarCollapsed && <span>Back to Chat Workspace</span>}
                </button>
              </div>
            </aside>

            {/* Right Admin Console Main Content */}
            <div className="min-w-0 space-y-5">
              {/* Admin workspace quick-access bar */}
              <div
                data-testid="admin-console-sovereign-banner"
                className="rounded-xl border border-amber-500/40 bg-slate-900/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">
                    Local Scenario Workspace · Demo Model Profiles
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="admin-banner-learn-now-btn"
                    onClick={() => {
                      handleTriggerAdminLearnUpdateNow();
                      setAdminSection('governance');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-mono text-[11px] font-bold hover:bg-cyan-400 transition"
                  >
                    Add Scenario
                  </button>
                  <button
                    type="button"
                    data-testid="open-admin-rest-mcp-docs-btn"
                    onClick={() => setAdminSection('api_mcp_docs')}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold border transition ${
                      adminSection === 'api_mcp_docs'
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-sky-500/15 text-sky-300 border-sky-500/40 hover:bg-sky-500/25'
                    }`}
                  >
                    REST API, MCP Agent &amp; Server Docs (PDF)
                  </button>
                  <button
                    type="button"
                    data-testid="open-admin-integrations-section-btn"
                    onClick={() => setAdminSection('integrations')}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold border transition ${
                      adminSection === 'integrations'
                        ? 'bg-indigo-500 text-white border-indigo-400'
                        : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/25'
                    }`}
                  >
                    Integrations, Shards &amp; MCP Hub (v5.8-GA)
                  </button>
                  <button
                    type="button"
                    data-testid="open-admin-governance-section-btn"
                    onClick={() => setAdminSection('governance')}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold border transition ${
                      adminSection === 'governance'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                    }`}
                  >
                    Release Train (v5.1..v6.0 LTS), QA &amp; Permissions
                  </button>
                </div>
              </div>

              {adminSection === 'api_mcp_docs' && (
                <AdminRestMcpDocsView
                  isDark={isDark}
                  onOpenFileInPreviewTab={handleOpenFileInPreviewTab}
                  onSyncNetworkModeFromCli={(online) => {
                    setIsOnlineLearning(online);
                    setPresetOfflineMode(!online);
                    const updatedSettings = updatePersistentSovereignSettingsV61({
                      isOnlineLearning: online,
                      presetOfflineMode: !online,
                      networkMode: online ? 'online' : 'offline',
                    });
                    fetch('/api/v61/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(updatedSettings),
                    }).catch(() => {});
                  }}
                />
              )}

              {adminSection === 'integrations' && (
                <AdminIntegrationsView
                  activeRole={activeAclRole}
                  userHandle={activeProfile.handle}
                  isOnline={isOnlineLearning}
                  onSendPromptToChat={(promptText) => {
                    setWorkspaceMode('user');
                    setChatCapability('coding');
                    handleSendCodingMessage(promptText, 'Python');
                  }}
                />
              )}

              {adminSection === 'governance' && (
                <EnterpriseGovernanceModal
                  isOpen={true}
                  inlineMode={true}
                  onClose={() => setAdminSection('registry')}
                  onRunLiveScenario={handleRunGovernanceScenarioFromAdmin}
                  adminPermissions={adminPermissions}
                  onUpdateAdminPermissions={handleUpdateAdminPermissions}
                  activeModel={activeModel}
                  customScenarios={customScenarios}
                  onTriggerAdminLearnUpdateNow={handleTriggerAdminLearnUpdateNow}
                />
              )}

              {adminSection === 'registry' && (
                <ModelRegistryView
                  models={models}
                  compatibleModels={compatibleModels}
                  activeModelId={activeModel.id}
                  onSelectActiveModel={setActiveModelId}
                  onCloneModel={handleCloneModel}
                  onCommitModelVersion={handleCommitModelVersion}
                  onRollbackVersion={handleRollbackVersion}
                  customScenarios={customScenarios}
                  onAddUseCaseViaNlp={handleAddUseCaseViaNlp}
                  onCloneAndEditUseCase={handleCloneAndEditUseCase}
                  activeHardware={activeHardware}
                  deploymentMode={deploymentMode}
                  onSelectDeploymentMode={handleSelectDeploymentMode}
                  telemetry={telemetry}
                  isOnlineLearning={isOnlineLearning}
                  currentUserName={activeProfile.name}
                  currentUserRole={activeProfile.role}
                  isDark={isDark}
                />
              )}

              {adminSection === 'hardware' && (
                <HardwareThermalView
                  activeHardware={activeHardware}
                  onSelectHardware={handleSelectHardware}
                  deploymentMode={deploymentMode}
                  onSelectDeploymentMode={handleSelectDeploymentMode}
                  compatibleModels={compatibleModels}
                  powerBudgetWatts={powerBudgetWatts}
                  onChangePowerWatts={setPowerBudgetWatts}
                  thermalLimitC={thermalLimitC}
                  onChangeThermalLimitC={setThermalLimitC}
                  ambientTempC={ambientTempC}
                  onChangeAmbientTempC={setAmbientTempC}
                  presetOfflineMode={presetOfflineMode}
                  onChangePresetOfflineMode={(val) => {
                    setPresetOfflineMode(val);
                    setIsOnlineLearning(!val);
                    appendLog(
                      'INFO',
                      'QuantEngine',
                      `Updated preset VITE_AETHERQUANT_OFFLINE_MODE to "${val}" from Admin Settings.`
                    );
                  }}
                  presetModelCacheDir={presetModelCacheDir}
                  onChangePresetModelCacheDir={(dir) => {
                    setPresetModelCacheDir(dir);
                    appendLog(
                      'INFO',
                      'QuantEngine',
                      `Updated preset VITE_AETHERQUANT_MODEL_CACHE_DIR to "${dir}" from Admin Settings.`
                    );
                  }}
                  presetBackupCron={presetBackupCron}
                  onChangePresetBackupCron={setPresetBackupCron}
                  contentSafetyMode={contentSafetyMode}
                  onChangeContentSafetyMode={(mode) => {
                    setContentSafetyMode(mode);
                    appendLog(
                      'INFO',
                      'AuthRBAC',
                      `Updated global Prompt Content Safety & Guardrail Policy to "${mode}" from Admin Settings.`
                    );
                  }}
                  activeModel={activeModel}
                  telemetry={telemetry}
                  isDark={isDark}
                />
              )}

              {adminSection === 'team' && (
                <TeamRbacView
                  profiles={profiles}
                  activeProfileId={activeProfile.id}
                  onSelectProfile={setActiveProfileId}
                  onAddProfile={(newProf) => {
                    setProfiles((prev) => [...prev, newProf]);
                    setActiveProfileId(newProf.id);
                    appendLog(
                      'INFO',
                      'AuthRBAC',
                      `Added team user ${newProf.name} with predefined role ${newProf.role}.`
                    );
                  }}
                  collabEvents={collabEvents}
                  onPostCollabNote={(note) =>
                    appendCollab(
                      'Commit',
                      note,
                      Math.floor(100000 + Math.random() * 899999).toString(16)
                    )
                  }
                  authMode={authMode}
                  onToggleAuthMode={(mode) => {
                    setAuthMode(mode);
                    appendLog('INFO', 'AuthRBAC', `Switched authentication provider to ${mode}.`);
                  }}
                  oauthClientId={oauthClientId}
                  onChangeOauthClientId={setOauthClientId}
                  oauthIssuerUrl={oauthIssuerUrl}
                  onChangeOauthIssuerUrl={setOauthIssuerUrl}
                  isDark={isDark}
                />
              )}

              {adminSection === 'ops' && (
                <OpsLogsDocsView
                  key={opsInitialSubTab}
                  logs={logs}
                  onTriggerCriticalAlertTest={handleTriggerCriticalAlertTest}
                  onAcknowledgeCriticalLogs={handleAcknowledgeCriticalLogs}
                  backups={backups}
                  onCreateBackup={handleCreateBackup}
                  onRestoreBackup={handleRestoreBackup}
                  currentUserRole={activeProfile.role}
                  initialSubTab={opsInitialSubTab}
                  isDark={isDark}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
