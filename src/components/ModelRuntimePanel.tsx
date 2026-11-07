import { useEffect, useState } from 'react';

interface RuntimeStatus {
  connected: boolean;
  version?: string;
  modelCount?: number;
  configuredDefaultModel?: string | null;
  error?: string;
}

interface RuntimeModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
}

interface TrainingJob {
  jobId: string;
  modelName: string;
  status: string;
  createdAt: string;
}

async function responseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({})) as { error?: string };
  return body.error || `Request failed (${response.status}).`;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'size unavailable';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`;
}

export default function ModelRuntimePanel() {
  const [status, setStatus] = useState<RuntimeStatus>({ connected: false });
  const [models, setModels] = useState<RuntimeModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [onlineModel, setOnlineModel] = useState('');
  const [onlineConfigured, setOnlineConfigured] = useState(false);
  const [trainingExamples, setTrainingExamples] = useState('');
  const [trainingBusy, setTrainingBusy] = useState(false);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [trainingNotice, setTrainingNotice] = useState('');
  const [trainingError, setTrainingError] = useState('');

  async function refresh() {
    setError('');
    try {
      const response = await fetch('/api/llm/status');
      if (!response.ok) throw new Error(await responseError(response));
      const result = await response.json() as RuntimeStatus;
      setStatus(result);
      if (!result.connected) {
        setModels([]);
        setNotice(result.error || 'Ollama is not connected.');
        return;
      }
      const modelResponse = await fetch('/api/llm/models');
      if (!modelResponse.ok) throw new Error(await responseError(modelResponse));
      const modelResult = await modelResponse.json() as { models: RuntimeModel[] };
      setModels(modelResult.models);
      const saved = localStorage.getItem('panini-ollama-model') || '';
      setSelectedModel((previous) =>
        modelResult.models.some((model) => model.name === previous)
          ? previous
          : modelResult.models.some((model) => model.name === saved)
            ? saved
            : result.configuredDefaultModel || modelResult.models[0]?.name || ''
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load model runtime status.');
      setStatus({ connected: false });
    }
  }

  useEffect(() => {
    void refresh();
    void refreshTrainingJobs();
    void fetch('/api/llm/online/status')
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        return response.json() as Promise<{ configured?: boolean; model?: string | null }>;
      })
      .then((result) => {
        setOnlineConfigured(Boolean(result.configured));
        setOnlineModel(result.model || '');
      })
      .catch((cause) => {
        setTrainingError(cause instanceof Error ? cause.message : 'Unable to load online model status.');
      });
  }, []);

  async function refreshTrainingJobs() {
    try {
      const response = await fetch('/api/llm/train/jobs');
      if (!response.ok) throw new Error(await responseError(response));
      const result = await response.json() as { jobs: TrainingJob[] };
      setTrainingJobs(result.jobs);
    } catch (cause) {
      setTrainingError(cause instanceof Error ? cause.message : 'Unable to load training jobs.');
    }
  }

  function chooseModel(model: string) {
    setSelectedModel(model);
    if (model) localStorage.setItem('panini-ollama-model', model);
  }

  async function pullModel() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/llm/models/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: downloadName }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const result = await response.json() as { model: string; status: string };
      setNotice(`Downloaded ${result.model} from the configured Ollama registry.`);
      setDownloadName('');
      await refresh();
      chooseModel(result.model);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Model download failed.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadModelfile() {
    if (!selectedModel) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/llm/export/modelfile?model=${encodeURIComponent(selectedModel)}`);
      if (!response.ok) throw new Error(await responseError(response));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${selectedModel.replace(/[^a-zA-Z0-9._-]/g, '_')}.Modelfile`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice(`Exported the Ollama Modelfile for ${selectedModel}. This is a recipe, not model weights.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Modelfile export failed.');
    } finally {
      setBusy(false);
    }
  }

  async function submitTraining(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTrainingBusy(true);
    setTrainingError('');
    setTrainingNotice('');
    try {
      const examples = JSON.parse(trainingExamples) as unknown;
      if (!Array.isArray(examples)) {
        throw new Error('Training data must be a JSON array of chat examples.');
      }
      const response = await fetch('/api/llm/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: onlineModel, examples }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const result = await response.json() as { job: { id?: string; status?: string } };
      setTrainingNotice(`Provider job ${result.job.id || '(unknown ID)'} · ${result.job.status || 'queued'}`);
      setTrainingExamples('');
      await refreshTrainingJobs();
    } catch (cause) {
      setTrainingError(cause instanceof Error ? cause.message : 'Provider fine-tuning request failed.');
    } finally {
      setTrainingBusy(false);
    }
  }

  async function refreshJobStatus(jobId: string) {
    setTrainingError('');
    try {
      const response = await fetch(`/api/llm/train/jobs/${encodeURIComponent(jobId)}`);
      if (!response.ok) throw new Error(await responseError(response));
      await refreshTrainingJobs();
    } catch (cause) {
      setTrainingError(cause instanceof Error ? cause.message : 'Unable to refresh provider job status.');
    }
  }

  return (
    <section
      data-testid="real-model-runtime-panel"
      className="space-y-4 rounded-xl border border-sky-500/30 bg-slate-950/80 p-4 text-slate-100"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">Local model runtime</h2>
          <p className="mt-1 max-w-3xl text-xs text-slate-400">
            Connect Ollama to download real model weights and run inference on this machine. Models are
            managed by Ollama and are not bundled with this app.
          </p>
        </div>
        <span
          data-testid="ollama-runtime-status"
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            status.connected
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
          }`}
        >
          {status.connected ? `Connected · Ollama ${status.version || ''}` : 'Not connected'}
        </span>
      </header>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-1">
          <label htmlFor="ollama-model-selector" className="text-xs text-slate-300">
            Active inference model
          </label>
          <select
            id="ollama-model-selector"
            data-testid="ollama-model-selector"
            value={selectedModel}
            onChange={(event) => chooseModel(event.target.value)}
            disabled={!models.length}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm disabled:opacity-60"
          >
            {!models.length && <option value="">Download or configure an Ollama model</option>}
            {models.map((model) => (
              <option key={model.digest} value={model.name}>
                {model.name} · {formatBytes(model.size)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            data-testid="ollama-refresh-btn"
            onClick={() => void refresh()}
            disabled={busy}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800 disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            type="button"
            data-testid="ollama-export-modelfile-btn"
            onClick={() => void downloadModelfile()}
            disabled={!selectedModel || busy}
            className="rounded-lg border border-sky-500/40 px-3 py-2 text-xs text-sky-200 hover:bg-sky-950 disabled:opacity-50"
          >
            Export Modelfile
          </button>
        </div>
      </div>

      <form
        className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          void pullModel();
        }}
      >
        <label className="sr-only" htmlFor="ollama-model-download">Model name to download</label>
        <input
          id="ollama-model-download"
          data-testid="ollama-model-download-input"
          value={downloadName}
          onChange={(event) => setDownloadName(event.target.value)}
          placeholder="Model tag, for example qwen3:8b"
          autoComplete="off"
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-500"
        />
        <button
          type="submit"
          data-testid="ollama-model-download-btn"
          disabled={!status.connected || !downloadName.trim() || busy}
          className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Download model weights'}
        </button>
      </form>

      {(notice || error) && (
        <p
          role={error ? 'alert' : 'status'}
          className={`rounded-lg border px-3 py-2 text-xs ${
            error
              ? 'border-red-500/40 bg-red-950/30 text-red-200'
              : 'border-slate-700 bg-slate-900 text-slate-300'
          }`}
        >
          {error || notice}
        </p>
      )}
      {!status.connected && !error && (
        <p className="text-xs text-amber-200">
          Start Ollama and set <code>OLLAMA_BASE_URL</code> if it is not listening at
          http://127.0.0.1:11434. Inference and downloads are unavailable until it connects.
        </p>
      )}
      {status.connected && (
        <p className="text-[11px] text-slate-500">
          GGUF export is available only for validated files provided through
          <code> PANINI_GGUF_EXPORT_DIR</code>. An Ollama Modelfile does not contain model weights.
        </p>
      )}

      <div className="space-y-3 border-t border-slate-800 pt-4">
        <div>
          <h3 className="text-sm font-bold">Provider fine-tuning</h3>
          <p className="mt-1 text-xs text-slate-400">
            Submits supervised data to the configured online provider. This is not local training and requires
            provider credentials, an eligible base model, and 10–10,000 valid examples.
          </p>
        </div>
        <form className="space-y-2" onSubmit={(event) => void submitTraining(event)}>
          <label htmlFor="provider-training-data" className="block text-xs text-slate-300">
            JSON array of examples with user and assistant messages · model: {onlineModel || 'not configured'}
          </label>
          <textarea
            id="provider-training-data"
            data-testid="provider-training-data"
            value={trainingExamples}
            onChange={(event) => setTrainingExamples(event.target.value)}
            placeholder={'[\n  { "messages": [\n    { "role": "user", "content": "Question" },\n    { "role": "assistant", "content": "Answer" }\n  ] }\n]'}
            rows={5}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs"
          />
          <button
            type="submit"
            data-testid="provider-training-submit"
            disabled={!onlineConfigured || !onlineModel || !trainingExamples.trim() || trainingBusy}
            className="rounded-lg bg-violet-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {trainingBusy ? 'Submitting…' : 'Submit provider fine-tuning job'}
          </button>
        </form>
        {!onlineConfigured && (
          <p className="text-xs text-amber-200">
            Configure <code>OPENAI_API_KEY</code> and <code>OPENAI_CHAT_MODEL</code> to enable provider operations.
          </p>
        )}
        {trainingError && <p role="alert" className="text-xs text-red-200">{trainingError}</p>}
        {trainingNotice && <p role="status" className="text-xs text-emerald-200">{trainingNotice}</p>}
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold">Persisted provider jobs</h4>
          <button
            type="button"
            onClick={() => void refreshTrainingJobs()}
            className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] hover:bg-slate-800"
          >
            Refresh jobs
          </button>
        </div>
        {trainingJobs.length === 0 ? (
          <p className="text-xs text-slate-500">No fine-tuning jobs recorded.</p>
        ) : (
          <ul className="space-y-1 text-xs text-slate-300">
            {trainingJobs.map((job) => (
              <li key={job.jobId} className="flex flex-wrap justify-between gap-2">
                <span>{job.modelName} · {job.jobId}</span>
                <span className="flex items-center gap-2">
                  {job.status}
                  <button
                    type="button"
                    onClick={() => void refreshJobStatus(job.jobId)}
                    disabled={trainingBusy}
                    className="rounded border border-slate-700 px-2 py-0.5 hover:bg-slate-800 disabled:opacity-50"
                  >
                    Refresh status
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
