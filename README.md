# Panini Studio

Panini Studio is a local-first application with deterministic workflows and optional integrations to real AI providers. Provider-backed operations work only when the corresponding runtime, model, and credentials are available; the repository does not bundle model weights.

## What this repository provides

- Ask and Coding call an explicitly selected Ollama model, or select an installed non-cloud model by default. They can also call an OpenAI-compatible online chat provider. They use stable source IDs for citations; citation links are emitted only for supplied HTTPS excerpts.
- Ollama integration supports runtime status, installed-model listing, model pulls, inference, and Modelfile export. GGUF export serves only validated weight files from a separately configured directory.
- OpenAI-compatible endpoints support online chat, image generation, provider fine-tuning job submission/status, speech synthesis, and transcription. Image generation returns and displays the provider’s actual PNG artifact; it does not imply factual visual verification. Fine-tuning is provider-hosted, not local offline training.
- Search uses public Wikipedia, OpenAlex, and Crossref APIs. It does not claim Google Search access. Generated summaries and bibliographic metadata without an actual excerpt are not treated as source evidence.
- Approved Deep Research plans now synthesize reports with the configured model and retrieved HTTPS excerpts; missing sources or inference fail the report instead of showing a deterministic report template. Text-match evidence review is still not independent fact-checking.
- Explicit create/generate requests for PPTX or DOCX use configured model output as the document content. PPTX exports package model-authored slide text plus generated SVG diagrams; they are not image-model illustrations, and neither format is independently fact-checked.
- SQLite stores retrieved HTTPS excerpts and indexes them for local FTS5/BM25 retrieval. Offline Ask/Coding can use indexed excerpts after they have been collected online. This is lexical retrieval, not embedding/vector search.
- Research review checks claim/excerpt term overlap and requires submitted excerpts to match sources already indexed by the server. It is not semantic fact-checking, proof of source independence, or contradiction detection. Review the cited originals.
- SQLite stores production authentication sessions, claim-level evidence checks, source excerpts, and provider fine-tuning job metadata. Existing application settings and knowledge shards still use their current local JSON persistence.
- Video and music generation use optional Replicate-hosted models when explicitly configured; without credentials and model slugs they fail explicitly. These models are cloud-hosted, not local/offline. Procedural storyboards are not video outputs. Local image/video/music generation still requires separate local weights and inference runtimes, which are not bundled.
- Admin views, scenario management, REST/MCP examples, and diagnostic UI include prototype or illustrative controls that do not provision unconfigured infrastructure.

Model names, parameter counts, benchmark scores, and legacy “self-learning” claims do not prove that a model is installed or running. Do not rely on generated content or retrieved sources for high-impact decisions.

## Run locally

Requires Node.js 22+ (including the built-in `node:sqlite` module) and npm. The project tracks `bun.lock`; use Bun for lockfile-reproducible dependency installation.

```powershell
bun install --frozen-lockfile
Copy-Item .env.example .env
npm run dev
```

The development server binds to `127.0.0.1:3000`. To use npm instead, install dependencies with `npm install` (this does not validate the tracked Bun lockfile).

### Optional model providers

- For local inference, install and start Ollama separately. On Windows, install Ollama from its official download page, start it, then run `ollama pull qwen3.5:4b` in PowerShell (or choose another model that fits your hardware). Configure `OLLAMA_BASE_URL` if it is not `http://127.0.0.1:11434`. An installed non-cloud model is chosen by default; set `PANINI_OLLAMA_MODEL` to prefer another local model. Ollama stores downloaded weights outside this repository.
- Model weights are not bundled or committed: even a small quantized model is multiple gigabytes, model licenses differ, and hardware requirements vary. The app can use locally hosted weights through Ollama after they are installed; this does not make the model equivalent in capability to Gemini or Claude.
- For online chat, image generation, speech, transcription, or fine-tuning, configure `OPENAI_API_KEY` and relevant model variables: `OPENAI_CHAT_MODEL`, `OPENAI_IMAGE_MODEL`, `OPENAI_TTS_MODEL`, and `OPENAI_TRANSCRIPTION_MODEL`. `OPENAI_API_BASE_URL` can point at a compatible provider that supports those endpoints. Fine-tuning requires an eligible provider model and 10–10,000 valid training examples.
- For hosted video or music generation, configure `PANINI_REPLICATE_API_TOKEN` and the matching `PANINI_REPLICATE_VIDEO_MODEL` and/or `PANINI_REPLICATE_MUSIC_MODEL` using Replicate `owner/model` slugs. The selected model must accept the request’s `prompt` plus the configured duration/aspect-ratio fields and return an MP4 for video or MP3/WAV/FLAC for music. Generation may incur provider charges and output URLs may expire. No provider credentials or model weights are included.
- `PANINI_DB_PATH` selects the SQLite database location. `PANINI_GGUF_EXPORT_DIR` enables export of actual `.gguf` files from a trusted local directory; it does not convert other model formats.

The server loads `.env` through dotenv. Keep provider credentials in environment variables or a protected deployment secret store. Do not commit credentials or model weights.

## Validate

```powershell
npm run lint
npm test
npm run build
```

`npm test` covers deterministic logic, citation ID validation, provider adapters with mocked HTTP responses, FTS5 retrieval and persistence, SQLite migrations, and an HTTP integration test for production auth/session persistence and API behavior. It is not a real-provider, GPU, media-generation, adversarial security, model-quality, or full browser acceptance suite.

## Production-mode API protection

Production mode requires `NODE_ENV=production` and `PANINI_ADMIN_PASSWORD` (at least 16 characters). Set `PANINI_ADMIN_USERNAME` to override the default username. Authentication sessions persist in SQLite for eight hours; sign-in attempts are rate-limited per client IP in process memory. Use HTTPS. When TLS terminates at a trusted reverse proxy, set `PANINI_TRUST_PROXY=1` and ensure the proxy overwrites forwarded headers. The default bind address is loopback; a remote bind must be explicitly configured with `PANINI_BIND_HOST`.

These integrations do not by themselves establish production readiness or frontier-model quality. Real-provider credentials and model acceptance, deployment hardening, per-user authorization, genuine semantic/independent fact checking, and full browser acceptance must be validated for each deployment. Review release documents’ legacy claims before relying on them.
