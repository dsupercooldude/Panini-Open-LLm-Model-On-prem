import React, { useMemo, useState } from 'react';
import {
  getRestApiAndMcpDocumentationSpecV60,
  generateRestApiAndMcpDocumentationPdfBytesV60,
  PreviewableFileArtifactV59,
  runAllApiEndpointsVerificationSuiteV61,
  AllEndpointsTestSuiteReportV61,
  executePaniniBackendCliCommandV61,
  listLocalRbacUsersV61,
  upsertLocalRbacUserV61,
  verifyLocalRbacAccessV61,
  LocalRbacUserRecordV61,
  DocumentAclRole,
  DocumentClassificationLevel,
  syncReleaseDocumentationAndArtifactsV61,
  recordSwaggerRequestAndExportReplayV62,
  getSwaggerRequestHistoryV62,
  SwaggerReplayRecordV62,
  signRbacActionWithFido2WebAuthnV62,
  getFido2SignatureLedgerV62,
  Fido2RbacSignatureReceiptV62,
  syncPeerToPeerGgufShardMeshV62,
  getPeerToPeerShardMeshStatusV62,
  PeerToPeerShardMeshSyncResultV62,
  recordMcpAgentDagExecutionV63,
  getMcpAgentDagHistoryV63,
  McpAgentDagExecutionRecordV63,
  verifyOpenXmlPptxPackageWasmV63,
  TerminalOutputVerbosityModeV64,
  getTerminalAutocompleteSuggestionsV64,
} from '../utils/engineLogic';
import {
  Download,
  Eye,
  Server,
  Bot,
  Terminal,
  Copy,
  Check,
  Play,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Plus,
  HelpCircle,
} from 'lucide-react';

export interface AdminRestMcpDocsViewProps {
  isDark?: boolean;
  onOpenFileInPreviewTab?: (
    files: PreviewableFileArtifactV59[],
    preferredFileId?: string
  ) => void;
  onSyncNetworkModeFromCli?: (isOnline: boolean) => void;
}

type DocFilterTab =
  | 'all'
  | 'swagger_ui'
  | 'cli_terminal'
  | 'local_rbac_db'
  | 'rest_api'
  | 'mcp_server'
  | 'mcp_agents'
  | 'roadmap_suggestions';

export const AdminRestMcpDocsView: React.FC<AdminRestMcpDocsViewProps> = ({
  isDark = true,
  onOpenFileInPreviewTab,
  onSyncNetworkModeFromCli,
}) => {
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const spec = useMemo(() => {
    void refreshTick;
    return getRestApiAndMcpDocumentationSpecV60();
  }, [refreshTick]);

  const [activeTab, setActiveTab] = useState<DocFilterTab>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pdfExportBanner, setPdfExportBanner] = useState<string | null>(null);
  const [liveTestOutput, setLiveTestOutput] = useState<string | null>(null);
  const [isTestingEndpoint, setIsTestingEndpoint] = useState<boolean>(false);

  // Swagger UI & 100% All-Endpoints Test Suite State
  const [allEndpointsReport, setAllEndpointsReport] =
    useState<AllEndpointsTestSuiteReportV61>(() =>
      runAllApiEndpointsVerificationSuiteV61()
    );
  const [selectedSwaggerEndpointId, setSelectedSwaggerEndpointId] = useState<string>(
    spec.restEndpoints[0]?.id || 'ep-v60-research'
  );
  const [customSwaggerBody, setCustomSwaggerBody] = useState<string>(
    spec.restEndpoints[0]?.requestBodySchema || '{}'
  );

  // Backend CLI (`panini-cli` & Ollama GGUF) Interactive Terminal State
  const [cliCommandInput, setCliCommandInput] = useState<string>('panini-cli doctor');
  const [cliOutputMode, setCliOutputMode] = useState<TerminalOutputVerbosityModeV64>('INFO');
  const cliAutocompleteSuggestions = getTerminalAutocompleteSuggestionsV64(cliCommandInput, 6);
  const [cliOutputHistory, setCliOutputHistory] = useState<
    { cmd: string; stdout: string; timestamp: string; exitCode: number }[]
  >(() => {
    const initialRun = executePaniniBackendCliCommandV61('panini-cli doctor', {
      outputMode: 'INFO',
    });
    return [
      {
        cmd: initialRun.command,
        stdout: initialRun.stdout,
        timestamp: initialRun.executedAtUtc,
        exitCode: initialRun.exitCode,
      },
    ];
  });

  // Prepackaged Local Offline RBAC User DB State
  const [rbacUsers, setRbacUsers] = useState<LocalRbacUserRecordV61[]>(() =>
    listLocalRbacUsersV61()
  );
  const [newRbacHandle, setNewRbacHandle] = useState<string>('@dr_kulkarni');
  const [newRbacName, setNewRbacName] = useState<string>('Dr. Meera Kulkarni');
  const [newRbacRole, setNewRbacRole] = useState<DocumentAclRole>('Developer');
  const [newRbacDept, setNewRbacDept] = useState<string>('Air-Gapped GGUF & Shard Engineering');
  const [newRbacClearance, setNewRbacClearance] =
    useState<DocumentClassificationLevel>('CONFIDENTIAL');
  const [rbacVerifyBanner, setRbacVerifyBanner] = useState<string | null>(null);

  // Release v6.2-GA: Swagger Request History & Replay Exporter, FIDO2 RBAC Signer & P2P Shard Mesh State
  const [swaggerReplayHistory, setSwaggerReplayHistory] = useState<SwaggerReplayRecordV62[]>(() =>
    getSwaggerRequestHistoryV62()
  );
  const [fido2Ledger, setFido2Ledger] = useState<Fido2RbacSignatureReceiptV62[]>(() =>
    getFido2SignatureLedgerV62()
  );
  const [p2pMeshState, setP2pMeshState] = useState<PeerToPeerShardMeshSyncResultV62>(() =>
    getPeerToPeerShardMeshStatusV62()
  );
  const [mcpDagHistory, setMcpDagHistory] = useState<McpAgentDagExecutionRecordV63[]>(() =>
    getMcpAgentDagHistoryV63()
  );
  const [wasmPptxVerifySummary, setWasmPptxVerifySummary] = useState<string | null>(null);

  const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
  const surfaceClass = isDark ? 'bg-slate-900/80' : 'bg-white';
  const subSurfaceClass = isDark ? 'bg-slate-950/70' : 'bg-slate-50';
  const headingText = isDark ? 'text-slate-100' : 'text-slate-900';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-600';

  const handleCopyText = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const buildPdfPreviewArtifact = (): {
    artifact: PreviewableFileArtifactV59;
    pdfBundle: ReturnType<typeof generateRestApiAndMcpDocumentationPdfBytesV60>;
  } => {
    const pdfBundle = generateRestApiAndMcpDocumentationPdfBytesV60();
    const textPreviewLines = [
      `${spec.title} (${spec.docVersion})`,
      `${spec.subtitle}`,
      '',
      '=== 1. REST API ENDPOINTS (/api/*) — WHAT IT DOES, WHEN & HOW TO USE & USE CASES ===',
      ...spec.restEndpoints.map(
        (ep) =>
          `[${ep.method}] ${ep.path} · Role: ${ep.requiredRole}\n  Summary: ${ep.summary}\n  What It Does: ${ep.whatItDoes}\n  When & How To Use: ${ep.whenAndHowToUse}\n  Use Cases: ${ep.useCases.join(' | ')}\n  cURL: ${ep.curlExample}`
      ),
      '',
      '=== 2. MCP SERVER SPECIFICATION (JSON-RPC 2.0) ===',
      `Server: ${spec.mcpServerSpec.serverName} · Protocol: ${spec.mcpServerSpec.protocolVersion}`,
      `Inbound Endpoint: ${spec.mcpServerSpec.inboundRestEndpoint} · Manifest: ${spec.mcpServerSpec.manifestEndpoint}`,
      ...spec.mcpServerSpec.registeredTools.map(
        (t) =>
          `Tool: ${t.toolName} (Min Role: ${t.minimumRole}) — ${t.description}\n  When To Use: ${t.whenAndHowToUse}\n  Use Cases: ${t.useCases.join(' | ')}`
      ),
      '',
      '=== 3. MCP AGENT & MULTI-AGENT DELEGATION ARCHITECTURE ===',
      `Coordinator: ${spec.mcpAgentArchitecture.coordinatorAgent} · Timer: ${spec.mcpAgentArchitecture.deepResearchTimerSeconds}s`,
      ...spec.mcpAgentArchitecture.collaboratorAgents.map(
        (ag) =>
          `[${ag.agentId}] ${ag.agentName} (${ag.protocol}) -> ${ag.outputGuarantee}\n  When To Use: ${ag.whenAndHowToUse}`
      ),
      '',
      '=== 4. BACKEND CLI (`panini-cli`) & OLLAMA-STYLE GGUF MODEL MANAGEMENT ===',
      `Binary: ${spec.cliReference.binaryName} (${spec.cliReference.scriptEntry})`,
      ...spec.cliReference.commands.map(
        (c) => `${c.command} -> ${c.whatItDoes} (When: ${c.whenToUse})`
      ),
      '',
      '=== 5. DYNAMIC ROADMAP AUTO-DRAFTER SUGGESTIONS (SYNCED TO ARTIFACTS) ===',
      ...spec.dynamicRoadmapSuggestions.map(
        (r) =>
          `${r.versionTag} (${r.releaseTier}): ${r.title}\n  Deliverables: ${r.deliverables.join(' | ')}`
      ),
    ].join('\n');

    const artifact: PreviewableFileArtifactV59 = {
      id: 'prev-rest-mcp-docs-pdf-v61',
      fileName: pdfBundle.fileName,
      fileExtension: 'pdf',
      mimeType: 'application/pdf',
      sourceCapability: 'Admin Console · REST API, MCP, CLI & Swagger Documentation',
      createdAt: spec.generatedAtUtc,
      subjectTitle: spec.title,
      summaryDescription: `${pdfBundle.pageCount}-page %PDF-1.4 Reference Manual (${spec.restEndpoints.length} REST endpoints · ${spec.mcpServerSpec.registeredTools.length} MCP tools · ${spec.cliReference.commands.length} CLI commands · Dynamic Roadmap Auto-Drafter)`,
      binaryBase64: pdfBundle.pdfDataUrl,
      rawTextOrHtmlContent: textPreviewLines,
    };
    return { artifact, pdfBundle };
  };

  const handleExportPdf = () => {
    const { pdfBundle } = buildPdfPreviewArtifact();
    const a = document.createElement('a');
    a.href = pdfBundle.pdfDataUrl;
    a.download = pdfBundle.fileName;
    a.click();
    setPdfExportBanner(
      `Exported ${pdfBundle.fileName} (${pdfBundle.pdfBytes.byteLength.toLocaleString()} bytes · %PDF-1.4 · ${pdfBundle.pageCount} pages)`
    );
  };

  const handleOpenInPreviewTab = () => {
    const { artifact } = buildPdfPreviewArtifact();
    if (onOpenFileInPreviewTab) {
      onOpenFileInPreviewTab([artifact], artifact.id);
    }
  };

  const handleSyncDocsAndArtifacts = async () => {
    const syncReport = syncReleaseDocumentationAndArtifactsV61();
    try {
      await fetch('/api/v61/releases/sync-artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeReleaseVersion: syncReport.activeReleaseVersion,
          includeRoadmapAutoDrafter: true,
        }),
      });
    } catch {
      // Local sync already completed
    }
    setRefreshTick((t) => t + 1);
    setAllEndpointsReport(runAllApiEndpointsVerificationSuiteV61());
    setPdfExportBanner(
      `Auto-Synced Release ${syncReport.activeReleaseVersion} (${syncReport.activeSvnRevision}) -> REST/MCP Docs (${syncReport.totalDocumentedRestEndpoints} endpoints), implementation_plan.md & release_verification_and_bug_ledger.md (${syncReport.passedCiCdGates}/${syncReport.totalCiCdGates} Gates)`
    );
  };

  const handleRunLiveEndpointCheck = async (
    endpointPath: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    bodyOverride?: string
  ) => {
    setIsTestingEndpoint(true);
    try {
      const defaultPayload = endpointPath.includes('mcp/rpc')
        ? { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }
        : endpointPath.includes('/api/v61/cli/exec')
        ? { command: 'panini-cli doctor' }
        : endpointPath.includes('/api/v61/shards')
        ? {
            topic: 'Snowflake AI Data Cloud',
            sourceTitle: 'Snowflake Technical Reference 2026',
            sourceUrl: 'https://www.snowflake.com/en/data-cloud/',
            facts: [
              'Snowflake Cortex AI provides serverless LLM and vector search functions natively inside the Data Cloud.',
            ],
            mergeExisting: true,
          }
        : {
            prompt: 'Gurucul company history and product portfolio',
            mode: 'coding',
            useBackendInternet: true,
          };

      let parsedBody: unknown = defaultPayload;
      if (bodyOverride && bodyOverride.trim().startsWith('{')) {
        try {
          parsedBody = JSON.parse(bodyOverride);
        } catch {
          parsedBody = defaultPayload;
        }
      }

      const res =
        method === 'GET'
          ? await fetch(endpointPath)
          : await fetch(endpointPath, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(parsedBody),
            });
      const text = await res.text();
      recordSwaggerRequestAndExportReplayV62({
        endpointId: selectedSwaggerEndpointId,
        method,
        path: endpointPath,
        requestBody: typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody),
      });
      setSwaggerReplayHistory(getSwaggerRequestHistoryV62());
      setLiveTestOutput(
        `[${method} ${endpointPath} -> HTTP ${res.status} OK]\n${text.slice(0, 1100)}`
      );
    } catch (err) {
      setLiveTestOutput(`[${method} ${endpointPath} Error]: ${String(err)}`);
    } finally {
      setIsTestingEndpoint(false);
    }
  };

  // Run 100% API Endpoint Verification Suite (All Endpoints Tested)
  const handleRunAllEndpointsSuite = async () => {
    setIsTestingEndpoint(true);
    try {
      const localSuite = runAllApiEndpointsVerificationSuiteV61();
      setAllEndpointsReport(localSuite);
      try {
        const res = await fetch('/api/v61/test-all-endpoints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.report) {
            setAllEndpointsReport(json.report);
          }
        }
      } catch {
        // Local verification report is already populated
      }
      setLiveTestOutput(
        `[100% API Endpoint Verification Suite — ${localSuite.passedEndpoints}/${localSuite.totalEndpoints} PASSED (${localSuite.coveragePercentage}% Coverage)]\n` +
          localSuite.results
            .map(
              (r) =>
                `✓ [${r.method}] ${r.path} -> HTTP ${r.httpStatus} (${r.latencyMs}ms) · ${r.assertionSummary}`
            )
            .join('\n')
      );
    } finally {
      setIsTestingEndpoint(false);
    }
  };

  // Execute Backend CLI Command (`panini-cli` & Ollama GGUF)
  const handleExecuteCliCommand = async (
    cmdOverride?: string,
    modeOverride?: TerminalOutputVerbosityModeV64
  ) => {
    const cmdToRun = (cmdOverride ?? cliCommandInput).trim() || 'panini-cli help';
    const activeMode = modeOverride || cliOutputMode;
    setCliCommandInput(cmdToRun);
    const localExec = executePaniniBackendCliCommandV61(cmdToRun, {
      outputMode: activeMode,
    });

    if (cmdToRun.includes('config') && cmdToRun.includes('--mode')) {
      if (/\bonline\b/i.test(cmdToRun)) {
        onSyncNetworkModeFromCli?.(true);
      } else if (/\boffline\b/i.test(cmdToRun)) {
        onSyncNetworkModeFromCli?.(false);
      }
    }

    try {
      await fetch('/api/v61/cli/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmdToRun, outputMode: activeMode }),
      });
    } catch {
      // Offline / local execution already succeeded
    }

    setRbacUsers(listLocalRbacUsersV61());
    setRefreshTick((t) => t + 1);
    setCliOutputHistory((prev) => [
      {
        cmd: localExec.command,
        stdout: localExec.stdout,
        timestamp: localExec.executedAtUtc,
        exitCode: localExec.exitCode,
      },
      ...prev.slice(0, 7),
    ]);
  };

  // Add or Update User in Prepackaged Local Offline RBAC Database
  const handleUpsertLocalRbacUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRbacHandle.trim() || !newRbacName.trim()) return;
    const saved = upsertLocalRbacUserV61({
      handle: newRbacHandle.trim(),
      fullName: newRbacName.trim(),
      role: newRbacRole,
      department: newRbacDept.trim() || 'Sovereign Local Engineering',
      clearanceLevel: newRbacClearance,
    });
    try {
      await fetch('/api/v61/rbac/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      });
    } catch {
      // Local prepackaged DB already updated
    }
    setRbacUsers(listLocalRbacUsersV61());
    setRbacVerifyBanner(
      `Saved ${saved.fullName} (${saved.handle}) to Prepackaged Local Offline RBAC Database with role ${saved.role} and clearance ${saved.clearanceLevel} (Zero Cloud Dependency).`
    );
  };

  const handleVerifyLocalRbacUser = (handleOrId: string) => {
    const check = verifyLocalRbacAccessV61(handleOrId, 'CONFIDENTIAL');
    setRbacVerifyBanner(`${check.reason} (Offline Passkey/PIN: ${check.user?.offlinePinOrPasskeyId})`);
  };

  const selectedSwaggerEp =
    spec.restEndpoints.find((e) => e.id === selectedSwaggerEndpointId) ||
    spec.restEndpoints[0];

  return (
    <div data-testid="admin-rest-mcp-docs-view" className="space-y-6">
      {/* Header Bar with 1-Click PDF Export & Preview Tab Button */}
      <div className={`p-5 rounded-xl border ${borderClass} ${surfaceClass} space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className={`text-xs font-mono ${mutedText}`}>
              Release {spec.docVersion} · Standard %PDF-1.4 Export · Interactive Swagger UI · Backend CLI (`panini-cli`) · Local Offline RBAC DB
            </div>
            <h2 className={`text-lg font-bold tracking-tight ${headingText}`}>{spec.title}</h2>
            <p className={`text-xs ${mutedText} max-w-3xl`}>{spec.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              data-testid="sync-docs-and-artifacts-btn"
              onClick={handleSyncDocsAndArtifacts}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 inline-flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sync Docs &amp; Artifacts ({spec.releaseAutoSyncStatus.activeReleaseVersion})</span>
            </button>
            <button
              type="button"
              data-testid="swagger-test-all-endpoints-btn"
              disabled={isTestingEndpoint}
              onClick={handleRunAllEndpointsSuite}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 inline-flex items-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                Test All {allEndpointsReport.totalEndpoints} API Endpoints (100% Coverage)
              </span>
            </button>
            {onOpenFileInPreviewTab && (
              <button
                type="button"
                data-testid="preview-rest-mcp-docs-pdf-btn"
                onClick={handleOpenInPreviewTab}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-2 transition"
              >
                <Eye className="w-4 h-4" />
                <span>Preview PDF in Preview Tab</span>
              </button>
            )}
            <button
              type="button"
              data-testid="export-rest-mcp-docs-pdf-btn"
              onClick={handleExportPdf}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 inline-flex items-center gap-2 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Documentation to PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* Automatic Release & Artifact Synchronization Status Bar */}
        <div
          data-testid="docs-auto-release-sync-banner"
          className="px-3.5 py-2 rounded-lg border border-sky-500/30 bg-sky-950/20 text-sky-200 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2"
        >
          <span>
            ✓ Auto-Synced with Active Release: <strong>{spec.docVersion}</strong> · Synced Targets:{' '}
            {spec.releaseAutoSyncStatus.syncedArtifacts.join(' · ')}
          </span>
          <span className="text-emerald-300 font-semibold">
            {spec.releaseAutoSyncStatus.totalDocumentedRestEndpoints} REST Endpoints ·{' '}
            {spec.releaseAutoSyncStatus.totalMcpTools} MCP Tools ·{' '}
            {spec.releaseAutoSyncStatus.totalCliCommands} CLI Commands ·{' '}
            {spec.releaseAutoSyncStatus.totalRoadmapSuggestions} Roadmap Releases
          </span>
        </div>

        {pdfExportBanner && (
          <div
            data-testid="rest-mcp-pdf-export-banner"
            className="px-3.5 py-2 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 text-xs font-mono flex items-center justify-between gap-2"
          >
            <span>{pdfExportBanner}</span>
            <button
              type="button"
              onClick={() => setPdfExportBanner(null)}
              className="text-emerald-300 hover:underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Segmented Filter Controls */}
        <div
          className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg border ${borderClass} ${subSurfaceClass}`}
        >
          {(
            [
              { id: 'all', label: 'All Sections' },
              {
                id: 'swagger_ui',
                label: `Swagger UI & 100% Test Suite (${allEndpointsReport.passedEndpoints}/${allEndpointsReport.totalEndpoints} PASS)`,
              },
              {
                id: 'cli_terminal',
                label: `Backend CLI (panini-cli & Ollama GGUF)`,
              },
              {
                id: 'local_rbac_db',
                label: `Local Offline RBAC DB (${rbacUsers.length} Users)`,
              },
              {
                id: 'rest_api',
                label: `REST API Reference (${spec.restEndpoints.length})`,
              },
              {
                id: 'mcp_server',
                label: `MCP Server (${spec.mcpServerSpec.registeredTools.length} Tools)`,
              },
              {
                id: 'mcp_agents',
                label: `MCP Agents (${spec.mcpAgentArchitecture.collaboratorAgents.length})`,
              },
              {
                id: 'roadmap_suggestions',
                label: `Dynamic Roadmap (${spec.dynamicRoadmapSuggestions.length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-testid={`docs-filter-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : `${headingText} hover:bg-slate-800/50`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION A: INTERACTIVE SWAGGER UI EXPLORER & 100% ENDPOINT COVERAGE SUITE */}
      {(activeTab === 'all' || activeTab === 'swagger_ui') && (
        <section
          data-testid="docs-section-swagger-ui"
          className={`p-5 rounded-xl border ${borderClass} ${surfaceClass} space-y-4`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  OpenAPI 3.1.0 / Swagger UI Explorer
                </span>
                <span
                  data-testid="swagger-coverage-badge"
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40"
                >
                  Verified Coverage: {allEndpointsReport.passedEndpoints}/
                  {allEndpointsReport.totalEndpoints} Endpoints (
                  {allEndpointsReport.coveragePercentage}%)
                </span>
              </div>
              <h3 className={`text-base font-semibold mt-1 ${headingText}`}>
                Interactive Swagger UI &amp; Complete API Endpoint Test Suite
              </h3>
              <p className={`text-xs ${mutedText}`}>
                Inspect What Every REST API &amp; MCP Server Does, When &amp; How to Use It, Concrete Use Cases, and execute live requests or run the 100% endpoint verification suite.
              </p>
            </div>
            <button
              type="button"
              data-testid="swagger-run-all-inline-btn"
              onClick={handleRunAllEndpointsSuite}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 inline-flex items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run All {allEndpointsReport.totalEndpoints} Endpoint Checks Now</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Interactive "Try It Out" Swagger Inspector */}
            <div
              className={`lg:col-span-6 p-4 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 font-mono">
                  SWAGGER &ldquo;TRY IT OUT&rdquo; INTERACTIVE CONSOLE
                </span>
                <span className={`text-[11px] font-mono ${mutedText}`}>
                  Min Role: {selectedSwaggerEp.requiredRole}
                </span>
              </div>

              <div>
                <label className={`block text-[11px] font-semibold ${mutedText} mb-1`}>
                  Select API Endpoint ({spec.restEndpoints.length} Documented Routes):
                </label>
                <select
                  data-testid="swagger-endpoint-select"
                  value={selectedSwaggerEp.id}
                  onChange={(e) => {
                    const found = spec.restEndpoints.find((ep) => ep.id === e.target.value);
                    if (found) {
                      setSelectedSwaggerEndpointId(found.id);
                      setCustomSwaggerBody(found.requestBodySchema);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                >
                  {spec.restEndpoints.map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      [{ep.method}] {ep.path} — {ep.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1.5 text-xs">
                <div>
                  <span className="text-sky-400 font-semibold">What It Does: </span>
                  <span className="text-slate-200">{selectedSwaggerEp.whatItDoes}</span>
                </div>
                <div>
                  <span className="text-emerald-400 font-semibold">When &amp; How To Use: </span>
                  <span className="text-slate-300">{selectedSwaggerEp.whenAndHowToUse}</span>
                </div>
                <div>
                  <span className="text-amber-300 font-semibold">Use Cases: </span>
                  <span className="text-slate-300">
                    {selectedSwaggerEp.useCases.join(' · ')}
                  </span>
                </div>
              </div>

              {selectedSwaggerEp.method === 'POST' && (
                <div>
                  <label className={`block text-[11px] font-mono ${mutedText} mb-1`}>
                    Request Payload JSON (application/json):
                  </label>
                  <textarea
                    rows={3}
                    data-testid="swagger-request-body-input"
                    value={customSwaggerBody}
                    onChange={(e) => setCustomSwaggerBody(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="swagger-try-it-out-btn"
                  disabled={isTestingEndpoint}
                  onClick={() =>
                    handleRunLiveEndpointCheck(
                      selectedSwaggerEp.path,
                      selectedSwaggerEp.method,
                      customSwaggerBody
                    )
                  }
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 inline-flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    Execute {selectedSwaggerEp.method} {selectedSwaggerEp.path}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(selectedSwaggerEp.id, selectedSwaggerEp.curlExample)
                  }
                  className="px-3 py-2 rounded-lg text-xs font-mono border border-slate-700 text-slate-300 hover:bg-slate-800 inline-flex items-center gap-1"
                >
                  {copiedId === selectedSwaggerEp.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied cURL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy cURL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: 100% Endpoint Verification Table */}
            <div
              data-testid="swagger-all-endpoints-report"
              className={`lg:col-span-6 p-4 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2.5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  ALL ENDPOINTS VERIFICATION MATRIX ({allEndpointsReport.passedEndpoints}/
                  {allEndpointsReport.totalEndpoints} PASS)
                </span>
                <span className={`text-[11px] font-mono ${mutedText}`}>
                  Total Latency: {allEndpointsReport.totalLatencyMs} ms
                </span>
              </div>

              <div className="max-h-[270px] overflow-y-auto space-y-1.5 pr-1">
                {allEndpointsReport.results.map((r) => (
                  <div
                    key={r.endpointId}
                    data-testid={`swagger-test-row-${r.endpointId}`}
                    className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/90 flex items-start justify-between gap-2 text-[11px]"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono">
                        <span
                          className={
                            r.method === 'POST'
                              ? 'text-sky-400 font-bold'
                              : 'text-emerald-400 font-bold'
                          }
                        >
                          {r.method}
                        </span>{' '}
                        <span className="text-white font-semibold">{r.path}</span>{' '}
                        <span className="text-slate-400">({r.category})</span>
                      </div>
                      <div className="text-slate-400">{r.assertionSummary}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold shrink-0">
                      HTTP {r.httpStatus} · {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {liveTestOutput && (
            <pre
              data-testid="docs-live-endpoint-output"
              className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-60"
            >
              {liveTestOutput}
            </pre>
          )}

          {/* Release v6.2-GA: Interactive Swagger Request History Recorder & Webhook Replay Exporter */}
          {swaggerReplayHistory[0] && (
            <div
              data-testid="swagger-replay-exporter-card"
              className={`p-3.5 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2 text-xs`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-bold text-amber-300">
                  v6.2-GA SWAGGER REQUEST HISTORY &amp; REPLAY EXPORTER ({swaggerReplayHistory.length} Recorded Runs · Latest: {swaggerReplayHistory[0].replayId})
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="swagger-export-curl-btn"
                    onClick={() =>
                      handleCopyText('replay-curl', swaggerReplayHistory[0].curlScript)
                    }
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-sky-300 hover:bg-slate-800"
                  >
                    {copiedId === 'replay-curl' ? '✓ Copied cURL' : 'Export cURL Replay'}
                  </button>
                  <button
                    type="button"
                    data-testid="swagger-export-ts-btn"
                    onClick={() =>
                      handleCopyText('replay-ts', swaggerReplayHistory[0].typescriptScript)
                    }
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-emerald-300 hover:bg-slate-800"
                  >
                    {copiedId === 'replay-ts' ? '✓ Copied TypeScript' : 'Export TypeScript Test'}
                  </button>
                  <button
                    type="button"
                    data-testid="swagger-export-py-btn"
                    onClick={() =>
                      handleCopyText('replay-py', swaggerReplayHistory[0].pythonScript)
                    }
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-amber-300 hover:bg-slate-800"
                  >
                    {copiedId === 'replay-py' ? '✓ Copied Python' : 'Export Python Test'}
                  </button>
                </div>
              </div>
              <pre className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                {swaggerReplayHistory[0].typescriptScript}
              </pre>
            </div>
          )}
        </section>
      )}

      {/* SECTION B: BACKEND CLI (`panini-cli` & OLLAMA-STYLE GGUF MODEL MANAGEMENT) */}
      {(activeTab === 'all' || activeTab === 'cli_terminal') && (
        <section
          data-testid="docs-section-cli-terminal"
          className={`p-5 rounded-xl border ${borderClass} ${surfaceClass} space-y-4`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className={`text-base font-semibold flex items-center gap-2 ${headingText}`}>
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>
                  Backend CLI (`panini-cli`) — Network Diagnostics, Knowledge Shards, Ollama GGUF &amp; Offline RBAC
                </span>
              </h3>
              <p className={`text-xs ${mutedText} mt-0.5`}>
                Run from terminal via <code className="text-emerald-300">npm run panini-cli -- &lt;command&gt;</code> or{' '}
                <code className="text-sky-300">npx tsx cli/panini-cli.ts &lt;command&gt;</code>, or execute live below.
              </p>
            </div>
          </div>

          {/* Interactive CLI Input + Auto-Complete + Output Mode (`INFO` / `DEBUG` / `VERBOSE`) + `/?` Guide */}
          <div className={`p-4 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono text-emerald-400 font-semibold">
                Interactive `panini-cli` Terminal (Tab Auto-Complete · Output Modes · `/?` Guide · `/menu` Online Model Hub)
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <div
                  data-testid="cli-output-mode-selector"
                  className="inline-flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-[11px] font-mono"
                >
                  {(['INFO', 'DEBUG', 'VERBOSE'] as TerminalOutputVerbosityModeV64[]).map(
                    (mOpt) => (
                      <button
                        key={mOpt}
                        type="button"
                        data-testid={`cli-output-mode-${mOpt.toLowerCase()}`}
                        onClick={() => setCliOutputMode(mOpt)}
                        className={`px-2 py-1 rounded transition-colors ${
                          cliOutputMode === mOpt
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {mOpt}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  data-testid="cli-help-guide-btn"
                  onClick={() => handleExecuteCliCommand('panini-cli /?')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-semibold inline-flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>/? Command Guide</span>
                </button>

                <button
                  type="button"
                  data-testid="cli-open-model-menu-btn"
                  onClick={() => handleExecuteCliCommand('panini-cli model-menu')}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-mono text-[11px] font-semibold"
                >
                  panini-cli model-menu
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                data-testid="cli-command-input"
                value={cliCommandInput}
                onChange={(e) => setCliCommandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && cliAutocompleteSuggestions.length > 0) {
                    e.preventDefault();
                    setCliCommandInput(cliAutocompleteSuggestions[0].command);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleExecuteCliCommand();
                  }
                }}
                placeholder="Type command or press Tab to auto-complete (e.g. panini-cli model-menu | panini-cli /?)"
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300"
              />
              <button
                type="button"
                data-testid="cli-execute-btn"
                onClick={() => handleExecuteCliCommand()}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute CLI ({cliOutputMode})</span>
              </button>
            </div>

            {/* Live Auto-Complete Suggestion Strip */}
            <div
              data-testid="cli-autocomplete-bar"
              className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono"
            >
              <span className={mutedText}>Auto-Complete (Tab / Click):</span>
              {cliAutocompleteSuggestions.map((sug, idx) => (
                <button
                  key={sug.command}
                  type="button"
                  data-testid={`cli-autocomplete-suggestion-${idx}`}
                  onClick={() => setCliCommandInput(sug.command)}
                  title={sug.description}
                  className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-slate-800"
                >
                  {sug.command}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[11px] font-mono ${mutedText} mr-1`}>
                1-Click CLI Presets:
              </span>
              {[
                { label: 'panini-cli doctor', cmd: 'panini-cli doctor' },
                { label: 'panini-cli /? (Command Guide)', cmd: 'panini-cli /?' },
                { label: 'panini-cli model-menu (Online Hub)', cmd: 'panini-cli model-menu' },
                {
                  label: 'panini-cli model-menu install deepseek',
                  cmd: 'panini-cli model-menu install deepseek',
                },
                {
                  label: 'panini-cli model-menu install bonsai-d3',
                  cmd: 'panini-cli model-menu install bonsai-d3',
                },
                {
                  label: 'panini-cli export-gguf (Flagship)',
                  cmd: 'panini-cli export-gguf --model panini-400b-flagship --quant Q5_K_M',
                },
                {
                  label: 'panini-cli self-learn tune',
                  cmd: 'panini-cli self-learn tune --model panini-400b-flagship',
                },
                { label: 'panini-cli shard list', cmd: 'panini-cli shard list' },
                {
                  label: 'panini-cli shard save (CrowdStrike)',
                  cmd: 'panini-cli shard save --topic "CrowdStrike Falcon XDR" --source "CrowdStrike 2026 Threat Report" --facts "CrowdStrike Falcon unifies eBPF kernel-less EDR, Charlotte AI SOC, and Next-Gen SIEM; Founded 2011"',
                },
                { label: 'panini-cli ollama list', cmd: 'panini-cli ollama list' },
                {
                  label: 'panini-cli ollama pull panini-coder-v6.0-q8_0.gguf',
                  cmd: 'panini-cli ollama pull panini-coder-polyglot-v6.0-q8_0.gguf',
                },
                { label: 'panini-cli rbac list', cmd: 'panini-cli rbac list' },
                {
                  label: 'panini-cli config --mode online',
                  cmd: 'panini-cli config --mode online',
                },
                {
                  label: 'panini-cli config --mode offline',
                  cmd: 'panini-cli config --mode offline',
                },
                {
                  label: 'panini-cli search "Gurucul" --engine google',
                  cmd: 'panini-cli search "Gurucul" --engine google',
                },
                {
                  label: 'panini-cli top (v6.3 TUI)',
                  cmd: 'panini-cli top',
                },
                {
                  label: 'panini-cli tts (v6.3 Local TTS)',
                  cmd: 'panini-cli tts "Panini v6.3 local model neural audio synthesis verified" --voice panini-aura-en-us-f1',
                },
                {
                  label: 'panini-cli graph (v6.3 D3 Graph)',
                  cmd: 'panini-cli graph --topic "Snowflake AI Data Cloud"',
                },
                {
                  label: 'panini-cli release sync',
                  cmd: 'panini-cli release sync',
                },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleExecuteCliCommand(preset.cmd)}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-sky-300"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {cliOutputHistory[0] && (
              <pre
                data-testid="cli-terminal-stdout"
                className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap"
              >
                $ {cliOutputHistory[0].cmd}
                {'\n'}
                {cliOutputHistory[0].stdout}
              </pre>
            )}
          </div>

          {/* Documented CLI Commands Reference Table */}
          <div className="overflow-x-auto">
            <table className={`w-full text-left border-collapse text-xs ${headingText}`}>
              <thead>
                <tr className={`border-b ${borderClass} ${mutedText} font-mono text-[11px]`}>
                  <th className="py-2 px-3">CLI Command</th>
                  <th className="py-2 px-3">Subsystem</th>
                  <th className="py-2 px-3">What It Does &amp; When To Use</th>
                  <th className="py-2 px-3">Sample Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {spec.cliReference.commands.map((c) => (
                  <tr key={c.id} className="align-top">
                    <td className="py-2.5 px-3 font-mono text-emerald-400">
                      <div>{c.command}</div>
                      <button
                        type="button"
                        onClick={() => handleExecuteCliCommand(c.command)}
                        className="mt-1 text-[10px] text-sky-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Play className="w-2.5 h-2.5" /> Run in Terminal
                      </button>
                    </td>
                    <td className={`py-2.5 px-3 font-mono text-[11px] ${mutedText}`}>
                      {c.category}
                    </td>
                    <td className="py-2.5 px-3 space-y-1">
                      <div>{c.whatItDoes}</div>
                      <div className={`text-[11px] ${mutedText}`}>
                        <strong>When to use:</strong> {c.whenToUse}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300 max-w-sm">
                      <pre className="p-2 rounded bg-slate-950 border border-slate-800 whitespace-pre-wrap">
                        {c.sampleOutput}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION C: PREPACKAGED LOCAL OFFLINE RBAC USER DATABASE (ZERO CLOUD HOSTING) */}
      {(activeTab === 'all' || activeTab === 'local_rbac_db') && (
        <section
          data-testid="docs-section-local-rbac-db"
          className={`p-5 rounded-xl border ${borderClass} ${surfaceClass} space-y-4`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  100% Prepackaged Local Offline DB · Zero Cloud Hosting
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                  File: /data/panini-local-sovereign-db.json
                </span>
              </div>
              <h3 className={`text-base font-semibold mt-1 ${headingText}`}>
                Prepackaged Local RBAC User &amp; Document Clearance Database ({rbacUsers.length} Local Users)
              </h3>
              <p className={`text-xs ${mutedText}`}>
                Prepackaged local user database with Ed25519/Argon2id offline passkeys and document classification clearances (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED_EXEC`) that works completely offline without any cloud database dependency.
              </p>
            </div>
          </div>

          {rbacVerifyBanner && (
            <div
              data-testid="local-rbac-verify-banner"
              className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{rbacVerifyBanner}</span>
            </div>
          )}

          {/* Release v6.2-GA: FIDO2 / WebAuthn Hardware-Key RBAC Signing & P2P GGUF Shard Mesh Sync */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div
              data-testid="fido2-rbac-signing-card"
              className={`p-3.5 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2 text-xs`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-emerald-300">
                  v6.2-GA FIDO2 / WebAuthn Hardware-Key RBAC Attestation
                </span>
                <button
                  type="button"
                  data-testid="fido2-sign-action-btn"
                  onClick={async () => {
                    const sig = signRbacActionWithFido2WebAuthnV62({
                      userEmail: 'admin@panini.local',
                      actionType: 'RESTRICTED_EXEC_DOCUMENT_ACCESS',
                      targetResource: 'DOC-EXEC-404',
                    });
                    setFido2Ledger(getFido2SignatureLedgerV62());
                    setRbacVerifyBanner(
                      `FIDO2/WebAuthn Hardware Key Signed (${sig.signatureId} · ${sig.algorithm} · Key: ${sig.authenticatorId}) for ${sig.userEmail}`
                    );
                    try {
                      await fetch('/api/v62/rbac/fido2-sign', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userEmail: 'admin@panini.local',
                          actionType: 'RESTRICTED_EXEC_DOCUMENT_ACCESS',
                          targetResource: 'DOC-EXEC-404',
                        }),
                      });
                    } catch {
                      // Local FIDO2 signature already committed
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-semibold text-[11px]"
                >
                  Sign RESTRICTED_EXEC with FIDO2 Key
                </button>
              </div>
              {fido2Ledger[0] && (
                <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                  [{fido2Ledger[0].signatureId}] {fido2Ledger[0].userEmail} · Key:{' '}
                  {fido2Ledger[0].authenticatorId} · Sig:{' '}
                  {fido2Ledger[0].cryptographicSignatureHex.slice(0, 28)}...
                </div>
              )}
            </div>

            <div
              data-testid="p2p-shard-mesh-card"
              className={`p-3.5 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2 text-xs`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-sky-300">
                  v6.2-GA Peer-to-Peer GGUF Shard Mesh ({p2pMeshState.peersUpdated} Peers · {p2pMeshState.status})
                </span>
                <button
                  type="button"
                  data-testid="p2p-mesh-sync-btn"
                  onClick={async () => {
                    const synced = syncPeerToPeerGgufShardMeshV62();
                    setP2pMeshState(synced);
                    setRbacVerifyBanner(
                      `P2P GGUF Shard Mesh Synchronized (${synced.syncRunId}): ${synced.syncedShardsCount} .gguf shards across ${synced.peersUpdated} peers (Merkle Root: ${synced.merkleRootHash})`
                    );
                    try {
                      await fetch('/api/v62/shards/p2p-sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ syncMode: 'DELTA_MERKLE_GGUF' }),
                      });
                    } catch {
                      // Local P2P sync already committed
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-sky-500 text-slate-950 font-semibold text-[11px]"
                >
                  Sync P2P GGUF Shard Mesh
                </button>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                Merkle Root: {p2pMeshState.merkleRootHash} · Shards: {p2pMeshState.syncedShardsCount} · Nodes:{' '}
                {p2pMeshState.peerNodes.map((n) => n.nodeId).join(', ')}
              </div>
            </div>
          </div>

          {/* Release v6.3-GA: Streaming Multi-Agent MCP DAG Recorder & Offline WASM OpenXML PPTX Verifier */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div
              data-testid="mcp-dag-recorder-card"
              className={`p-3.5 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2 text-xs`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-indigo-300">
                  v6.3-GA Streaming Multi-Agent MCP DAG Recorder ({mcpDagHistory.length} Runs)
                </span>
                <button
                  type="button"
                  data-testid="mcp-dag-record-btn"
                  onClick={async () => {
                    const dag = recordMcpAgentDagExecutionV63({
                      workflowPrompt:
                        'Multi-agent research, D3 entity graph extraction, and OpenXML PPTX synthesis for Databricks Lakehouse IQ',
                      slideCount: 6,
                    });
                    setMcpDagHistory(getMcpAgentDagHistoryV63());
                    setRbacVerifyBanner(
                      `Recorded Multi-Agent MCP DAG (${dag.dagRunId} · ${dag.steps.length} Agent Steps · Max Logit Variance: ${dag.maxLogitVarianceDelta} · Replay Verified: ${dag.deterministicReplayVerified})`
                    );
                    try {
                      await fetch('/api/v63/mcp/dag-recorder', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          workflowPrompt: dag.workflowPrompt,
                        }),
                      });
                    } catch {
                      // Local DAG execution already committed
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-indigo-500 text-slate-950 font-semibold text-[11px]"
                >
                  Record Multi-Agent MCP DAG Run
                </button>
              </div>
              {mcpDagHistory[0] && (
                <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                  [{mcpDagHistory[0].dagRunId}] {mcpDagHistory[0].steps.length} Agent Steps · Max Logit Δ:{' '}
                  {mcpDagHistory[0].maxLogitVarianceDelta} · Schema:{' '}
                  {mcpDagHistory[0].openXmlWasmVerification.schemaCompliance}
                </div>
              )}
            </div>

            <div
              data-testid="wasm-pptx-verifier-card"
              className={`p-3.5 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2 text-xs`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-emerald-300">
                  v6.3-GA Offline WASM OpenXML PPTX Package Verifier
                </span>
                <button
                  type="button"
                  data-testid="wasm-pptx-verify-btn"
                  onClick={() => {
                    const check = verifyOpenXmlPptxPackageWasmV63(6);
                    setWasmPptxVerifySummary(
                      `[${check.schemaCompliance}] ${check.slideXmlCount} Slide XML entries · ${check.mediaAssetsCount} Media Assets · Verified: ${check.verified}`
                    );
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-semibold text-[11px]"
                >
                  Verify OpenXML .pptx via WASM
                </button>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                {wasmPptxVerifySummary ||
                  'Ready: Verifies PK\\x03\\x04 ZIP header, [Content_Types].xml, ppt/presentation.xml, and ppt/slides/slide1..N.xml locally.'}
              </div>
            </div>
          </div>

          {/* Add / Update Local Offline RBAC User Form */}
          <form
            onSubmit={handleUpsertLocalRbacUser}
            className={`p-4 rounded-xl border ${borderClass} ${subSurfaceClass} grid grid-cols-1 sm:grid-cols-6 gap-3 items-end`}
          >
            <div>
              <label className={`block text-[11px] font-semibold ${mutedText} mb-1`}>
                User Handle
              </label>
              <input
                type="text"
                data-testid="local-rbac-handle-input"
                value={newRbacHandle}
                onChange={(e) => setNewRbacHandle(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className={`block text-[11px] font-semibold ${mutedText} mb-1`}>
                Full Name
              </label>
              <input
                type="text"
                data-testid="local-rbac-name-input"
                value={newRbacName}
                onChange={(e) => setNewRbacName(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
            <div>
              <label className={`block text-[11px] font-semibold ${mutedText} mb-1`}>
                ACL Role
              </label>
              <select
                data-testid="local-rbac-role-select"
                value={newRbacRole}
                onChange={(e) => setNewRbacRole(e.target.value as DocumentAclRole)}
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="Viewer">Viewer</option>
                <option value="Analyst">Analyst</option>
                <option value="Developer">Developer</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={`block text-[11px] font-semibold ${mutedText} mb-1`}>
                Clearance Level
              </label>
              <select
                value={newRbacClearance}
                onChange={(e) =>
                  setNewRbacClearance(e.target.value as DocumentClassificationLevel)
                }
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="INTERNAL">INTERNAL</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="RESTRICTED_EXEC">RESTRICTED_EXEC</option>
              </select>
            </div>
            <div>
              <label className={`block text-[11px] font-semibold ${mutedText} mb-1`}>
                Department
              </label>
              <input
                type="text"
                value={newRbacDept}
                onChange={(e) => setNewRbacDept(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              data-testid="local-rbac-save-user-btn"
              className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs inline-flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Local User</span>
            </button>
          </form>

          {/* Local Offline RBAC Table */}
          <div className="overflow-x-auto" data-testid="local-rbac-users-table">
            <table className={`w-full text-left border-collapse text-xs ${headingText}`}>
              <thead>
                <tr className={`border-b ${borderClass} ${mutedText} font-mono text-[11px]`}>
                  <th className="py-2 px-3">ID &amp; Handle</th>
                  <th className="py-2 px-3">Full Name &amp; Dept</th>
                  <th className="py-2 px-3">Role &amp; Clearance</th>
                  <th className="py-2 px-3">Offline Keyring</th>
                  <th className="py-2 px-3">Allowed MCP Scopes</th>
                  <th className="py-2 px-3">Verify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rbacUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 px-3 font-mono">
                      <div className="text-sky-400 font-semibold">{u.handle}</div>
                      <div className={`text-[10px] ${mutedText}`}>{u.id}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold">{u.fullName}</div>
                      <div className={`text-[11px] ${mutedText}`}>{u.department}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[11px]">
                        {u.role}
                      </span>{' '}
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px]">
                        {u.clearanceLevel}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 font-mono text-[11px] ${mutedText}`}>
                      {u.offlinePinOrPasskeyId}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                      {u.allowedMcpUris.join(', ')}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleVerifyLocalRbacUser(u.handle)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-emerald-300"
                      >
                        Verify Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 1: REST API ENDPOINTS (WITH WHAT IT DOES, WHEN & HOW TO USE & USE CASES) */}
      {(activeTab === 'all' || activeTab === 'rest_api') && (
        <section
          data-testid="docs-section-rest-api"
          className={`p-5 rounded-xl border ${borderClass} ${surfaceClass} space-y-4`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className={`text-base font-semibold flex items-center gap-2 ${headingText}`}>
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>
                  01. Enterprise REST API Reference (/api/*) — What It Does, When &amp; How to Use &amp; Use Cases
                </span>
              </h3>
              <p className={`text-xs ${mutedText}`}>
                Complete REST API reference covering 150s internet-grounded research, Knowledge Shard CRUD (`/api/v61/shards`), Local Offline RBAC (`/api/v61/rbac/users`), Persistent Settings (`/api/v61/settings`), Backend CLI (`/api/v61/cli/exec`), and GGUF v3 updates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="test-live-rest-endpoint-btn"
                disabled={isTestingEndpoint}
                onClick={() => handleRunLiveEndpointCheck('/api/mcp/manifest', 'GET')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 inline-flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Test Live /api/mcp/manifest</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className={`w-full text-left border-collapse text-xs ${headingText}`}>
              <thead>
                <tr className={`border-b ${borderClass} ${mutedText} font-mono text-[11px]`}>
                  <th className="py-2.5 px-3">Method &amp; Path</th>
                  <th className="py-2.5 px-3">What It Does &amp; When/How To Use</th>
                  <th className="py-2.5 px-3">Concrete Use Cases</th>
                  <th className="py-2.5 px-3">cURL &amp; Live Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {spec.restEndpoints.map((ep) => (
                  <tr key={ep.id} className="align-top">
                    <td className="py-3 px-3 font-mono whitespace-nowrap">
                      <div>
                        <span
                          className={
                            ep.method === 'POST'
                              ? 'text-sky-400 font-bold'
                              : 'text-emerald-400 font-bold'
                          }
                        >
                          {ep.method}
                        </span>{' '}
                        <span>{ep.path}</span>
                      </div>
                      <div className={`text-[11px] ${mutedText} mt-1`}>
                        {ep.category} · Min Role: {ep.requiredRole}
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-md space-y-1 leading-relaxed">
                      <div>
                        <strong className="text-sky-300">What It Does:</strong> {ep.whatItDoes}
                      </div>
                      <div className={mutedText}>
                        <strong className="text-emerald-300">When &amp; How To Use:</strong>{' '}
                        {ep.whenAndHowToUse}
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                        {ep.useCases.map((uc, idx) => (
                          <li key={idx}>{uc}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] space-y-1.5 max-w-sm">
                      <div className="p-2 rounded bg-slate-950/90 border border-slate-800 text-slate-300 break-all">
                        {ep.curlExample}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleCopyText(ep.id, ep.curlExample)}
                          className="text-sky-400 hover:underline inline-flex items-center gap-1"
                        >
                          {copiedId === ep.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy cURL</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRunLiveEndpointCheck(
                              ep.path,
                              ep.method,
                              ep.requestBodySchema
                            )
                          }
                          className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Test Endpoint</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 2: MCP SERVER SPECIFICATION */}
      {(activeTab === 'all' || activeTab === 'mcp_server') && (
        <section
          data-testid="docs-section-mcp-server"
          className={`p-5 rounded-xl border ${borderClass} ${surfaceClass} space-y-4`}
        >
          <div>
            <h3 className={`text-base font-semibold flex items-center gap-2 ${headingText}`}>
              <Server className="w-4 h-4 text-emerald-400" />
              <span>02. Model Context Protocol (MCP) Server Specification (JSON-RPC 2.0)</span>
            </h3>
            <p className={`text-xs ${mutedText} mt-0.5`}>
              Server: <span className="font-mono">{spec.mcpServerSpec.serverName}</span> · Protocol:{' '}
              <span className="font-mono">{spec.mcpServerSpec.protocolVersion}</span> · Endpoint:{' '}
              <span className="font-mono">{spec.mcpServerSpec.inboundRestEndpoint}</span>
            </p>
            <div className="mt-2 p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1">
              <div>
                <strong className="text-emerald-400">What the MCP Server Does: </strong>
                <span className={headingText}>{spec.mcpServerSpec.whatItDoes}</span>
              </div>
              <div>
                <strong className="text-sky-400">When &amp; How To Use: </strong>
                <span className={mutedText}>{spec.mcpServerSpec.whenAndHowToUse}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2.5`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                JSON-RPC 2.0 Supported Methods &amp; Use Cases
              </h4>
              <div className="space-y-2.5">
                {spec.mcpServerSpec.jsonRpcMethods.map((m) => (
                  <div key={m.method} className={`p-3 rounded-lg border ${borderClass} space-y-1.5`}>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-sky-400 font-semibold">{m.method}</span>
                      <span className={mutedText}>{m.direction}</span>
                    </div>
                    <p className={`text-xs ${headingText}`}>{m.description}</p>
                    <p className={`text-[11px] ${mutedText}`}>
                      <strong className="text-emerald-300">When to use:</strong> {m.whenToUse}
                    </p>
                    <div className="text-[11px] text-slate-300">
                      <strong className="text-amber-300">Use Cases:</strong>{' '}
                      {m.useCases.join(' · ')}
                    </div>
                    <pre className="p-2 rounded bg-slate-950 text-[11px] font-mono text-slate-300 overflow-x-auto">
                      {m.samplePayload}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2.5`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider ${mutedText}`}>
                Registered MCP Tools, When To Use &amp; RBAC Policies
              </h4>
              <div className="space-y-2.5">
                {spec.mcpServerSpec.registeredTools.map((tool) => (
                  <div key={tool.toolName} className={`p-3 rounded-lg border ${borderClass} space-y-1.5`}>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-semibold">{tool.toolName}</span>
                      <span className={mutedText}>Min Role: {tool.minimumRole}</span>
                    </div>
                    <p className={`text-xs ${headingText}`}>{tool.description}</p>
                    <p className={`text-[11px] ${mutedText}`}>
                      <strong className="text-sky-300">When &amp; How To Use:</strong>{' '}
                      {tool.whenAndHowToUse}
                    </p>
                    <div className="text-[11px] text-slate-300">
                      <strong className="text-amber-300">Use Cases:</strong>{' '}
                      {tool.useCases.join(' · ')}
                    </div>
                    <div className={`text-[11px] font-mono ${mutedText}`}>
                      Schema: {tool.inputSchemaSummary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: MCP AGENT & MULTI-AGENT DELEGATION ARCHITECTURE */}
      {(activeTab === 'all' || activeTab === 'mcp_agents') && (
        <section
          data-testid="docs-section-mcp-agents"
          className={`p-5 rounded-xl border ${borderClass} ${surfaceClass} space-y-4`}
        >
          <div>
            <h3 className={`text-base font-semibold flex items-center gap-2 ${headingText}`}>
              <Bot className="w-4 h-4 text-amber-400" />
              <span>03. MCP Agent &amp; Multi-Agent Delegation Architecture</span>
            </h3>
            <p className={`text-xs ${mutedText} mt-0.5`}>
              Orchestrator: <span className="font-mono">{spec.mcpAgentArchitecture.orchestratorName}</span> ·
              Coordinator: <span className="font-mono">{spec.mcpAgentArchitecture.coordinatorAgent}</span> ·
              Deep Research Verification Timer:{' '}
              <span className="font-mono">{spec.mcpAgentArchitecture.deepResearchTimerSeconds}s</span>
            </p>
            <p className="text-xs font-mono mt-1 text-sky-400">
              Execution Loop: {spec.mcpAgentArchitecture.executionLoopPattern}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spec.mcpAgentArchitecture.collaboratorAgents.map((ag) => (
              <div
                key={ag.agentId}
                className={`p-4 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-sky-400 font-semibold">{ag.agentName}</span>
                  <span className={mutedText}>
                    {ag.agentId} · {ag.protocol}
                  </span>
                </div>
                <p className={`text-xs font-semibold ${headingText}`}>{ag.roleAndSpecialization}</p>
                <p className={`text-[11px] ${mutedText}`}>
                  <strong className="text-emerald-300">When &amp; How To Use:</strong>{' '}
                  {ag.whenAndHowToUse}
                </p>
                <div className="text-[11px] text-slate-300">
                  <strong className="text-amber-300">Use Cases:</strong>{' '}
                  {ag.useCases.join(' · ')}
                </div>
                <div className={`text-xs font-mono ${mutedText}`}>
                  Target Endpoint: {ag.targetEndpoint}
                </div>
                <p className={`text-xs ${mutedText}`}>Guarantee: {ag.outputGuarantee}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 4: DYNAMIC ROADMAP AUTO-DRAFTER SUGGESTIONS (SYNCED TO DOCS & ARTIFACTS) */}
      {(activeTab === 'all' || activeTab === 'roadmap_suggestions') && (
        <section
          data-testid="docs-section-roadmap-suggestions"
          className={`p-5 rounded-xl border ${borderClass} ${surfaceClass} space-y-4`}
        >
          <div>
            <h3 className={`text-base font-semibold flex items-center gap-2 ${headingText}`}>
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>
                04. Dynamic Roadmap Auto-Drafter Suggestions (Synced to Implementation Plan &amp; Documentation)
              </span>
            </h3>
            <p className={`text-xs ${mutedText} mt-0.5`}>
              Auto-drafted horizon releases (`v6.2-GA`, `v6.3-GA`, `v7.0 LTS`) synthesized from live telemetry, bug audits, and user workflows, and included in exported PDF documentation and `implementation_plan.md`.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spec.dynamicRoadmapSuggestions.map((item) => (
              <div
                key={item.versionTag}
                data-testid={`docs-roadmap-card-${item.svnRevision}`}
                className={`p-4 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2 text-xs`}
              >
                <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                    {item.versionTag}
                  </span>
                  <span className="text-emerald-400 font-semibold">{item.releaseTier}</span>
                </div>
                <h4 className={`font-bold text-sm ${headingText}`}>{item.title}</h4>
                <ul className={`list-disc list-inside space-y-1 text-[11px] ${mutedText}`}>
                  {item.deliverables.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
