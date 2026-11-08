# Panini Studio

Panini Studio is a local-first application with deterministic workflows and optional integrations to real AI providers. Provider-backed operations work only when the corresponding runtime, model, and credentials are available; the repository does not bundle model weights.

## What this repository provides

- Ask and Coding call an explicitly selected Ollama model, or select an installed non-cloud model by default. They can also call an OpenAI-compatible online chat provider. Retrieved excerpts are passed as untrusted context; if inference fails, deterministic fallback output is identified.
- Ollama integration supports runtime status, installed-model listing, model pulls, inference, and Modelfile export. GGUF export serves only validated weight files from a separately configured directory.
- OpenAI-compatible endpoints support online chat, image generation, provider fine-tuning job submission/status, speech synthesis, and transcription. Image generation returns the provider’s actual PNG dimensions. Fine-tuning is provider-hosted, not local offline training.
- Research review stores source excerpts and checks answer sentences for overlapping terms on distinct HTTPS hosts. This is a deterministic evidence-matching aid, not semantic fact-checking, proof of source independence, or a contradiction detector.
- SQLite stores production authentication sessions, claim-level evidence checks, source excerpts, and provider fine-tuning job metadata. Existing application settings and knowledge shards still use their current local JSON persistence.
- Video and music generation fail explicitly because no real video/music model provider is configured; storyboard and composition controls are not rendered media files. Local image generation likewise requires separate image-model weights/runtime; online image generation requires `OPENAI_API_KEY`.
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

- For local inference, install and start Ollama separately. Configure `OLLAMA_BASE_URL` if it is not `http://127.0.0.1:11434`, then download a model in Model Registry or with Ollama. An installed non-cloud model is chosen by default; set `PANINI_OLLAMA_MODEL` to prefer another local model. Ollama stores model weights outside this repository.
- For online chat, image generation, speech, transcription, or fine-tuning, configure `OPENAI_API_KEY` and relevant model variables: `OPENAI_CHAT_MODEL`, `OPENAI_IMAGE_MODEL`, `OPENAI_TTS_MODEL`, and `OPENAI_TRANSCRIPTION_MODEL`. `OPENAI_API_BASE_URL` can point at a compatible provider that supports those endpoints. Fine-tuning requires an eligible provider model and 10–10,000 valid training examples.
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
