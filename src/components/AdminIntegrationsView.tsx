import React, { useState } from 'react';
import {
  Globe,
  Database,
  FileSpreadsheet,
  Server,
  Upload,
  PlusCircle,
  CheckCircle2,
  Play,
  Terminal,
  ShieldCheck,
  Bot,
  Network,
  FileText,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import {
  DocumentAclRole,
  DocumentClassificationLevel,
  ExternalRagEngineTypeV58,
  SupportedDocumentOrFlatfileFormatV58,
  ingestWebsiteToKnowledgeShardV58,
  connectExternalRagServerToShardV58,
  ingestDocumentOrFlatfileToShardV58,
  registerCustomMcpServerV58,
  setPaniniInboundMcpServerEnabledV58,
  handleInboundMcpJsonRpcRequestV58,
  delegateTaskToSubAgentsV58,
  getIntegrationsHubSnapshotV58,
  InboundMcpJsonRpcResponseV58,
  upsertAndIndexKnowledgeShardV61,
} from '../utils/engineLogic';
import { listPaniniKnowledgeShards } from '../utils/multimodalSuite';

interface AdminIntegrationsViewProps {
  activeRole?: DocumentAclRole;
  userHandle?: string;
  isOnline?: boolean;
  onSendPromptToChat?: (prompt: string) => void;
}

type IntegrationSubTab =
  | 'website_shards'
  | 'rag_servers'
  | 'flatfiles_docs'
  | 'mcp_agent_hub';

export const AdminIntegrationsView: React.FC<AdminIntegrationsViewProps> = ({
  activeRole = 'Admin',
  userHandle = 'dsupercooldude@gmail.com',
  isOnline = true,
  onSendPromptToChat,
}) => {
  const [activeTab, setActiveTab] = useState<IntegrationSubTab>('website_shards');
  const [snapshot, setSnapshot] = useState(() =>
    getIntegrationsHubSnapshotV58(activeRole, userHandle)
  );
  const [statusBanner, setStatusBanner] = useState<string>('');
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Release v6.1-GA: Direct Knowledge Shard Source Saver & Updater State
  const [shardUpdateTopic, setShardUpdateTopic] = useState<string>(
    'Gurucul REVEAL Next-Gen SIEM & UEBA'
  );
  const [shardUpdateSourceTitle, setShardUpdateSourceTitle] = useState<string>(
    'Gurucul 2026 Product Architecture & Threat Intelligence Advisory'
  );
  const [shardUpdateSourceUrl, setShardUpdateSourceUrl] = useState<string>(
    'https://gurucul.com/products/reveal-security-analytics-platform'
  );
  const [shardUpdateFactsText, setShardUpdateFactsText] = useState<string>(
    'Gurucul REVEAL unifies Next-Gen SIEM, UEBA, Identity & Access Analytics (IAA), and NDR on a single open data lake.\nSmeagle AI Agent automates tier-1/tier-2 SOC triage and dynamic risk scoring (0-100) with zero-trust playbooks.'
  );
  const [shardMergeExisting, setShardMergeExisting] = useState<boolean>(true);
  const [liveStoredShards, setLiveStoredShards] = useState(() =>
    listPaniniKnowledgeShards()
  );

  // 1. Website -> Knowledge Shard Form State
  const [websiteUrl, setWebsiteUrl] = useState<string>(
    'https://en.wikipedia.org/wiki/Databricks'
  );
  const [websiteTopic, setWebsiteTopic] = useState<string>(
    'Databricks Lakehouse & Mosaic AI Architecture'
  );
  const [websiteCrawlMode, setWebsiteCrawlMode] = useState<
    'Single Page Extract' | 'Multi-Section + Subpages' | 'RSS / Sitemap Feed'
  >('Multi-Section + Subpages');
  const [websiteClassification, setWebsiteClassification] =
    useState<DocumentClassificationLevel>('PUBLIC');
  const [isCrawlingWebsite, setIsCrawlingWebsite] = useState(false);

  // 2. External RAG Server Form State
  const [ragServerName, setRagServerName] = useState<string>(
    'Milvus Sovereign Enterprise Knowledge Cluster'
  );
  const [ragEngineType, setRagEngineType] = useState<ExternalRagEngineTypeV58>(
    'Milvus Distributed Vector DB'
  );
  const [ragEndpointUrl, setRagEndpointUrl] = useState<string>(
    'https://milvus-hybrid.internal.corp:19530'
  );
  const [ragCollection, setRagCollection] = useState<string>(
    'enterprise_architecture_and_product_docs_v58'
  );
  const [ragAuthMode, setRagAuthMode] = useState<
    | 'Bearer Token (OAuth2 / JWT)'
    | 'mTLS Client Certificate'
    | 'API Key Header'
    | 'Local Air-Gapped Socket'
  >('Bearer Token (OAuth2 / JWT)');
  const [ragClassification, setRagClassification] =
    useState<DocumentClassificationLevel>('INTERNAL');

  // 3. Flatfiles & Documents (.pdf, .pptx, .docx, .xlsx, .csv, .json, .md) Form State
  const [fileName, setFileName] = useState<string>(
    'Palo_Alto_Cortex_XSIAM_Portfolio_2026.pdf'
  );
  const [fileFormat, setFileFormat] =
    useState<SupportedDocumentOrFlatfileFormatV58>('PDF (.pdf)');
  const [fileTopic, setFileTopic] = useState<string>(
    'Palo Alto Networks Cortex XSIAM & Prisma Cloud Portfolio'
  );
  const [fileContent, setFileContent] = useState<string>(
    'Product Module,Primary Capability,Verified SLA,Deployment Model\nCortex XSIAM,Autonomous AI-Driven SOC & SIEM Replacement,99.95%,Cloud Native / Federal GovCloud\nPrisma Cloud,Cloud-Native Application Protection Platform (CNAPP),99.95%,Multi-Cloud AWS/Azure/GCP\nStrata Network Security,Next-Generation Firewall (PA-Series & VM-Series),99.99%,Hardware Appliance & Virtual'
  );
  const [fileClassification, setFileClassification] =
    useState<DocumentClassificationLevel>('PUBLIC');

  // 4. Outbound & Inbound MCP Server + Agentic Sub-Agent Delegation State
  const [customMcpUri, setCustomMcpUri] = useState<string>(
    'mcp://servicenow-secops'
  );
  const [customMcpName, setCustomMcpName] = useState<string>(
    'ServiceNow SecOps & Incident Response MCP'
  );
  const [customMcpTarget, setCustomMcpTarget] = useState<string>(
    'https://servicenow.internal.corp/api/mcp/v1/rpc'
  );
  const [customMcpTransport, setCustomMcpTransport] = useState<
    'stdio' | 'Streamable HTTP / SSE' | 'JSON-RPC 2.0 REST'
  >('Streamable HTTP / SSE');
  const [customMcpTools, setCustomMcpTools] = useState<string>(
    'secops.list_incidents, secops.enrich_threat_intel, secops.remediate_host'
  );
  const [rpcTestMethod, setRpcTestMethod] = useState<
    'tools/list' | 'tools/call' | 'resources/list' | 'agent/delegate'
  >('tools/call');
  const [rpcTestResponse, setRpcTestResponse] =
    useState<InboundMcpJsonRpcResponseV58 | null>(() =>
      handleInboundMcpJsonRpcRequestV58({
        jsonrpc: '2.0',
        id: 'rpc-init-1',
        method: 'tools/list',
      })
    );
  const [delegationGoal, setDelegationGoal] = useState<string>(
    'Coordinate Web Shard Harvester, Federated RAG, Flatfile Schema, and OpenXML Synthesis sub-agents to audit our ingested Website & PDF/CSV shards and prepare an executive summary'
  );

  const refreshSnapshot = () => {
    setSnapshot(getIntegrationsHubSnapshotV58(activeRole, userHandle));
    setLiveStoredShards(listPaniniKnowledgeShards());
  };

  // Handler 0 (Release v6.1-GA): Save New Sources or Update Existing Knowledge Shard
  const handleSaveOrUpdateKnowledgeShard = async () => {
    const factsArray = shardUpdateFactsText
      .split(/\r?\n|;/)
      .map((s) => s.trim())
      .filter((s) => s.length > 4);
    const result = upsertAndIndexKnowledgeShardV61({
      topic: shardUpdateTopic,
      sourceTitle: shardUpdateSourceTitle,
      sourceUrl: shardUpdateSourceUrl,
      facts:
        factsArray.length > 0
          ? factsArray
          : [`${shardUpdateTopic}: Verified enterprise shard fact.`],
      classification: websiteClassification,
      mergeExisting: shardMergeExisting,
    });
    try {
      await fetch('/api/v61/shards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: shardUpdateTopic,
          sourceTitle: shardUpdateSourceTitle,
          sourceUrl: shardUpdateSourceUrl,
          facts: factsArray,
          classification: websiteClassification,
          mergeExisting: shardMergeExisting,
        }),
      });
    } catch {
      // Local shard store and Hybrid RAG already updated
    }
    refreshSnapshot();
    setStatusBanner(
      `${result.actionPerformed === 'UPDATED_AND_MERGED' ? 'Updated & Merged' : 'Created'} Knowledge Shard "${result.topic}" (${result.shardRecord.ggufShardFile} · ${result.docId}) with ${result.totalMergedFacts} verified facts across ${result.totalMergedSources} sources — immediately active in Chat, Hybrid RAG & PPTX Grounding.`
    );
  };

  // Handler 1: Crawl Website & Commit to Knowledge Shard
  const handleIngestWebsite = async () => {
    setIsCrawlingWebsite(true);
    try {
      let fetchedFactsOverride: string[] | undefined;
      if (isOnline) {
        try {
          const resp = await fetch('/api/v58/integrations/ingest-website', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: websiteUrl,
              topicTitle: websiteTopic,
              crawlMode: websiteCrawlMode,
              classification: websiteClassification,
              isOnline,
              role: activeRole,
            }),
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data?.shard) {
              refreshSnapshot();
              setStatusBanner(
                `Website crawled & committed to Knowledge Shard ${data.shard.ggufShardFile} (${data.shard.docIdGenerated}) — immediately active in Hybrid RAG & PPTX Grounding.`
              );
              setIsCrawlingWebsite(false);
              return;
            }
          }
        } catch {
          // Fallback to deterministic local ingestion if backend call fails
        }
      }

      const shard = ingestWebsiteToKnowledgeShardV58({
        url: websiteUrl,
        topicTitle: websiteTopic,
        crawlMode: websiteCrawlMode,
        classification: websiteClassification,
        fetchedFactsOverride,
      });
      refreshSnapshot();
      setStatusBanner(
        `Website committed to Knowledge Shard ${shard.ggufShardFile} (${shard.docIdGenerated}) — indexed in Hybrid RAG (${shard.classification}).`
      );
    } finally {
      setIsCrawlingWebsite(false);
    }
  };

  // Handler 2: Connect External RAG Server & Sync to Shard
  const handleConnectRagServer = async () => {
    const record = connectExternalRagServerToShardV58({
      serverName: ragServerName,
      engineType: ragEngineType,
      endpointUrl: ragEndpointUrl,
      collectionOrIndex: ragCollection,
      authMode: ragAuthMode,
      hybridAlphaWeight: 0.55,
      classification: ragClassification,
    });
    try {
      await fetch('/api/v58/integrations/sync-rag-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverName: ragServerName,
          engineType: ragEngineType,
          endpointUrl: ragEndpointUrl,
          collectionOrIndex: ragCollection,
          authMode: ragAuthMode,
          hybridAlphaWeight: 0.55,
          classification: ragClassification,
          role: activeRole,
        }),
      });
    } catch {
      // Local state already updated
    }
    refreshSnapshot();
    setStatusBanner(
      `Connected ${record.engineType} (${record.serverName}) & synced collection "${record.collectionOrIndex}" to shard ${record.syncedShardFile} (${record.syncedDocId}).`
    );
  };

  // Handler 3: Upload / Ingest Flatfile or Office Document (.pdf, .pptx, .docx, .xlsx, .csv, .json, .md)
  const handleFileUploadInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') setFileFormat('PDF (.pdf)');
    else if (ext === 'pptx' || ext === 'ppt') setFileFormat('PowerPoint (.pptx)');
    else if (ext === 'docx' || ext === 'doc') setFileFormat('Word (.docx)');
    else if (ext === 'xlsx' || ext === 'xls') setFileFormat('Excel (.xlsx)');
    else if (ext === 'csv' || ext === 'tsv')
      setFileFormat('CSV / TSV Flatfile (.csv/.tsv)');
    else if (ext === 'json' || ext === 'jsonl')
      setFileFormat('JSON / JSONL (.json/.jsonl)');
    else setFileFormat('Markdown / Text (.md/.txt)');

    setFileTopic(
      file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
    );

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const printable = reader.result
          .replace(/[^\x20-\x7E\r\n\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 600);
        if (printable.length > 16) {
          setFileContent(printable);
        }
      }
    };
    reader.readAsText(file.slice(0, 16384));
  };

  const handleIngestDocumentOrFlatfile = async () => {
    const rec = ingestDocumentOrFlatfileToShardV58({
      fileName,
      fileFormat,
      rawContentOrExcerpt: fileContent,
      classification: fileClassification,
      topicOverride: fileTopic,
    });
    try {
      await fetch('/api/v58/integrations/ingest-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          fileFormat,
          rawContentOrExcerpt: fileContent,
          classification: fileClassification,
          topicOverride: fileTopic,
          role: activeRole,
        }),
      });
    } catch {
      // Local state already updated
    }
    refreshSnapshot();
    setStatusBanner(
      `Parsed ${rec.fileName} (${rec.detectedFormat}) via ${rec.parserUsed} -> Knowledge Shard ${rec.ggufShardFile} (${rec.docIdGenerated}).`
    );
  };

  // Handler 4A: Register Outbound MCP Server
  const handleRegisterCustomMcp = async () => {
    const toolsList = customMcpTools
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const entry = registerCustomMcpServerV58(
      {
        uri: customMcpUri,
        name: customMcpName,
        connectorTarget: customMcpTarget,
        transportMode: customMcpTransport,
        toolsAndScopes: toolsList,
        allowedRoles: ['Analyst', 'Developer', 'Admin'],
        accessLevel: 'READ_WRITE',
        requiresHitlForWrite: true,
      },
      activeRole,
      userHandle
    );
    try {
      await fetch('/api/v58/integrations/register-mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uri: customMcpUri,
          name: customMcpName,
          connectorTarget: customMcpTarget,
          transportMode: customMcpTransport,
          toolsAndScopes: toolsList,
          role: activeRole,
        }),
      });
    } catch {
      // Local state already updated
    }
    refreshSnapshot();
    setStatusBanner(
      `Registered Outbound MCP Server ${entry.uri} (${entry.name}) with scoped token ${entry.scopedCredentialToken}.`
    );
  };

  // Handler 4B: Toggle Panini Inbound MCP Server Mode & Test JSON-RPC 2.0 Call
  const handleToggleInboundMcpServer = (enabled: boolean) => {
    setPaniniInboundMcpServerEnabledV58(enabled);
    refreshSnapshot();
    setStatusBanner(
      enabled
        ? 'Panini Inbound MCP & REST Server ENABLED (/api/mcp/manifest & /api/mcp/rpc).'
        : 'Panini Inbound MCP Server paused.'
    );
  };

  const handleRunInboundMcpRpcTest = async () => {
    const rpcPayload = {
      jsonrpc: '2.0' as const,
      id: `rpc-${Date.now()}`,
      method: rpcTestMethod,
      params:
        rpcTestMethod === 'tools/call'
          ? {
              name: 'panini_hybrid_rag_search',
              arguments: {
                query: websiteTopic || fileTopic || 'Audit enterprise shards',
                role: activeRole,
              },
            }
          : rpcTestMethod === 'agent/delegate'
          ? {
              goalPrompt: delegationGoal,
              role: activeRole,
            }
          : {},
    };
    const localRes = handleInboundMcpJsonRpcRequestV58(rpcPayload);
    setRpcTestResponse(localRes);
    try {
      const resp = await fetch('/api/mcp/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rpcPayload),
      });
      if (resp.ok) {
        const remoteJson = await resp.json();
        setRpcTestResponse(remoteJson);
      }
    } catch {
      // Keep local JSON-RPC response
    }
    refreshSnapshot();
    setStatusBanner(
      `Executed Inbound MCP JSON-RPC 2.0 request (${rpcTestMethod}) on /api/mcp/rpc -> Status: ${localRes.result.status}.`
    );
  };

  // Handler 4C: Dispatch Multi-Agent Sub-Agent Delegation Task
  const handleRunSubAgentDelegation = async () => {
    const run = delegateTaskToSubAgentsV58(delegationGoal, activeRole);
    try {
      await fetch('/api/v58/agents/delegate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalPrompt: delegationGoal,
          role: activeRole,
        }),
      });
    } catch {
      // Local state already updated
    }
    refreshSnapshot();
    setStatusBanner(
      `Delegated objective (${run.delegationRunId}) across ${run.subAgentsDispatchedCount} specialized sub-agents (${run.totalLatencyMs} ms total) with ${run.crossReferencedCitations.length} cross-referenced citations.`
    );
  };

  const inboundCurlSnippet = `curl -X POST http://localhost:3000/api/mcp/rpc \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":"mcp-1","method":"tools/call","params":{"name":"panini_hybrid_rag_search","arguments":{"query":"${websiteTopic.slice(0, 48)}","role":"${activeRole}"}}}'`;

  const handleCopyCurl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inboundCurlSnippet).catch(() => {});
    }
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1800);
  };

  return (
    <div
      data-testid="admin-integrations-view"
      className="space-y-6 text-slate-100"
    >
      {/* Top KISS Header & Summary Metrics Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Release v5.8-GA · SVN-r408.0-GA
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                KISS Federated Integrations Hub
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-400" />
              Integrations, Knowledge Shards, Flatfiles & Agentic MCP Hub
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect Websites, External RAG Servers, and Office Documents (
              <code className="text-indigo-300">.pdf, .pptx, .docx, .xlsx, .csv, .json</code>
              ) directly into local <code className="text-emerald-300">.gguf</code> Knowledge
              Shards, register Outbound MCP servers, expose Panini as an Inbound MCP / REST
              endpoint, and delegate tasks across specialized sub-agents.
            </p>
          </div>

          {/* 4 KPI Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Active Shards
              </div>
              <div
                data-testid="integrations-kpi-shards-count"
                className="text-base font-bold text-emerald-400"
              >
                {snapshot.ingestedShards.length} Shards
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                RAG Servers
              </div>
              <div
                data-testid="integrations-kpi-rag-count"
                className="text-base font-bold text-sky-400"
              >
                {snapshot.connectedRagServers.length} Connected
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Files Ingested
              </div>
              <div
                data-testid="integrations-kpi-files-count"
                className="text-base font-bold text-amber-300"
              >
                {snapshot.ingestedDocumentsAndFlatfiles.length} Docs
              </div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                MCP & Agents
              </div>
              <div
                data-testid="integrations-kpi-mcp-count"
                className="text-base font-bold text-indigo-300"
              >
                {snapshot.mcpServerRegistry.length} MCP ·{' '}
                {snapshot.inboundMcpManifest.exposedTools.length} Tools
              </div>
            </div>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusBanner && (
          <div
            data-testid="integrations-status-banner"
            className="mt-4 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusBanner}</span>
            </div>
            {onSendPromptToChat && (
              <button
                type="button"
                onClick={() =>
                  onSendPromptToChat(
                    `Generate a pptx for ${websiteTopic || fileTopic} about its company history, product portfolio and its feature about each product. Make sure use actual data and generate relevant images as needed`
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shrink-0"
              >
                Test in Chat / PPTX Builder
              </button>
            )}
          </div>
        )}

        {/* KISS 4-Tab Navigation Bar */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            data-testid="integrations-tab-website_shards"
            onClick={() => setActiveTab('website_shards')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
              activeTab === 'website_shards'
                ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <div>1. Websites → Shard</div>
              <div className="text-[10px] font-normal text-slate-400">
                Crawl URLs into .gguf & RAG
              </div>
            </div>
          </button>

          <button
            type="button"
            data-testid="integrations-tab-rag_servers"
            onClick={() => setActiveTab('rag_servers')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
              activeTab === 'rag_servers'
                ? 'bg-sky-600/25 border-sky-500 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div>2. External RAG Servers</div>
              <div className="text-[10px] font-normal text-slate-400">
                Qdrant, Milvus, Pinecone, PGVector
              </div>
            </div>
          </button>

          <button
            type="button"
            data-testid="integrations-tab-flatfiles_docs"
            onClick={() => setActiveTab('flatfiles_docs')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
              activeTab === 'flatfiles_docs'
                ? 'bg-amber-600/25 border-amber-500 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div>3. Flatfiles & Office Docs</div>
              <div className="text-[10px] font-normal text-slate-400">
                PDF, PPTX, DOCX, XLSX, CSV, JSON
              </div>
            </div>
          </button>

          <button
            type="button"
            data-testid="integrations-tab-mcp_agent_hub"
            onClick={() => setActiveTab('mcp_agent_hub')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
              activeTab === 'mcp_agent_hub'
                ? 'bg-emerald-600/25 border-emerald-500 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div>4. MCP & Agentic Hub</div>
              <div className="text-[10px] font-normal text-slate-400">
                Client + Inbound REST/MCP + Agents
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: WEBSITES & ONLINE SOURCES -> KNOWLEDGE SHARD
          ===================================================================== */}
      {activeTab === 'website_shards' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Website Crawler Form */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                Connect Website / Online Portal → Knowledge Shard
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                {isOnline ? 'Live Online Crawler' : 'Offline Shard Builder'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Crawls any Website URL, Wikipedia entity page, documentation site, or RSS/JSON feed,
              extracts verified facts, persists a local{' '}
              <code className="text-emerald-300">.gguf</code> Knowledge Shard, and indexes it into
              Hybrid RAG + 4-Tier PPTX Grounding.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Website URL / Documentation Endpoint
                </label>
                <input
                  type="text"
                  data-testid="website-url-input"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://en.wikipedia.org/wiki/Databricks"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Entity / Knowledge Shard Topic Title
                </label>
                <input
                  type="text"
                  data-testid="website-topic-input"
                  value={websiteTopic}
                  onChange={(e) => setWebsiteTopic(e.target.value)}
                  placeholder="Databricks Lakehouse & Mosaic AI Architecture"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Crawl Depth Mode
                  </label>
                  <select
                    value={websiteCrawlMode}
                    onChange={(e) =>
                      setWebsiteCrawlMode(
                        e.target.value as
                          | 'Single Page Extract'
                          | 'Multi-Section + Subpages'
                          | 'RSS / Sitemap Feed'
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Multi-Section + Subpages">
                      Multi-Section + Subpages
                    </option>
                    <option value="Single Page Extract">Single Page Extract</option>
                    <option value="RSS / Sitemap Feed">RSS / Sitemap Feed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Document ACL Classification
                  </label>
                  <select
                    value={websiteClassification}
                    onChange={(e) =>
                      setWebsiteClassification(
                        e.target.value as DocumentClassificationLevel
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="PUBLIC">PUBLIC (All Roles)</option>
                    <option value="INTERNAL">INTERNAL (Analyst/Dev/Admin)</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL (Dev/Admin)</option>
                    <option value="RESTRICTED_EXEC">RESTRICTED_EXEC (Admin)</option>
                  </select>
                </div>
              </div>

              {/* Quick Preset Pills */}
              <div className="pt-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">
                  1-Click Website Presets:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: 'Gurucul REVEAL Docs',
                      url: 'https://gurucul.com/products/next-gen-siem',
                      topic: 'Gurucul REVEAL Next-Gen SIEM & UEBA',
                    },
                    {
                      label: 'Databricks Mosaic AI',
                      url: 'https://en.wikipedia.org/wiki/Databricks',
                      topic: 'Databricks Lakehouse & Mosaic AI Architecture',
                    },
                    {
                      label: 'MCP 2025 Specification',
                      url: 'https://modelcontextprotocol.io/specification/2025-06-18',
                      topic: 'Model Context Protocol (MCP) 2025-06-18 Specification',
                    },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setWebsiteUrl(preset.url);
                        setWebsiteTopic(preset.topic);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                data-testid="ingest-website-shard-btn"
                disabled={isCrawlingWebsite}
                onClick={handleIngestWebsite}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                {isCrawlingWebsite
                  ? 'Crawling & Indexing into Knowledge Shard...'
                  : 'Crawl Website & Commit to Knowledge Shard (.gguf)'}
              </button>
            </div>
          </div>

          {/* Right Column: Active Knowledge Shards Ledger */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Active Knowledge Shards Ledger ({snapshot.ingestedShards.length} Shards Indexed in
                Hybrid RAG)
              </h3>
              <span className="text-[11px] text-slate-400">
                Dynamic RAG Chunks: {snapshot.totalDynamicChunksInHybridRag}
              </span>
            </div>

            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {snapshot.ingestedShards.map((shard) => (
                <div
                  key={shard.shardId}
                  data-testid={`ingested-shard-card-${shard.shardId}`}
                  className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {shard.sourceKind}
                      </span>
                      <span className="text-xs font-bold text-white">{shard.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {shard.docIdGenerated}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        ACL: {shard.classification}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    Source: {shard.sourceUriOrFilename} → Shard: {shard.ggufShardFile}
                  </div>

                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {shard.extractedFacts.slice(0, 2).map((f, i) => (
                      <li key={i} className="leading-relaxed">
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400">
                      {shard.chunkCount} chunks · {shard.vectorDimensions}-dim
                    </span>
                    <button
                      type="button"
                      data-testid={`edit-shard-btn-${shard.shardId}`}
                      onClick={() => {
                        setShardUpdateTopic(shard.title);
                        setShardUpdateSourceTitle(`${shard.title} — Additional Verified Source`);
                        setShardUpdateSourceUrl(shard.sourceUriOrFilename);
                        setShardUpdateFactsText(shard.extractedFacts.join('\n'));
                        setShardMergeExisting(true);
                      }}
                      className="text-[11px] font-mono text-sky-400 hover:underline"
                    >
                      Load into Shard Updater / Append Source →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Release v6.1-GA: Live Knowledge Shard Source Saver & Updater Panel */}
            <div
              data-testid="knowledge-shard-updater-panel"
              className="mt-4 pt-4 border-t border-slate-800 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Release v6.1-GA Fix · Save New Sources &amp; Update Existing Shards
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1">
                    Direct Knowledge Shard Source Saver &amp; Multi-Source Merger ({liveStoredShards.length} Cached Entity Shards)
                  </h4>
                </div>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shardMergeExisting}
                    onChange={(e) => setShardMergeExisting(e.target.checked)}
                    className="rounded border-slate-700"
                  />
                  <span>Merge with existing shard sources &amp; facts</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Shard Topic / Entity Key
                  </label>
                  <input
                    type="text"
                    data-testid="shard-update-topic-input"
                    value={shardUpdateTopic}
                    onChange={(e) => setShardUpdateTopic(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    New or Updated Source Title
                  </label>
                  <input
                    type="text"
                    data-testid="shard-update-source-input"
                    value={shardUpdateSourceTitle}
                    onChange={(e) => setShardUpdateSourceTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Source URL / DOI / URI
                  </label>
                  <input
                    type="text"
                    data-testid="shard-update-url-input"
                    value={shardUpdateSourceUrl}
                    onChange={(e) => setShardUpdateSourceUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Verified Facts to Save / Append to Knowledge Shard (one per line):
                </label>
                <textarea
                  rows={2}
                  data-testid="shard-update-facts-input"
                  value={shardUpdateFactsText}
                  onChange={(e) => setShardUpdateFactsText(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  data-testid="save-or-update-shard-btn"
                  onClick={handleSaveOrUpdateKnowledgeShard}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>
                    {shardMergeExisting
                      ? 'Save & Merge Source into Knowledge Shard (.gguf + RAG)'
                      : 'Overwrite Knowledge Shard (.gguf + RAG)'}
                  </span>
                </button>
                {onSendPromptToChat && (
                  <button
                    type="button"
                    data-testid="query-updated-shard-in-chat-btn"
                    onClick={() => {
                      setWebsiteTopic(shardUpdateTopic);
                      onSendPromptToChat(
                        `Generate a pptx for ${shardUpdateTopic} about its company history, product portfolio and its feature about each product. Make sure use actual data and generate relevant images as needed`
                      );
                    }}
                    className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-semibold text-xs"
                  >
                    Use Updated Shard in Coding / PPTX Now →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: EXTERNAL RAG SERVERS
          ===================================================================== */}
      {activeTab === 'rag_servers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Connect External RAG Server Form */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              Connect External Vector / Hybrid RAG Server
            </h3>
            <p className="text-xs text-slate-400">
              Federate external vector clusters (<code className="text-sky-300">Qdrant</code>,{' '}
              <code className="text-sky-300">Milvus</code>,{' '}
              <code className="text-sky-300">Pinecone</code>,{' '}
              <code className="text-sky-300">Weaviate</code>,{' '}
              <code className="text-sky-300">PGVector</code>) into Panini&apos;s{' '}
              <code>0.45*BM25 + 0.55*Vector</code> + Cross-Encoder Reranker pipeline and mirror
              collections to local Knowledge Shards.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  RAG Server Display Name
                </label>
                <input
                  type="text"
                  data-testid="rag-server-name-input"
                  value={ragServerName}
                  onChange={(e) => setRagServerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    RAG Engine Type
                  </label>
                  <select
                    value={ragEngineType}
                    onChange={(e) =>
                      setRagEngineType(e.target.value as ExternalRagEngineTypeV58)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Qdrant Vector Cluster">Qdrant Vector Cluster</option>
                    <option value="Milvus Distributed Vector DB">
                      Milvus Distributed Vector DB
                    </option>
                    <option value="Pinecone Serverless Index">
                      Pinecone Serverless Index
                    </option>
                    <option value="Weaviate Hybrid Graph">Weaviate Hybrid Graph</option>
                    <option value="PGVector / Cloud SQL">PGVector / Cloud SQL</option>
                    <option value="LangChain / LlamaIndex REST RAG">
                      LangChain / LlamaIndex REST RAG
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Authentication Mode
                  </label>
                  <select
                    value={ragAuthMode}
                    onChange={(e) =>
                      setRagAuthMode(
                        e.target.value as
                          | 'Bearer Token (OAuth2 / JWT)'
                          | 'mTLS Client Certificate'
                          | 'API Key Header'
                          | 'Local Air-Gapped Socket'
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Bearer Token (OAuth2 / JWT)">
                      Bearer Token (OAuth2 / JWT)
                    </option>
                    <option value="mTLS Client Certificate">
                      mTLS Client Certificate
                    </option>
                    <option value="API Key Header">API Key Header</option>
                    <option value="Local Air-Gapped Socket">
                      Local Air-Gapped Socket
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Cluster Endpoint URL
                </label>
                <input
                  type="text"
                  data-testid="rag-endpoint-input"
                  value={ragEndpointUrl}
                  onChange={(e) => setRagEndpointUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Collection / Index Name
                  </label>
                  <input
                    type="text"
                    value={ragCollection}
                    onChange={(e) => setRagCollection(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    ACL Classification
                  </label>
                  <select
                    value={ragClassification}
                    onChange={(e) =>
                      setRagClassification(
                        e.target.value as DocumentClassificationLevel
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED_EXEC">RESTRICTED_EXEC</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                data-testid="connect-rag-server-btn"
                onClick={handleConnectRagServer}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Database className="w-4 h-4" />
                Connect RAG Server & Sync Collection to Local Shard
              </button>
            </div>
          </div>

          {/* Right Column: Connected RAG Servers List */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Federated RAG Servers ({snapshot.connectedRagServers.length} Active)
            </h3>

            <div className="space-y-3">
              {snapshot.connectedRagServers.map((srv) => (
                <div
                  key={srv.id}
                  data-testid={`connected-rag-card-${srv.id}`}
                  className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white">{srv.serverName}</div>
                      <div className="text-[11px] text-sky-300 font-mono">
                        {srv.engineType} · {srv.endpointUrl}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {srv.status} · {srv.latencyMs} ms
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Collection</span>
                      <span className="text-slate-200 font-mono">{srv.collectionOrIndex}</span>
                    </div>
                    <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Synced Shard</span>
                      <span className="text-emerald-300 font-mono">{srv.syncedDocId}</span>
                    </div>
                    <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Auth Mode</span>
                      <span className="text-slate-200">{srv.authMode}</span>
                    </div>
                    <div className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">ACL Scope</span>
                      <span className="text-amber-300 font-semibold">{srv.classification}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: FLATFILES & OFFICE DOCUMENTS (.PDF, .PPTX, .DOCX, .XLSX, .CSV, .JSON)
          ===================================================================== */}
      {activeTab === 'flatfiles_docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: File Upload & Flatfile Schema Parser */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              Ingest Office Documents & Flatfiles → Knowledge Shard
            </h3>
            <p className="text-xs text-slate-400">
              Upload or paste structured data from{' '}
              <code className="text-amber-300">.pdf, .pptx, .docx, .xlsx, .csv, .tsv, .json, .md</code>
              . Automatically extracts tables & facts via{' '}
              <code>PaddleOCR-v3</code> / <code>ECMA-376 OpenXML Parser</code> /{' '}
              <code>openpyxl</code> and indexes them into local Knowledge Shards.
            </p>

            <div className="space-y-3">
              {/* Local File Picker */}
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/15 text-amber-200 text-xs font-semibold cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Choose File (.pdf, .pptx, .docx, .xlsx, .csv, .json, .md)</span>
                <input
                  type="file"
                  data-testid="flatfile-upload-input"
                  accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.csv,.tsv,.json,.jsonl,.md,.txt"
                  onChange={handleFileUploadInput}
                  className="hidden"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    data-testid="flatfile-name-input"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Document / Flatfile Format
                  </label>
                  <select
                    value={fileFormat}
                    onChange={(e) =>
                      setFileFormat(
                        e.target.value as SupportedDocumentOrFlatfileFormatV58
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="PDF (.pdf)">PDF (.pdf)</option>
                    <option value="PowerPoint (.pptx)">PowerPoint (.pptx)</option>
                    <option value="Word (.docx)">Word (.docx)</option>
                    <option value="Excel (.xlsx)">Excel (.xlsx)</option>
                    <option value="CSV / TSV Flatfile (.csv/.tsv)">
                      CSV / TSV Flatfile (.csv/.tsv)
                    </option>
                    <option value="JSON / JSONL (.json/.jsonl)">
                      JSON / JSONL (.json/.jsonl)
                    </option>
                    <option value="Markdown / Text (.md/.txt)">
                      Markdown / Text (.md/.txt)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Knowledge Shard Topic
                  </label>
                  <input
                    type="text"
                    value={fileTopic}
                    onChange={(e) => setFileTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    ACL Classification
                  </label>
                  <select
                    value={fileClassification}
                    onChange={(e) =>
                      setFileClassification(
                        e.target.value as DocumentClassificationLevel
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED_EXEC">RESTRICTED_EXEC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Extracted Text / CSV Table / Document Excerpt
                </label>
                <textarea
                  rows={4}
                  data-testid="flatfile-content-input"
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>

              {/* Quick Format Sample Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    label: 'Sample .PPTX Deck',
                    name: 'Snowflake_AI_Data_Cloud_2026.pptx',
                    fmt: 'PowerPoint (.pptx)' as SupportedDocumentOrFlatfileFormatV58,
                    topic: 'Snowflake AI Data Cloud & Cortex Architecture',
                    body: 'Slide 1: Snowflake Horizon Catalog & Iceberg Tables\nSlide 2: Cortex AI SQL & Document AI 99.95% SLA across AWS, Azure, and GCP.',
                  },
                  {
                    label: 'Sample .XLSX Sheet',
                    name: 'Q4_Enterprise_Security_Spend_Matrix.xlsx',
                    fmt: 'Excel (.xlsx)' as SupportedDocumentOrFlatfileFormatV58,
                    topic: 'Q4 Enterprise Security Spend Matrix',
                    body: 'Department,Tool Suite,Annual Spend USD,ROI Savings\nSOC Operations,Gurucul REVEAL SIEM,420000,58% Log Reduction\nCloud Security,Prisma Cloud CNAPP,310000,45% Faster Triage',
                  },
                  {
                    label: 'Sample .DOCX Spec',
                    name: 'Zero_Trust_IAM_Governance_Charter.docx',
                    fmt: 'Word (.docx)' as SupportedDocumentOrFlatfileFormatV58,
                    topic: 'Zero Trust IAM Governance Charter',
                    body: 'Section 1: Least-Privilege RBAC & Scoped OAuth2 Tokens for all MCP Servers.\nSection 2: Mandatory >=2 Knowledge Shard Cross-Referencing on executive outputs.',
                  },
                ].map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setFileName(sample.name);
                      setFileFormat(sample.fmt);
                      setFileTopic(sample.topic);
                      setFileContent(sample.body);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                data-testid="ingest-flatfile-shard-btn"
                onClick={handleIngestDocumentOrFlatfile}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <FileText className="w-4 h-4" />
                Parse Document / Flatfile & Commit to Knowledge Shard
              </button>
            </div>
          </div>

          {/* Right Column: Ingested Documents & Extracted OCR/Schema Tables */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              Ingested Office Documents & Flatfile Shards (
              {snapshot.ingestedDocumentsAndFlatfiles.length} Indexed)
            </h3>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {snapshot.ingestedDocumentsAndFlatfiles.map((doc) => (
                <div
                  key={doc.recordId}
                  data-testid={`ingested-doc-card-${doc.recordId}`}
                  className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-white">{doc.fileName}</span>
                      <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {doc.detectedFormat}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {doc.docIdGenerated} · {doc.ggufShardFile}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Parser: <code className="text-slate-200">{doc.parserUsed}</code> · ACL:{' '}
                    <span className="text-amber-300 font-semibold">{doc.classification}</span>
                  </div>

                  {/* Extracted Table Preview */}
                  {doc.extractedTable && (
                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-900 text-slate-300">
                          <tr>
                            {doc.extractedTable.headers.map((h, i) => (
                              <th key={i} className="px-2.5 py-1.5 font-semibold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 text-slate-300">
                          {doc.extractedTable.rows.slice(0, 3).map((row, rIdx) => (
                            <tr key={rIdx} className="bg-slate-950/60">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-2.5 py-1">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: MCP SERVER REGISTRY, INBOUND MCP/REST HOST & SUB-AGENT DELEGATION
          ===================================================================== */}
      {activeTab === 'mcp_agent_hub' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 Cols: Register Outbound MCP Server */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  A. Connect Outbound MCP Server (Client Mode)
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {snapshot.mcpServerRegistry.length} Registered Servers
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Register external MCP tool servers (<code className="text-emerald-300">mcp://</code>)
                with scoped OAuth2 credentials and least-privilege RBAC enforcement.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    MCP Server URI
                  </label>
                  <input
                    type="text"
                    data-testid="custom-mcp-uri-input"
                    value={customMcpUri}
                    onChange={(e) => setCustomMcpUri(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Server Name
                  </label>
                  <input
                    type="text"
                    value={customMcpName}
                    onChange={(e) => setCustomMcpName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Target Endpoint / Connector
                  </label>
                  <input
                    type="text"
                    value={customMcpTarget}
                    onChange={(e) => setCustomMcpTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Transport Protocol
                  </label>
                  <select
                    value={customMcpTransport}
                    onChange={(e) =>
                      setCustomMcpTransport(
                        e.target.value as
                          | 'stdio'
                          | 'Streamable HTTP / SSE'
                          | 'JSON-RPC 2.0 REST'
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Streamable HTTP / SSE">Streamable HTTP / SSE</option>
                    <option value="JSON-RPC 2.0 REST">JSON-RPC 2.0 REST</option>
                    <option value="stdio">stdio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Exposed Tools & Scopes (comma-separated)
                </label>
                <input
                  type="text"
                  value={customMcpTools}
                  onChange={(e) => setCustomMcpTools(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>

              <button
                type="button"
                data-testid="register-custom-mcp-btn"
                onClick={handleRegisterCustomMcp}
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Register Outbound MCP Server in Federation Registry
              </button>

              {/* Compact List of Registered Outbound MCP Servers */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pt-2 border-t border-slate-800">
                {snapshot.mcpServerRegistry.map((srv) => (
                  <div
                    key={srv.uri}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-emerald-300">{srv.uri}</span>
                      <span className="text-slate-400 ml-2">{srv.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {srv.accessLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 Cols: Act as Inbound MCP Server & REST Endpoint */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  B. Act as Inbound MCP Server & REST Endpoint (Host Mode)
                </h3>
                <button
                  type="button"
                  data-testid="inbound-mcp-server-toggle"
                  onClick={() =>
                    handleToggleInboundMcpServer(
                      !snapshot.inboundMcpManifest.inboundServerEnabled
                    )
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    snapshot.inboundMcpManifest.inboundServerEnabled
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {snapshot.inboundMcpManifest.inboundServerEnabled
                    ? 'INBOUND MCP SERVER: ONLINE'
                    : 'INBOUND MCP SERVER: PAUSED'}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                External MCP servers, orchestrators (Claude Desktop, Cursor, LangGraph, n8n), and
                partner agents can call Panini via{' '}
                <code className="text-indigo-300">GET /api/mcp/manifest</code> and{' '}
                <code className="text-indigo-300">POST /api/mcp/rpc</code> (JSON-RPC 2.0).
              </p>

              {/* Copyable cURL Snippet */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Inbound JSON-RPC 2.0 Endpoint (/api/mcp/rpc)</span>
                  <button
                    type="button"
                    onClick={handleCopyCurl}
                    className="flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
                  >
                    {copiedCurl ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy cURL
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {inboundCurlSnippet}
                </pre>
              </div>

              {/* Interactive JSON-RPC 2.0 Tester */}
              <div className="flex items-center gap-2">
                <select
                  value={rpcTestMethod}
                  onChange={(e) =>
                    setRpcTestMethod(
                      e.target.value as
                        | 'tools/list'
                        | 'tools/call'
                        | 'resources/list'
                        | 'agent/delegate'
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                >
                  <option value="tools/call">
                    tools/call (panini_hybrid_rag_search)
                  </option>
                  <option value="tools/list">tools/list (Discover 5 MCP Tools)</option>
                  <option value="resources/list">
                    resources/list (Discover shard:// URIs)
                  </option>
                  <option value="agent/delegate">
                    agent/delegate (Multi-Agent Task)
                  </option>
                </select>

                <button
                  type="button"
                  data-testid="test-inbound-mcp-rpc-btn"
                  onClick={handleRunInboundMcpRpcTest}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Test Inbound MCP JSON-RPC 2.0 Call
                </button>
              </div>

              {rpcTestResponse && (
                <div
                  data-testid="inbound-mcp-rpc-output"
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-44 overflow-y-auto"
                >
                  <div className="text-[10px] font-mono text-indigo-300 mb-1">
                    JSON-RPC 2.0 Response · methodHandled: {rpcTestResponse.result.methodHandled} ·{' '}
                    {rpcTestResponse.result.latencyMs} ms
                  </div>
                  <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap">
                    {JSON.stringify(rpcTestResponse.result.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Full-Width Card: Agentic Sub-Agent Delegation Orchestrator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  C. Agentic Sub-Agent Delegation Orchestrator (Make Specialized Agents Work for the
                  Solution)
                </h3>
                <p className="text-xs text-slate-400">
                  Dispatches your objective across specialized worker agents (Web Shard Harvester,
                  Federated RAG & Flatfile Schema Agent, OpenXML PPTX/DOCX/XLSX Synthesis Agent,
                  Guardrail & Logit-Variance Auditor Agent, plus any custom federated MCP partner
                  agents) and synthesizes a cross-referenced solution.
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                POST /api/v58/agents/delegate
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                data-testid="agent-delegation-goal-input"
                value={delegationGoal}
                onChange={(e) => setDelegationGoal(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <button
                type="button"
                data-testid="run-agent-delegation-btn"
                onClick={handleRunSubAgentDelegation}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shrink-0 shadow-md"
              >
                <Bot className="w-4 h-4" />
                Delegate Task Across Sub-Agents
              </button>
            </div>

            {/* Latest Multi-Agent Delegation Execution Result */}
            {snapshot.recentDelegationRuns[0] && (
              <div
                data-testid="agent-delegation-result-card"
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-white">
                    Run {snapshot.recentDelegationRuns[0].delegationRunId} ·{' '}
                    {snapshot.recentDelegationRuns[0].coordinatorAgent}
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      {snapshot.recentDelegationRuns[0].subAgentsDispatchedCount} Sub-Agents
                      Collaborated
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {snapshot.recentDelegationRuns[0].totalLatencyMs} ms total
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {snapshot.recentDelegationRuns[0].subAgentExecutions.map((ag) => (
                    <div
                      key={ag.agentId}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-300">
                          {ag.agentName}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {ag.confidencePct}% · {ag.latencyMs}ms
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {ag.protocolUsed} → {ag.targetEndpointOrUri}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {ag.outputSummary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
