import React, { useState } from 'react';
import {
  HARDWARE_PROFILES,
  HardwareProfile,
  HardwareProfileId,
  DeploymentEnvironment,
  QUANTIZATION_SPECS,
  QuantizationType,
  StoredModel,
  CompatibleModelOption,
  ThermalPowerTelemetry,
  ContentSafetyMode,
  calculateQuantizedFootprint,
  computeThermalAndPowerMetrics,
  LOCAL_TTS_VOICE_PROFILES_V63,
  synthesizeLocalModelTtsAudioV63,
  getPersistentSovereignSettingsV61,
  updatePersistentSovereignSettingsV61,
  LocalModelTtsSynthesisResultV63,
} from '../utils/engineLogic';
import { Smartphone, Laptop, Server, Cloud, ShieldCheck, Baby, Flame, Volume2, Play } from 'lucide-react';

interface HardwareThermalViewProps {
  activeHardware: HardwareProfile;
  onSelectHardware: (id: HardwareProfileId) => void;
  deploymentMode: DeploymentEnvironment;
  onSelectDeploymentMode: (mode: DeploymentEnvironment) => void;
  compatibleModels: CompatibleModelOption[];
  powerBudgetWatts: number;
  onChangePowerWatts: (watts: number) => void;
  thermalLimitC: number;
  onChangeThermalLimitC: (tempC: number) => void;
  ambientTempC: number;
  onChangeAmbientTempC: (tempC: number) => void;
  presetOfflineMode: boolean;
  onChangePresetOfflineMode: (val: boolean) => void;
  presetModelCacheDir: string;
  onChangePresetModelCacheDir: (dir: string) => void;
  presetBackupCron: string;
  onChangePresetBackupCron: (cron: string) => void;
  contentSafetyMode: ContentSafetyMode;
  onChangeContentSafetyMode: (mode: ContentSafetyMode) => void;
  activeModel: StoredModel;
  telemetry: ThermalPowerTelemetry;
  isDark: boolean;
  selectedTtsVoiceId?: string;
  onChangeTtsVoiceId?: (voiceId: string) => void;
  ttsSpeechRate?: number;
  onChangeTtsSpeechRate?: (rate: number) => void;
  ttsAutoReadResponses?: boolean;
  onChangeTtsAutoReadResponses?: (autoRead: boolean) => void;
}

const DEPLOYMENT_ENVS: {
  id: DeploymentEnvironment;
  title: string;
  desc: string;
}[] = [
  {
    id: 'Air-Gapped Local',
    title: 'Air-Gapped Local Device',
    desc: 'Zero external network dependency. Strictly enforces local device RAM, CPU cores, and flash storage.',
  },
  {
    id: 'On-Premises Cluster',
    title: 'On-Premises Enterprise Cluster',
    desc: 'Local LAN / Data-Center GPU & NVMe cluster with high-speed RoCEv2 shard pooling.',
  },
  {
    id: 'Cloud Elastic Node',
    title: 'Cloud Elastic Multi-GPU Node',
    desc: 'Elastic cloud deployment supporting all parameter tiers up to 400B Q8_0 reference checkpoints.',
  },
];

export const HardwareThermalView: React.FC<HardwareThermalViewProps> = ({
  activeHardware,
  onSelectHardware,
  deploymentMode,
  onSelectDeploymentMode,
  compatibleModels,
  powerBudgetWatts,
  onChangePowerWatts,
  thermalLimitC,
  onChangeThermalLimitC,
  ambientTempC,
  onChangeAmbientTempC,
  presetOfflineMode,
  onChangePresetOfflineMode,
  presetModelCacheDir,
  onChangePresetModelCacheDir,
  presetBackupCron,
  onChangePresetBackupCron,
  contentSafetyMode,
  onChangeContentSafetyMode,
  activeModel,
  telemetry,
  isDark,
  selectedTtsVoiceId,
  onChangeTtsVoiceId,
  ttsSpeechRate,
  onChangeTtsSpeechRate,
  ttsAutoReadResponses,
  onChangeTtsAutoReadResponses,
}) => {
  const initialPersistent = getPersistentSovereignSettingsV61();
  const [localVoiceId, setLocalVoiceId] = useState<string>(
    selectedTtsVoiceId || initialPersistent.ttsVoiceId || 'panini-voice-aria-en-us'
  );
  const [localSpeechRate, setLocalSpeechRate] = useState<number>(
    typeof ttsSpeechRate === 'number' ? ttsSpeechRate : initialPersistent.ttsSpeechRate || 1.0
  );
  const [localAutoRead, setLocalAutoRead] = useState<boolean>(
    typeof ttsAutoReadResponses === 'boolean'
      ? ttsAutoReadResponses
      : Boolean(initialPersistent.ttsAutoReadResponses)
  );
  const [ttsSampleText, setTtsSampleText] = useState<string>(
    'Gurucul REVEAL unifies Next-Gen SIEM, UEBA, Identity Analytics, and Network Traffic Analysis for zero-trust security.'
  );
  const [ttsPreviewResult, setTtsPreviewResult] = useState<LocalModelTtsSynthesisResultV63>(() =>
    synthesizeLocalModelTtsAudioV63({
      text: 'Gurucul REVEAL unifies Next-Gen SIEM, UEBA, Identity Analytics, and Network Traffic Analysis.',
      voiceId: selectedTtsVoiceId || initialPersistent.ttsVoiceId || 'panini-voice-aria-en-us',
      speechRate:
        typeof ttsSpeechRate === 'number' ? ttsSpeechRate : initialPersistent.ttsSpeechRate || 1.0,
    })
  );

  const effectiveVoiceId = selectedTtsVoiceId || localVoiceId;
  const effectiveSpeechRate = typeof ttsSpeechRate === 'number' ? ttsSpeechRate : localSpeechRate;
  const effectiveAutoRead =
    typeof ttsAutoReadResponses === 'boolean' ? ttsAutoReadResponses : localAutoRead;

  const activeVoiceProfile =
    LOCAL_TTS_VOICE_PROFILES_V63.find((v) => v.voiceId === effectiveVoiceId) ||
    LOCAL_TTS_VOICE_PROFILES_V63[0];

  const handleSelectVoice = (voiceId: string) => {
    setLocalVoiceId(voiceId);
    onChangeTtsVoiceId?.(voiceId);
    updatePersistentSovereignSettingsV61({ ttsVoiceId: voiceId }, 'USER_UI_TOGGLE');
    fetch('/api/v61/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttsVoiceId: voiceId }),
    }).catch(() => {});
    const synthesized = synthesizeLocalModelTtsAudioV63({
      text: ttsSampleText,
      voiceId,
      speechRate: effectiveSpeechRate,
    });
    setTtsPreviewResult(synthesized);
  };

  const handleChangeSpeechRate = (rate: number) => {
    setLocalSpeechRate(rate);
    onChangeTtsSpeechRate?.(rate);
    updatePersistentSovereignSettingsV61({ ttsSpeechRate: rate }, 'USER_UI_TOGGLE');
    fetch('/api/v61/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttsSpeechRate: rate }),
    }).catch(() => {});
  };

  const handleToggleAutoRead = (nextVal: boolean) => {
    setLocalAutoRead(nextVal);
    onChangeTtsAutoReadResponses?.(nextVal);
    updatePersistentSovereignSettingsV61({ ttsAutoReadResponses: nextVal }, 'USER_UI_TOGGLE');
    fetch('/api/v61/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttsAutoReadResponses: nextVal }),
    }).catch(() => {});
  };

  const handleSynthesizePreview = async () => {
    const localSynth = synthesizeLocalModelTtsAudioV63({
      text: ttsSampleText,
      voiceId: effectiveVoiceId,
      speechRate: effectiveSpeechRate,
    });
    setTtsPreviewResult(localSynth);
    try {
      const res = await fetch('/api/v63/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsSampleText,
          voiceId: effectiveVoiceId,
          speechRate: effectiveSpeechRate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.ttsResult) {
          setTtsPreviewResult(data.ttsResult);
        }
      }
    } catch {
      // Offline local synthesizer already populated ttsPreviewResult
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(localSynth.cleanedSpokenText);
        utter.rate = effectiveSpeechRate;
        utter.lang = activeVoiceProfile.locale;
        window.speechSynthesis.speak(utter);
      } catch {
        // Ignore browser speech errors in headless environments
      }
    }
  };

  const currentVersion =
    activeModel.versions.find((v) => v.versionId === activeModel.currentVersionId) ||
    activeModel.versions[0];

  const activeFootprint = calculateQuantizedFootprint(
    activeModel.totalParamsBillions,
    activeModel.activeParamsBillions,
    currentVersion.quantType,
    currentVersion.contextLength,
    activeHardware
  );

  const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
  const surfaceClass = isDark ? 'bg-slate-900/70' : 'bg-white';
  const subSurfaceClass = isDark ? 'bg-slate-950/60' : 'bg-slate-50';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const headingText = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="space-y-6">
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b ${borderClass}`}
      >
        <div>
          <h2 className={`text-lg font-semibold ${headingText}`}>
            Hardware Specs, Preset Environment Settings, Content Guardrails &amp; Thermal Governor
          </h2>
          <p className={`text-xs ${mutedText} mt-0.5`}>
            All runtime variables (<span className="font-mono">VITE_AETHERQUANT_OFFLINE_MODE</span>,{' '}
            <span className="font-mono">VITE_AETHERQUANT_MODEL_CACHE_DIR</span>, and Prompt Content Safety Mode) are managed exclusively here in Admin Settings.
          </p>
        </div>
        <div className={`text-xs font-mono tabular-nums ${mutedText}`}>
          Deployment: {deploymentMode} · Policy: {contentSafetyMode} · Temp:{' '}
          {telemetry.steadyStateTempC}°C
        </div>
      </div>

      {/* Prompt Content Safety & Guardrail Mode (Admin-Controlled Global Policy: Safe Mode, Child Mode, NSFW Mode) */}
      <div className={`border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className={`text-sm font-semibold ${headingText}`}>
              Prompt Content Safety &amp; Guardrail Policy (Admin Settings Control)
            </h3>
            <p className={`text-xs ${mutedText} mt-0.5`}>
              Controls global prompt filtering, vocabulary complexity, and content synthesis boundaries across Ask &amp; Math, Coding, Deep Research, and 8K Cinema Studio.
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono border ${
              contentSafetyMode === 'Child Mode'
                ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                : contentSafetyMode === 'NSFW Mode'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
            }`}
          >
            Active Policy: {contentSafetyMode}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onChangeContentSafetyMode('Safe Mode')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
              contentSafetyMode === 'Safe Mode'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                : `${borderClass} ${subSurfaceClass} hover:border-slate-700`
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${headingText}`}>Safe Mode (Default)</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className={`text-xs ${mutedText}`}>
              Standard institutional &amp; enterprise guardrails. Full academic, scientific, historical, and technical rigor with balanced content filtering.
            </p>
            <div className="text-[11px] font-mono text-emerald-400 pt-1">
              {contentSafetyMode === 'Safe Mode' ? '[ACTIVE POLICY]' : 'Activate Safe Mode ->'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChangeContentSafetyMode('Child Mode')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
              contentSafetyMode === 'Child Mode'
                ? 'border-sky-500 bg-sky-500/10 shadow-sm'
                : `${borderClass} ${subSurfaceClass} hover:border-slate-700`
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${headingText}`}>Child Mode (Ages 8–12)</span>
              <Baby className="w-4 h-4 text-sky-400" />
            </div>
            <p className={`text-xs ${mutedText}`}>
              Strict family-safe content filtering with age-adapted explanations, simplified vocabulary, and encouraging educational tone.
            </p>
            <div className="text-[11px] font-mono text-sky-400 pt-1">
              {contentSafetyMode === 'Child Mode' ? '[ACTIVE POLICY]' : 'Activate Child Mode ->'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChangeContentSafetyMode('NSFW Mode')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
              contentSafetyMode === 'NSFW Mode'
                ? 'border-rose-500 bg-rose-500/10 shadow-sm'
                : `${borderClass} ${subSurfaceClass} hover:border-slate-700`
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${headingText}`}>NSFW / Mature Mode</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <p className={`text-xs ${mutedText}`}>
              Unlocks unredacted mature creative writing, historical conflict analysis, and adult artistic themes under Administrator authorization.
            </p>
            <div className="text-[11px] font-mono text-rose-400 pt-1">
              {contentSafetyMode === 'NSFW Mode' ? '[ACTIVE POLICY]' : 'Activate NSFW Mode ->'}
            </div>
          </button>
        </div>
      </div>

      {/* Preset Runtime Environment Variables (Admin Settings Only — Never prompts end-users) */}
      <div className={`border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className={`text-sm font-semibold ${headingText}`}>
              Preset Runtime Environment Variables (Admin Settings Only)
            </h3>
            <p className={`text-xs ${mutedText} mt-0.5`}>
              These variables are pre-configured out of the box so the app never prompts users for environment variables at launch. Administrators can override them here at any time.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Preset &amp; Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* VITE_AETHERQUANT_OFFLINE_MODE */}
          <div className={`p-3.5 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-semibold text-sky-400">
                VITE_AETHERQUANT_OFFLINE_MODE
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  presetOfflineMode
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}
              >
                {presetOfflineMode ? 'true (Air-Gapped)' : 'false (Hybrid Online)'}
              </span>
            </div>
            <p className={`text-[11px] ${mutedText}`}>
              Controls default offline air-gapped execution mode vs. multi-engine online search stream.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onChangePresetOfflineMode(true)}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                  presetOfflineMode
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                    : `${borderClass} ${headingText}`
                }`}
              >
                Preset: true (Offline)
              </button>
              <button
                type="button"
                onClick={() => onChangePresetOfflineMode(false)}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                  !presetOfflineMode
                    ? 'bg-sky-500 text-slate-950 border-sky-500'
                    : `${borderClass} ${headingText}`
                }`}
              >
                Preset: false (Online)
              </button>
            </div>
          </div>

          {/* VITE_AETHERQUANT_MODEL_CACHE_DIR */}
          <div className={`p-3.5 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2`}>
            <label
              htmlFor="preset-cache-dir-input"
              className="block text-xs font-mono font-semibold text-sky-400"
            >
              VITE_AETHERQUANT_MODEL_CACHE_DIR
            </label>
            <p className={`text-[11px] ${mutedText}`}>
              Preset local NVMe / UFS 4.0 shard cache path for quantized GGUF &amp; EXL2 weights.
            </p>
            <input
              id="preset-cache-dir-input"
              type="text"
              value={presetModelCacheDir}
              onChange={(e) => onChangePresetModelCacheDir(e.target.value)}
              className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border ${borderClass} ${surfaceClass} ${headingText}`}
            />
          </div>

          {/* VITE_AETHERQUANT_BACKUP_CRON */}
          <div className={`p-3.5 rounded-xl border ${borderClass} ${subSurfaceClass} space-y-2`}>
            <label
              htmlFor="preset-backup-cron-input"
              className="block text-xs font-mono font-semibold text-sky-400"
            >
              VITE_AETHERQUANT_BACKUP_CRON
            </label>
            <p className={`text-[11px] ${mutedText}`}>
              Automated encrypted Zstd state &amp; QLoRA adapter snapshot schedule.
            </p>
            <input
              id="preset-backup-cron-input"
              type="text"
              value={presetBackupCron}
              onChange={(e) => onChangePresetBackupCron(e.target.value)}
              className={`w-full px-3 py-1.5 text-xs font-mono rounded-lg border ${borderClass} ${surfaceClass} ${headingText}`}
            />
          </div>
        </div>
      </div>

      {/* Local Model Text-to-Speech (TTS) Accessibility & Voice Selection (v6.3-GA) */}
      <div
        data-testid="hardware-env-tts-voice-settings-panel"
        className={`border border-sky-500/35 ${surfaceClass} rounded-xl p-5 space-y-4`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-sky-400" />
            <div>
              <h3 className={`text-sm font-semibold ${headingText}`}>
                Local Model Text-to-Speech (TTS) Accessibility &amp; Voice Selection (v6.3-GA · KISS)
              </h3>
              <p className={`text-xs ${mutedText}`}>
                Synthesizes accessible 16-bit PCM WAV audio responses using local Panini Neural Prosody GGUF vocalizers ({activeVoiceProfile.ggufVocalizerModel}) with zero external cloud dependency.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Active Voice: {activeVoiceProfile.displayName} · {effectiveSpeechRate.toFixed(1)}x
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Voice Selector Grid */}
          <div className="lg:col-span-7 space-y-2.5">
            <label
              htmlFor="tts-voice-selector-dropdown"
              className={`block text-xs font-semibold ${headingText}`}
            >
              Select Local Model Neural TTS Voice Profile
            </label>
            <select
              id="tts-voice-selector-dropdown"
              data-testid="hardware-tts-voice-select"
              value={effectiveVoiceId}
              onChange={(e) => handleSelectVoice(e.target.value)}
              className={`w-full px-3 py-2 text-xs font-mono rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
            >
              {LOCAL_TTS_VOICE_PROFILES_V63.map((voice) => (
                <option key={voice.voiceId} value={voice.voiceId}>
                  {voice.displayName} — [{voice.locale} · {voice.timbre} · {voice.pitchHz}Hz]
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {LOCAL_TTS_VOICE_PROFILES_V63.map((voice) => {
                const isSelected = voice.voiceId === effectiveVoiceId;
                return (
                  <button
                    key={voice.voiceId}
                    type="button"
                    data-testid={`tts-voice-card-${voice.voiceId}`}
                    onClick={() => handleSelectVoice(voice.voiceId)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10'
                        : `${borderClass} ${subSurfaceClass} hover:border-slate-700`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-semibold ${headingText}`}>
                        {voice.displayName}
                      </span>
                      <span className="text-[10px] font-mono text-sky-400">{voice.locale}</span>
                    </div>
                    <div className={`text-[11px] ${mutedText} mt-0.5 line-clamp-1`}>
                      {voice.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Cadence, Auto-Read Accessibility Toggle & Live WAV Preview */}
          <div
            className={`lg:col-span-5 p-3.5 rounded-xl border ${borderClass} ${subSurfaceClass} flex flex-col justify-between gap-3`}
          >
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="tts-speech-rate-slider" className={`font-medium ${headingText}`}>
                    Speech Cadence &amp; Prosody Rate
                  </label>
                  <span className="font-mono text-sky-400">{effectiveSpeechRate.toFixed(1)}x</span>
                </div>
                <input
                  id="tts-speech-rate-slider"
                  data-testid="hardware-tts-rate-slider"
                  type="range"
                  min={0.7}
                  max={1.6}
                  step={0.1}
                  value={effectiveSpeechRate}
                  onChange={(e) => handleChangeSpeechRate(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div>
                  <div className={`text-xs font-semibold ${headingText}`}>
                    Auto-Synthesize Workspace Responses
                  </div>
                  <div className={`text-[11px] ${mutedText}`}>
                    Automatically attach playable local TTS audio to new assistant responses.
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="hardware-tts-autoread-toggle"
                  onClick={() => handleToggleAutoRead(!effectiveAutoRead)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    effectiveAutoRead
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                      : `${borderClass} ${headingText}`
                  }`}
                >
                  {effectiveAutoRead ? 'AUTO-READ: ON' : 'AUTO-READ: OFF'}
                </button>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="tts-preview-sample-input"
                  className={`block text-[11px] font-mono ${mutedText}`}
                >
                  Accessibility Audio Test Phrase:
                </label>
                <div className="flex gap-2">
                  <input
                    id="tts-preview-sample-input"
                    data-testid="hardware-tts-sample-input"
                    type="text"
                    value={ttsSampleText}
                    onChange={(e) => setTtsSampleText(e.target.value)}
                    className={`flex-1 px-2.5 py-1.5 text-xs rounded-lg border ${borderClass} ${surfaceClass} ${headingText}`}
                  />
                  <button
                    type="button"
                    data-testid="hardware-tts-synthesize-preview-btn"
                    onClick={handleSynthesizePreview}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 flex items-center gap-1.5 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Synthesize Audio
                  </button>
                </div>
              </div>
            </div>

            <div className={`pt-2.5 border-t ${borderClass} space-y-1.5`}>
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
                <span>
                  {ttsPreviewResult.wavHeaderMagic} · {ttsPreviewResult.sampleRateHz}Hz PCM ·{' '}
                  {ttsPreviewResult.durationSeconds}s ({ttsPreviewResult.wavByteLength.toLocaleString()} B)
                </span>
                <span>{ttsPreviewResult.voiceProfile.ggufVocalizerModel}</span>
              </div>
              <audio
                data-testid="hardware-tts-preview-audio"
                controls
                src={ttsPreviewResult.audioDataUrl}
                className="w-full h-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Topology Selector: Air-Gapped Local / On-Premises / Cloud */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEPLOYMENT_ENVS.map((env) => {
          const isSelected = deploymentMode === env.id;
          return (
            <button
              key={env.id}
              type="button"
              onClick={() => onSelectDeploymentMode(env.id)}
              className={`p-4 rounded-xl border text-left transition-colors flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : `${borderClass} ${surfaceClass} hover:border-slate-700`
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${headingText}`}>{env.title}</span>
                <Cloud className="w-4 h-4 text-emerald-400" />
              </div>
              <p className={`text-xs ${mutedText}`}>{env.desc}</p>
              <div className="text-xs font-mono text-emerald-400 pt-1">
                {isSelected ? '[ACTIVE DEPLOYMENT ENVIRONMENT]' : 'Switch Environment ->'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hardware Profile Selector Cards with Explicit RAM, CPU, and Storage Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(HARDWARE_PROFILES) as HardwareProfileId[]).map((hwId) => {
          const hw = HARDWARE_PROFILES[hwId];
          const isSelected = hw.id === activeHardware.id;
          const IconComponent =
            hwId === 'mobile-arm64' ? Smartphone : hwId === 'laptop-unified' ? Laptop : Server;

          return (
            <button
              key={hw.id}
              type="button"
              onClick={() => onSelectHardware(hw.id)}
              className={`p-4 rounded-xl border text-left transition-colors flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'border-sky-500 bg-sky-500/10'
                  : `${borderClass} ${surfaceClass} hover:border-slate-700`
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono tabular-nums text-sky-400`}>
                    {hw.ramGb}GB RAM · {hw.cpuCores}-Core CPU · {hw.storageFreeGb}GB Disk
                  </span>
                  <IconComponent className="w-4 h-4 text-sky-400" />
                </div>
                <div className={`text-sm font-semibold ${headingText}`}>{hw.name}</div>
                <div className={`text-xs ${mutedText}`}>{hw.cpuSpecLabel}</div>
              </div>

              <div
                className={`pt-2 border-t ${borderClass} flex items-center justify-between text-xs font-mono tabular-nums ${mutedText}`}
              >
                <span>
                  Power: {hw.minPowerWatts}W–{hw.maxPowerWatts}W
                </span>
                <span className={isSelected ? 'text-sky-400 font-semibold' : ''}>
                  {isSelected ? 'Active Hardware' : 'Select Hardware'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Power & Thermal Sliders + Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`lg:col-span-6 border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-5`}
        >
          <h3 className={`text-sm font-semibold ${headingText}`}>
            Dynamic Power & Thermal Ceiling Controls ({activeHardware.name})
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="power-budget-slider" className={`font-medium ${headingText}`}>
                  Sustained Compute Power Envelope (Watts)
                </label>
                <span className="font-mono tabular-nums text-sky-400">
                  {powerBudgetWatts}W (Range {activeHardware.minPowerWatts}W–
                  {activeHardware.maxPowerWatts}W)
                </span>
              </div>
              <input
                id="power-budget-slider"
                type="range"
                min={activeHardware.minPowerWatts}
                max={activeHardware.maxPowerWatts}
                step={1}
                value={powerBudgetWatts}
                onChange={(e) => onChangePowerWatts(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="thermal-limit-slider" className={`font-medium ${headingText}`}>
                  Skin / Junction Thermal Ceiling (°C)
                </label>
                <span className="font-mono tabular-nums text-amber-400">
                  {thermalLimitC}°C (Safe Max {activeHardware.safeMaxThermalC}°C)
                </span>
              </div>
              <input
                id="thermal-limit-slider"
                type="range"
                min={36}
                max={activeHardware.safeMaxThermalC}
                step={1}
                value={thermalLimitC}
                onChange={(e) => onChangeThermalLimitC(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label htmlFor="ambient-temp-slider" className={`font-medium ${headingText}`}>
                  Ambient Environment Temperature (°C)
                </label>
                <span className={`font-mono tabular-nums ${mutedText}`}>{ambientTempC}°C</span>
              </div>
              <input
                id="ambient-temp-slider"
                type="range"
                min={15}
                max={40}
                step={1}
                value={ambientTempC}
                onChange={(e) => onChangeAmbientTempC(Number(e.target.value))}
                className="w-full accent-slate-400"
              />
            </div>
          </div>

          <div
            className={`p-3.5 rounded-lg border ${borderClass} ${subSurfaceClass} text-xs space-y-1.5`}
          >
            <div className={`font-semibold ${headingText}`}>
              Hardware Compatibility & Thermal Governance
            </div>
            <p className={mutedText}>
              Host Specs: <span className={headingText}>{activeHardware.ramGb}GB RAM</span>,{' '}
              <span className={headingText}>{activeHardware.cpuSpecLabel}</span>, and{' '}
              <span className={headingText}>{activeHardware.storageFreeGb}GB Flash Storage</span>.
              Models that exceed this hardware envelope are automatically hidden in the User
              Workspace while keeping multiple compatible parameter tiers ready.
            </p>
          </div>
        </div>

        {/* Right: Real-Time Computed Telemetry Grid */}
        <div
          className={`lg:col-span-6 border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}
        >
          <h3 className={`text-sm font-semibold ${headingText}`}>
            Real-Time Hardware & Memory Telemetry ({activeModel.name})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono tabular-nums">
            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-xs ${mutedText}`}>Throughput</div>
              <div className={`text-lg font-semibold ${headingText} mt-0.5`}>
                {telemetry.estimatedTokensPerSec} tok/s
              </div>
              <div className={`text-[11px] ${mutedText}`}>
                {telemetry.powerEfficiencyTokPerWatt} tok/W
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-xs ${mutedText}`}>Steady Temperature</div>
              <div
                className={`text-lg font-semibold mt-0.5 ${
                  telemetry.steadyStateTempC > thermalLimitC ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {telemetry.steadyStateTempC}°C
              </div>
              <div className={`text-[11px] ${mutedText}`}>
                Throttle: {telemetry.thermalThrottlePct}%
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-xs ${mutedText}`}>Battery Endurance</div>
              <div className={`text-lg font-semibold ${headingText} mt-0.5`}>
                {telemetry.estimatedBatteryHours !== null
                  ? `${telemetry.estimatedBatteryHours} hrs`
                  : 'AC Mains'}
              </div>
              <div className={`text-[11px] ${mutedText}`}>
                Pacing: +{telemetry.interTokenPacingMs}ms
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-xs ${mutedText}`}>Active Resident RAM</div>
              <div className={`text-lg font-semibold ${headingText} mt-0.5`}>
                {activeFootprint.totalRequiredRamGb} GB
              </div>
              <div className={`text-[11px] ${mutedText}`}>
                Host RAM: {activeHardware.ramGb} GB
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-xs ${mutedText}`}>Flash Stream Offload</div>
              <div className={`text-lg font-semibold ${headingText} mt-0.5`}>
                {activeFootprint.flashStreamedGb} GB
              </div>
              <div className={`text-[11px] ${mutedText}`}>
                @{activeHardware.storageBandwidthGbPerSec} GB/s
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass}`}>
              <div className={`text-xs ${mutedText}`}>Model Min Specs</div>
              <div className={`text-sm font-semibold text-sky-400 mt-0.5`}>
                {activeModel.minRamGb}G RAM · {activeModel.minStorageGb}G Disk
              </div>
              <div className={`text-[11px] ${mutedText}`}>
                {activeModel.minCpuCores}-Core CPU Min
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Quantization Matrix across Active Hardware */}
      <div className={`border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-3`}>
        <h3 className={`text-sm font-semibold ${headingText}`}>
          Quantization Precision & Memory Footprint Matrix on {activeHardware.name}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
            <thead>
              <tr className={`border-b ${borderClass} ${mutedText}`}>
                <th className="py-2 pr-4">Quant Format</th>
                <th className="py-2 pr-4">Bits / Weight</th>
                <th className="py-2 pr-4">Total Shard Size</th>
                <th className="py-2 pr-4">Resident RAM</th>
                <th className="py-2 pr-4">Flash Streamed</th>
                <th className="py-2 pr-4">Est. Speed</th>
                <th className="py-2">Hardware Fit</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {(Object.keys(QUANTIZATION_SPECS) as QuantizationType[]).map((qKey) => {
                const spec = QUANTIZATION_SPECS[qKey];
                const fp = calculateQuantizedFootprint(
                  activeModel.totalParamsBillions,
                  activeModel.activeParamsBillions,
                  qKey,
                  currentVersion.contextLength,
                  activeHardware
                );
                const tm = computeThermalAndPowerMetrics(
                  activeHardware,
                  qKey,
                  powerBudgetWatts,
                  thermalLimitC,
                  activeModel.activeParamsBillions,
                  ambientTempC
                );
                return (
                  <tr key={qKey}>
                    <td className={`py-2.5 pr-4 font-semibold ${headingText}`}>{qKey}</td>
                    <td className="py-2.5 pr-4">{spec.bitsPerWeight} bpw</td>
                    <td className="py-2.5 pr-4">{fp.totalWeightsGb} GB</td>
                    <td className="py-2.5 pr-4">{fp.totalRequiredRamGb} GB</td>
                    <td className="py-2.5 pr-4">{fp.flashStreamedGb} GB</td>
                    <td className="py-2.5 pr-4 text-sky-400">{tm.estimatedTokensPerSec} tok/s</td>
                    <td className="py-2.5">
                      <span
                        className={
                          fp.fitsInMemoryWithFlashOffload ? 'text-emerald-400' : 'text-amber-400'
                        }
                      >
                        {fp.fitsInMemoryWithFlashOffload
                          ? 'Fits in Local RAM'
                          : 'Requires Flash Paging'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
