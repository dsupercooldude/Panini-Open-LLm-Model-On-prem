# Panini Sovereign Master AI — REST API, Backend CLI (`panini-cli`) & MCP Usage Guide (`v6.4-GA / SVN-r414.0-GA`)

> **Compatibility warning:** The endpoint, CLI, MCP, model, and verification descriptions below are legacy documentation, not a contract for the current prototype. In particular, the stated `30/30` endpoint pass rate, model downloads, GGUF export, training, and generated speech are not verified and must not be relied on. The API report now returns `NOT_EXECUTED`; unsupported model artifact operations fail closed. Production API access requires the configured sign-in described in the repository [README.md](../../../../README.md). Treat each route as unsupported until it has a real integration test and current implementation evidence.

## 1. Overview & KISS Architecture Principles

This dedicated artifact provides the complete, copy-ready reference for integrating with, operating, and troubleshooting **Panini Sovereign Master AI (`v6.4-GA / SVN-r414.0-GA`)** across three unified interfaces:

1. **REST API (`30` Verified Endpoints under `/api/*`)**: Covers Portable GGUF v3 Binary, Ollama `Modelfile` & Installer Export (`POST /api/v64/models/export`, `GET /api/v64/models/export/:modelId`), Online Frontier Model Hub Menu & Auto-Installer (`GET/POST /api/v64/terminal/model-menu`, `GET /api/v64/terminal/autocomplete`), Autonomous Self-Learning Model Auto-Updater (`POST /api/v64/models/self-learn-tune`), D3 Sub-Graph Export to `.GGUF` Shard (`POST /api/v64/integrations/d3-subgraph-export`), Local Model Text-to-Speech (`POST /api/v63/tts/synthesize`, `GET /api/v63/tts/voices`), D3 Interactive Knowledge Graph (`GET /api/v63/integrations/knowledge-graph`), Interactive GGUF Fetch & Auto-Update Terminal (`POST /api/v63/gguf/terminal-exec`, `GET /api/v63/gguf/hosted-catalog`), Streaming Multi-Agent MCP DAG Recorder (`POST /api/v63/mcp/dag-recorder`), Google Search & Multi-Engine Grounding (`/api/search/google`, `/api/search`), `150s` Deep Research & Prompt Engineering (`/api/v60/research-and-engineer`), Multimodal 4K Image Studio (`/api/multimodal/image`), `.gguf` Knowledge Shard CRUD & P2P Mesh Sync (`/api/v61/shards`, `/api/v62/shards/p2p-sync`), Prepackaged Local Offline RBAC & FIDO2/WebAuthn Hardware-Key Signing (`/api/v61/rbac/users`, `/api/v62/rbac/fido2-sign`), GGUF Model Registry Updates (`/api/v60/gguf-parse-and-update`), and Swagger Request History & Replay Export (`/api/v62/swagger/replay`).
2. **Backend CLI (`panini-cli` — `22` Commands + Auto-Complete + `INFO`/`DEBUG`/`VERBOSE` Modes + `/?` Command Guides + Online Model Menu)**: Run directly from the terminal (`npm run panini-cli -- <command>`), inside the **Admin Model Registry Interactive GGUF Terminal** (`POST /api/v63/gguf/terminal-exec`), or via the Admin Console interactive CLI terminal (`POST /api/v61/cli/exec`) with Tab auto-complete, selectable `INFO` / `DEBUG` / `VERBOSE` output modes, `/?` interactive Command Guides, and `panini-cli model-menu` (`/menu`) to browse and auto-install `DeepSeek`, `Llama`, `GLM`, `MiMo`, `Kimi`, `Bonsai D3`, and `Qwen` models, export `.gguf` binaries (`panini-cli export-gguf`), run self-learning auto-tuning (`panini-cli self-learn tune`), monitor live TUI telemetry (`panini-cli top`), synthesize local neural TTS (`panini-cli tts`), build D3 Knowledge Graphs (`panini-cli graph`), and fetch online hosted `.gguf` models via `ollama`, `curl`, `irm`, or `wget`.
3. **Model Context Protocol (`MCP 2025-06-18` JSON-RPC 2.0 Server, Agentic Sub-Agent Delegation & Streaming DAG Recorder)**: Connect external AI hosts (Claude Desktop, Cursor, Windsurf, LangGraph, n8n) to Panini (`GET /api/mcp/manifest`, `POST /api/mcp/rpc`), invoke sovereign tools (`panini_hybrid_rag_search`, `panini_generate_openxml_pptx`, `panini_verify_guardrails_and_reground`, `panini_delegate_subagents`), and record deterministic multi-agent DAG executions (`POST /api/v63/mcp/dag-recorder`).

---

## 2. Historical REST API Reference (routes and behaviors are not verified)

### 2.1 Summary Table of All Documented REST Endpoints

| # | Method | Path | Category | Min Role | Purpose & Primary Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `POST` | `/api/v64/models/export` | `Model Registry & GGUF Export` (`v6.4-GA`) | `Viewer` | **Portable `.GGUF` v3 Binary, Ollama `Modelfile` & Installer Exporter (`v6.4-GA`)**: Generates a valid GGUF v3 binary (`0x47475546`), Ollama `Modelfile`, and cross-platform `.sh`/`.ps1` installer script so any Panini model can be imported into Ollama (`ollama create`), LM Studio, or `llama.cpp` (`GET /api/v64/models/export/:modelId?format=gguf\|modelfile\|installer` also supported). |
| **2** | `POST` | `/api/v64/terminal/model-menu` | `Online Model Hub Menu` (`v6.4-GA`) | `Admin` | **Online Frontier Model Hub Menu & Auto-Installer (`v6.4-GA`)**: Lists (`GET`) or automatically installs (`POST`) frontier models from **`DeepSeek`**, **`Llama`**, **`GLM`**, **`MiMo`**, **`Kimi`**, **`Bonsai D3`**, and **`Qwen`** (`GET /api/v64/terminal/autocomplete?q=...` also supported). |
| **3** | `POST` | `/api/v64/models/self-learn-tune` | `Self-Learning Auto-Tuner` (`v6.4-GA`) | `Admin` | **Autonomous Self-Learning Model Auto-Updater & QLoRA Tuner (`v6.4-GA`)**: Harvests verified `.gguf` Knowledge Shards and D3 Knowledge Graph entities to auto-tune LoRA rank (`96`), alpha (`192`), temperature (`0.18`), top-p (`0.90`), and differential GGUF tensors (`GET /api/v64/models/self-learn-tune` returns state). |
| **4** | `POST` | `/api/v64/integrations/d3-subgraph-export` | `D3 Graph & Shards` (`v6.4-GA`) | `Analyst` | **D3 Sub-Graph Export to Standalone `.GGUF` Shard (`v6.4-GA`)**: Exports a filtered D3 Knowledge Graph entity-chunk cluster directly into a standalone `.gguf` Knowledge Shard (`POST /api/v64/voice/duplex` also available for bidirectional voice-to-voice turns). |
| **5** | `POST` | `/api/v63/tts/synthesize` | `Accessibility & Local TTS` (`v6.3-GA`) | `Viewer` | **Local Model Neural Text-to-Speech Synthesizer (`v6.3-GA`)**: Synthesizes 16-bit PCM RIFF/WAV audio (`data:audio/wav;base64,...`) using the selected local GGUF voice profile (`panini-aura-en-us-f1`..`panini-kavya-airgap-dsp`) (`GET /api/v63/tts/voices` lists all 6 voice profiles). |
| **6** | `GET` | `/api/v63/integrations/knowledge-graph` | `Integrations Hub & D3 Graph` (`v6.3-GA`) | `Viewer` | **D3 Interactive Knowledge Graph Builder (`v6.3-GA`)**: Returns `nodes` (`DOCUMENT_CHUNK`, `ENTITY`, `KNOWLEDGE_SHARD`, `CONNECTOR_SOURCE`) and `links` (`MENTIONS_ENTITY`, `INDEXED_IN_SHARD`, `INGESTED_FROM_CONNECTOR`, `CO_OCCURS_WITH`, `CITES_VERIFIED_FACT`) for the D3 force-directed graph. |
| **7** | `POST` | `/api/v63/gguf/terminal-exec` | `Model Registry & GGUF` (`v6.3-GA` / `v6.4-GA`) | `Admin` | **Interactive GGUF Fetch & Auto-Update Terminal (`v6.3-GA` / `v6.4-GA`)**: Executes `ollama`, `curl`, `irm`, `wget`, `/?`, or `/menu` (`panini-cli model-menu`) with `INFO` / `DEBUG` / `VERBOSE` output modes, parses GGUF v3 headers (`0x47475546`), and automatically updates the target Panini model. |
| **8** | `POST` | `/api/v63/mcp/dag-recorder` | `MCP JSON-RPC 2.0 & DAG` (`v6.3-GA`) | `Developer` | **Streaming Multi-Agent MCP DAG Recorder & WASM OpenXML Verifier (`v6.3-GA`)**: Records deterministic multi-agent MCP delegation runs with per-step logit-variance diffing and ECMA-376 OpenXML `.pptx` verification (`GET /api/v63/mcp/dag-recorder` lists history). |
| **1** | `POST` | `/api/search/google` | `Search & Grounding` | `Viewer` | **Google Search & Knowledge Graph Grounding (`v6.2-GA`)**: Queries Google Search Grounding (`@google/genai` `googleSearch` tool + Google News/Web RSS + Knowledge Graph) alongside Wikipedia, Wikidata, OpenAlex, and Crossref, and auto-saves verified facts into local `.gguf` Knowledge Shards. |
| **2** | `POST` | `/api/search` | `Search & Grounding` | `Viewer` | **Unified Multi-Engine Online Search**: Parallel query across Google Search, Wikipedia REST Summary/Extracts, Wikidata, OpenAlex, and Crossref (`GET /api/search?q=...` and `POST /api/search/online` also supported). |
| **3** | `POST` | `/api/v60/research-and-engineer` | `Research & Prompt Engineering` | `Viewer` | **`150s` Deep Research & Backend Prompt Engineer**: Auto-engineers raw user prompts, probes live Google/Wikipedia/OpenAlex/Crossref sources when online, updates `.gguf` shards, and returns the 5-stage `150s` Deep Verification plan. |
| **4** | `POST` | `/api/multimodal/image` | `Multimodal & Media` | `Viewer` | **4K Image Studio & Grounded Photographic Plate Synthesizer (`v6.2-GA`)**: Synthesizes a 3D volumetric scene (`Panini-Aether-3D`) paired with a grounded Wikimedia/Google photographic reference plate or deterministic high-res SVG plate (`photographicPlateUrl`) and persists a visual Knowledge Shard. |
| **5** | `POST` | `/api/v61/shards` | `Knowledge Shards & RAG` | `Analyst` | **Save & Merge Knowledge Shard**: Creates or updates a local `.gguf` Knowledge Shard (`upsertAndIndexKnowledgeShardV61`), deduplicating and merging new sources/facts with existing shards and indexing into Hybrid RAG & PPTX Tier 2. |
| **6** | `GET` | `/api/v61/shards` | `Knowledge Shards & RAG` | `Viewer` | **List Active Knowledge Shards**: Returns all active `.gguf` Knowledge Shards stored in `/data/panini-local-sovereign-db.json` and the active memory vault. |
| **7** | `POST` | `/api/v62/shards/p2p-sync` | `Knowledge Shards & RAG` | `Analyst` | **Distributed Peer-to-Peer GGUF Shard Mesh Sync (`v6.2-GA`)**: Synchronizes `.gguf` Knowledge Shard deltas across LAN / Air-Gap workstation peers (`peer-blr-01`, `peer-hyd-02`, `peer-mum-dr-03`, `peer-del-airgap-04`) using SHA-256 Merkle trees (`GET /api/v62/shards/p2p-sync` also supported). |
| **8** | `POST` | `/api/v60/gguf-parse-and-update` | `Model Registry & GGUF` | `Admin` | **GGUF v3 Binary Parser & Panini Model Updater**: Parses `.gguf` (`0x47475546` v3) headers and KV metadata (`Q4_K_M`, `Q5_K_M`, `Q8_0`, `IQ3_XXS`), commits a new Panini model version, and syncs embedded calibration facts to a shard. |
| **9** | `POST` | `/api/mcp/rpc` | `MCP JSON-RPC 2.0` | `Analyst` | **Inbound MCP JSON-RPC 2.0 Endpoint (`2025-06-18`)**: Handles `initialize`, `tools/list`, `tools/call`, and `resources/read` requests from external MCP clients. |
| **10** | `GET` | `/api/mcp/manifest` | `MCP JSON-RPC 2.0` | `Viewer` | **MCP Server Discovery Manifest**: Returns Panini's MCP protocol version, capabilities, 4 sovereign tools, and `panini://shards/*` resource templates. |
| **11** | `POST` | `/api/v58/integrations/delegate-agents` | `Agentic Orchestration` | `Developer` | **Multi-Agent Sub-Agent Delegation**: Dispatches complex goals across `Panini-Atlas-Research-Agent`, `Panini-Chronos-FactVerifier-Agent`, `Panini-Polyglot-OpenXML-Agent`, and `Panini-Veritas-Guardrail-Agent`. |
| **12** | `POST` | `/api/v58/integrations/ingest-website` | `Integrations Hub` | `Analyst` | **Website URL &rarr; Knowledge Shard Crawler**: Crawls an external website/documentation portal, extracts structured facts, and indexes an ACL-scoped chunk into Hybrid RAG. |
| **13** | `POST` | `/api/v58/integrations/connect-rag` | `Integrations Hub` | `Admin` | **External RAG Cluster Connector**: Federates `Qdrant`, `Milvus`, `Pinecone`, `Weaviate`, or `PGVector` collections into Panini Hybrid RAG and local `.gguf` shards. |
| **14** | `POST` | `/api/v58/integrations/ingest-file` | `Integrations Hub` | `Analyst` | **Multi-Format Document & Flatfile Ingestor**: Extracts tables and facts from `.pdf`, `.pptx`, `.docx`, `.xlsx`, `.csv`, `.tsv`, `.json`, and `.md` files into local `.gguf` shards. |
| **15** | `GET` / `POST` | `/api/v61/rbac/users` | `Local Offline RBAC` | `Viewer` / `Admin` | **Prepackaged Local Offline RBAC User Database**: Lists (`GET`) or upserts/verifies (`POST`) local operators (`@elena_rostova`, `@marcus_vance`, `@priya_nair`, `@arjun_mehta`, `@sarah_chen`) stored in `/data/panini-local-sovereign-db.json` with zero cloud dependency. |
| **16** | `POST` | `/api/v62/rbac/fido2-sign` | `Local Offline RBAC` | `Admin` | **Cryptographic FIDO2 / WebAuthn Hardware-Key Signing (`v6.2-GA`)**: Generates and verifies an offline EdDSA (`COSE Alg -8 / Ed25519`) hardware-key attestation signature (`YubiKey 5C NFC FIPS`) for role transitions and `RESTRICTED_EXEC` access (`GET /api/v62/rbac/fido2-sign` lists ledger). |
| **17** | `POST` / `GET` | `/api/v61/settings` | `Runtime Configuration` | `Viewer` | **Persistent Sovereign Settings (Online by Default)**: Reads or updates persistent settings (`isOnlineLearning: true` by default) across browser sessions and server restarts. |
| **18** | `POST` | `/api/v61/cli/exec` | `Backend CLI & QA` | `Developer` | **Backend CLI (`panini-cli`) Executor**: Executes any `panini-cli` command on the backend and returns structured `stdout`, `stderr`, and `exitCode`. |
| **19** | `POST` | `/api/v62/swagger/replay` | `Swagger & QA` | `Developer` | **Swagger UI Request History Recorder & Replay Exporter (`v6.2-GA`)**: Records live API executions and generates ready-to-run `cURL`, `TypeScript (Vitest)`, and `Python (pytest)` regression test scripts (`GET /api/v62/swagger/replay` lists history; `POST /api/v61/test-all-endpoints`, `GET /api/v60/docs/rest-mcp-pdf`, and `POST /api/v61/releases/sync-artifacts` also available). |

---

### 2.2 Key REST API Request & Response Examples

#### A. Google Search & Knowledge Graph Grounding (`POST /api/search/google`)
```bash
curl -X POST http://localhost:3000/api/search/google \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Gurucul company history REVEAL platform UEBA SIEM",
    "persistToShard": true
  }'
```

#### B. 4K Image Studio & Grounded Photographic Plate Synthesis (`POST /api/multimodal/image`)
```bash
curl -X POST http://localhost:3000/api/multimodal/image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a 4K architectural visualization of a sovereign AI liquid-cooled data center",
    "isOnline": true
  }'
```

#### C. Save & Merge Multi-Source Knowledge Shard (`POST /api/v61/shards`)
```bash
curl -X POST http://localhost:3000/api/v61/shards \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Rubrik Zero Trust Data Security",
    "sources": ["https://www.rubrik.com/products/security-cloud", "Rubrik 2026 SEC 10-K"],
    "facts": [
      "Rubrik was founded inDecember 2013 in Palo Alto, California by Bipul Sinha, Arvind Jain, Soham Mazumdar, and Arvind Nithrakashyap.",
      "Rubrik Security Cloud delivers immutable air-gapped backups, ransomware anomaly detection, and DSPM."
    ],
    "classification": "INTERNAL",
    "mergeWithExisting": true
  }'
```

#### D. Sync Peer-to-Peer GGUF Shard Mesh (`POST /api/v62/shards/p2p-sync`)
```bash
curl -X POST http://localhost:3000/api/v62/shards/p2p-sync \
  -H "Content-Type: application/json" \
  -d '{"targetPeerId": "peer-mum-dr-03"}'
```

#### E. Sign RBAC Action with FIDO2 / WebAuthn Hardware Passkey (`POST /api/v62/rbac/fido2-sign`)
```bash
curl -X POST http://localhost:3000/api/v62/rbac/fido2-sign \
  -H "Content-Type: application/json" \
  -d '{
    "userHandle": "@elena_rostova",
    "actionType": "RESTRICTED_EXEC_DOCUMENT_ACCESS",
    "targetResource": "DOC-EXEC-401",
    "authenticatorModel": "YubiKey 5C NFC FIPS (FIDO2 / WebAuthn L2)"
  }'
```

#### F. Local Model Text-to-Speech (TTS) Audio Synthesis (`POST /api/v63/tts/synthesize`)
```bash
curl -X POST http://localhost:3000/api/v63/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Panini v6.3 local model neural audio synthesis verified for accessibility.",
    "voiceId": "panini-aura-en-us-f1",
    "speechRate": 1.0
  }'
```

#### G. D3 Interactive Knowledge Graph (`GET /api/v63/integrations/knowledge-graph`)
```bash
curl "http://localhost:3000/api/v63/integrations/knowledge-graph?focusQuery=Snowflake%20AI%20Data%20Cloud"
```

#### H. Interactive GGUF Fetch & Auto-Update Terminal (`POST /api/v63/gguf/terminal-exec`)
```bash
curl -X POST http://localhost:3000/api/v63/gguf/terminal-exec \
  -H "Content-Type: application/json" \
  -d '{
    "command": "curl -L https://models.panini.local/gguf/panini-400b-moe-flagship-v6.3-q5_k_m.gguf -o panini-400b-moe-flagship-v6.3-q5_k_m.gguf --apply --debug",
    "targetModelId": "panini-400b-flagship",
    "outputMode": "DEBUG"
  }'
```

#### I. Export Portable `.GGUF` Binary, Ollama `Modelfile` & Installer Script (`POST /api/v64/models/export`)
```bash
curl -X POST http://localhost:3000/api/v64/models/export \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "panini-400b-flagship",
    "modelName": "Panini-400B-MoE-Flagship",
    "quantType": "Q5_K_M"
  }'
```

#### J. Auto-Install Online Frontier Model (`DeepSeek`, `Llama`, `GLM`, `MiMo`, `Kimi`, `Bonsai D3`, `Qwen`) (`POST /api/v64/terminal/model-menu`)
```bash
curl -X POST http://localhost:3000/api/v64/terminal/model-menu \
  -H "Content-Type: application/json" \
  -d '{
    "modelKeyOrFamily": "deepseek",
    "targetPaniniModelId": "panini-400b-flagship",
    "outputMode": "DEBUG"
  }'
```

#### K. Trigger Autonomous Self-Learning Model Auto-Update & QLoRA Tuning (`POST /api/v64/models/self-learn-tune`)
```bash
curl -X POST http://localhost:3000/api/v64/models/self-learn-tune \
  -H "Content-Type: application/json" \
  -d '{
    "targetModelId": "panini-400b-flagship",
    "tuningStrategy": "QLoRA-Differential-HotSwap",
    "enableAutoContinuousLearning": true
  }'
```

---

## 3. Backend CLI (`panini-cli`) & Ollama/cURL/IRM/Wget GGUF Terminal Reference (`22` Commands · Tab Auto-Complete · `INFO`/`DEBUG`/`VERBOSE` Modes · `/?` Command Guides)

You can run `panini-cli` and GGUF terminal commands in four ways:
1. **Terminal / Shell**: `npm run panini-cli -- <subcommand>` (or `npx tsx cli/panini-cli.ts <subcommand>`)
2. **Admin Model Registry GGUF Terminal**: Open **Admin Console &rarr; Model Registry &rarr; GGUF Model Updater &rarr; GGUF Fetch, Auto-Complete & Online Model Hub Terminal** (`data-testid="gguf-interactive-terminal-panel"`)
3. **Admin Docs CLI Terminal**: Open **Admin Console &rarr; REST API, MCP & CLI Docs &rarr; Backend CLI (`panini-cli` & Ollama)** (`data-testid="docs-section-cli-terminal"`)
4. **REST API**: `POST /api/v61/cli/exec` or `POST /api/v63/gguf/terminal-exec`

### 3.1 Complete `panini-cli` & GGUF Terminal Command Matrix (`22` Commands)

| # | CLI Command Syntax | Category | What It Does & When To Use |
| :--- | :--- | :--- | :--- |
| **1** | `panini-cli model-menu [install <deepseek\|llama\|glm\|mimo\|kimi\|bonsai-d3\|qwen>]` (or `/menu`) | `Online Model Hub Menu` (`v6.4-GA`) | Opens the interactive Online Frontier Model Hub Menu or automatically downloads, parses GGUF v3 headers (`0x47475546`), and installs the selected model (`DeepSeek`, `Llama`, `GLM`, `MiMo`, `Kimi`, `Bonsai D3`, `Qwen`). |
| **2** | `panini-cli export-gguf --model <id> --quant <Q5_K_M\|Q4_K_M\|Q8_0>` | `Portable GGUF Exporter` (`v6.4-GA`) | Exports a downloadable `.gguf` v3 binary, Ollama `Modelfile`, and cross-platform installer scripts (`.sh`/`.ps1`) so any Panini model can be imported into Ollama, LM Studio, or `llama.cpp`. |
| **3** | `panini-cli self-learn tune --model <id>` | `Self-Learning Auto-Tuner` (`v6.4-GA`) | Harvests verified `.gguf` Knowledge Shards and D3 Knowledge Graph entities to auto-tune LoRA rank, alpha, temperature, top-p, and differential GGUF tensors without model downtime. |
| **4** | `panini-cli /?` (or `/?`, `ollama /?`) | `Interactive Command Guide` (`v6.4-GA`) | Displays the interactive Command Guide detailing all terminal commands, output verbosity flags (`--info`, `--debug`, `--verbose`), Tab auto-complete, and online model menu syntax. |
| **5** | `panini-cli doctor [--debug \| --info \| --verbose]` | `Diagnostics & Network` | Runs a full diagnostic audit of network mode (`Online` by default), persistent SQLite/JSON database (`/data/panini-local-sovereign-db.json`), active `.gguf` Knowledge Shards, GGUF models, local TTS voice, local RBAC users, and all `25/25` CI/CD gates. |
| **6** | `panini-cli top` | `TUI Telemetry Monitor` (`v6.3-GA`) | Renders the interactive TUI telemetry snapshot showing GPU queue utilization, active `.gguf` shards, active Local TTS voice, recorded Multi-Agent MCP DAG runs, and CI/CD gate health. |
| **7** | `panini-cli tts "<text>" --voice <voice-id>` | `Local Model TTS` (`v6.3-GA`) | Synthesizes 16-bit PCM RIFF/WAV audio using the local neural GGUF vocalizer (`panini-aura-en-us-f1`..`panini-kavya-airgap-dsp`). |
| **8** | `panini-cli graph --query "<topic>"` | `D3 Knowledge Graph` (`v6.3-GA`) | Builds the D3 Knowledge Graph for a topic and prints counts of `DOCUMENT_CHUNK`, `ENTITY`, `KNOWLEDGE_SHARD`, and `CONNECTOR_SOURCE` nodes and relationship edges. |
| **9** | `curl \| wget \| irm \| ollama pull <hosted-gguf-url-or-file> [--debug]` | `GGUF Terminal Fetch & Apply` (`v6.3-GA`) | Fetches an online hosted `.gguf` file via `curl`, `wget`, `irm` (`Invoke-RestMethod`), or `ollama pull`, verifies the `0x47475546` v3 header, and automatically applies the update to the target Panini model. |
| **10** | `panini-cli net-check` | `Diagnostics & Network` | Probes live internet connectivity across Google Search, Wikipedia REST API, Wikidata, OpenAlex, and Crossref, and verifies persistent network configuration. |
| **11** | `panini-cli config --mode online\|offline` | `Diagnostics & Network` | Switches the persistent runtime between Online mode (`online` — default) and Air-Gapped Offline mode (`offline`), saving immediately to `/data/panini-local-sovereign-db.json`. |
| **12** | `panini-cli search "<query>" --engine google` | `Search & Grounding` (`v6.2-GA`) | Executes a live Google Search & Knowledge Graph query from the CLI, prints verified snippets and URLs, and persists the facts into a local `.gguf` Knowledge Shard. |
| **13** | `panini-cli shard list` | `Knowledge Shards` | Lists all local `.gguf` Knowledge Shards with shard ID, topic, merged source count, verified fact count, and last-updated timestamp. |
| **14** | `panini-cli shard show "<topic>"` | `Knowledge Shards` | Inspects the full contents (sources, facts, domain category, and `.gguf` path) of a specific Knowledge Shard (e.g., `panini-cli shard show "Gurucul"`). |
| **15** | `panini-cli shard save --topic "<T>" --source "<S>" --facts "<F1>; <F2>"` | `Knowledge Shards` | Saves a new Knowledge Shard or merges additional sources and semicolon-separated facts into an existing shard so Chat, Coding, and PPTX immediately use it. |
| **16** | `panini-cli mesh sync` | `Knowledge Shards` (`v6.2-GA`) | Synchronizes `.gguf` Knowledge Shard deltas across all LAN / Air-Gap P2P mesh peers and prints the SHA-256 Merkle root. |
| **17** | `panini-cli ollama list` | `Ollama & GGUF Models` | Lists all registered Panini models and pre-built `.gguf` (`0x47475546` v3) packages in Ollama-compatible format (`NAME`, `ID`, `QUANT`, `SIZE`, `MODIFIED`). |
| **18** | `panini-cli ollama pull <gguf-package-name>` | `Ollama & GGUF Models` | Parses a `.gguf` v3 binary package (e.g., `panini-coder-polyglot-v6.3-q8_0.gguf`), updates the target Panini model's quantization/layers/context, and syncs its calibration shard. |
| **19** | `panini-cli ollama show <model-id-or-name>` | `Ollama & GGUF Models` | Displays GGUF v3 architecture metadata, tensor count, quantization scheme, context window, and active LoRA rank for a Panini model. |
| **20** | `panini-cli ollama run <model> "<prompt>"` | `Ollama & GGUF Models` | Runs a grounded synthesis turn against the specified Panini model directly from the CLI, applying backend prompt engineering and shard lookup. |
| **21** | `panini-cli rbac list` / `panini-cli rbac sign --user <handle> --action <action>` | `Local Offline RBAC` (`v6.2-GA`) | Lists prepackaged local offline RBAC operators or signs an RBAC role transition / `RESTRICTED_EXEC` access check using offline FIDO2 / WebAuthn (`EdDSA / Ed25519`) hardware-key attestation. |
| **22** | `panini-cli release sync` / `panini-cli test-endpoints` | `CI/CD & Release Sync` | Runs `syncReleaseDocumentationAndArtifactsV61()` and `runAllApiEndpointsVerificationSuiteV61()` (`30/30` endpoints), syncing the active release (`v6.4-GA`), REST/MCP docs, `%PDF-1.4` manual, and all 4 Markdown artifacts. |

---

## 4. Model Context Protocol (`MCP 2025-06-18`) Server & Agent Usage Guide

### 4.1 Connecting External MCP Hosts (Claude Desktop, Cursor, Windsurf, OpenAI Agents)

Add the following server entry to your `claude_desktop_config.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "panini-sovereign-master": {
      "url": "http://localhost:3000/api/mcp/rpc",
      "transport": "http-jsonrpc-2.0",
      "protocolVersion": "2025-06-18",
      "headers": {
        "Authorization": "Bearer panini-local-passkey-ed25519",
        "X-Panini-ACL-Role": "Admin"
      }
    }
  }
}
```

### 4.2 Inbound MCP JSON-RPC 2.0 Methods (`POST /api/mcp/rpc`)

1. **`initialize`**: Handshakes protocol version (`2025-06-18`) and returns server capabilities (`tools`, `resources`, `prompts`).
2. **`tools/list`**: Returns the 4 sovereign tools exposed by Panini:
   - **`panini_hybrid_rag_search`**: Executes permission-aware Hybrid Search (`0.35 * BM25 + 0.65 * Vector Cosine` + `bge-reranker-v2-m3-cross-encoder`) across authorized documents and `.gguf` Knowledge Shards (`arguments: { query, role, enforceSourceVerification }`).
   - **`panini_generate_openxml_pptx`**: Generates a researched ECMA-376 OpenXML `.pptx` presentation specification with `<p:pic>` 16:9 SVG diagrams and `<a:tbl>` tables using the 4-Tier Grounding Pipeline (`arguments: { prompt, isOnlineMode }`).
   - **`panini_verify_guardrails_and_reground`**: Runs Input/Output Guardrail scans (PII redaction, prompt-injection defense, internal logit variance `σ²` check) and triggers the deterministic Re-Ground loop across `≥2` Knowledge Shards (`arguments: { query, draftOutput, role }`).
   - **`panini_delegate_subagents`**: Delegates a multi-step enterprise task across Panini's 4 specialized collaborator sub-agents (`arguments: { taskPrompt, role }`).
3. **`resources/read`**: Reads any local `.gguf` Knowledge Shard via URI (`panini://shards/gurucul`, `panini://shards/crowdstrike`, `panini://shards/snowflake`, etc.).

### 4.3 Example MCP `tools/call` Request (`POST /api/mcp/rpc`)

```bash
curl -X POST http://localhost:3000/api/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "req-mcp-101",
    "method": "tools/call",
    "params": {
      "name": "panini_hybrid_rag_search",
      "arguments": {
        "query": "Gurucul REVEAL UEBA and Next-Gen SIEM product features",
        "role": "Admin",
        "enforceSourceVerification": true
      }
    }
  }'
```

### 4.4 Agentic Sub-Agent Delegation Architecture (`POST /api/v58/integrations/delegate-agents`)

When Panini acts as an **Agentic Orchestrator**, it decomposes complex requests across 4 specialized collaborator agents:

| Agent ID | Agent Name | Specialty | Primary MCP Tools Used |
| :--- | :--- | :--- | :--- |
| `agent-atlas-research` | **`Panini-Atlas-Research-Agent`** | Live Google Search, Wikipedia/Wikidata/OpenAlex/Crossref harvesting & `.gguf` Knowledge Shard persistence | `/api/search/google`, `panini_hybrid_rag_search`, `mcp://sharepoint` |
| `agent-chronos-verifier` | **`Panini-Chronos-FactVerifier-Agent`** | Cross-referencing claims across `≥2` shards, enforcing strict `"Data Not Available"` abstention & logit-variance (`σ² <= 0.18`) checks | `panini_verify_guardrails_and_reground`, `mcp://erp`, `mcp://crm` |
| `agent-polyglot-openxml` | **`Panini-Polyglot-OpenXML-Agent`** | Synthesizing ECMA-376 `.pptx` decks (with `<p:pic>` SVG diagrams & `<a:tbl>` tables), `%PDF-1.4` manuals, `.docx`, `.xlsx`, and tested code | `panini_generate_openxml_pptx`, `mcp://code-sandbox` |
| `agent-veritas-guardrail` | **`Panini-Veritas-Guardrail-Agent`** | Bi-directional PII redaction, prompt-injection defense, Document ACL filtering (`PUBLIC`..`RESTRICTED_EXEC`), and FIDO2/WebAuthn RBAC attestation | `/api/v62/rbac/fido2-sign`, `mcp://ticketing` |
