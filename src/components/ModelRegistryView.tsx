import React, { useState } from 'react';
import {
  StoredModel,
  ModelVersion,
  QuantizationType,
  QUANTIZATION_SPECS,
  HardwareProfile,
  DeploymentEnvironment,
  ThermalPowerTelemetry,
  CompatibleModelOption,
  UserRole,
  DomainCategory,
  UseCaseScenario,
  UseCaseVerificationResult,
  ALL_DOMAINS,
  TOTAL_PRETRAINED_SCENARIOS,
  evaluateRbacPermission,
  queryScenarioCatalog,
  verifyExistingUseCaseMatch,
  PREBUILT_GGUF_MODEL_PACKAGES_V60,
  parseGgufFileAndBuildModelUpdateV60,
  GgufModelUpdateDescriptorV60,
  HOSTED_ONLINE_GGUF_CATALOG_V63,
  HostedOnlineGgufPackageV63,
  executeGgufModelTerminalCommandV63,
  GgufTerminalExecutionResultV63,
  TerminalOutputVerbosityModeV64,
  exportPaniniModelGgufAndInstallBundleV64,
  ExportedModelGgufAndInstallBundleV64,
  ONLINE_EXTERNAL_MODEL_CATALOG_V64,
  OnlineExternalModelCatalogEntryV64,
  installOnlineCatalogModelV64,
  getTerminalAutocompleteSuggestionsV64,
  runAutonomousModelSelfLearningAndTuningV64,
  getModelSelfLearningStateV64,
  AutonomousModelSelfLearningResultV64,
} from '../utils/engineLogic';
import { savePaniniKnowledgeShard } from '../utils/multimodalSuite';
import {
  Copy,
  RotateCcw,
  Activity,
  Upload,
  Database,
  Eye,
  EyeOff,
  Plus,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Filter,
  GitCommit,
  Terminal,
  Play,
  Globe,
  Download,
  HelpCircle,
  Cpu,
} from 'lucide-react';

export type RegistrySubTab = 'models' | 'use_cases' | 'monitoring' | 'versions';

interface ModelRegistryViewProps {
  models: StoredModel[];
  compatibleModels: CompatibleModelOption[];
  activeModelId: string;
  onSelectActiveModel: (modelId: string) => void;
  onCloneModel: (
    sourceModelId: string,
    newName: string,
    editedVersion: Omit<ModelVersion, 'versionId' | 'commitHash' | 'timestamp'>
  ) => void;
  onCommitModelVersion: (
    modelId: string,
    editedVersion: Omit<ModelVersion, 'versionId' | 'commitHash' | 'timestamp'>
  ) => void;
  onRollbackVersion: (modelId: string, targetVersionId: string) => void;
  customScenarios: UseCaseScenario[];
  onAddUseCaseViaNlp: (nlpDescription: string) => Promise<UseCaseScenario>;
  onCloneAndEditUseCase: (clonedScenario: UseCaseScenario) => void;
  activeHardware: HardwareProfile;
  deploymentMode: DeploymentEnvironment;
  onSelectDeploymentMode: (mode: DeploymentEnvironment) => void;
  telemetry: ThermalPowerTelemetry;
  isOnlineLearning: boolean;
  currentUserName: string;
  currentUserRole: UserRole;
  isDark: boolean;
}

const DEPLOYMENT_MODES: DeploymentEnvironment[] = [
  'Air-Gapped Local',
  'On-Premises Cluster',
  'Cloud Elastic Node',
];

const QUANT_FILTER_OPTIONS: (QuantizationType | 'All')[] = [
  'All',
  'IQ1_S',
  'Q2_K',
  'IQ3_XXS',
  'Q4_K_M',
  'Q5_K_M',
  'Q8_0',
];

const MULTI_CATEGORY_NLP_TEMPLATES: { category: DomainCategory; label: string; prompt: string }[] = [
  {
    category: 'Science',
    label: 'Science: Quantum Decoherence',
    prompt:
      'Model superconducting transmon qubit Hamiltonian eigenstates and cryogenic resonator thermal decoherence',
  },
  {
    category: 'Mathematics',
    label: 'Math: Stochastic PDEs',
    prompt:
      'Derive closed-form Ito calculus martingale proofs and Runge-Kutta RK4 numerical convergence bounds',
  },
  {
    category: 'Computer Programming',
    label: 'Coding: Rust Lock-Free Ring',
    prompt:
      'Synthesize a zero-allocation cache-line aligned lock-free SPSC ring buffer in Rust with Miri memory verification',
  },
  {
    category: 'Geology',
    label: 'Geology: Subduction Tomography',
    prompt:
      'Analyze Pacific Ring of Fire subduction slab eclogite dehydration embrittlement and P/S wave velocity inversion',
  },
  {
    category: 'Cybersecurity',
    label: 'Cybersecurity: Post-Quantum ML-KEM',
    prompt:
      'Audit NIST FIPS-203 ML-KEM-1024 lattice key encapsulation and zero-trust enclave telemetry attestation',
  },
  {
    category: 'History',
    label: 'History & Culture: Epigraphy',
    prompt:
      'Cross-reference primary archival epigraphy, radiocarbon chronologies, and trade route historiography',
  },
];

export const ModelRegistryView: React.FC<ModelRegistryViewProps> = ({
  models,
  compatibleModels,
  activeModelId,
  onSelectActiveModel,
  onCloneModel,
  onCommitModelVersion,
  onRollbackVersion,
  customScenarios,
  onAddUseCaseViaNlp,
  onCloneAndEditUseCase,
  activeHardware,
  deploymentMode,
  onSelectDeploymentMode,
  telemetry,
  isOnlineLearning,
  currentUserName,
  currentUserRole,
  isDark,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<RegistrySubTab>('models');

  const [inspectedModelId, setInspectedModelId] = useState<string>(activeModelId);
  const [summaryModelId, setSummaryModelId] = useState<string | null>(null);

  const [showUseCaseCatalogSummary, setShowUseCaseCatalogSummary] = useState<boolean>(false);
  const [expandedUseCaseSummaryId, setExpandedUseCaseSummaryId] = useState<string | null>(null);

  // Admin Use-Case Catalog, Verification & Clone-and-Edit state
  const [nlpUseCaseInput, setNlpUseCaseInput] = useState<string>('');
  const [isTranslatingNlp, setIsTranslatingNlp] = useState<boolean>(false);
  const [lastTranslatedScenario, setLastTranslatedScenario] = useState<UseCaseScenario | null>(
    null
  );
  const [verificationResult, setVerificationResult] = useState<UseCaseVerificationResult | null>(
    null
  );

  // Clone & Edit Use Case Editor State
  const [cloningUseCase, setCloningUseCase] = useState<UseCaseScenario | null>(null);
  const [cloneUcTitle, setCloneUcTitle] = useState<string>('');
  const [cloneUcDomain, setCloneUcDomain] = useState<DomainCategory>('Science');
  const [cloneUcQuant, setCloneUcQuant] = useState<QuantizationType>('Q4_K_M');
  const [cloneUcPrompt, setCloneUcPrompt] = useState<string>('');
  const [cloneUcCapability, setCloneUcCapability] = useState<string>('');

  // Multi-Parameter Use-Case Filters (Text, Category, Quantization, Source)
  const [scenarioDomainFilter, setScenarioDomainFilter] = useState<DomainCategory | 'All'>('All');
  const [scenarioQuantFilter, setScenarioQuantFilter] = useState<QuantizationType | 'All'>('All');
  const [scenarioSourceFilter, setScenarioSourceFilter] = useState<'All' | 'Pretrained' | 'Custom'>(
    'All'
  );
  const [scenarioSearch, setScenarioSearch] = useState<string>('');
  const [scenarioPage, setScenarioPage] = useState<number>(1);

  const inspectedModel =
    compatibleModels.find((c) => c.model.id === inspectedModelId)?.model ||
    compatibleModels[0]?.model ||
    models[0];
  const currentVersion =
    inspectedModel.versions.find((v) => v.versionId === inspectedModel.currentVersionId) ||
    inspectedModel.versions[0];

  // Glass-Box Clone & Edit form state
  const [editMode, setEditMode] = useState<'none' | 'clone' | 'commit'>('none');
  const [forkName, setForkName] = useState(`${inspectedModel.name}-CustomFork`);
  const [versionTag, setVersionTag] = useState('v4.1.0-glass');
  const [quantType, setQuantType] = useState<QuantizationType>(currentVersion.quantType);
  const [activeLayers, setActiveLayers] = useState<number>(currentVersion.activeLayers);
  const [moeActiveExperts, setMoeActiveExperts] = useState<number>(currentVersion.moeActiveExperts);
  const [contextLength, setContextLength] = useState<number>(currentVersion.contextLength);
  const [loraRank, setLoraRank] = useState<number>(currentVersion.loraRank);
  const [systemDirective, setSystemDirective] = useState<string>(currentVersion.systemDirective);
  const [commitNotes, setCommitNotes] = useState<string>(
    'Customized Glass-Box layer routing & quantization bitrate'
  );
  const [formError, setFormError] = useState<string>('');

  // Release v6.0-GA: GGUF (GPT-Generated Unified Format) Panini Model Updater State
  const [selectedGgufPackageId, setSelectedGgufPackageId] = useState<string>(
    PREBUILT_GGUF_MODEL_PACKAGES_V60[0].packageId
  );
  const [ggufTargetModelId, setGgufTargetModelId] = useState<string>(
    models[0]?.id || 'panini-400b-flagship'
  );
  const [ggufCustomFileName, setGgufCustomFileName] = useState<string>(
    PREBUILT_GGUF_MODEL_PACKAGES_V60[0].ggufFileName
  );
  const [ggufCustomCalibrationFact, setGgufCustomCalibrationFact] = useState<string>(
    'GGUF v3 tensor & KV calibration data synced with Panini v6.0-GA sovereign shard registry.'
  );
  const [parsedGgufDescriptor, setParsedGgufDescriptor] = useState<GgufModelUpdateDescriptorV60>(
    () => PREBUILT_GGUF_MODEL_PACKAGES_V60[0]
  );
  const [ggufUpdateBanner, setGgufUpdateBanner] = useState<string | null>(null);

  // Release v6.3-GA & v6.4-GA: Interactive GGUF Fetch & Auto-Update Terminal State
  const [ggufTerminalCommand, setGgufTerminalCommand] = useState<string>(
    HOSTED_ONLINE_GGUF_CATALOG_V63[0].sampleCurlCommand
  );
  const [ggufTerminalOutputMode, setGgufTerminalOutputMode] =
    useState<TerminalOutputVerbosityModeV64>('INFO');
  const [showOnlineModelMenu, setShowOnlineModelMenu] = useState<boolean>(true);
  const [ggufTerminalLogs, setGgufTerminalLogs] = useState<GgufTerminalExecutionResultV63[]>(() => [
    executeGgufModelTerminalCommandV63({
      command: 'ollama pull panini-400b-moe-flagship-v6.3-q5_k_m.gguf',
      targetModelId: 'panini-400b-flagship',
      outputMode: 'INFO',
    }),
  ]);

  // Release v6.4-GA: Downloadable GGUF Binary, Ollama Modelfile & Installer Bundle Exporter State
  const [lastExportedBundle, setLastExportedBundle] =
    useState<ExportedModelGgufAndInstallBundleV64 | null>(null);

  // Release v6.4-GA: Autonomous Self-Learning Model Auto-Update & QLoRA Tuner State
  const [selfLearningState, setSelfLearningState] = useState(() => getModelSelfLearningStateV64());
  const [selectedSelfLearningStrategy, setSelectedSelfLearningStrategy] = useState<
    AutonomousModelSelfLearningResultV64['tuningStrategy']
  >('QLoRA-Differential-HotSwap');

  const terminalAutocompleteSuggestions = getTerminalAutocompleteSuggestionsV64(
    ggufTerminalCommand,
    6
  );

  const handleDownloadModelGgufOrInstaller = (
    model: StoredModel,
    format: 'gguf' | 'modelfile' | 'installer_sh' | 'installer_ps1'
  ) => {
    const activeVer =
      model.versions.find((v) => v.versionId === model.currentVersionId) || model.versions[0];
    const bundle = exportPaniniModelGgufAndInstallBundleV64({
      modelId: model.id,
      modelName: model.name,
      quantType: activeVer.quantType,
      contextLength: activeVer.contextLength,
      activeLayers: activeVer.activeLayers,
      totalLayers: activeVer.totalLayers,
      loraRank: activeVer.loraRank,
      systemDirective: activeVer.systemDirective,
    });
    setLastExportedBundle(bundle);

    const a = document.createElement('a');
    if (format === 'gguf') {
      a.href = bundle.ggufDataUrl;
      a.download = bundle.ggufFileName;
    } else if (format === 'modelfile') {
      a.href = bundle.modelfileDataUrl;
      a.download = bundle.modelfileFileName;
    } else if (format === 'installer_sh') {
      a.href = bundle.shellInstallerDataUrl;
      a.download = bundle.shellInstallerFileName;
    } else {
      a.href = bundle.powershellInstallerDataUrl;
      a.download = bundle.powershellInstallerFileName;
    }
    a.click();

    setGgufUpdateBanner(
      `Exported ${model.name} (${activeVer.quantType}) as ${a.download} — Ready for import into Ollama (${bundle.importCommands.ollamaCreateCmd}), LM Studio, or llama.cpp.`
    );
  };

  const handleInstallOnlineCatalogModel = (entry: OnlineExternalModelCatalogEntryV64) => {
    const installRes = installOnlineCatalogModelV64({
      modelKeyOrFamily: entry.id,
      targetPaniniModelId: ggufTargetModelId,
      outputMode: ggufTerminalOutputMode,
    });
    const newVer = installRes.installedModel.versions[0];
    onCloneModel(ggufTargetModelId, installRes.installedModel.name, {
      versionTag: newVer.versionTag,
      author: currentUserName,
      quantType: newVer.quantType,
      activeLayers: newVer.activeLayers,
      totalLayers: newVer.totalLayers,
      moeActiveExperts: newVer.moeActiveExperts,
      moeTotalExperts: newVer.moeTotalExperts,
      contextLength: newVer.contextLength,
      systemDirective: newVer.systemDirective,
      loraRank: newVer.loraRank,
      notes: newVer.notes,
    });
    setGgufTerminalCommand(entry.installCommand);
    const terminalEntry: GgufTerminalExecutionResultV63 = {
      executionId: installRes.installationId,
      command: entry.installCommand,
      detectedTool: 'ollama',
      fetchedUrlOrModel: entry.downloadUrl,
      parsedGgufUpdate: installRes.parsedGgufUpdate,
      persistedShardFile: installRes.persistedShardFile,
      outputMode: ggufTerminalOutputMode,
      isMenuOpened: true,
      installedExternalModel: installRes.installedModel,
      terminalStdout: installRes.terminalStdout,
      executedAtUtc: installRes.installedAtUtc,
    };
    setGgufTerminalLogs((prev) => [terminalEntry, ...prev.slice(0, 7)]);
    setGgufUpdateBanner(
      `Auto-installed online model "${entry.displayName}" (${entry.family} · ${entry.quantType} · ${(entry.contextLength / 1024).toFixed(0)}K ctx) into Model Registry and synced shard ${installRes.persistedShardFile}.`
    );
  };

  const handleRunSelfLearningAutoTune = async () => {
    const targetModel =
      models.find((m) => m.id === ggufTargetModelId) || inspectedModel || models[0];
    const tuned = runAutonomousModelSelfLearningAndTuningV64({
      targetModelId: targetModel.id,
      targetModelName: targetModel.name,
      tuningStrategy: selectedSelfLearningStrategy,
      enableAutoContinuousLearning: selfLearningState.autoUpdateAndSelfLearningEnabled,
    });
    setSelfLearningState(getModelSelfLearningStateV64());

    const baseVer =
      targetModel.versions.find((v) => v.versionId === targetModel.currentVersionId) ||
      targetModel.versions[0];

    onCommitModelVersion(targetModel.id, {
      versionTag: tuned.newVersionTag,
      author: `${currentUserName} (Self-Learning Auto-Tuner)`,
      quantType: baseVer.quantType,
      activeLayers: Math.min(tuned.tunedHyperparameters.activeLayers, baseVer.totalLayers),
      totalLayers: baseVer.totalLayers,
      moeActiveExperts: baseVer.moeActiveExperts,
      moeTotalExperts: baseVer.moeTotalExperts,
      contextLength: baseVer.contextLength,
      systemDirective: `${baseVer.systemDirective} | [${tuned.tuningRunId}: ${tuned.tuningStrategy} · Rank=${tuned.tunedHyperparameters.loraRank} · Temp=${tuned.tunedHyperparameters.temperature}]`,
      loraRank: tuned.tunedHyperparameters.loraRank,
      notes: tuned.differentialGgufPatchSummary,
    });

    setGgufUpdateBanner(
      `${tuned.differentialGgufPatchSummary} Perplexity improved ${tuned.validationPerplexityBefore} → ${tuned.validationPerplexityAfter} (Maturity: ${tuned.maturityScoreAfter}%).`
    );

    try {
      await fetch('/api/v64/models/self-learn-tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetModelId: targetModel.id,
          targetModelName: targetModel.name,
          tuningStrategy: selectedSelfLearningStrategy,
          enableAutoContinuousLearning: selfLearningState.autoUpdateAndSelfLearningEnabled,
        }),
      });
    } catch {
      // Offline local self-learning auto-tune already committed
    }
  };

  const handleToggleAutoContinuousLearning = () => {
    const nextEnabled = !selfLearningState.autoUpdateAndSelfLearningEnabled;
    runAutonomousModelSelfLearningAndTuningV64({
      targetModelId: ggufTargetModelId,
      tuningStrategy: selectedSelfLearningStrategy,
      enableAutoContinuousLearning: nextEnabled,
    });
    setSelfLearningState(getModelSelfLearningStateV64());
  };

  const applyParsedGgufToRegistry = (
    parsed: GgufModelUpdateDescriptorV60,
    sourceLabel = 'GGUF v3 Calibration Registry'
  ) => {
    setParsedGgufDescriptor(parsed);
    setGgufCustomFileName(parsed.ggufFileName);

    const targetModel =
      models.find(
        (m) =>
          m.id === parsed.targetModelId ||
          m.id === ggufTargetModelId ||
          m.name.toLowerCase() === parsed.targetModelName.toLowerCase()
      ) ||
      inspectedModel ||
      models[0];
    const baseVer =
      targetModel.versions.find((v) => v.versionId === targetModel.currentVersionId) ||
      targetModel.versions[0];

    onCommitModelVersion(targetModel.id, {
      versionTag: parsed.versionTag,
      author: currentUserName,
      quantType: parsed.quantType,
      activeLayers: Math.min(parsed.activeLayers, baseVer.totalLayers),
      totalLayers: baseVer.totalLayers,
      moeActiveExperts: Math.min(parsed.moeActiveExperts, baseVer.moeTotalExperts),
      moeTotalExperts: baseVer.moeTotalExperts,
      contextLength: parsed.contextLength,
      systemDirective: parsed.systemDirective,
      loraRank: parsed.loraRank,
      notes: parsed.commitNotes,
    });

    const shard = savePaniniKnowledgeShard(`${targetModel.name} (${parsed.versionTag})`, {
      syncedFromOnline: true,
      cachedWikipediaSources: [
        {
          title: `GGUF v3 Model Update: ${parsed.ggufFileName}`,
          snippet: `${parsed.commitNotes} | Facts: ${parsed.embeddedKnowledgeFacts.join(' ; ')}`,
          url: `https://localhost:3000/models/gguf/${encodeURIComponent(parsed.ggufFileName)}`,
          publicationOrSource: sourceLabel,
          year: 2026,
        },
      ],
    });

    setGgufTargetModelId(targetModel.id);
    setInspectedModelId(targetModel.id);
    setGgufUpdateBanner(
      `Updated ${targetModel.name} to ${parsed.versionTag} (${parsed.quantType} · ${parsed.tensorCount} tensors · ${parsed.contextLength.toLocaleString()} ctx) from ${parsed.ggufFileName} and synced shard ${shard.ggufShardFile}.`
    );
  };

  const handleRunGgufTerminalCommand = async (
    overrideCmd?: string,
    overrideModelId?: string,
    overrideMode?: TerminalOutputVerbosityModeV64
  ) => {
    const cmdToRun = (overrideCmd ?? ggufTerminalCommand).trim();
    if (!cmdToRun) return;
    if (overrideCmd) {
      setGgufTerminalCommand(overrideCmd);
    }
    const modeToUse = overrideMode || ggufTerminalOutputMode;
    const targetId = overrideModelId || ggufTargetModelId;
    const localExec = executeGgufModelTerminalCommandV63({
      command: cmdToRun,
      targetModelId: targetId,
      outputMode: modeToUse,
      customFacts: ggufCustomCalibrationFact.trim()
        ? [ggufCustomCalibrationFact.trim()]
        : undefined,
    });
    setGgufTerminalLogs((prev) => [localExec, ...prev.slice(0, 7)]);
    if (localExec.isMenuOpened) {
      setShowOnlineModelMenu(true);
    }
    if (localExec.installedExternalModel) {
      const extVer = localExec.installedExternalModel.versions[0];
      onCloneModel(targetId, localExec.installedExternalModel.name, {
        versionTag: extVer.versionTag,
        author: currentUserName,
        quantType: extVer.quantType,
        activeLayers: extVer.activeLayers,
        totalLayers: extVer.totalLayers,
        moeActiveExperts: extVer.moeActiveExperts,
        moeTotalExperts: extVer.moeTotalExperts,
        contextLength: extVer.contextLength,
        systemDirective: extVer.systemDirective,
        loraRank: extVer.loraRank,
        notes: extVer.notes,
      });
    }
    if (!localExec.isHelpGuide && !localExec.isMenuOpened) {
      applyParsedGgufToRegistry(
        localExec.parsedGgufUpdate,
        `GGUF Terminal (${localExec.detectedTool.toUpperCase()} · ${localExec.outputMode || modeToUse})`
      );
    }

    try {
      const res = await fetch('/api/v63/gguf/terminal-exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmdToRun,
          targetModelId: targetId,
          outputMode: modeToUse,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.execution) {
          setGgufTerminalLogs((prev) => [data.execution, ...prev.slice(1, 8)]);
        }
      }
    } catch {
      // Offline local terminal execution already committed the GGUF update
    }
  };

  const handleSelectGgufPreset = (pkg: GgufModelUpdateDescriptorV60) => {
    setSelectedGgufPackageId(pkg.packageId);
    setGgufCustomFileName(pkg.ggufFileName);
    const matchingModel =
      models.find(
        (m) =>
          m.id === pkg.targetModelId ||
          m.name.toLowerCase() === pkg.targetModelName.toLowerCase()
      ) || models[0];
    if (matchingModel) {
      setGgufTargetModelId(matchingModel.id);
    }
    setParsedGgufDescriptor(pkg);
  };

  const handleUploadGgufFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGgufCustomFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer;
      const bytes = buf ? new Uint8Array(buf.slice(0, 64)) : undefined;
      const parsed = parseGgufFileAndBuildModelUpdateV60({
        fileName: file.name,
        targetModelId: ggufTargetModelId,
        binaryBytes: bytes,
        customKnowledgeFacts: ggufCustomCalibrationFact.trim()
          ? [ggufCustomCalibrationFact.trim()]
          : undefined,
      });
      setParsedGgufDescriptor(parsed);
    };
    reader.readAsArrayBuffer(file.slice(0, 4096));
  };

  const handleApplyGgufUpdateToPaniniModel = () => {
    const parsed = parseGgufFileAndBuildModelUpdateV60({
      fileName: ggufCustomFileName || parsedGgufDescriptor.ggufFileName,
      targetModelId: ggufTargetModelId,
      customQuantType: parsedGgufDescriptor.quantType,
      customContextLength: parsedGgufDescriptor.contextLength,
      customActiveLayers: parsedGgufDescriptor.activeLayers,
      customLoraRank: parsedGgufDescriptor.loraRank,
      customSystemDirective: parsedGgufDescriptor.systemDirective,
      customKnowledgeFacts: ggufCustomCalibrationFact.trim()
        ? [ggufCustomCalibrationFact.trim()]
        : undefined,
    });
    applyParsedGgufToRegistry(parsed, 'GGUF v3 Calibration Registry');
  };

  const canEditOrClone = evaluateRbacPermission(currentUserRole, 'clone_and_edit_model');
  const canRollback = evaluateRbacPermission(currentUserRole, 'rollback_version');

  const hiddenModelsCount = Math.max(0, models.length - compatibleModels.length);

  const scenarioQueryResult = queryScenarioCatalog(
    scenarioDomainFilter,
    scenarioSearch,
    scenarioPage,
    8,
    customScenarios,
    scenarioQuantFilter,
    scenarioSourceFilter
  );

  const openEditor = (mode: 'clone' | 'commit', model: StoredModel) => {
    const ver =
      model.versions.find((v) => v.versionId === model.currentVersionId) || model.versions[0];
    setInspectedModelId(model.id);
    setEditMode(mode);
    setForkName(`${model.name}-Fork-${model.versions.length + 1}`);
    setVersionTag(`v4.0.${model.versions.length + 1}-custom`);
    setQuantType(ver.quantType);
    setActiveLayers(ver.activeLayers);
    setMoeActiveExperts(ver.moeActiveExperts);
    setContextLength(ver.contextLength);
    setLoraRank(ver.loraRank);
    setSystemDirective(ver.systemDirective);
    setCommitNotes(
      mode === 'clone'
        ? `Cloned from ${model.name} (${ver.versionTag}) with editable glass-box layers`
        : `Updated profile metadata: ${ver.quantType} quantization and active-layer settings`
    );
    setFormError('');
  };

  const handleSaveEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditOrClone) {
      setFormError(`Role "${currentUserRole}" does not have permission to clone or edit models.`);
      return;
    }
    if (editMode === 'clone' && !forkName.trim()) {
      setFormError('Cloned model name is required.');
      return;
    }
    if (!versionTag.trim() || !systemDirective.trim()) {
      setFormError('Version tag and system directive are required.');
      return;
    }

    const payload: Omit<ModelVersion, 'versionId' | 'commitHash' | 'timestamp'> = {
      versionTag: versionTag.trim(),
      author: currentUserName,
      quantType,
      activeLayers,
      totalLayers: currentVersion.totalLayers,
      moeActiveExperts,
      moeTotalExperts: currentVersion.moeTotalExperts,
      contextLength,
      systemDirective: systemDirective.trim(),
      loraRank,
      notes: commitNotes.trim() || 'Glass-Box configuration update',
    };

    if (editMode === 'clone') {
      onCloneModel(inspectedModel.id, forkName.trim(), payload);
    } else {
      onCommitModelVersion(inspectedModel.id, payload);
    }
    setEditMode('none');
  };

  const handleVerifyUseCaseBeforeAdding = (inputToVerify?: string) => {
    const target = (inputToVerify ?? nlpUseCaseInput).trim();
    if (!target) return;
    const ver = verifyExistingUseCaseMatch(target, customScenarios);
    setVerificationResult(ver);
  };

  const handleOpenCloneUseCaseEditor = (sourceScenario: UseCaseScenario) => {
    setCloningUseCase(sourceScenario);
    setCloneUcTitle(`${sourceScenario.title} (Cloned & Customized)`);
    setCloneUcDomain(sourceScenario.domain);
    setCloneUcQuant(sourceScenario.recommendedQuant);
    setCloneUcPrompt(
      nlpUseCaseInput.trim() ? nlpUseCaseInput.trim() : sourceScenario.starterPrompt
    );
    setCloneUcCapability(sourceScenario.expectedCapability);
  };

  const handleSaveClonedUseCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloningUseCase || !cloneUcTitle.trim()) return;
    const newClone: UseCaseScenario = {
      ...cloningUseCase,
      id: `SCN-CLONE-${String(10001 + customScenarios.length).padStart(5, '0')}`,
      title: cloneUcTitle.trim(),
      domain: cloneUcDomain,
      recommendedQuant: cloneUcQuant,
      starterPrompt: cloneUcPrompt.trim() || cloningUseCase.starterPrompt,
      expectedCapability: cloneUcCapability.trim() || cloningUseCase.expectedCapability,
      isCustom: true,
    };
    onCloneAndEditUseCase(newClone);
    setLastTranslatedScenario(newClone);
    setCloningUseCase(null);
    setVerificationResult(null);
    setNlpUseCaseInput('');
    setScenarioPage(1);
  };

  const handleCreateUseCaseFromNlp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nlpUseCaseInput.trim();
    if (!trimmed) return;

    // First verify if an existing use case fulfills the user's needs unless already verified
    if (!verificationResult) {
      const check = verifyExistingUseCaseMatch(trimmed, customScenarios);
      setVerificationResult(check);
      if (check.alreadyFulfilled) {
        return;
      }
    }

    setIsTranslatingNlp(true);
    try {
      const created = await onAddUseCaseViaNlp(trimmed);
      setLastTranslatedScenario(created);
      setVerificationResult(null);
      setNlpUseCaseInput('');
      setScenarioPage(1);
    } finally {
      setIsTranslatingNlp(false);
    }
  };

  const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
  const surfaceClass = isDark ? 'bg-slate-900/70' : 'bg-white';
  const subSurfaceClass = isDark ? 'bg-slate-950/60' : 'bg-slate-50';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const headingText = isDark ? 'text-slate-100' : 'text-slate-900';

  const subTabs: { id: RegistrySubTab; label: string; countBadge?: string }[] = [
    {
      id: 'models',
      label: '1. Demo Model Profiles',
      countBadge: `${compatibleModels.length} Profiles`,
    },
    {
      id: 'use_cases',
      label: '2. Scenario Templates & Builder',
      countBadge: `${TOTAL_PRETRAINED_SCENARIOS.toLocaleString()} templates · ${customScenarios.length} local`,
    },
    {
      id: 'monitoring',
      label: '3. Profile Metrics (Unverified)',
      countBadge: 'Metadata',
    },
    {
      id: 'versions',
      label: '4. Version Metadata',
      countBadge: `${inspectedModel.versions.length} records`,
    },
  ];

  return (
    <div className="space-y-5">
      <div
        data-testid="model-runtime-disclosure"
        className="rounded-lg border border-amber-500/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-100"
      >
        No model weights or LLM inference runtime are installed. Registry values are demo profile
        metadata and resource estimates, not runtime measurements.
      </div>
      {/* ADMIN SUB-TABS UNDERNEATH FOR ORGANIZED REPRESENTATION */}
      <div
        role="tablist"
        aria-label="Admin Model & Use-Case Sub-Tabs"
        className={`flex flex-wrap items-center gap-2 p-2 rounded-xl border ${borderClass} ${surfaceClass}`}
      >
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeSubTab === tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeSubTab === tab.id
                ? 'bg-sky-500 text-slate-950'
                : `${subSurfaceClass} ${headingText} border ${borderClass} hover:border-sky-500/50`
            }`}
          >
            <span>{tab.label}</span>
            {tab.countBadge && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                  activeSubTab === tab.id
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-sky-500/15 text-sky-400'
                }`}
              >
                {tab.countBadge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: DEMO MODEL PROFILES AND CONFIGURATION METADATA */}
      {activeSubTab === 'models' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className={`text-base font-semibold ${headingText}`}>
                Demo Model Profiles for {activeHardware.name} ({deploymentMode})
              </h2>
              <p className={`text-xs ${mutedText}`}>
                No model weights or LLM inference runtime are installed. These entries are profile
                metadata only; resource figures are estimates, and selecting a profile does not
                load or run a model.
              </p>
            </div>
            <div className={`text-xs font-mono ${mutedText}`}>
              Role: {currentUserRole} · Clone/Edit: {canEditOrClone ? 'Allowed' : 'Read-Only'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {compatibleModels.map(({ model, isRecommended, footprint }) => {
              const activeVer =
                model.versions.find((v) => v.versionId === model.currentVersionId) ||
                model.versions[0];
              const isSelectedRuntime = model.id === activeModelId;
              const isInspected = model.id === inspectedModel.id;
              const isSummaryOpen = summaryModelId === model.id;

              return (
                <div
                  key={model.id}
                  onClick={() => setInspectedModelId(model.id)}
                  className={`p-4 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
                    isInspected
                      ? 'border-sky-500 bg-sky-500/5'
                      : `${borderClass} ${surfaceClass} hover:border-slate-700`
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                      <span className="text-sky-400 font-semibold">{model.parameterBadge}</span>
                      {isRecommended && (
                        <span className="text-emerald-400 font-semibold">[PROFILE MATCH]</span>
                      )}
                    </div>

                    <div>
                      <h3 className={`text-sm font-semibold ${headingText}`}>{model.name}</h3>
                      <p className={`text-xs ${mutedText} mt-0.5`}>
                        {model.family} · {activeVer.quantType} · {activeVer.versionTag}
                      </p>
                    </div>

                    {/* Estimated profile resource requirements */}
                    <div
                      className={`p-2.5 rounded-lg border ${borderClass} ${subSurfaceClass} text-xs font-mono tabular-nums space-y-1`}
                    >
                      <div className="flex justify-between">
                        <span className={mutedText}>Estimated RAM:</span>
                        <span className={headingText}>
                          {model.minRamGb} GB profile minimum ({footprint.totalRequiredRamGb} GB estimated)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={mutedText}>CPU/NPU profile:</span>
                        <span className={headingText}>{model.minCpuCores}-Core CPU/NPU</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={mutedText}>Estimated storage:</span>
                        <span className={headingText}>{model.minStorageGb} GB Free</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={mutedText}>Target environments:</span>
                        <span className="text-sky-400">Cloud · On-Prem · Air-Gap</span>
                      </div>
                    </div>

                    {/* ON-DEMAND MODEL & USE-CASE SUMMARY (Shown ONLY when Summary button is clicked) */}
                    {isSummaryOpen && (
                      <div
                        className={`p-3 rounded-lg border border-sky-500/40 bg-sky-500/5 space-y-2 text-xs`}
                      >
                        <div className="font-semibold text-sky-400">
                          Demo profile description:
                        </div>
                        <p className={`${headingText} text-[11px] leading-relaxed`}>
                          {model.xaiArchitectureSummary}
                        </p>
                        <div className="font-semibold text-sky-400 pt-1">
                          Primary Use-Cases Summary:
                        </div>
                        <ul className={`list-disc pl-4 space-y-0.5 text-[11px] ${mutedText}`}>
                          {model.primaryUseCasesSummary.map((uc, idx) => (
                            <li key={idx}>{uc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectActiveModel(model.id);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        isSelectedRuntime
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                      }`}
                    >
                      {isSelectedRuntime ? 'Selected Demo Profile' : 'Select Demo Profile'}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSummaryModelId(isSummaryOpen ? null : model.id);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                        isSummaryOpen
                          ? 'bg-sky-500 text-slate-950 border-sky-500'
                          : `${borderClass} ${headingText} hover:border-sky-500/60`
                      }`}
                    >
                      {isSummaryOpen ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hide Summary</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-sky-400" />
                          <span>Summary</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={!canEditOrClone}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditor('clone', model);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${borderClass} ${headingText} hover:border-sky-500/60 disabled:opacity-40 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0`}
                    >
                      <Copy className="w-3 h-3" />
                      <span>Clone &amp; Edit</span>
                    </button>

                    <button
                      type="button"
                      data-testid={`card-export-gguf-btn-${model.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadModelGgufOrInstaller(model, 'gguf');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export .GGUF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RELEASE v6.0-GA to v6.4-GA: GGUF UPDATER, EXPORTER, ONLINE MODEL HUB MENU & SELF-LEARNING AUTO-TUNER */}
          <div
            data-testid="gguf-model-updater-panel"
            className={`p-5 rounded-xl border ${borderClass} ${surfaceClass} space-y-4`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className={`text-xs font-mono ${mutedText}`}>
                  GGUF v3 Binary &amp; KV Tensor Format (Magic 0x47475546) · Panini Model Registry Updater &amp; Portable Exporter (v6.4-GA)
                </div>
                <h3 className={`text-base font-semibold flex items-center gap-2 mt-0.5 ${headingText}`}>
                  <Database className="w-4 h-4 text-sky-400" />
                  <span>Update, Export &amp; Self-Tune Panini Models via GGUF (GPT-Generated Unified Format)</span>
                </h3>
                <p className={`text-xs ${mutedText}`}>
                  Apply GGUF v3 updates, download portable `.gguf` binaries / Ollama Modelfiles / installer scripts for external LLMs, install online models (`DeepSeek`, `Llama`, `GLM`, `MiMo`, `Kimi`, `Bonsai D3`), or run Autonomous Self-Learning QLoRA tuning.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid="export-model-gguf-btn"
                  onClick={() => {
                    const targetModel =
                      models.find((m) => m.id === ggufTargetModelId) || inspectedModel || models[0];
                    handleDownloadModelGgufOrInstaller(targetModel, 'gguf');
                  }}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 inline-flex items-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .GGUF Binary</span>
                </button>
                <button
                  type="button"
                  data-testid="export-model-modelfile-btn"
                  onClick={() => {
                    const targetModel =
                      models.find((m) => m.id === ggufTargetModelId) || inspectedModel || models[0];
                    handleDownloadModelGgufOrInstaller(targetModel, 'modelfile');
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-mono font-semibold border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 inline-flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Ollama Modelfile</span>
                </button>
                <button
                  type="button"
                  data-testid="export-model-installer-btn"
                  onClick={() => {
                    const targetModel =
                      models.find((m) => m.id === ggufTargetModelId) || inspectedModel || models[0];
                    handleDownloadModelGgufOrInstaller(targetModel, 'installer_sh');
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-mono font-semibold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 inline-flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Installer (.sh/.ps1)</span>
                </button>
                <button
                  type="button"
                  data-testid="apply-gguf-model-update-btn"
                  onClick={handleApplyGgufUpdateToPaniniModel}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 inline-flex items-center gap-2 transition shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Apply GGUF Update</span>
                </button>
              </div>
            </div>

            {lastExportedBundle && (
              <div
                data-testid="exported-gguf-bundle-status"
                className="p-3 rounded-lg border border-sky-500/40 bg-sky-950/20 text-xs font-mono space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-sky-300 font-semibold">
                  <span>
                    Exported Portable Model Package: {lastExportedBundle.ggufFileName} (SHA-256: {lastExportedBundle.sha256Checksum.slice(0, 16)}... · Magic 0x47475546)
                  </span>
                  <span className="text-emerald-300">
                    Compatible: {lastExportedBundle.compatibleRuntimes.join(' · ')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Import into Ollama: <code className="text-emerald-300">{lastExportedBundle.importCommands.ollamaCreateCmd}</code> · Run: <code className="text-sky-300">{lastExportedBundle.importCommands.ollamaRunCmd}</code>
                </div>
              </div>
            )}

            {ggufUpdateBanner && (
              <div
                data-testid="gguf-model-update-success-banner"
                className="px-3.5 py-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 text-xs font-mono flex items-center justify-between gap-2"
              >
                <span>{ggufUpdateBanner}</span>
                <button
                  type="button"
                  onClick={() => setGgufUpdateBanner(null)}
                  className="text-emerald-300 hover:underline text-[11px]"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Prebuilt GGUF v3 Packages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {PREBUILT_GGUF_MODEL_PACKAGES_V60.map((pkg) => {
                const isSelected = selectedGgufPackageId === pkg.packageId;
                return (
                  <button
                    key={pkg.packageId}
                    type="button"
                    data-testid={`gguf-preset-btn-${pkg.packageId}`}
                    onClick={() => handleSelectGgufPreset(pkg)}
                    className={`p-3 rounded-lg border text-left transition-colors space-y-1 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10'
                        : `${borderClass} ${subSurfaceClass} hover:border-slate-700`
                    }`}
                  >
                    <div className="text-xs font-mono text-sky-400 font-semibold truncate">
                      {pkg.ggufFileName}
                    </div>
                    <div className={`text-xs font-semibold ${headingText}`}>
                      {pkg.targetModelName}
                    </div>
                    <div className={`text-[11px] font-mono ${mutedText}`}>
                      {pkg.quantType} · {pkg.tensorCount} tensors · {(pkg.contextLength / 1024).toFixed(0)}K ctx
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Target Model, File Upload & Custom GGUF Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="gguf-target-model-select"
                  className={`block text-xs font-medium ${mutedText} mb-1`}
                >
                  Target Panini Model to Update
                </label>
                <select
                  id="gguf-target-model-select"
                  data-testid="gguf-target-model-select"
                  value={ggufTargetModelId}
                  onChange={(e) => setGgufTargetModelId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                >
                  {models.map((m) => {
                    const ver =
                      m.versions.find((v) => v.versionId === m.currentVersionId) || m.versions[0];
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} (Current: {ver.versionTag} · {ver.quantType})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label
                  htmlFor="gguf-file-name-input"
                  className={`block text-xs font-medium ${mutedText} mb-1`}
                >
                  GGUF File Name / Upload (.gguf)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="gguf-file-name-input"
                    data-testid="gguf-file-name-input"
                    type="text"
                    value={ggufCustomFileName}
                    onChange={(e) => {
                      setGgufCustomFileName(e.target.value);
                      setParsedGgufDescriptor(
                        parseGgufFileAndBuildModelUpdateV60({
                          fileName: e.target.value,
                          targetModelId: ggufTargetModelId,
                        })
                      );
                    }}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                  />
                  <label
                    htmlFor="gguf-binary-upload"
                    className={`px-3 py-2 rounded-lg border ${borderClass} ${subSurfaceClass} text-xs font-medium cursor-pointer hover:border-sky-500/50 whitespace-nowrap`}
                  >
                    Browse .gguf
                    <input
                      id="gguf-binary-upload"
                      data-testid="gguf-file-input"
                      type="file"
                      accept=".gguf,.bin,.json"
                      onChange={handleUploadGgufFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor="gguf-calibration-input"
                  className={`block text-xs font-medium ${mutedText} mb-1`}
                >
                  Embedded GGUF Domain Calibration Data
                </label>
                <input
                  id="gguf-calibration-input"
                  data-testid="gguf-calibration-input"
                  type="text"
                  value={ggufCustomCalibrationFact}
                  onChange={(e) => setGgufCustomCalibrationFact(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                />
              </div>
            </div>

            {/* Parsed GGUF v3 Header & KV Tensor Metadata Summary Table */}
            <div className={`p-3.5 rounded-lg border ${borderClass} ${subSurfaceClass} space-y-2`}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className={headingText}>
                  Parsed GGUF Header: Magic={parsedGgufDescriptor.magicHeader} (0x47475546) · Version=v
                  {parsedGgufDescriptor.ggufFormatVersion} · Tensors={parsedGgufDescriptor.tensorCount} · KV Entries=
                  {parsedGgufDescriptor.metadataKvCount}
                </span>
                <span className="text-sky-400">
                  Target Version Tag: {parsedGgufDescriptor.versionTag} ({parsedGgufDescriptor.quantType} ·{' '}
                  {parsedGgufDescriptor.activeLayers}/{parsedGgufDescriptor.totalLayers} Layers ·{' '}
                  {parsedGgufDescriptor.contextLength.toLocaleString()} Tokens)
                </span>
              </div>
            </div>

            {/* RELEASE v6.3-GA & v6.4-GA: INTERACTIVE GGUF TERMINAL WITH AUTOCOMPLETE, INFO/DEBUG/VERBOSE MODES, `/?` GUIDE & ONLINE MODEL MENU */}
            <div
              data-testid="gguf-interactive-terminal-panel"
              className="rounded-xl border border-emerald-500/40 bg-slate-950 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">
                      GGUF Fetch, Auto-Complete &amp; Online Model Hub Terminal (`ollama`, `curl`, `irm`, `wget`, `/?` Guide &amp; `/menu` · v6.4-GA)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Supports Tab auto-complete, Output Modes (`INFO`, `DEBUG`, `VERBOSE`), `/?` Command Guides, and `/menu` (`panini-cli model-menu`) to select &amp; auto-install `DeepSeek`, `Llama`, `GLM`, `MiMo`, `Kimi`, `Bonsai D3`, and `Qwen`.
                    </p>
                  </div>
                </div>

                {/* Output Mode Selector (`INFO` | `DEBUG` | `VERBOSE`) + `/?` Guide + `/menu` Toggle */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <div
                    data-testid="gguf-terminal-mode-selector"
                    className="inline-flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-[11px] font-mono"
                  >
                    {(['INFO', 'DEBUG', 'VERBOSE'] as TerminalOutputVerbosityModeV64[]).map(
                      (modeOpt) => (
                        <button
                          key={modeOpt}
                          type="button"
                          data-testid={`gguf-terminal-mode-${modeOpt.toLowerCase()}`}
                          onClick={() => setGgufTerminalOutputMode(modeOpt)}
                          className={`px-2 py-1 rounded transition-colors ${
                            ggufTerminalOutputMode === modeOpt
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {modeOpt}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    data-testid="gguf-terminal-help-guide-btn"
                    onClick={() => handleRunGgufTerminalCommand('/?')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-semibold inline-flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>/? Command Guide</span>
                  </button>

                  <button
                    type="button"
                    data-testid="open-online-model-menu-btn"
                    onClick={() => {
                      setShowOnlineModelMenu((v) => !v);
                      handleRunGgufTerminalCommand('panini-cli model-menu');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-mono text-[11px] font-semibold inline-flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" />
                    <span>/menu · Online Model Menu</span>
                  </button>
                </div>
              </div>

              {/* Command Input + Tab Auto-Complete + Run Button */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300">
                    <span className="text-slate-500 select-none">$</span>
                    <input
                      type="text"
                      data-testid="gguf-terminal-command-input"
                      value={ggufTerminalCommand}
                      onChange={(e) => setGgufTerminalCommand(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' && terminalAutocompleteSuggestions.length > 0) {
                          e.preventDefault();
                          setGgufTerminalCommand(terminalAutocompleteSuggestions[0].command);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRunGgufTerminalCommand();
                        }
                      }}
                      placeholder="Type command or press Tab to auto-complete (try: /? | /menu | panini-cli model-menu install deepseek)"
                      className="w-full bg-transparent text-emerald-300 focus:outline-none font-mono text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    data-testid="gguf-terminal-run-btn"
                    onClick={() => handleRunGgufTerminalCommand()}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run ({ggufTerminalOutputMode})</span>
                  </button>
                </div>

                {/* Live Auto-Complete Suggestion Strip */}
                <div
                  data-testid="gguf-terminal-autocomplete-bar"
                  className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono"
                >
                  <span className="text-slate-400">Auto-Complete (Tab / Click):</span>
                  {terminalAutocompleteSuggestions.map((sug, idx) => (
                    <button
                      key={sug.command}
                      type="button"
                      data-testid={`gguf-autocomplete-suggestion-${idx}`}
                      onClick={() => setGgufTerminalCommand(sug.command)}
                      title={sug.description}
                      className="px-2 py-0.5 rounded bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-slate-800 transition-colors"
                    >
                      {sug.command}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Tool Presets: ollama, curl, irm, wget, /?, /menu */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                <span className="text-slate-400 mr-1">Quick CLI Presets:</span>
                {[
                  {
                    label: 'ollama pull (Flagship Q5_K_M)',
                    cmd: HOSTED_ONLINE_GGUF_CATALOG_V63[0].sampleOllamaCommand,
                    modelId: HOSTED_ONLINE_GGUF_CATALOG_V63[0].targetModelId,
                  },
                  {
                    label: 'curl -L (Coder Q8_0)',
                    cmd: HOSTED_ONLINE_GGUF_CATALOG_V63[1].sampleCurlCommand,
                    modelId: HOSTED_ONLINE_GGUF_CATALOG_V63[1].targetModelId,
                  },
                  {
                    label: 'irm PowerShell (Vision Q4_K_M)',
                    cmd: HOSTED_ONLINE_GGUF_CATALOG_V63[2].sampleIrmCommand,
                    modelId: HOSTED_ONLINE_GGUF_CATALOG_V63[2].targetModelId,
                  },
                  {
                    label: 'wget (Edge SecOps IQ3_XXS)',
                    cmd: HOSTED_ONLINE_GGUF_CATALOG_V63[3].sampleWgetCommand,
                    modelId: HOSTED_ONLINE_GGUF_CATALOG_V63[3].targetModelId,
                  },
                  {
                    label: 'panini-cli model-menu install deepseek',
                    cmd: 'panini-cli model-menu install deepseek',
                    modelId: 'panini-400b-flagship',
                  },
                  {
                    label: 'panini-cli model-menu install bonsai-d3',
                    cmd: 'panini-cli model-menu install bonsai-d3',
                    modelId: 'panini-coder-polyglot',
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    data-testid={`gguf-terminal-preset-${idx}`}
                    onClick={() => handleRunGgufTerminalCommand(preset.cmd, preset.modelId)}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* RELEASE v6.4-GA: ONLINE FRONTIER MODEL HUB MENU (DeepSeek, Llama, GLM, MiMo, Kimi, Bonsai D3, Qwen) */}
              {showOnlineModelMenu && (
                <div
                  data-testid="gguf-online-model-menu-panel"
                  className="p-3.5 rounded-xl bg-slate-900/95 border border-sky-500/40 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-mono font-bold text-sky-300">
                      ONLINE FRONTIER MODEL HUB MENU (`panini-cli model-menu` · `/menu`) — Select to Auto-Install `.gguf` Model
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      DeepSeek · Llama · GLM · MiMo · Kimi · Bonsai D3 · Qwen
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {ONLINE_EXTERNAL_MODEL_CATALOG_V64.map((entry) => {
                      const familySlug = entry.family.toLowerCase().replace(/\s+/g, '-');
                      return (
                        <div
                          key={entry.id}
                          data-testid={`online-model-menu-card-${familySlug}`}
                          className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between gap-2 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1 font-mono text-[11px]">
                              <span className="text-amber-300 font-bold">{entry.family}</span>
                              <span className="text-sky-400">
                                {entry.quantType} · {entry.sizeGb} GB
                              </span>
                            </div>
                            <div className="font-semibold text-white text-xs">
                              {entry.displayName}
                            </div>
                            <div className="text-[10px] font-mono text-emerald-400 truncate">
                              $ {entry.installCommand}
                            </div>
                            <div className="text-[10px] text-slate-400 line-clamp-2">
                              {entry.specialization}
                            </div>
                          </div>
                          <button
                            type="button"
                            data-testid={`install-external-model-btn-${familySlug}`}
                            onClick={() => handleInstallOnlineCatalogModel(entry)}
                            className="w-full py-1.5 px-2.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-semibold transition-colors"
                          >
                            Auto-Install {entry.family} Model →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Online Hosted GGUF Catalog with 1-Click Terminal Fetch & Auto-Apply */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span>Online Hosted `.gguf` Model Repository (1-Click Terminal Fetch &amp; Auto-Apply):</span>
                  </span>
                  <span className="text-slate-500">https://models.panini.local/gguf/*</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {HOSTED_ONLINE_GGUF_CATALOG_V63.map((hosted: HostedOnlineGgufPackageV63) => (
                    <div
                      key={hosted.id}
                      data-testid={`hosted-online-gguf-card-${hosted.id}`}
                      className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-mono text-[11px] text-emerald-400 font-semibold truncate">
                          {hosted.fileName}
                        </div>
                        <div className="text-[11px] text-white font-semibold">
                          {hosted.targetModelName} · {hosted.quantType} ({hosted.sizeGb} GB)
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-2">
                          {hosted.releaseNotes}
                        </div>
                      </div>
                      <button
                        type="button"
                        data-testid={`fetch-online-gguf-btn-${hosted.id}`}
                        onClick={() =>
                          handleRunGgufTerminalCommand(
                            hosted.sampleCurlCommand,
                            hosted.targetModelId
                          )
                        }
                        className="w-full py-1.5 px-2 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-mono text-[11px] font-semibold transition-colors"
                      >
                        Fetch Online &amp; Auto-Apply →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Terminal Output Stream */}
              <div
                data-testid="gguf-terminal-stdout"
                className="p-3 rounded-lg bg-black/90 border border-slate-800 font-mono text-[11px] text-emerald-300 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed"
              >
                {ggufTerminalLogs[0]?.terminalStdout}
              </div>
            </div>

            {/* RELEASE v6.4-GA: AUTONOMOUS SELF-LEARNING MODEL AUTO-UPDATE & HYPERPARAMETER TUNING ENGINE */}
            <div
              data-testid="model-auto-update-self-learning-panel"
              className={`p-4 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-3`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <h4 className={`text-sm font-semibold ${headingText}`}>
                      Autonomous Model Auto-Update &amp; Self-Learning Hyperparameter Tuner (v6.4-GA)
                    </h4>
                  </div>
                  <p className={`text-xs ${mutedText} mt-0.5`}>
                    Continuously harvests verified local `.gguf` Knowledge Shards and D3 Knowledge Graph entity relationships to auto-tune LoRA Rank, Alpha, Temperature, Top-P, and differential GGUF tensors without model downtime.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    aria-label="Self-Learning Tuning Strategy"
                    data-testid="self-learning-strategy-select"
                    value={selectedSelfLearningStrategy}
                    onChange={(e) =>
                      setSelectedSelfLearningStrategy(
                        e.target.value as AutonomousModelSelfLearningResultV64['tuningStrategy']
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg border ${borderClass} bg-slate-950 text-xs font-mono text-sky-300`}
                  >
                    <option value="QLoRA-Differential-HotSwap">QLoRA-Differential-HotSwap</option>
                    <option value="DoRA-Knowledge-Distillation">DoRA-Knowledge-Distillation</option>
                    <option value="RLHF-Shard-Alignment">RLHF-Shard-Alignment</option>
                  </select>

                  <button
                    type="button"
                    data-testid="toggle-auto-self-learning-btn"
                    onClick={handleToggleAutoContinuousLearning}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                      selfLearningState.autoUpdateAndSelfLearningEnabled
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Continuous Self-Learning:{' '}
                    {selfLearningState.autoUpdateAndSelfLearningEnabled ? 'ENABLED' : 'PAUSED'}
                  </button>

                  <button
                    type="button"
                    data-testid="trigger-self-learning-tune-btn"
                    onClick={handleRunSelfLearningAutoTune}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 inline-flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Update &amp; Self-Learn Tune Model Now</span>
                  </button>
                </div>
              </div>

              {selfLearningState.lastTuningResult && (
                <div
                  data-testid="self-learning-last-run-card"
                  className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs font-mono"
                >
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Last Auto-Tune Run</div>
                    <div className="text-emerald-400 font-semibold">
                      {selfLearningState.lastTuningResult.tuningRunId} ·{' '}
                      {selfLearningState.lastTuningResult.newVersionTag}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      {selfLearningState.lastTuningResult.targetModelName}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Self-Learned Corpus</div>
                    <div className="text-sky-300 font-semibold">
                      {selfLearningState.lastTuningResult.harvestedShardsCount} Shards ·{' '}
                      {selfLearningState.lastTuningResult.harvestedFactsCount} Facts
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {selfLearningState.lastTuningResult.d3GraphEntitiesUsed} D3 Graph Entities
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Tuned Hyperparameters</div>
                    <div className="text-amber-300 font-semibold">
                      LoRA Rank={selfLearningState.lastTuningResult.tunedHyperparameters.loraRank}{' '}
                      (α={selfLearningState.lastTuningResult.tunedHyperparameters.loraAlpha})
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Temp={selfLearningState.lastTuningResult.tunedHyperparameters.temperature} ·
                      Top-P={selfLearningState.lastTuningResult.tunedHyperparameters.topP}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Perplexity &amp; Maturity Gain</div>
                    <div className="text-emerald-300 font-semibold">
                      PPL {selfLearningState.lastTuningResult.validationPerplexityBefore} →{' '}
                      {selfLearningState.lastTuningResult.validationPerplexityAfter}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Maturity: {selfLearningState.lastTuningResult.maturityScoreBefore}% →{' '}
                      {selfLearningState.lastTuningResult.maturityScoreAfter}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Inline Glass-Box Editor Modal / Panel when cloning or editing */}
          {editMode !== 'none' && (
            <form
              onSubmit={handleSaveEditor}
              className={`border-2 border-sky-500/70 ${surfaceClass} rounded-xl p-5 space-y-4`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-semibold ${headingText}`}>
                  {editMode === 'clone'
                    ? `Clone Glass-Box Model from ${inspectedModel.name}`
                    : `Edit & Commit New Version on ${inspectedModel.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditMode('none')}
                  className={`text-xs ${mutedText} hover:underline`}
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {editMode === 'clone' && (
                  <div>
                    <label htmlFor="clone-fork-name" className={`block text-xs ${mutedText} mb-1`}>
                      New Cloned Model Name
                    </label>
                    <input
                      id="clone-fork-name"
                      type="text"
                      value={forkName}
                      onChange={(e) => setForkName(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="version-tag-input" className={`block text-xs ${mutedText} mb-1`}>
                    Version Release Tag
                  </label>
                  <input
                    id="version-tag-input"
                    type="text"
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                  />
                </div>

                <div>
                  <label htmlFor="quant-select-input" className={`block text-xs ${mutedText} mb-1`}>
                    Quantization Format
                  </label>
                  <select
                    id="quant-select-input"
                    value={quantType}
                    onChange={(e) => setQuantType(e.target.value as QuantizationType)}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                  >
                    {(Object.keys(QUANTIZATION_SPECS) as QuantizationType[]).map((q) => (
                      <option key={q} value={q}>
                        {QUANTIZATION_SPECS[q].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="active-layers-input"
                    className={`block text-xs ${mutedText} mb-1`}
                  >
                    Active Transformer Layers (Max {currentVersion.totalLayers})
                  </label>
                  <input
                    id="active-layers-input"
                    type="number"
                    min={16}
                    max={currentVersion.totalLayers}
                    value={activeLayers}
                    onChange={(e) => setActiveLayers(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                  />
                </div>

                <div>
                  <label htmlFor="moe-experts-input" className={`block text-xs ${mutedText} mb-1`}>
                    Routed MoE Experts / Token (Max {currentVersion.moeTotalExperts})
                  </label>
                  <input
                    id="moe-experts-input"
                    type="number"
                    min={1}
                    max={currentVersion.moeTotalExperts}
                    value={moeActiveExperts}
                    onChange={(e) => setMoeActiveExperts(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                  />
                </div>

                <div>
                  <label htmlFor="context-len-input" className={`block text-xs ${mutedText} mb-1`}>
                    KV Context Window Tokens
                  </label>
                  <select
                    id="context-len-input"
                    value={contextLength}
                    onChange={(e) => setContextLength(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                  >
                    <option value={8192}>8,192 tokens</option>
                    <option value={16384}>16,384 tokens</option>
                    <option value={32768}>32,768 tokens</option>
                    <option value={65536}>65,536 tokens</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="lora-rank-input" className={`block text-xs ${mutedText} mb-1`}>
                    Profile Adapter-Rank Metadata (not loaded)
                  </label>
                  <select
                    id="lora-rank-input"
                    value={loraRank}
                    onChange={(e) => setLoraRank(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                  >
                    <option value={8}>r = 8 (Mobile Low-RAM)</option>
                    <option value={16}>r = 16 (Standard Adapter)</option>
                    <option value={32}>r = 32 (High-Capacity)</option>
                    <option value={64}>r = 64 (Full Domain Fine-Tune)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="commit-notes-input" className={`block text-xs ${mutedText} mb-1`}>
                    Version Commit Summary
                  </label>
                  <input
                    id="commit-notes-input"
                    type="text"
                    value={commitNotes}
                    onChange={(e) => setCommitNotes(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sys-directive-input" className={`block text-xs ${mutedText} mb-1`}>
                  Glass-Box System Directive & Alignment Constitution
                </label>
                <textarea
                  id="sys-directive-input"
                  rows={2}
                  value={systemDirective}
                  onChange={(e) => setSystemDirective(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditMode('none')}
                  className={`px-4 py-2 text-xs font-medium rounded-lg border ${borderClass} ${headingText}`}
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400"
                >
                  {editMode === 'clone'
                    ? 'Create Cloned Model & Mount'
                    : 'Commit New Version to Ledger'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SUB-TAB 2: GENERATED SCENARIO TEMPLATES AND LOCAL SCENARIO BUILDER */}
      {activeSubTab === 'use_cases' && (
        <div className="space-y-5">
          {/* Admin NLP-to-Use-Case Verification & Translation Builder */}
          <div className={`border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className={`text-base font-semibold ${headingText} flex items-center gap-2`}>
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>
                    Admin Use-Case Verifier, Clone-and-Edit &amp; Backend NLP Use-Case Builder
                  </span>
                </h2>
                <p className={`text-xs ${mutedText} mt-0.5`}>
                  Adding a scenario first checks deterministic built-in template variants and
                  saved local scenarios for a close match. You can{' '}
                  <strong>Clone &amp; Edit</strong> that close match or register a new use case.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowUseCaseCatalogSummary(!showUseCaseCatalogSummary)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  showUseCaseCatalogSummary
                    ? 'bg-sky-500 text-slate-950 border-sky-500'
                    : `${borderClass} ${subSurfaceClass} ${headingText} hover:border-sky-500/60`
                }`}
              >
                {showUseCaseCatalogSummary ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide Use-Case Summary</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>Use-Case Summary</span>
                  </>
                )}
              </button>
            </div>

            {showUseCaseCatalogSummary && (
              <div
                className={`p-4 rounded-xl border border-sky-500/40 bg-sky-500/5 text-xs space-y-2.5`}
              >
                <div className="font-semibold text-sky-400">
                  Scenario Catalog Summary:
                </div>
                <p className={headingText}>
                  The catalog generates {TOTAL_PRETRAINED_SCENARIOS.toLocaleString()} deterministic
                  scenario-template variants (not pretrained model data) plus {customScenarios.length}
                  saved local scenarios across 9 core domains (Science, Mathematics, Geology, History, Literature,
                  Computer Programming, Cybersecurity, Sacred &amp; Religious Studies, and
                  Astrology).
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 font-mono text-[11px]">
                  {ALL_DOMAINS.map((dom) => (
                    <div
                      key={dom}
                      className={`p-2 rounded border ${borderClass} ${subSurfaceClass}`}
                    >
                      <div className={`font-semibold ${headingText} truncate`}>{dom}</div>
                      <div className="text-sky-400">1,111+ template variants</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateUseCaseFromNlp} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <label htmlFor="admin-nlp-usecase-input" className="sr-only">
                  Describe new use case using natural language (NLP)
                </label>
                <input
                  id="admin-nlp-usecase-input"
                  data-testid="admin-nlp-usecase-input"
                  type="text"
                  value={nlpUseCaseInput}
                  onChange={(e) => {
                    setNlpUseCaseInput(e.target.value);
                    if (verificationResult) setVerificationResult(null);
                  }}
                  placeholder="Describe a new use case across Science, Math, Coding, Geology, Cybersecurity, or History..."
                  className={`flex-1 px-3.5 py-2.5 text-xs rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText} placeholder:text-slate-500 focus:outline-none focus:border-sky-500`}
                />
                <button
                  type="button"
                  data-testid="verify-usecase-btn"
                  onClick={() => handleVerifyUseCaseBeforeAdding()}
                  className={`px-3.5 py-2.5 text-xs font-semibold rounded-lg border border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>1. Verify Existing Match</span>
                </button>
                <button
                  type="submit"
                  data-testid="submit-nlp-usecase-btn"
                  disabled={isTranslatingNlp}
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {isTranslatingNlp
                      ? 'Translating NLP...'
                      : verificationResult
                      ? '2. Confirm & Register New Use Case'
                      : 'Verify & Add Use Case'}
                  </span>
                </button>
              </div>

              {/* Multi-Category Quick NLP Templates (Science, Math, Coding, Geology, Cybersecurity, History) */}
              <div className="space-y-1.5">
                <div className={`text-[11px] font-medium ${mutedText}`}>
                  Quick Multi-Category NLP Templates (Click to test verification &amp; clone
                  workflow):
                </div>
                <div
                  data-testid="multi-category-nlp-templates"
                  className="flex flex-wrap items-center gap-1.5 text-[11px]"
                >
                  {MULTI_CATEGORY_NLP_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => {
                        setNlpUseCaseInput(tpl.prompt);
                        handleVerifyUseCaseBeforeAdding(tpl.prompt);
                      }}
                      className={`px-2.5 py-1 rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText} hover:border-sky-500/60 transition-colors`}
                    >
                      + {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verification Report & Closest Match Clone-and-Edit Panel */}
              {verificationResult && (
                <div
                  data-testid="usecase-verification-panel"
                  className={`p-4 rounded-xl border space-y-3 text-xs ${
                    verificationResult.alreadyFulfilled
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-sky-500/50 bg-sky-500/10'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldCheck
                        className={`w-4 h-4 ${
                          verificationResult.alreadyFulfilled ? 'text-amber-400' : 'text-sky-400'
                        }`}
                      />
                      <span className={headingText}>
                        Use-Case Verification Result ({verificationResult.similarityScorePct}% Match
                        in {verificationResult.detectedDomain})
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-sky-300">
                      {verificationResult.alreadyFulfilled
                        ? 'Existing Use Case Fulfills Needs — Clone & Edit Recommended'
                        : 'Close Matches Found — Clone & Edit or Register New'}
                    </span>
                  </div>

                  <p className={mutedText}>{verificationResult.verificationNote}</p>

                  {verificationResult.closestMatches.length > 0 && (
                    <div className="space-y-2">
                      <div className={`font-semibold text-[11px] ${headingText}`}>
                        Closest Existing Use Cases (Click &quot;Clone &amp; Edit Match&quot; to
                        customize):
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {verificationResult.closestMatches.map((match) => (
                          <div
                            key={match.id}
                            className={`p-3 rounded-lg border ${borderClass} ${surfaceClass} space-y-2 flex flex-col justify-between`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between font-mono text-[11px]">
                                <span className="text-sky-400 font-semibold">{match.id}</span>
                                <span className={mutedText}>{match.recommendedQuant}</span>
                              </div>
                              <div className={`font-semibold ${headingText}`}>{match.title}</div>
                              <p className={`text-[11px] line-clamp-2 ${mutedText}`}>
                                {match.starterPrompt}
                              </p>
                            </div>
                            <button
                              type="button"
                              data-testid={`clone-match-${match.id}`}
                              onClick={() => handleOpenCloneUseCaseEditor(match)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Clone &amp; Edit Close Match</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {lastTranslatedScenario && (
                <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className={headingText}>
                      Verified &amp; Registered Use Case:{' '}
                      <strong className="font-mono text-emerald-300">
                        {lastTranslatedScenario.id}
                      </strong>{' '}
                      — {lastTranslatedScenario.title} ({lastTranslatedScenario.domain} ·{' '}
                      {lastTranslatedScenario.recommendedQuant})
                    </span>
                  </div>
                </div>
              )}
            </form>

            {/* Inline Clone & Edit Use-Case Customization Modal/Form */}
            {cloningUseCase && (
              <form
                onSubmit={handleSaveClonedUseCase}
                data-testid="clone-usecase-editor"
                className={`p-4 rounded-xl border border-emerald-500/50 ${subSurfaceClass} space-y-3 text-xs`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5" />
                    <span>
                      Clone &amp; Edit Existing Use Case ({cloningUseCase.id} —{' '}
                      {cloningUseCase.title})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCloningUseCase(null)}
                    className={`text-[11px] ${mutedText} hover:underline`}
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="clone-uc-title"
                      className={`block text-[11px] ${mutedText} mb-1`}
                    >
                      Cloned Use-Case Title
                    </label>
                    <input
                      id="clone-uc-title"
                      type="text"
                      value={cloneUcTitle}
                      onChange={(e) => setCloneUcTitle(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg border ${borderClass} ${surfaceClass} ${headingText}`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="clone-uc-domain"
                      className={`block text-[11px] ${mutedText} mb-1`}
                    >
                      Category / Domain
                    </label>
                    <select
                      id="clone-uc-domain"
                      value={cloneUcDomain}
                      onChange={(e) => setCloneUcDomain(e.target.value as DomainCategory)}
                      className={`w-full px-3 py-1.5 rounded-lg border ${borderClass} ${surfaceClass} ${headingText}`}
                    >
                      {ALL_DOMAINS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="clone-uc-quant"
                      className={`block text-[11px] ${mutedText} mb-1`}
                    >
                      Recommended Quantization
                    </label>
                    <select
                      id="clone-uc-quant"
                      value={cloneUcQuant}
                      onChange={(e) => setCloneUcQuant(e.target.value as QuantizationType)}
                      className={`w-full px-3 py-1.5 rounded-lg border ${borderClass} ${surfaceClass} ${headingText}`}
                    >
                      {QUANT_FILTER_OPTIONS.filter((q) => q !== 'All').map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="clone-uc-prompt"
                      className={`block text-[11px] ${mutedText} mb-1`}
                    >
                      Customized Starter Prompt
                    </label>
                    <input
                      id="clone-uc-prompt"
                      type="text"
                      value={cloneUcPrompt}
                      onChange={(e) => setCloneUcPrompt(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg border ${borderClass} ${surfaceClass} ${headingText}`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="clone-uc-cap"
                      className={`block text-[11px] ${mutedText} mb-1`}
                    >
                      Expected Capability &amp; Output Contract
                    </label>
                    <input
                      id="clone-uc-cap"
                      type="text"
                      value={cloneUcCapability}
                      onChange={(e) => setCloneUcCapability(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg border ${borderClass} ${surfaceClass} ${headingText}`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCloningUseCase(null)}
                    className={`px-3 py-1.5 rounded-lg border ${borderClass} ${mutedText}`}
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    data-testid="save-cloned-usecase-btn"
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                  >
                    Save Cloned &amp; Edited Use Case
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Searchable deterministic template and local scenario explorer */}
          <div className={`border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className={`text-sm font-semibold ${headingText} flex items-center gap-2`}>
                  <Filter className="w-4 h-4 text-sky-400" />
                  <span>
                    Scenario Templates &amp; Local Scenarios ({scenarioQueryResult.totalMatched.toLocaleString()}{' '}
                    Matched · {customScenarios.length} Saved / Cloned)
                  </span>
                </h3>
                <p className={`text-xs ${mutedText}`}>
                  Search template variants and saved scenarios by text, domain, quantization, or
                  source. Click <strong>Clone &amp; Edit</strong> on any result to
                  customize a close match.
                </p>
              </div>
            </div>

            {/* Multi-Parameter Filter Bar (Text, Category, Quantization, Source) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  aria-label="Search Use Cases by Text"
                  data-testid="usecase-search-input"
                  value={scenarioSearch}
                  onChange={(e) => {
                    setScenarioSearch(e.target.value);
                    setScenarioPage(1);
                  }}
                  placeholder="Filter by text, ID, or prompt..."
                  className={`w-full pl-8 pr-3 py-2 text-xs rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                />
              </div>

              <select
                aria-label="Filter Use Cases by Domain"
                data-testid="usecase-domain-filter"
                value={scenarioDomainFilter}
                onChange={(e) => {
                  setScenarioDomainFilter(e.target.value as DomainCategory | 'All');
                  setScenarioPage(1);
                }}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
              >
                <option value="All">Category: All 9 Domains</option>
                {ALL_DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    Category: {d}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter Use Cases by Quantization Parameter"
                data-testid="usecase-quant-filter"
                value={scenarioQuantFilter}
                onChange={(e) => {
                  setScenarioQuantFilter(e.target.value as QuantizationType | 'All');
                  setScenarioPage(1);
                }}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
              >
                {QUANT_FILTER_OPTIONS.map((q) => (
                  <option key={q} value={q}>
                    Quantization: {q}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter Use Cases by Source Parameter"
                data-testid="usecase-source-filter"
                value={scenarioSourceFilter}
                onChange={(e) => {
                  setScenarioSourceFilter(e.target.value as 'All' | 'Pretrained' | 'Custom');
                  setScenarioPage(1);
                }}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
              >
                <option value="All">Source: All (Built-in + Local)</option>
                <option value="Pretrained">Source: Built-in Catalog</option>
                <option value="Custom">Source: Custom / Cloned NLP</option>
              </select>
            </div>

            <div className="space-y-2.5">
              {scenarioQueryResult.items.map((scn) => {
                const isRowSummaryOpen = expandedUseCaseSummaryId === scn.id;
                return (
                  <div
                    key={scn.id}
                    className={`p-3.5 rounded-lg border ${
                      scn.isCustom
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : `${borderClass} ${subSurfaceClass}`
                    } space-y-2`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-semibold text-sky-400">{scn.id}</span>
                        {scn.isCustom && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-emerald-500/20 text-emerald-300">
                            [CUSTOM / CLONED USE CASE]
                          </span>
                        )}
                        <span className={`font-semibold ${headingText}`}>{scn.title}</span>
                        <span className={`text-[11px] font-mono ${mutedText}`}>
                          · {scn.domain} · {scn.recommendedQuant}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenCloneUseCaseEditor(scn)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 whitespace-nowrap`}
                        >
                          <Copy className="w-3 h-3" />
                          <span>Clone &amp; Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedUseCaseSummaryId(isRowSummaryOpen ? null : scn.id)
                          }
                          className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                            isRowSummaryOpen
                              ? 'bg-sky-500 text-slate-950 border-sky-500'
                              : `${borderClass} ${headingText} hover:border-sky-500/60`
                          }`}
                        >
                          {isRowSummaryOpen ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Hide Summary</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-sky-400" />
                              <span>Summary</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {isRowSummaryOpen && (
                      <div
                        className={`p-3 rounded-lg border border-sky-500/40 bg-sky-500/5 text-xs space-y-1.5`}
                      >
                        <div className="font-semibold text-sky-400">
                          Use-Case Capability &amp; Routing Summary:
                        </div>
                        <p className={headingText}>
                          <strong>Starter Prompt:</strong> {scn.starterPrompt}
                        </p>
                        <div className={`flex flex-wrap gap-4 font-mono text-[11px] ${mutedText}`}>
                          <span>Expected Capability: {scn.expectedCapability}</span>
                          <span>Recommended Quant: {scn.recommendedQuant}</span>
                          <span>Routed Experts: {scn.activeExperts.join(', ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs font-mono">
              <span className={mutedText}>
                Page {scenarioPage} · Showing {scenarioQueryResult.items.length} of{' '}
                {scenarioQueryResult.totalMatched.toLocaleString()} Use Cases
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={scenarioPage <= 1}
                  onClick={() => setScenarioPage((p) => Math.max(1, p - 1))}
                  className={`px-3 py-1 rounded border ${borderClass} ${headingText} disabled:opacity-40`}
                >
                  &lt;- Prev
                </button>
                <button
                  type="button"
                  onClick={() => setScenarioPage((p) => p + 1)}
                  className={`px-3 py-1 rounded border ${borderClass} ${headingText}`}
                >
                  Next -&gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MODEL PERFORMANCE MONITORING & DEPLOYMENT TOPOLOGY */}
      {activeSubTab === 'monitoring' && (
        <div className={`border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-5`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
            <div>
              <h2 className={`text-base font-semibold ${headingText} flex items-center gap-2`}>
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Profile Metadata &amp; Estimated Resource Topology</span>
              </h2>
              <p className={`text-xs ${mutedText} mt-0.5`}>
                These are illustrative profile fields and calculated resource estimates; no model is
                executing and no runtime telemetry is collected.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {DEPLOYMENT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSelectDeploymentMode(mode)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    deploymentMode === mode
                      ? 'bg-sky-500 text-slate-950 border-sky-500'
                      : `${borderClass} ${subSurfaceClass} ${headingText} hover:border-sky-500/50`
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono tabular-nums">
            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-[11px] ${mutedText}`}>Accuracy Profile Field</div>
              <div className="text-base font-semibold text-emerald-400 mt-0.5">
                {inspectedModel.accuracyBenchmarkPct}%
              </div>
              <div className={`text-[11px] ${mutedText}`}>Unverified metadata</div>
            </div>

            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-[11px] ${mutedText}`}>Throughput Estimate</div>
              <div className={`text-base font-semibold ${headingText} mt-0.5`}>
                {telemetry.estimatedTokensPerSec} tok/s
              </div>
              <div className={`text-[11px] ${mutedText}`}>
                Profile latency field: {inspectedModel.avgLatencyMs}ms
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-[11px] ${mutedText}`}>Confidence Profile Field</div>
              <div className="text-base font-semibold text-sky-400 mt-0.5">
                {inspectedModel.accuracyBenchmarkPct}%
              </div>
              <div className={`text-[11px] ${mutedText}`}>Unverified metadata</div>
            </div>

            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-[11px] ${mutedText}`}>Online Search Mode</div>
              <div className={`text-base font-semibold ${headingText} mt-0.5`}>
                {isOnlineLearning ? 'Online source lookup' : 'Offline templates'}
              </div>
              <div className={`text-[11px] ${mutedText}`}>
                No model training or weight updates
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-[11px] ${mutedText}`}>Generated Template Variants</div>
              <div className={`text-base font-semibold ${headingText} mt-0.5`}>
                {TOTAL_PRETRAINED_SCENARIOS.toLocaleString()}
              </div>
              <div className={`text-[11px] ${mutedText}`}>
                {customScenarios.length} saved local scenarios
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-[11px] ${mutedText}`}>Compatible Profiles</div>
              <div className={`text-base font-semibold ${headingText} mt-0.5`}>
                {compatibleModels.length} / {models.length} profiles
              </div>
              <div className={`text-[11px] ${mutedText}`}>
                {hiddenModelsCount > 0 ? `${hiddenModelsCount} excluded by estimates` : 'All profiles included'}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead>
                <tr className={`border-b ${borderClass} ${mutedText}`}>
                  <th className="py-2 pr-3">Model Name</th>
                  <th className="py-2 px-3">Parameter Tier</th>
                  <th className="py-2 px-3">Accuracy Metadata</th>
                  <th className="py-2 px-3">Latency Metadata</th>
                  <th className="py-2 px-3">Estimated RAM / CPU / Disk</th>
                  <th className="py-2 pl-3">Version Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {compatibleModels.map(({ model, isRecommended }) => (
                  <tr key={model.id}>
                    <td className={`py-2.5 pr-3 font-sans font-semibold ${headingText}`}>
                      {model.name}{' '}
                      {isRecommended && (
                        <span className="text-emerald-400 font-mono text-[10px]">
                          [PROFILE MATCH]
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-sky-400">{model.parameterBadge}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{model.accuracyBenchmarkPct}%</td>
                    <td className={`py-2.5 px-3 ${headingText}`}>{model.avgLatencyMs} ms</td>
                    <td className={`py-2.5 px-3 ${mutedText}`}>
                      {model.minRamGb}GB / {model.minCpuCores}C / {model.minStorageGb}GB
                    </td>
                    <td className={`py-2.5 pl-3 ${headingText}`}>
                      {model.versions.length} version records
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: VERSION-CONTROLLED UPDATE LEDGER, ATOMIC ROLLBACKS & BOTTOM VERSION SUMMARY */}
      {activeSubTab === 'versions' && (
        <div className="space-y-5">
          <div className={`border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className={`text-base font-semibold ${headingText} flex items-center gap-2`}>
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>
                    Version-Controlled Update Ledger &amp; Instant Rollbacks — {inspectedModel.name}
                  </span>
                </h2>
                <p className={`text-xs ${mutedText}`}>
                  Restore any historical checkpoint effortlessly. Rollbacks create an auditable
                  commit entry.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Select Model for Version Ledger"
                  value={inspectedModel.id}
                  onChange={(e) => setInspectedModelId(e.target.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
                >
                  {compatibleModels.map(({ model }) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.versions.length} versions)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {inspectedModel.versions.map((ver) => {
                const isHead = ver.versionId === inspectedModel.currentVersionId;
                return (
                  <div
                    key={ver.versionId}
                    className={`p-3.5 rounded-lg border transition-colors ${
                      isHead
                        ? 'border-sky-500/60 bg-sky-500/5'
                        : `${borderClass} ${subSurfaceClass}`
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                        <span className={`font-semibold ${headingText}`}>{ver.versionTag}</span>
                        <span className={mutedText}>#{ver.commitHash}</span>
                        <span className={mutedText}>· {ver.quantType}</span>
                        {isHead && (
                          <span className="text-emerald-400 font-semibold">· CURRENT HEAD</span>
                        )}
                      </div>

                      {!isHead && (
                        <button
                          type="button"
                          disabled={!canRollback}
                          onClick={() => onRollbackVersion(inspectedModel.id, ver.versionId)}
                          className={`px-3 py-1 text-xs font-semibold rounded border ${borderClass} ${headingText} hover:border-amber-500/60 hover:text-amber-300 disabled:opacity-40 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0`}
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Rollback to {ver.versionTag}</span>
                        </button>
                      )}
                    </div>

                    <p className={`text-xs ${headingText} mt-1.5`}>{ver.notes}</p>

                    <div
                      className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums ${mutedText}`}
                    >
                      <span>Author: {ver.author}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ver.timestamp}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Layers: {ver.activeLayers}/{ver.totalLayers}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Ctx: {ver.contextLength.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM VERSION SUMMARY & COVERAGE LEDGER */}
          <div
            data-testid="version-control-bottom-summary"
            className={`border border-sky-500/40 bg-sky-500/5 rounded-xl p-5 space-y-3 text-xs`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className={`text-sm font-bold ${headingText} flex items-center gap-2`}>
                <GitCommit className="w-4 h-4 text-sky-400" />
                <span>
                  Version Control Summary &amp; What Was Covered ({currentVersion.versionTag} · #
                  {currentVersion.commitHash})
                </span>
              </h3>
              <span className="font-mono text-[11px] text-emerald-400">
                Active Release · {inspectedModel.versions.length} Total Checkpoints Audited
              </span>
            </div>

            <p className={`leading-relaxed ${headingText}`}>
              <strong>Executive Release Summary:</strong> Version{' '}
              <code className="font-mono text-sky-400">{currentVersion.versionTag}</code> of{' '}
              <strong>{inspectedModel.name}</strong> consolidates{' '}
              <strong>{currentVersion.quantType}</strong> weight quantization across{' '}
              <strong>
                {currentVersion.activeLayers}/{currentVersion.totalLayers} transformer layers
              </strong>{' '}
              and{' '}
              <strong>
                {currentVersion.moeActiveExperts}/{currentVersion.moeTotalExperts} sparse MoE
                experts
              </strong>{' '}
              with a <strong>{currentVersion.contextLength.toLocaleString()}-token</strong> KV
              context window and <strong>profile adapter-rank metadata r={currentVersion.loraRank}</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className={`p-3 rounded-lg border ${borderClass} ${surfaceClass} space-y-1`}>
                <div className="font-semibold text-sky-400">
                  1. Core Capabilities Covered in {currentVersion.versionTag}
                </div>
                <p className={mutedText}>
                  Covers Ask &amp; Multi-Stage Symbolic Math, Pre-Verified Polyglot Coding with Live
                  Sandbox Preview, Dense Multi-Section Deep Research with valid HTTPS citations, and
                  Prompt-Driven 8K Cinema Studio (Lifelike Humans &amp; Studio Ghibli /
                  &quot;Geebly&quot; art).
                </p>
              </div>
              <div className={`p-3 rounded-lg border ${borderClass} ${surfaceClass} space-y-1`}>
                <div className="font-semibold text-emerald-400">
                  2. Scenario Catalog Coverage
                </div>
                <p className={mutedText}>
                  Includes built-in scenario entries plus {customScenarios.length} custom or cloned
                  local scenarios. Adding a scenario does not change model weights.
                </p>
              </div>
              <div className={`p-3 rounded-lg border ${borderClass} ${surfaceClass} space-y-1`}>
                <div className="font-semibold text-amber-400">
                  3. Governance, XAI &amp; Rollback Safety
                </div>
                <p className={mutedText}>
                  Enforces on-demand Explainable AI defaulted to &quot;Explain Like I&apos;m 12 Years
                  Old&quot;, thermal-aware frame pacing, and atomic 1-click rollback across all{' '}
                  {inspectedModel.versions.length} historical checkpoints.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
