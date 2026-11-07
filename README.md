# Panini Studio

Panini Studio is a local-first application with deterministic workflows and optional integrations to real AI providers. Provider-backed operations only work when the corresponding runtime, model, and credentials are available; the repository does not bundle model weights.

## What this repository provides

- Ask and Coding can call a configured Ollama model locally or an OpenAI-compatible online chat provider. Deterministic output remains available when no provider is configured and is identified as such.
- Ollama integration supports runtime status, installed-model listing, model pulls, inference, and Modelfile export. GGUF export serves only validated weight files from a separately configured directory.
- OpenAI-compatible endpoints support online chat, provider fine-tuning job submission/status, speech synthesis, and transcription. Fine-tuning is provider-hosted, not local offline training.
- SQLite stores production authentication sessions, research-validation records, and provider fine-tuning job metadata. Existing application settings and knowledge shards still use their current local JSON persistence.
- Deep Research can retrieve sources from configured providers, but retrieval and source diversity are not independent verification of factual claims.
- Image, video, and music workspaces provide procedural previews and composition workflows; they do not include or invoke image, video, or music model weights.
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

- For local inference, install and start Ollama separately. Configure `OLLAMA_BASE_URL` if it is not `http://127.0.0.1:11434`, then download a model in the Model Registry or with Ollama. Set `PANINI_OLLAMA_MODEL` to choose the default. Ollama downloads its own model weights; none are checked into this repository.
- For online chat, speech, transcription, or fine-tuning, configure `OPENAI_API_KEY` and the relevant model variables: `OPENAI_CHAT_MODEL`, `OPENAI_TTS_MODEL`, and `OPENAI_TRANSCRIPTION_MODEL`. `OPENAI_API_BASE_URL` can point at an OpenAI-compatible provider. Fine-tuning requires an eligible provider model and 10–10,000 valid training examples.
- `PANINI_DB_PATH` selects the SQLite database location. `PANINI_GGUF_EXPORT_DIR` enables export of actual `.gguf` files from a trusted local directory; it does not convert other model formats.

The server loads `.env` through dotenv. Keep provider credentials in environment variables or a protected deployment secret store. Do not commit credentials or model weights.

## Validate

```powershell
npm run lint
npm test
npm run build
```

`npm test` covers deterministic logic, provider adapters with mocked HTTP responses, SQLite persistence, and an HTTP integration test for production auth/session persistence and online chat routing. It is not a real-provider, GPU, media-generation, security-audit, or full browser acceptance suite.

## Production-mode API protection

Production mode requires `NODE_ENV=production` and `PANINI_ADMIN_PASSWORD` (at least 16 characters). Set `PANINI_ADMIN_USERNAME` to override the default username. Authentication sessions persist in SQLite for eight hours. Use HTTPS. When TLS terminates at a trusted reverse proxy, set `PANINI_TRUST_PROXY=1` and ensure the proxy overwrites forwarded headers. The default bind address is loopback; a remote bind must be explicitly configured with `PANINI_BIND_HOST`.

These integrations do not by themselves establish production readiness. Real-provider credentials and model acceptance, deployment hardening, per-user authorization, independent research verification, and full browser acceptance must be validated for each deployment. Review release documents’ legacy claims before relying on them.
