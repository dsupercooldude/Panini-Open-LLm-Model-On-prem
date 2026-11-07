import React, { useState, useEffect, useRef } from 'react';
import {
  DomainCategory,
  StoredModel,
  HardwareProfile,
  DeploymentEnvironment,
  ThermalPowerTelemetry,
  CompatibleModelOption,
  MediaQualityTier,
  VideoPacingPreset,
  CreativeVisualTheme,
  LightingEffectStyle,
  CinematographyOpticsStyle,
  CodeLanguageChoice,
  DeepResearchPlanStep,
  ChatCapabilityMode,
  UploadedAttachment,
  UseCaseScenario,
  ContentSafetyMode,
  SubDomainExpert,
  LearnedEntityKnowledge,
  AmbiguityClarificationOption,
  StoryboardShot,
  SUB_DOMAIN_EXPERTS,
  getDynamicTypingSuggestions,
  generateDeepResearchPlan,
  autoCorrectUserQuery,
  generatePdfDocumentBytes,
  parsePromptIntoStoryboardShots,
  ExpenseDeckBrandStyle,
  SandboxIsolationRuntime,
  DocumentAclRole,
  PreviewableFileArtifactV59,
  buildPreviewableArtifactsFromCodingResolutionV59,
  synthesizeLocalModelTtsAudioV63,
  getPersistentSovereignSettingsV61,
  LocalModelTtsSynthesisResultV63,
} from '../utils/engineLogic';
import { ChatMessage, ChatThreadSession, GeneratedMediaItem } from '../utils/initialData';
import {
  VideoAspectRatio,
  OpenSourceVideoModelArchitecture,
  OpenSourceImageModelArchitecture,
  Veo3CameraTrajectory,
  HumanGenderType,
  HairStructureType,
  FacialExpressionType,
  PromptSceneParameterOverrides,
  SovereignReferenceVideoMasterV55,
  SOVEREIGN_VIDEO_MASTERS_V55,
  buildPromptConstructedScene,
  generatePureReceiptPdfBytes,
  synthesizeCommercialReceiptSpec,
} from '../utils/multimodalSuite';
import {
  BioscienceLabCard,
  MusicSynthStudioCard,
  ImageCreateAndEditCard,
  SpatialMapsAndSearchCard,
  LiveVoiceConversationDrawer,
  renderPromptConstructedCanvasFrame,
} from './MultimodalStudios';
import {
  CodingMultiFormatWorkbenchCard,
  AdminResourcePermissionPolicy,
  BiDirectionalGuardrailBanner,
  BoundedAgentOrchestratorCard,
  ReceiptToExpenseDeckWorkbenchCard,
  KnowledgePipelineAndMcpCardV57,
  Phase3ProductionArchitectureCardV57,
} from './EnterpriseGovernanceAndCodingHub';
import {
  Send,
  Wifi,
  WifiOff,
  Settings,
  Trash2,
  Film,
  Paperclip,
  Download,
  FileText,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Code2,
  MessageSquare,
  Plus,
  Globe,
  BookOpen,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  ShieldCheck,
  Terminal,
  Hash,
  ExternalLink,
  Copy,
  Search,
  Users,
  Shield,
  Database,
  Mic,
  Music,
  Dna,
  MapPin,
  Radio,
  Wand2,
  Volume2,
  VolumeX,
  Image as ImageIcon,
} from 'lucide-react';

const CREATIVE_THEMES: { id: CreativeVisualTheme; shortLabel: string }[] = [
  { id: 'Golden-Hour Nature Documentary', shortLabel: 'Alpine Glacier Valley' },
  { id: 'Observatory & Quantum Realism', shortLabel: 'Quantum Observatory' },
  { id: 'Neo-Noir Rain Metropolis', shortLabel: 'Broadcast / Metropolis' },
  { id: 'Vedic & Sacred Temple Sanctuary', shortLabel: 'Classical Conservatory' },
  { id: 'Celestial Sidereal & Tarot Studio', shortLabel: 'Celestial Astral Dome' },
];

const LIGHTING_EFFECTS: { id: LightingEffectStyle; shortLabel: string }[] = [
  { id: 'Golden-Hour Chiaroscuro & Subsurface Glow', shortLabel: 'Golden Hour Rays' },
  { id: 'Anamorphic Three-Point Rim & God-Rays', shortLabel: 'Anamorphic God-Rays' },
  { id: 'Bioluminescent Cyan-Amber Reflections', shortLabel: 'Cyan-Amber Caustics' },
  { id: 'Sacred Diya Warmth & Incense Shafts', shortLabel: 'Warm Tungsten Shafts' },
];

const OPTICS_STYLES: { id: CinematographyOpticsStyle; shortLabel: string }[] = [
  { id: '65mm IMAX Anamorphic 2.39:1 Dolly', shortLabel: '65mm IMAX Dolly' },
  { id: '85mm f/1.2 Portrait Prime Bokeh', shortLabel: '85mm f/1.2 Bokeh' },
  { id: '35mm Leica Steadicam Motion', shortLabel: '35mm Leica Steadicam' },
];

const CODE_LANGUAGES: CodeLanguageChoice[] = [
  'Auto (Best Practice)',
  'TypeScript',
  'Python',
  'Rust',
  'C++20',
  'Go',
  'Java',
  'SQL',
];

interface UserWorkspaceViewProps {
  compatibleModels: CompatibleModelOption[];
  activeModel: StoredModel;
  onSelectModel: (modelId: string) => void;
  activeHardware: HardwareProfile;
  deploymentMode: DeploymentEnvironment;
  telemetry: ThermalPowerTelemetry;
  isOnlineLearning: boolean;
  onToggleOnlineLearning: () => void;
  chatCapability: ChatCapabilityMode;
  onChangeChatCapability: (mode: ChatCapabilityMode) => void;
  chatThreads: ChatThreadSession[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onCreateNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onLoadChatByReferenceId: (refId: string) => { ok: boolean; message: string };
  chatHistory: ChatMessage[];
  customScenarios: UseCaseScenario[];
  recentDomains: DomainCategory[];
  recentQueries: string[];
  onSendMessage: (
    prompt: string,
    domain?: DomainCategory,
    attachment?: UploadedAttachment
  ) => void;
  onSendCodingMessage: (prompt: string, languageChoice: CodeLanguageChoice) => void;
  onExecuteDeepResearch: (topic: string, steps?: DeepResearchPlanStep[]) => void;
  onApproveDeepResearchPlan?: (
    planMessageId: string,
    approvedTopic: string,
    approvedSteps: DeepResearchPlanStep[]
  ) => void;
  onSelectAmbiguityOption?: (option: AmbiguityClarificationOption) => void;
  onClearThreadContext?: () => void;
  onGenerateMediaInChat: (
    prompt: string,
    modality: 'Image' | 'Video',
    qualityTier: MediaQualityTier,
    pacingPreset: VideoPacingPreset,
    creativeTheme: CreativeVisualTheme,
    lightingEffect: LightingEffectStyle,
    opticsStyle: CinematographyOpticsStyle,
    aspectRatio?: VideoAspectRatio,
    sourcePhotoDataUrl?: string
  ) => void;
  onUpdateGeneratedMedia?: (
    messageId: string,
    updates: Partial<{
      qualityTier: MediaQualityTier;
      pacingPreset: VideoPacingPreset;
      creativeTheme: CreativeVisualTheme;
      lightingEffect: LightingEffectStyle;
      opticsStyle: CinematographyOpticsStyle;
      fps: number;
    }>
  ) => void;
  onOpenAdminConsole: () => void;
  onOpenAdminInstallScripts: () => void;
  contentSafetyMode: ContentSafetyMode;
  selectedExpertId: string | 'auto';
  onSelectExpertId: (expertId: string | 'auto') => void;
  onSwitchMessageExpert: (messageId: string, newExpertId: string) => void;
  learnedEntities: LearnedEntityKnowledge[];
  adminPermissions?: AdminResourcePermissionPolicy;
  onHitlDecision?: (messageId: string, decision: 'approved' | 'rejected') => void;
  onUpdateExpenseDeckStyle?: (
    messageId: string,
    brandStyle: ExpenseDeckBrandStyle,
    sandboxRuntime: SandboxIsolationRuntime
  ) => void;
  activeAclRole?: DocumentAclRole;
  onChangeAclRole?: (role: DocumentAclRole) => void;
  onUpdateMessageAclRole?: (messageId: string, role: DocumentAclRole) => void;
  onOpenFileInPreviewTab?: (
    files: PreviewableFileArtifactV59[],
    preferredFileId?: string
  ) => void;
  isDark: boolean;
}

function renderInlineSpans(text: string, isDark: boolean): React.ReactNode[] {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className={`px-1.5 py-0.5 text-xs font-mono rounded ${
            isDark ? 'bg-slate-800 text-sky-300' : 'bg-slate-100 text-sky-700'
          }`}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong
          key={idx}
          className={isDark ? 'font-semibold text-slate-100' : 'font-semibold text-slate-900'}
        >
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return <em key={idx}>{token.slice(1, -1)}</em>;
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

function renderFormattedMessage(content: string, isDark: boolean): React.ReactNode {
  const blocks = content.split(/```(\w*)\n([\s\S]*?)```/g);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i += 3) {
    const prose = blocks[i];
    const lang = blocks[i + 1];
    const codeBody = blocks[i + 2];

    if (prose) {
      const lines = prose.split('\n');
      let lineIdx = 0;
      while (lineIdx < lines.length) {
        const line = lines[lineIdx].trim();
        if (!line) {
          lineIdx++;
          continue;
        }

        // Check for Markdown Table block
        if (line.startsWith('|') && line.endsWith('|')) {
          const tableLines: string[] = [];
          while (
            lineIdx < lines.length &&
            lines[lineIdx].trim().startsWith('|') &&
            lines[lineIdx].trim().endsWith('|')
          ) {
            tableLines.push(lines[lineIdx].trim());
            lineIdx++;
          }
          const rows = tableLines
            .filter((tl) => !/^\|[\s:|-]+\|$/.test(tl))
            .map((tl) =>
              tl
                .slice(1, -1)
                .split('|')
                .map((cell) => cell.trim())
            );
          if (rows.length > 0) {
            const headerRow = rows[0];
            const bodyRows = rows.slice(1);
            elements.push(
              <div
                key={`tbl-${i}-${lineIdx}`}
                className="my-2.5 overflow-x-auto rounded-xl border border-slate-800/90"
              >
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr
                      className={
                        isDark
                          ? 'bg-slate-900/90 text-sky-300 border-b border-slate-800'
                          : 'bg-slate-100 text-sky-800 border-b border-slate-200'
                      }
                    >
                      {headerRow.map((hCell, cIdx) => (
                        <th key={cIdx} className="px-3 py-2 font-semibold">
                          {renderInlineSpans(hCell, isDark)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {bodyRows.map((rCells, rIdx) => (
                      <tr
                        key={rIdx}
                        className={isDark ? 'bg-slate-950/60 hover:bg-slate-900/50' : 'bg-white'}
                      >
                        {rCells.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 leading-relaxed">
                            {renderInlineSpans(cell, isDark)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          continue;
        }

        if (line.startsWith('### ')) {
          elements.push(
            <h4
              key={`p-${i}-${lineIdx}`}
              className={`text-sm font-semibold tracking-normal mt-2 mb-1 ${
                isDark ? 'text-sky-300' : 'text-sky-700'
              }`}
            >
              {renderInlineSpans(line.replace(/^###\s+/, ''), isDark)}
            </h4>
          );
        } else if (line.startsWith('- ')) {
          elements.push(
            <div
              key={`p-${i}-${lineIdx}`}
              className="pl-3 flex items-start gap-2 text-sm leading-relaxed"
            >
              <span className="text-sky-400 select-none">•</span>
              <span>{renderInlineSpans(line.slice(2), isDark)}</span>
            </div>
          );
        } else {
          elements.push(
            <p key={`p-${i}-${lineIdx}`} className="text-sm leading-relaxed">
              {renderInlineSpans(line, isDark)}
            </p>
          );
        }
        lineIdx++;
      }
    }

    if (codeBody !== undefined) {
      elements.push(
        <div key={`code-${i}`} className="my-2.5">
          {lang && (
            <div className="text-[11px] font-mono text-slate-400 mb-1 uppercase">{lang}</div>
          )}
          <pre
            className={`p-3.5 rounded-lg border text-xs font-mono overflow-x-auto ${
              isDark
                ? 'border-slate-800 bg-slate-950 text-slate-200'
                : 'border-slate-200 bg-slate-100 text-slate-800'
            }`}
          >
            <code>{codeBody.trim()}</code>
          </pre>
        </div>
      );
    }
  }

  return <div className="space-y-1.5">{elements}</div>;
}

/**
 * Deterministic multi-octave procedural height function for realistic mountain & terrain ridges
 */
function terrainRidgeHeight(x: number, seedOffset: number, scale: number): number {
  const n1 = Math.sin(x * 0.0085 * scale + seedOffset) * 44;
  const n2 = Math.cos(x * 0.021 * scale - seedOffset * 1.7) * 22;
  const n3 = Math.sin(x * 0.053 * scale + seedOffset * 3.1) * 9.5;
  const n4 = Math.cos(x * 0.12 * scale + seedOffset * 5.3) * 3.8;
  return n1 + n2 + n3 + n4;
}

/**
 * Draws an articulated lifelike human character or Studio Ghibli ("Geebly") character
 * following the user prompt's action and style.
 */
function drawHumanCharacter(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  groundY: number,
  t: number,
  isGhibli: boolean,
  action:
    | 'walking'
    | 'observing'
    | 'gesturing'
    | 'portrait'
    | 'presenting'
    | 'presenting_news'
    | 'meditating'
    | 'researching'
    | 'cooking'
    | 'teaching_sutras',
  sunColorRgb: string
) {
  ctx.save();
  const walkCycle = action === 'walking' ? Math.sin(t * 2.8) : Math.sin(t * 0.9) * 0.25;
  const bobY = action === 'walking' ? Math.abs(Math.cos(t * 2.8)) * 3.2 : Math.sin(t * 1.2) * 1.1;
  const windSway = Math.sin(t * 2.1) * 5.5 + Math.cos(t * 1.3) * 2.5;

  const x = centerX + (action === 'walking' ? Math.sin(t * 0.45) * 28 : 0);
  const y = groundY - bobY;

  // Ground contact ambient occlusion shadow
  const shadowGrad = ctx.createRadialGradient(x, groundY + 2, 2, x, groundY + 2, 28);
  shadowGrad.addColorStop(0, 'rgba(2, 6, 23, 0.72)');
  shadowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(x, groundY + 2, 26, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Articulated Legs & Boots
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const leftLegHipX = x - 5;
  const rightLegHipX = x + 5;
  const hipY = y - 42;
  const leftFootX = leftLegHipX + walkCycle * 11;
  const rightFootX = rightLegHipX - walkCycle * 11;

  ctx.strokeStyle = isGhibli ? '#1e293b' : '#0f172a';
  ctx.lineWidth = 6.2;
  ctx.beginPath();
  ctx.moveTo(leftLegHipX, hipY);
  ctx.lineTo(leftLegHipX + walkCycle * 5, y - 20);
  ctx.lineTo(leftFootX, groundY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(rightLegHipX, hipY);
  ctx.lineTo(rightLegHipX - walkCycle * 5, y - 20);
  ctx.lineTo(rightFootX, groundY);
  ctx.stroke();

  // Flowing Coat / Tunic / Cape (Dynamic Cloth Physics in Wind)
  const torsoTopY = y - 78;
  const coatGrad = ctx.createLinearGradient(x - 18, torsoTopY, x + 22, y - 28);
  if (isGhibli) {
    // Studio Ghibli cobalt & crimson explorer tunic with warm sunlit rim
    coatGrad.addColorStop(0, '#2563eb');
    coatGrad.addColorStop(0.65, '#1d4ed8');
    coatGrad.addColorStop(1, '#1e3a8a');
  } else {
    // Photorealistic charcoal/expedition tailored coat with rim illumination
    coatGrad.addColorStop(0, '#334155');
    coatGrad.addColorStop(0.5, '#1e293b');
    coatGrad.addColorStop(1, '#0f172a');
  }
  ctx.fillStyle = coatGrad;
  ctx.beginPath();
  ctx.moveTo(x - 13, torsoTopY + 4);
  ctx.lineTo(x + 13, torsoTopY + 4);
  ctx.lineTo(x + 16 + windSway * 0.7, hipY + 10);
  ctx.lineTo(x - 17 + windSway * 1.1, hipY + 12);
  ctx.closePath();
  ctx.fill();

  // Sunlit Rim Highlight along Coat Shoulder & Edge
  ctx.strokeStyle = `rgba(${sunColorRgb}, 0.85)`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 12, torsoTopY + 4);
  ctx.lineTo(x + 16 + windSway * 0.7, hipY + 10);
  ctx.stroke();

  // Flowing Scarf / Collar Ribbon in Breeze
  ctx.strokeStyle = isGhibli ? '#f43f5e' : '#38bdf8';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(x, torsoTopY + 5);
  ctx.quadraticCurveTo(
    x - 18 + windSway * 1.3,
    torsoTopY + 12,
    x - 32 + windSway * 1.9,
    torsoTopY + 6 + Math.sin(t * 3.2) * 4
  );
  ctx.stroke();

  // Articulated Arms & Natural Hand Gesture
  ctx.strokeStyle = isGhibli ? '#1d4ed8' : '#1e293b';
  ctx.lineWidth = 5.2;
  // Left Arm
  ctx.beginPath();
  ctx.moveTo(x - 12, torsoTopY + 8);
  ctx.lineTo(x - 17 - walkCycle * 6, torsoTopY + 26);
  ctx.stroke();
  // Right Arm (raised slightly if observing/presenting/researching)
  const rightHandX =
    action === 'observing' || action === 'presenting'
      ? x + 22
      : x + 16 + walkCycle * 6;
  const rightHandY =
    action === 'observing' || action === 'presenting'
      ? torsoTopY + 12 + Math.sin(t * 1.8) * 3
      : torsoTopY + 26;
  ctx.beginPath();
  ctx.moveTo(x + 12, torsoTopY + 8);
  ctx.lineTo(rightHandX, rightHandY);
  ctx.stroke();

  // Lifelike Hands (Skin Subsurface Scattering Tone)
  ctx.fillStyle = '#f1c27d';
  ctx.beginPath();
  ctx.arc(rightHandX, rightHandY, 2.8, 0, Math.PI * 2);
  ctx.arc(x - 17 - walkCycle * 6, torsoTopY + 26, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Neck & Realistic Human Head with Subsurface Scattering
  const headX = x + Math.sin(t * 0.8) * 0.8;
  const headY = torsoTopY - 10;
  ctx.fillStyle = '#e0ac69';
  ctx.fillRect(headX - 3, torsoTopY - 3, 6, 8);

  const skinGrad = ctx.createRadialGradient(headX + 3, headY - 2, 2, headX, headY, 12);
  skinGrad.addColorStop(0, '#ffdbac');
  skinGrad.addColorStop(0.7, '#f1c27d');
  skinGrad.addColorStop(1, '#c68642');
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.arc(headX, headY, isGhibli ? 11.2 : 10.2, 0, Math.PI * 2);
  ctx.fill();

  // Facial Features (Expressive Eyes, Brow, Nose Bridge & Gentle Smile)
  const eyeRadius = isGhibli ? 2.1 : 1.35;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(headX - 3.4, headY - 1, eyeRadius, 0, Math.PI * 2);
  ctx.arc(headX + 3.8, headY - 1, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Eye Specular Catchlight (Essential for lifelike human & Ghibli eyes)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(headX - 2.9, headY - 1.6, isGhibli ? 0.9 : 0.55, 0, Math.PI * 2);
  ctx.arc(headX + 4.3, headY - 1.6, isGhibli ? 0.9 : 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Warm Cheek Blush / Subsurface Glow
  ctx.fillStyle = isGhibli ? 'rgba(244, 63, 94, 0.32)' : 'rgba(234, 88, 12, 0.18)';
  ctx.beginPath();
  ctx.arc(headX - 5.2, headY + 2.2, 2.2, 0, Math.PI * 2);
  ctx.arc(headX + 5.2, headY + 2.2, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Natural Expression Line
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(headX + 0.5, headY + 2.5, 2.6, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // Wind-Swept Hair Strands with Rim Backlighting
  ctx.fillStyle = isGhibli ? '#1e1b4b' : '#0f172a';
  ctx.beginPath();
  ctx.arc(headX, headY - 3, isGhibli ? 11.8 : 10.6, Math.PI * 0.92, Math.PI * 2.08);
  ctx.quadraticCurveTo(
    headX - 14 + windSway * 0.6,
    headY + 4,
    headX - 18 + windSway * 0.9,
    headY + 9
  );
  ctx.quadraticCurveTo(headX - 8, headY - 2, headX, headY - 11);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws dynamic prompt-driven foreground objects (spacecraft, vehicles, trains, castles/temples, creatures, celestial planets)
 * so every user prompt is synthesized live rather than using a static preset scene.
 */
function drawDynamicPromptObjects(
  ctx: CanvasRenderingContext2D,
  w: number,
  horizonY: number,
  t: number,
  dollyX: number,
  detectedObjects: string[],
  sunColorRgb: string,
  isGhibli: boolean
) {
  ctx.save();

  if (detectedObjects.includes('celestial_body')) {
    const px = w * 0.22 - dollyX * 0.18;
    const py = horizonY * 0.34;
    const planetGrad = ctx.createRadialGradient(px - 10, py - 10, 4, px, py, 36);
    planetGrad.addColorStop(0, `rgba(${sunColorRgb}, 0.95)`);
    planetGrad.addColorStop(0.55, '#4f46e5');
    planetGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(px, py, 34, 0, Math.PI * 2);
    ctx.fill();

    // Planetary Ring
    ctx.strokeStyle = `rgba(${sunColorRgb}, 0.65)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(px, py, 58, 11, -0.22, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (detectedObjects.includes('spacecraft')) {
    const sx = ((w * 0.35 + t * 38) % (w - 120)) + 60;
    const sy = horizonY * 0.36 + Math.sin(t * 1.9) * 8;
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(sx + 26, sy);
    ctx.lineTo(sx - 18, sy - 9);
    ctx.lineTo(sx - 12, sy);
    ctx.lineTo(sx - 18, sy + 9);
    ctx.closePath();
    ctx.fill();

    // Ion thruster plume
    const plume = ctx.createLinearGradient(sx - 48, sy, sx - 12, sy);
    plume.addColorStop(0, 'transparent');
    plume.addColorStop(1, '#38bdf8');
    ctx.fillStyle = plume;
    ctx.fillRect(sx - 48, sy - 3, 36, 6);
  }

  if (detectedObjects.includes('train') || detectedObjects.includes('vehicle')) {
    const vx = ((w * 0.15 + t * 52) % (w + 140)) - 70;
    const vy = horizonY - 8;
    ctx.fillStyle = isGhibli ? '#dc2626' : '#0ea5e9';
    ctx.fillRect(vx, vy - 16, 86, 15);
    ctx.fillStyle = '#fef08a';
    for (let win = vx + 8; win < vx + 76; win += 14) {
      ctx.fillRect(win, vy - 12, 8, 6);
    }
  }

  if (detectedObjects.includes('creature')) {
    for (let b = 0; b < 4; b++) {
      const bx = ((w * 0.25 + b * 64 + t * 32) % (w - 80)) + 40;
      const by = horizonY * 0.42 + Math.sin(t * 3.4 + b) * 10 - b * 8;
      const wing = Math.sin(t * 7.5 + b * 1.4) * 7;
      ctx.strokeStyle = isGhibli ? '#ffffff' : '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(bx - 10, by + wing);
      ctx.quadraticCurveTo(bx - 4, by - 4, bx, by);
      ctx.quadraticCurveTo(bx + 4, by - 4, bx + 10, by + wing);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Draws an 8K Broadcast Television Newsroom Studio with an articulated human News Channel Presenter
 * at an illuminated glass/metal anchor desk, curved LED world-map video wall, 3-point studio lighting,
 * synchronized lip-sync speaking animation, and live scrolling breaking-news lower-third ticker.
 */
function drawNewsStudioScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  media: GeneratedMediaItem,
  activeQuality: MediaQualityTier,
  activeOptics: CinematographyOpticsStyle,
  activePacingFps: number,
  showHumanSubject: boolean,
  promptEntities: string[]
) {
  ctx.save();

  // 1. Deep Broadcast Studio Backdrop Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#04091a');
  bgGrad.addColorStop(0.45, '#0b1736');
  bgGrad.addColorStop(0.78, '#0f2347');
  bgGrad.addColorStop(1, '#050b18');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Curved LED World-Map Broadcast Video Wall
  const wallTop = 34;
  const wallBottom = Math.floor(h * 0.68);
  const wallHeight = wallBottom - wallTop;

  const wallGrad = ctx.createLinearGradient(40, wallTop, w - 40, wallBottom);
  wallGrad.addColorStop(0, '#071938');
  wallGrad.addColorStop(0.5, '#0c2d5e');
  wallGrad.addColorStop(1, '#081b3d');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(36, wallTop, w - 72, wallHeight);

  // LED Matrix Grid Lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
  ctx.lineWidth = 1;
  for (let gx = 56; gx < w - 56; gx += 36) {
    ctx.beginPath();
    ctx.moveTo(gx, wallTop);
    ctx.lineTo(gx, wallBottom);
    ctx.stroke();
  }
  for (let gy = wallTop + 20; gy < wallBottom; gy += 28) {
    ctx.beginPath();
    ctx.moveTo(36, gy);
    ctx.lineTo(w - 36, gy);
    ctx.stroke();
  }

  // Glowing World Telemetry Nodes & Arcs on the Studio Video Wall
  for (let nodeIdx = 0; nodeIdx < 18; nodeIdx++) {
    const nx = 85 + ((nodeIdx * 79 + Math.round(t * 14)) % (w - 170));
    const ny = wallTop + 36 + ((nodeIdx * 43) % (wallHeight - 72));
    const pulse = 2.2 + Math.abs(Math.sin(t * 2.4 + nodeIdx)) * 2.8;
    ctx.fillStyle = nodeIdx % 3 === 0 ? 'rgba(248, 113, 113, 0.85)' : 'rgba(56, 189, 248, 0.8)';
    ctx.beginPath();
    ctx.arc(nx, ny, pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  // Left & Right Broadcast Monitor Panels on Video Wall
  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  ctx.fillRect(54, wallTop + 18, 175, 92);
  ctx.fillRect(w - 229, wallTop + 18, 175, 92);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(54, wallTop + 18, 175, 92);
  ctx.strokeRect(w - 229, wallTop + 18, 175, 92);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(62, wallTop + 26, 42, 15);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.fillText('LIVE', 70, wallTop + 37);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText('8K STUDIO FEED A', 62, wallTop + 56);
  ctx.fillText('GLOBAL TELEMETRY', w - 218, wallTop + 38);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('5600K KEY/FILL LOCK', 62, wallTop + 74);
  ctx.fillText('ANCHOR CAM 1 (85MM)', w - 218, wallTop + 56);

  // 3. Studio Ceiling Softbox Key & Rim Lighting Cones
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const studioLights = [w * 0.28, w * 0.5, w * 0.72];
  studioLights.forEach((lx, idx) => {
    const beamGrad = ctx.createRadialGradient(lx, wallTop, 6, lx, h * 0.55, 190);
    beamGrad.addColorStop(
      0,
      idx === 1 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(56, 189, 248, 0.18)'
    );
    beamGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.arc(lx, h * 0.42, 190, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // 4. Articulated Human News Channel Presenter (Anchor) Behind the Desk
  const anchorX = w * 0.5 + Math.sin(t * 0.85) * 2.2;
  const deskTopY = Math.floor(h * 0.64);
  const headY = deskTopY - 94 + Math.sin(t * 1.6) * 1.2;

  if (showHumanSubject) {
    ctx.save();

    // Tailored Broadcast Blazer Shoulders & Torso
    const suitGrad = ctx.createLinearGradient(anchorX - 54, deskTopY - 68, anchorX + 54, deskTopY + 12);
    suitGrad.addColorStop(0, '#0f172a');
    suitGrad.addColorStop(0.5, '#1e293b');
    suitGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = suitGrad;
    ctx.beginPath();
    ctx.moveTo(anchorX - 56, deskTopY + 10);
    ctx.quadraticCurveTo(anchorX - 52, deskTopY - 62, anchorX - 22, deskTopY - 68);
    ctx.lineTo(anchorX + 22, deskTopY - 68);
    ctx.quadraticCurveTo(anchorX + 52, deskTopY - 62, anchorX + 56, deskTopY + 10);
    ctx.closePath();
    ctx.fill();

    // Crisp White Broadcast Shirt Collar & Crimson Tie
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(anchorX - 15, deskTopY - 68);
    ctx.lineTo(anchorX + 15, deskTopY - 68);
    ctx.lineTo(anchorX, deskTopY - 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(anchorX - 4, deskTopY - 63);
    ctx.lineTo(anchorX + 4, deskTopY - 63);
    ctx.lineTo(anchorX + 6, deskTopY - 26);
    ctx.lineTo(anchorX, deskTopY - 18);
    ctx.lineTo(anchorX - 6, deskTopY - 26);
    ctx.closePath();
    ctx.fill();

    // Jacket Lapels & Broadcast Lapel Microphone
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(anchorX - 16, deskTopY - 68);
    ctx.lineTo(anchorX - 4, deskTopY - 24);
    ctx.moveTo(anchorX + 16, deskTopY - 68);
    ctx.lineTo(anchorX + 4, deskTopY - 24);
    ctx.stroke();

    // Clip-on Lapel Mic
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(anchorX - 14, deskTopY - 46, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Neck & Subsurface-Shaded Head
    ctx.fillStyle = '#e0ac8b';
    ctx.fillRect(anchorX - 7, headY + 14, 14, 16);

    const skinGrad = ctx.createRadialGradient(anchorX - 4, headY - 4, 3, anchorX, headY, 22);
    skinGrad.addColorStop(0, '#fbd3b7');
    skinGrad.addColorStop(0.7, '#e2a884');
    skinGrad.addColorStop(1, '#b97a56');
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.ellipse(anchorX, headY, 17, 21, 0, 0, Math.PI * 2);
    ctx.fill();

    // Styled Broadcast Hair
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(anchorX, headY - 5, 18, Math.PI * 0.92, Math.PI * 2.08);
    ctx.quadraticCurveTo(anchorX + 18, headY - 18, anchorX, headY - 23);
    ctx.closePath();
    ctx.fill();

    // Expressive Eyes with Periodic Blinking & Catchlights
    const isBlinking = Math.sin(t * 3.1) > 0.94;
    ctx.fillStyle = '#0f172a';
    if (isBlinking) {
      ctx.fillRect(anchorX - 9, headY - 3, 5, 1.4);
      ctx.fillRect(anchorX + 4, headY - 3, 5, 1.4);
    } else {
      ctx.beginPath();
      ctx.arc(anchorX - 6.5, headY - 3, 2.1, 0, Math.PI * 2);
      ctx.arc(anchorX + 6.5, headY - 3, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(anchorX - 7.1, headY - 3.7, 0.7, 0, Math.PI * 2);
      ctx.arc(anchorX + 5.9, headY - 3.7, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyebrows
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(anchorX - 10, headY - 7.5);
    ctx.lineTo(anchorX - 3, headY - 8.2);
    ctx.moveTo(anchorX + 3, headY - 8.2);
    ctx.lineTo(anchorX + 10, headY - 7.5);
    ctx.stroke();

    // Animated Lip-Sync Speaking Mouth
    const mouthOpen = 1.4 + Math.abs(Math.sin(t * 8.2)) * 3.4;
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(anchorX, headY + 9, 4.8, mouthOpen, 0, 0, Math.PI * 2);
    ctx.fill();

    // Articulated Forearms & Hands Resting on Anchor Desk with Script Pages
    const rightHandWave = Math.sin(t * 3.8) * 5;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(anchorX - 44, deskTopY - 36);
    ctx.lineTo(anchorX - 28, deskTopY - 2);
    ctx.moveTo(anchorX + 44, deskTopY - 36);
    ctx.lineTo(anchorX + 30 + rightHandWave, deskTopY - 6 - Math.abs(rightHandWave) * 0.5);
    ctx.stroke();

    ctx.fillStyle = '#f3bfa0';
    ctx.beginPath();
    ctx.arc(anchorX - 26, deskTopY - 1, 5.2, 0, Math.PI * 2);
    ctx.arc(
      anchorX + 31 + rightHandWave,
      deskTopY - 6 - Math.abs(rightHandWave) * 0.5,
      5.2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  // 5. Sleek Illuminated Glass & Brushed Metal Broadcast Anchor Desk
  const deskGrad = ctx.createLinearGradient(w * 0.16, deskTopY, w * 0.84, h - 58);
  deskGrad.addColorStop(0, '#0f172a');
  deskGrad.addColorStop(0.45, '#1e293b');
  deskGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = deskGrad;
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h - 54);
  ctx.quadraticCurveTo(w * 0.2, deskTopY - 6, w * 0.5, deskTopY - 6);
  ctx.quadraticCurveTo(w * 0.8, deskTopY - 6, w * 0.86, h - 54);
  ctx.closePath();
  ctx.fill();

  // Glowing Cyan & Crimson Broadcast Desk Accent Strips
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.18, deskTopY);
  ctx.quadraticCurveTo(w * 0.5, deskTopY - 8, w * 0.82, deskTopY);
  ctx.stroke();

  // Anchor Desk Front Branding Panel
  ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
  ctx.fillRect(w * 0.36, deskTopY + 14, w * 0.28, 34);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(w * 0.36, deskTopY + 14, w * 0.28, 34);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px "Inter", sans-serif';
  ctx.fillText('PANINI 8K LIVE NEWS', w * 0.39, deskTopY + 35);

  // 6. Live Broadcast Lower-Third Breaking News Banner & Scrolling Ticker
  const lowerThirdY = h - 68;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(28, lowerThirdY, w - 56, 36);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(28, lowerThirdY, 128, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px "Inter", sans-serif';
  ctx.fillText('BREAKING NEWS', 40, lowerThirdY + 22);

  const headlineText = (
    media.prompt || 'LIVE 8K BROADCAST STUDIO SYNTHESIS · ANCHOR DESK TELEMETRY'
  )
    .toUpperCase()
    .slice(0, 62);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillText(headlineText, 168, lowerThirdY + 22);

  // 7. CinemaScope Letterbox Bars & Validated Broadcast HUD
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, 24);
  ctx.fillRect(0, h - 28, w, 28);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText(
    `LIVE SYNTHESIS · ${activeQuality.toUpperCase()} (${media.resolution}) · 8K BROADCAST NEWS STUDIO · ${activeOptics.toUpperCase()}`,
    14,
    15
  );

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '10.5px "JetBrains Mono", monospace';
  const entitiesLabel =
    promptEntities.length > 0 ? promptEntities.slice(0, 4).join(' · ') : 'NEWS PRESENTER · ANCHOR DESK';
  ctx.fillText(
    `VALIDATED ENTITIES: [${entitiesLabel}] · SCENE: NEWS_STUDIO · ${activePacingFps}FPS`,
    14,
    h - 10
  );

  ctx.restore();
}

/**
 * Contextual 8K Scene 2: Artisanal Italian Culinary Studio & Cast-Iron Panini Press
 * Triggered for culinary panini, melted cheese, ciabatta, focaccia, grill, or kitchen prompts.
 */
function drawCulinaryStudioScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  media: GeneratedMediaItem,
  activeQuality: MediaQualityTier,
  activeOptics: CinematographyOpticsStyle,
  activePacingFps: number,
  promptEntities: string[]
) {
  ctx.save();

  // 1. Warm Italian Paninoteca Kitchen Backdrop with Copper Pots & Soft Bokeh Lights
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#1c1008');
  bgGrad.addColorStop(0.5, '#3b1f0e');
  bgGrad.addColorStop(1, '#140c06');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Warm Tungsten Bokeh Orbs in Kitchen Background
  for (let i = 0; i < 9; i++) {
    const bx = ((i * 97 + 40) % (w - 60)) + 30 + Math.sin(t * 0.4 + i) * 4;
    const by = 46 + ((i * 37) % 90);
    const br = 14 + (i % 4) * 6;
    const bokehGrad = ctx.createRadialGradient(bx, by, 2, bx, by, br);
    bokehGrad.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
    bokehGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.18)');
    bokehGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = bokehGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Carrara Marble Countertop & Grooved Cast-Iron Panini Platen Base
  const counterY = Math.floor(h * 0.62);
  const marbleGrad = ctx.createLinearGradient(0, counterY, 0, h);
  marbleGrad.addColorStop(0, '#292524');
  marbleGrad.addColorStop(0.4, '#1c1917');
  marbleGrad.addColorStop(1, '#0c0a09');
  ctx.fillStyle = marbleGrad;
  ctx.fillRect(0, counterY, w, h - counterY);

  // Cast-Iron Grill Surface
  const grillX = w * 0.16;
  const grillW = w * 0.68;
  const grillY = counterY - 12;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(grillX, grillY, grillW, 38);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(grillX, grillY, grillW, 38);

  // Glowing Cast-Iron Sear Ridges
  for (let gx = grillX + 18; gx < grillX + grillW - 14; gx += 22) {
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.42)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gx, grillY + 4);
    ctx.lineTo(gx - 8, grillY + 34);
    ctx.stroke();
  }

  // 3. Artisanal Pressed Italian Ciabatta Panino in Center Foreground
  const paninoX = w * 0.25;
  const paninoW = w * 0.5;
  const bottomBreadY = grillY - 26;

  // Bottom Ciabatta Crust
  const breadGrad = ctx.createLinearGradient(paninoX, bottomBreadY - 60, paninoX, bottomBreadY + 24);
  breadGrad.addColorStop(0, '#d97706');
  breadGrad.addColorStop(0.5, '#f59e0b');
  breadGrad.addColorStop(1, '#92400e');
  ctx.fillStyle = breadGrad;
  ctx.beginPath();
  ctx.roundRect(paninoX, bottomBreadY, paninoW, 24, 10);
  ctx.fill();

  // Heirloom Tomato & Prosciutto / Roasted Pepper Layer
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(paninoX + 14, bottomBreadY - 14, paninoW - 28, 14, 6);
  ctx.fill();

  // Fresh Genovese Basil Leaves & Pesto Drizzle
  ctx.fillStyle = '#16a34a';
  for (let b = 0; b < 5; b++) {
    const leafX = paninoX + 36 + b * ((paninoW - 72) / 4);
    ctx.beginPath();
    ctx.ellipse(leafX, bottomBreadY - 16, 16, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bubbling Melted Mozzarella di Bufala & Provolone Cheese Layer with Animated Stretch Drip
  const meltWave = Math.sin(t * 2.4) * 3;
  const cheeseGrad = ctx.createLinearGradient(paninoX, bottomBreadY - 34, paninoX, bottomBreadY - 4);
  cheeseGrad.addColorStop(0, '#fef9c3');
  cheeseGrad.addColorStop(0.6, '#fde047');
  cheeseGrad.addColorStop(1, '#facc15');
  ctx.fillStyle = cheeseGrad;
  ctx.beginPath();
  ctx.moveTo(paninoX + 8, bottomBreadY - 14);
  ctx.lineTo(paninoX + paninoW - 8, bottomBreadY - 14);
  ctx.lineTo(paninoX + paninoW - 12, bottomBreadY - 30);
  ctx.lineTo(paninoX + 12, bottomBreadY - 30);
  ctx.closePath();
  ctx.fill();

  // Melted Cheese Pull Drips over the Edge
  for (let d = 0; d < 4; d++) {
    const dripX = paninoX + 48 + d * ((paninoW - 96) / 3);
    const dripLen = 14 + (d % 2) * 8 + meltWave;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(dripX, bottomBreadY - 12 + dripLen * 0.4, 7, dripLen * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top Pressed Ciabatta Loaf with Caramelized Maillard Grill Marks
  const topBreadY = bottomBreadY - 58;
  ctx.fillStyle = breadGrad;
  ctx.beginPath();
  ctx.roundRect(paninoX - 4, topBreadY, paninoW + 8, 30, [16, 16, 6, 6]);
  ctx.fill();

  // Maillard Sear Stripes on Top Ciabatta Crust
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 4.5;
  for (let m = 0; m < 6; m++) {
    const mx = paninoX + 28 + m * ((paninoW - 56) / 5);
    ctx.beginPath();
    ctx.moveTo(mx, topBreadY + 4);
    ctx.lineTo(mx - 12, topBreadY + 24);
    ctx.stroke();
  }

  // 4. Volumetric Rising Steam Plumes & Sizzling Olive Oil Micro-Droplets
  for (let s = 0; s < 7; s++) {
    const sx = paninoX + 30 + s * ((paninoW - 60) / 6) + Math.sin(t * 1.8 + s) * 10;
    const sy = topBreadY - 12 - ((t * 24 + s * 19) % 75);
    const alpha = Math.max(0.05, 0.34 - (topBreadY - sy) / 240);
    ctx.fillStyle = `rgba(248, 250, 252, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 12 + (s % 3) * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. CinemaScope Letterbox Bars & Validated Culinary HUD
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, 24);
  ctx.fillRect(0, h - 28, w, 28);

  ctx.fillStyle = '#f59e0b';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText(
    `LIVE SYNTHESIS · ${activeQuality.toUpperCase()} (${media.resolution}) · 8K CULINARY STUDIO & CAST-IRON GRILL · ${activeOptics.toUpperCase()}`,
    14,
    15
  );

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '10.5px "JetBrains Mono", monospace';
  const entitiesLabel =
    promptEntities.length > 0
      ? promptEntities.slice(0, 4).join(' · ')
      : 'ITALIAN PANINI · MELTED MOZZARELLA · CIABATTA';
  ctx.fillText(
    `VALIDATED ENTITIES: [${entitiesLabel}] · SCENE: CULINARY_STUDIO · ${activePacingFps}FPS`,
    14,
    h - 10
  );

  ctx.restore();
}

/**
 * Contextual 8K Scene 3: Ancient Takshashila / Shalatura Gurukul & Sacred Sanskrit Courtyard
 * Triggered for Maharshi Panini, Sanskrit sutras, Ashtadhyayi, Rishi, or Vedic Temple Sanctuary theme.
 */
function drawAncientGurukulScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  media: GeneratedMediaItem,
  activeQuality: MediaQualityTier,
  activeOptics: CinematographyOpticsStyle,
  activePacingFps: number,
  promptEntities: string[]
) {
  ctx.save();

  // 1. Warm Golden-Amber Sacred Courtyard Sky & Sandstone Temple Pillars
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  skyGrad.addColorStop(0, '#31102f');
  skyGrad.addColorStop(0.5, '#7c2d12');
  skyGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Carved Sandstone Gurukul Pillars on Left & Right
  const floorY = Math.floor(h * 0.68);
  ctx.fillStyle = '#451a03';
  ctx.fillRect(24, 24, 42, floorY - 24);
  ctx.fillRect(w - 66, 24, 42, floorY - 24);
  ctx.fillRect(92, 24, 28, floorY - 24);
  ctx.fillRect(w - 120, 24, 28, floorY - 24);

  // Sandstone Courtyard Floor
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
  floorGrad.addColorStop(0, '#78350f');
  floorGrad.addColorStop(1, '#271206');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, w, h - floorY);

  // 2. Floating Golden Shiva Sutra & Ashtadhyayi Algebraic Sanskrit Symbols in Volumetric Rays
  const sutraLabels = ['अ इ उ ण्', 'ऋ ऌ क्', 'ए ओ ङ्', 'ऐ औ च्', 'अष्टाध्यायी', 'प्रत्याहार'];
  ctx.font = 'bold 13px "Inter", serif';
  sutraLabels.forEach((label, idx) => {
    const sx = w * 0.22 + (idx % 3) * (w * 0.24) + Math.sin(t * 0.7 + idx) * 8;
    const sy = 62 + Math.floor(idx / 3) * 44 + Math.cos(t * 0.9 + idx) * 4;
    ctx.fillStyle = 'rgba(254, 240, 138, 0.82)';
    ctx.fillText(label, sx, sy);
  });

  // 3. Maharshi Panini Seated on Raised Stone Platform with Palm-Leaf / Birch-Bark Manuscript
  const sageX = w * 0.5;
  const daisY = floorY - 18;
  ctx.fillStyle = '#92400e';
  ctx.fillRect(sageX - 75, daisY, 150, 22);

  // Seated Sage Robes (Saffron-Ochre)
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(sageX, daisY - 22, 34, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head & Radiant Halo
  const haloGrad = ctx.createRadialGradient(sageX, daisY - 62, 6, sageX, daisY - 62, 36);
  haloGrad.addColorStop(0, 'rgba(253, 224, 71, 0.65)');
  haloGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(sageX, daisY - 62, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e2a884';
  ctx.beginPath();
  ctx.arc(sageX, daisY - 62, 15, 0, Math.PI * 2);
  ctx.fill();

  // Animated Right Hand Gesture (Vyakhya Mudra — Teaching Sutras)
  const handLift = Math.sin(t * 2.6) * 5;
  ctx.strokeStyle = '#e2a884';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(sageX + 18, daisY - 36);
  ctx.lineTo(sageX + 34, daisY - 52 + handLift);
  ctx.stroke();

  // Palm-Leaf Ashtadhyayi Manuscript Desk in Front of Sage
  ctx.fillStyle = '#fcd34d';
  ctx.fillRect(sageX - 38, daisY - 8, 76, 8);

  // 4. Flickering Brass Oil Diyas on Courtyard Steps
  for (let d = -1; d <= 1; d += 2) {
    const dx = sageX + d * 105;
    const dy = floorY - 4;
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(dx, dy, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const flameH = 10 + Math.sin(t * 6 + d) * 3;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(dx, dy - 7, 4, flameH * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. CinemaScope Letterbox Bars & Validated Gurukul HUD
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, 24);
  ctx.fillRect(0, h - 28, w, 28);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText(
    `LIVE SYNTHESIS · ${activeQuality.toUpperCase()} (${media.resolution}) · 8K ANCIENT GURUKUL & ASHTADHYAYI SUTRA STUDIO · ${activeOptics.toUpperCase()}`,
    14,
    15
  );

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '10.5px "JetBrains Mono", monospace';
  const entitiesLabel =
    promptEntities.length > 0
      ? promptEntities.slice(0, 4).join(' · ')
      : 'MAHARSHI PANINI · ASHTADHYAYI SUTRAS · TAKSHASHILA';
  ctx.fillText(
    `VALIDATED ENTITIES: [${entitiesLabel}] · SCENE: ANCIENT_GURUKUL · ${activePacingFps}FPS`,
    14,
    h - 10
  );

  ctx.restore();
}

/**
 * Contextual 8K Scene 4: Cryogenic Quantum & Sutra-MoE Supercomputing Observatory
 * Triggered for quantum lab, Panini 400B AI model architecture, or Observatory & Quantum Realism theme.
 */
function drawQuantumLabScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  media: GeneratedMediaItem,
  activeQuality: MediaQualityTier,
  activeOptics: CinematographyOpticsStyle,
  activePacingFps: number,
  promptEntities: string[]
) {
  ctx.save();

  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#020617');
  bgGrad.addColorStop(0.55, '#0f172a');
  bgGrad.addColorStop(1, '#030712');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Holographic Tensor Grid Lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < w; gx += 48) {
    ctx.beginPath();
    ctx.moveTo(gx, 28);
    ctx.lineTo(gx, h - 28);
    ctx.stroke();
  }

  // Central Gold-Plated Cryogenic Dilution Chandelier & Sutra-MoE Routing Core
  const cx = w * 0.5;
  const tiers = [56, 96, 138, 178];
  tiers.forEach((ty, idx) => {
    const radius = 58 - idx * 9;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cx - radius, ty, radius * 2, 7);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.7, ty + 7);
    ctx.lineTo(cx - radius * 0.7, ty + 34);
    ctx.moveTo(cx + radius * 0.7, ty + 7);
    ctx.lineTo(cx + radius * 0.7, ty + 34);
    ctx.stroke();
  });

  // Pulsing Quantum Coherence & MoE Gating Waveforms
  for (let p = 0; p < 12; p++) {
    const angle = (p / 12) * Math.PI * 2 + t * 0.8;
    const px = cx + Math.cos(angle) * 110;
    const py = h * 0.48 + Math.sin(angle) * 42;
    ctx.fillStyle = p % 2 === 0 ? '#38bdf8' : '#34d399';
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // CinemaScope Letterbox Bars & Validated Quantum Lab HUD
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, 24);
  ctx.fillRect(0, h - 28, w, 28);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText(
    `LIVE SYNTHESIS · ${activeQuality.toUpperCase()} (${media.resolution}) · 8K QUANTUM & SUTRA-MOE OBSERVATORY · ${activeOptics.toUpperCase()}`,
    14,
    15
  );

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '10.5px "JetBrains Mono", monospace';
  const entitiesLabel =
    promptEntities.length > 0
      ? promptEntities.slice(0, 4).join(' · ')
      : 'QUANTUM CRYOSTAT · SUTRA-MOE ROUTER · TENSOR CORE';
  ctx.fillText(
    `VALIDATED ENTITIES: [${entitiesLabel}] · SCENE: QUANTUM_LAB · ${activePacingFps}FPS`,
    14,
    h - 10
  );

  ctx.restore();
}

/**
 * Contextual 8K Scene 5: Historical Coastal March / Satyagraha & Civic Heritage Plaza
 * Triggered for Dandi Salt March, Mahatma Gandhi, historical crowd, or heritage monument prompts.
 */
function drawHistoricalPlazaScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  media: GeneratedMediaItem,
  activeQuality: MediaQualityTier,
  activeOptics: CinematographyOpticsStyle,
  activePacingFps: number,
  promptEntities: string[],
  shot?: StoryboardShot
) {
  ctx.save();
  const horizonY = Math.floor(h * 0.58);

  // Warm Golden-Hour Coastal / Heritage Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, '#451a03');
  skyGrad.addColorStop(0.45, '#b45309');
  skyGrad.addColorStop(0.8, '#f59e0b');
  skyGrad.addColorStop(1, '#fef08a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, horizonY);

  // Glowing Golden Sun
  const sunX = w * 0.72 + Math.sin(t * 0.35) * 10;
  const sunY = horizonY - 42;
  const sunRad = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 130);
  sunRad.addColorStop(0, '#ffffff');
  sunRad.addColorStop(0.25, 'rgba(254, 240, 138, 0.92)');
  sunRad.addColorStop(0.65, 'rgba(245, 158, 11, 0.35)');
  sunRad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunRad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 130, 0, Math.PI * 2);
  ctx.fill();

  // Arabian Sea / Shimmering Coastal Horizon Band
  const seaGrad = ctx.createLinearGradient(0, horizonY, 0, horizonY + 52);
  seaGrad.addColorStop(0, '#0284c7');
  seaGrad.addColorStop(0.6, '#0369a1');
  seaGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, horizonY, w, 52);

  // Animated White-Crested Sea Waves & Salt Pans
  for (let wy = 0; wy < 48; wy += 8) {
    const waveX = ((t * 28 + wy * 19) % 80) - 40;
    ctx.strokeStyle = 'rgba(254, 249, 195, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 8 + wy);
    for (let x = 0; x <= w; x += 36) {
      ctx.quadraticCurveTo(
        x + 18 + waveX * 0.25,
        horizonY + 4 + wy + Math.sin(t * 2 + x * 0.04) * 3,
        x + 36,
        horizonY + 8 + wy
      );
    }
    ctx.stroke();
  }

  // Coastal Sand & White Crystalline Salt Flats Foreground
  const sandGrad = ctx.createLinearGradient(0, horizonY + 46, 0, h);
  sandGrad.addColorStop(0, '#fde68a');
  sandGrad.addColorStop(0.35, '#f8fafc');
  sandGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = sandGrad;
  ctx.fillRect(0, horizonY + 46, w, h - (horizonY + 46));

  // Spinning Charkha / Heritage Arch Silhouettes in Distance
  const archX = w * 0.22;
  const archY = horizonY - 2;
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(archX, archY - 14, 16, 0, Math.PI * 2);
  ctx.stroke();
  for (let sp = 0; sp < 8; sp++) {
    const ang = (sp / 8) * Math.PI * 2 + t * 1.1;
    ctx.beginPath();
    ctx.moveTo(archX, archY - 14);
    ctx.lineTo(archX + Math.cos(ang) * 15, archY - 14 + Math.sin(ang) * 15);
    ctx.stroke();
  }

  // Animated Procession of Satyagrahis / Figures Walking Forward in White Khadi
  const marchOffset = (t * 22) % 44;
  for (let idx = 0; idx < 7; idx++) {
    const fx = w * 0.2 + idx * 78 + (marchOffset * 0.45);
    const fy = horizonY + 95 + (idx % 2) * 16;
    const isLead = idx === 3;
    const stride = Math.sin(t * 4.2 + idx * 0.9) * 6;

    // Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(fx, fy + 26, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Khadi Robe / Dhoti Torso
    ctx.fillStyle = isLead ? '#ffffff' : '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(fx - 7, fy - 14, 14, 24, 5);
    ctx.fill();

    // Head
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(fx, fy - 21, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Walking Legs
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(fx - 3, fy + 9);
    ctx.lineTo(fx - 3 + stride, fy + 25);
    ctx.moveTo(fx + 3, fy + 9);
    ctx.lineTo(fx + 3 - stride, fy + 25);
    ctx.stroke();

    // Lead Figure Bamboo Walking Staff or Raised Salt Hand
    if (isLead) {
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(fx + 9, fy - 24);
      ctx.lineTo(fx + 14 + stride * 0.3, fy + 26);
      ctx.stroke();

      // Glowing Salt Crystals in Hand
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(fx - 10, fy - 8 + Math.sin(t * 3) * 3, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // CinemaScope Letterbox Bars
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, 24);
  ctx.fillRect(0, h - 28, w, 28);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText(
    `LIVE SYNTHESIS · ${activeQuality.toUpperCase()} (${media.resolution}) · ${
      shot ? `SHOT ${shot.shotNumber}: ${shot.environmentLabel.toUpperCase()}` : 'HISTORICAL COASTAL SATYAGRAHA'
    } · ${activeOptics.toUpperCase()}`,
    14,
    15
  );

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '10.5px "JetBrains Mono", monospace';
  const entitiesLabel =
    promptEntities.length > 0
      ? promptEntities.slice(0, 4).join(' · ')
      : 'DANDI COAST · KHADI PROCESSION · CRYSTALLINE SALT';
  ctx.fillText(
    `VALIDATED ENTITIES: [${entitiesLabel}] · ${activePacingFps}FPS`,
    14,
    h - 10
  );

  ctx.restore();
}

/**
 * Helper: Renders the on-canvas Storyboard Shot Overlay Badge & Active Sentence Subtitle
 * so every shot in a multi-sentence video clearly shows which sentence is currently being animated.
 */
function drawStoryboardShotOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  shot: StoryboardShot | undefined,
  totalShots: number
) {
  if (!shot) return;
  ctx.save();

  const boxW = Math.min(w - 36, 790);
  const boxX = Math.floor((w - boxW) / 2);
  const boxY = h - 76;
  const boxH = 42;

  ctx.fillStyle = 'rgba(2, 6, 23, 0.84)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Top line: Shot badge + Environment + Camera Motion + Subject/Action
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  const headerText = `SHOT ${shot.shotNumber}/${totalShots} · ${shot.environmentLabel.toUpperCase()} · ${shot.subjectLabel.toUpperCase()} (${shot.actionLabel.toUpperCase()}) · ${shot.cameraMotion.toUpperCase()}`;
  ctx.fillText(headerText.slice(0, 108), boxX + 12, boxY + 15);

  // Second line: Active sentence from the prompt
  ctx.fillStyle = '#f8fafc';
  ctx.font = '11.5px "Inter", system-ui, sans-serif';
  const cleanSentence =
    shot.sentence.length > 106 ? `${shot.sentence.slice(0, 103)}...` : shot.sentence;
  ctx.fillText(`"${cleanSentence}"`, boxX + 12, boxY + 33);

  ctx.restore();
}

/**
 * Live Prompt-Driven 8K Cinema Studio & Multi-Shot Storyboard Video/Image Synthesizer.
 * Splits any prompt into sentence-by-sentence storyboard shots and animates each shot dynamically.
 */
const RealisticMediaCanvas: React.FC<{
  media: GeneratedMediaItem;
  messageId: string;
  onUpdateMediaParams?: (
    messageId: string,
    updates: Partial<{
      qualityTier: MediaQualityTier;
      pacingPreset: VideoPacingPreset;
      creativeTheme: CreativeVisualTheme;
      lightingEffect: LightingEffectStyle;
      opticsStyle: CinematographyOpticsStyle;
      fps: number;
    }>
  ) => void;
  isDark: boolean;
}> = ({ media, messageId, onUpdateMediaParams, isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRecordingWebm, setIsRecordingWebm] = useState(false);
  // Video generation parameters are ONLY shown when user clicks "Video Settings" on the generated media
  const [showVideoSettings, setShowVideoSettings] = useState(false);
  const [showVideoDetails, setShowVideoDetails] = useState(false);
  const [liveSynthesisPass, setLiveSynthesisPass] = useState<number>(100);

  const storyboardShots: StoryboardShot[] = React.useMemo(
    () =>
      media.visualNlp?.storyboardShots && media.visualNlp.storyboardShots.length > 0
        ? media.visualNlp.storyboardShots
        : parsePromptIntoStoryboardShots(media.prompt),
    [media.visualNlp?.storyboardShots, media.prompt]
  );

  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [isAutoCyclingShots, setIsAutoCyclingShots] = useState<boolean>(true);
  const [activeAspectRatio, setActiveAspectRatio] = useState<VideoAspectRatio>(
    media.aspectRatio || '16:9'
  );
  const [loadedPhotoEl, setLoadedPhotoEl] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (media.aspectRatio) {
      setActiveAspectRatio(media.aspectRatio);
    }
  }, [media.aspectRatio]);

  useEffect(() => {
    if (!media.sourcePhotoDataUrl) {
      setLoadedPhotoEl(null);
      return;
    }
    const img = new Image();
    img.onload = () => setLoadedPhotoEl(img);
    img.src = media.sourcePhotoDataUrl;
  }, [media.sourcePhotoDataUrl]);

  const [activeQuality, setActiveQuality] = useState<MediaQualityTier>(media.qualityTier);
  const [activeTheme, setActiveTheme] = useState<CreativeVisualTheme>(
    media.visualNlp?.creativeTheme || 'Golden-Hour Nature Documentary'
  );
  const [activeLighting, setActiveLighting] = useState<LightingEffectStyle>(
    media.visualNlp?.lightingEffect || 'Golden-Hour Chiaroscuro & Subsurface Glow'
  );
  const [activeOptics, setActiveOptics] = useState<CinematographyOpticsStyle>(
    media.visualNlp?.cinematographyOptics || '65mm IMAX Anamorphic 2.39:1 Dolly'
  );
  const [activePacingFps, setActivePacingFps] = useState<number>(media.fps || 24);
  const [isGhibliMode, setIsGhibliMode] = useState<boolean>(
    Boolean(media.visualNlp?.isGhibliStyle)
  );
  const [showHumanSubject, setShowHumanSubject] = useState<boolean>(
    media.visualNlp?.hasHumanSubject !== undefined ? media.visualNlp.hasHumanSubject : true
  );
  const [openSourceVideoModel, setOpenSourceVideoModel] =
    useState<OpenSourceVideoModelArchitecture>('Panini-Wan2.1-14B (3D Spatio-Temporal DiT)');
  const [cameraTrajectory, setCameraTrajectory] = useState<Veo3CameraTrajectory>(
    '65mm Anamorphic Dolly Push'
  );
  const [videoOverrides, setVideoOverrides] = useState<PromptSceneParameterOverrides>({});
  const [isVeoAudioPlaying, setIsVeoAudioPlaying] = useState<boolean>(false);
  const [isSynthesizingVideo, setIsSynthesizingVideo] = useState<boolean>(true);
  const veoAudioRef = useRef<HTMLAudioElement | null>(null);
  const webAudioCtxRef = useRef<AudioContext | null>(null);
  const webAudioTimerRef = useRef<number | null>(null);

  const activeStoryboardShot = storyboardShots[activeShotIndex] || storyboardShots[0];

  const veoSceneSpec = React.useMemo(() => {
    const shotSentence = activeStoryboardShot?.sentence || media.prompt;
    const combinedPrompt =
      shotSentence && shotSentence !== media.prompt
        ? `${shotSentence} — Full Scene Context: ${media.prompt}`
        : media.prompt;
    const shotScene = buildPromptConstructedScene(
      combinedPrompt,
      activeAspectRatio,
      media.sourcePhotoDataUrl,
      activeStoryboardShot?.shotNumber || activeShotIndex + 1,
      videoOverrides
    );
    if (
      !shotScene.promptDecomposition?.canGenerateVisual &&
      shotSentence !== media.prompt
    ) {
      return buildPromptConstructedScene(
        media.prompt,
        activeAspectRatio,
        media.sourcePhotoDataUrl,
        activeStoryboardShot?.shotNumber || activeShotIndex + 1,
        videoOverrides
      );
    }
    return shotScene;
  }, [
    activeStoryboardShot?.sentence,
    activeStoryboardShot?.shotNumber,
    activeShotIndex,
    media.prompt,
    activeAspectRatio,
    media.sourcePhotoDataUrl,
    videoOverrides,
  ]);

  const activeSceneSpecRef = useRef(veoSceneSpec);
  const [selectedV55VideoMasterId, setSelectedV55VideoMasterId] = useState<
    SovereignReferenceVideoMasterV55['id']
  >(veoSceneSpec.hotfixV55VideoMaster?.id || 'vid-v55-culinary-chefs');
  const [userSelectedMasterPreset, setUserSelectedMasterPreset] = useState<boolean>(false);
  const [videoEngineNetworkMode, setVideoEngineNetworkMode] = useState<
    'hybrid_online_offline' | 'online_cloud' | 'offline_airgap'
  >('hybrid_online_offline');

  useEffect(() => {
    setUserSelectedMasterPreset(false);
    if (veoSceneSpec.hotfixV55VideoMaster?.id) {
      setSelectedV55VideoMasterId(veoSceneSpec.hotfixV55VideoMaster.id);
    }
  }, [veoSceneSpec.hotfixV55VideoMaster?.id, media.prompt]);

  const activeV55VideoMaster = React.useMemo(
    () =>
      SOVEREIGN_VIDEO_MASTERS_V55.find((m) => m.id === selectedV55VideoMasterId) ||
      veoSceneSpec.hotfixV55VideoMaster ||
      SOVEREIGN_VIDEO_MASTERS_V55[0],
    [selectedV55VideoMasterId, veoSceneSpec.hotfixV55VideoMaster]
  );

  useEffect(() => {
    activeSceneSpecRef.current = veoSceneSpec;
    // If speaker audio is currently playing when the storyboard shot changes, seamlessly sync the .WAV stream
    if (isVeoAudioPlaying && veoAudioRef.current && veoSceneSpec.veo3AudioSpec?.wavDataUrl) {
      veoAudioRef.current.src = veoSceneSpec.veo3AudioSpec.wavDataUrl;
      veoAudioRef.current.muted = false;
      veoAudioRef.current.play().catch(() => {});
    }
  }, [veoSceneSpec, isVeoAudioPlaying]);

  // Trigger progressive blurred preview loading state whenever a video is generated or its parameters change
  useEffect(() => {
    setIsSynthesizingVideo(true);
    const timer = window.setTimeout(() => {
      setIsSynthesizingVideo(false);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [media.id, media.prompt, activeAspectRatio, activeQuality, openSourceVideoModel]);

  const stopWebAudioFoley = () => {
    if (webAudioTimerRef.current !== null) {
      window.clearInterval(webAudioTimerRef.current);
      webAudioTimerRef.current = null;
    }
    if (webAudioCtxRef.current) {
      webAudioCtxRef.current.close().catch(() => {});
      webAudioCtxRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopWebAudioFoley();
    };
  }, []);

  const toggleVeoSpeakerAudio = () => {
    const audioEl = veoAudioRef.current;
    if (isVeoAudioPlaying) {
      if (audioEl) {
        audioEl.pause();
        audioEl.muted = true;
      }
      stopWebAudioFoley();
      setIsVeoAudioPlaying(false);
    } else {
      setIsVeoAudioPlaying(true);
      if (audioEl) {
        audioEl.muted = false;
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
      }
      // Real-time Shot-Synchronized WebAudio Procedural Foley Synthesizer
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          stopWebAudioFoley();
          const ctx = new AudioCtx();
          webAudioCtxRef.current = ctx;
          const playPulse = () => {
            if (!webAudioCtxRef.current || webAudioCtxRef.current.state === 'closed') return;
            const now = ctx.currentTime;
            const currentSpec = activeSceneSpecRef.current;
            const foleyMode = currentSpec.veo3AudioSpec?.foleyMode || 'cosmic';

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            if (foleyMode === 'sizzle') {
              // Authentic Commercial Hotel Kitchen Foley:
              // 1) High-frequency filtered white-noise pan sizzle & oil crackle
              const bufferSize = Math.floor(ctx.sampleRate * 0.48);
              const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
              const output = noiseBuffer.getChannelData(0);
              for (let i = 0; i < bufferSize; i++) {
                const env = 0.55 + 0.45 * Math.sin((i / bufferSize) * Math.PI * 6);
                output[i] = (Math.random() * 2 - 1) * env;
              }
              const noiseSource = ctx.createBufferSource();
              noiseSource.buffer = noiseBuffer;
              const sizzleFilter = ctx.createBiquadFilter();
              sizzleFilter.type = 'bandpass';
              sizzleFilter.frequency.setValueAtTime(3800, now);
              sizzleFilter.Q.setValueAtTime(1.1, now);
              const sizzleGain = ctx.createGain();
              sizzleGain.gain.setValueAtTime(0.11, now);
              sizzleGain.gain.exponentialRampToValueAtTime(0.03, now + 0.46);
              noiseSource.connect(sizzleFilter);
              sizzleFilter.connect(sizzleGain);
              sizzleGain.connect(ctx.destination);
              noiseSource.start(now);
              noiseSource.stop(now + 0.48);

              // 2) Rhythmic chef knife chop & copper cookware metallic clink overtone
              osc.type = 'sine';
              osc.frequency.setValueAtTime(1840.0, now);
              osc.frequency.exponentialRampToValueAtTime(420.0, now + 0.08);
              gain.gain.setValueAtTime(0.045, now);
              gain.gain.exponentialRampToValueAtTime(0.002, now + 0.14);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now);
              osc.stop(now + 0.15);
              return;
            } else if (foleyMode === 'water_shower') {
              osc.type = 'sine';
              osc.frequency.setValueAtTime(520.0, now);
              osc.frequency.exponentialRampToValueAtTime(246.94, now + 0.42);
              gain.gain.setValueAtTime(0.06, now);
              gain.gain.exponentialRampToValueAtTime(0.012, now + 0.48);
            } else if (foleyMode === 'laser_medical') {
              osc.type = 'square';
              osc.frequency.setValueAtTime(1480.0, now);
              osc.frequency.setValueAtTime(329.63, now + 0.09);
              gain.gain.setValueAtTime(0.09, now);
              gain.gain.exponentialRampToValueAtTime(0.006, now + 0.45);
            } else if (foleyMode === 'heavy_machinery') {
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(146.83, now);
              osc.frequency.linearRampToValueAtTime(220.0, now + 0.38);
              gain.gain.setValueAtTime(0.085, now);
              gain.gain.exponentialRampToValueAtTime(0.01, now + 0.48);
            } else if (foleyMode === 'rain_transit') {
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(164.81, now);
              osc.frequency.exponentialRampToValueAtTime(196.0, now + 0.35);
              gain.gain.setValueAtTime(0.08, now);
              gain.gain.exponentialRampToValueAtTime(0.008, now + 0.48);
            } else {
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(220.0, now);
              osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.35);
              gain.gain.setValueAtTime(0.07, now);
              gain.gain.exponentialRampToValueAtTime(0.008, now + 0.48);
            }

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
          };
          playPulse();
          webAudioTimerRef.current = window.setInterval(playPulse, 520);
        }
      } catch {
        // Ignore WebAudio restriction in headless environments
      }
    }
  };

  // Auto-advance through storyboard shots every 2.8 seconds when playing a multi-shot video
  useEffect(() => {
    if (media.modality !== 'Video' || !isAutoCyclingShots || storyboardShots.length <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveShotIndex((prev) => (prev + 1) % storyboardShots.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [media.modality, isAutoCyclingShots, storyboardShots.length]);

  useEffect(() => {
    setActiveQuality(media.qualityTier);
    setActiveTheme(media.visualNlp?.creativeTheme || 'Golden-Hour Nature Documentary');
    setActiveLighting(
      media.visualNlp?.lightingEffect || 'Golden-Hour Chiaroscuro & Subsurface Glow'
    );
    setActiveOptics(media.visualNlp?.cinematographyOptics || '65mm IMAX Anamorphic 2.39:1 Dolly');
    setActivePacingFps(media.fps || 24);
    setIsGhibliMode(Boolean(media.visualNlp?.isGhibliStyle));
    setShowHumanSubject(
      media.visualNlp?.hasHumanSubject !== undefined ? media.visualNlp.hasHumanSubject : true
    );
  }, [media]);

  const triggerLiveResynthesis = (
    updates: Partial<{
      qualityTier: MediaQualityTier;
      creativeTheme: CreativeVisualTheme;
      lightingEffect: LightingEffectStyle;
      opticsStyle: CinematographyOpticsStyle;
      fps: number;
    }>
  ) => {
    setLiveSynthesisPass(25);
    window.setTimeout(() => setLiveSynthesisPass(100), 320);
    if (onUpdateMediaParams) {
      onUpdateMediaParams(messageId, updates);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let timerId = 0;
    let tick = 0;
    const isVideo = media.modality === 'Video';
    const intervalMs = Math.max(
      42,
      Math.round(1000 / (activePacingFps || 24)) + Math.min(12, media.interFrameYieldMs || 8)
    );

    const activeShot: StoryboardShot | undefined =
      storyboardShots[activeShotIndex] || storyboardShots[0];

    const scheduleNextFrame = () => {
      if (isVideo) {
        timerId = window.setTimeout(() => {
          animId = requestAnimationFrame(drawCinemaFrame);
        }, intervalMs);
      }
    };

    const drawCinemaFrame = () => {
      tick += 1;

      const w = canvas.width;
      const h = canvas.height;
      const progressRatio = isVideo ? (tick % 96) / 96 : 0.45;

      renderPromptConstructedCanvasFrame(
        ctx,
        w,
        h,
        veoSceneSpec,
        progressRatio,
        {
          shotBadgeText: showVideoDetails
            ? `${
                media.sourcePhotoDataUrl ? 'PHOTO-TO-VIDEO · ' : ''
              }${openSourceVideoModel} · ${activeAspectRatio} · ${activeQuality} (${activePacingFps}FPS)`
            : undefined,
          captionText: showVideoDetails
            ? activeShot
              ? undefined
              : veoSceneSpec.scenarioTitle
            : undefined,
          hudTelemetryText: showVideoDetails
            ? `Cam: ${cameraTrajectory} · Framing: ${
                veoSceneSpec.promptDecomposition?.humanAnatomy.cameraFraming || 'medium_shot'
              } · Foley: ${
                veoSceneSpec.veo3AudioSpec?.ambientSoundscape || 'Binaural Sync'
               }`
            : undefined,
          loadedPhotoElement: loadedPhotoEl,
        }
      );

      if (showVideoDetails) {
        drawStoryboardShotOverlay(ctx, w, h, activeShot, storyboardShots.length);
      }

      scheduleNextFrame();
    };

    animId = requestAnimationFrame(drawCinemaFrame);
    return () => {
      window.clearTimeout(timerId);
      cancelAnimationFrame(animId);
    };
  }, [
    media,
    veoSceneSpec,
    showVideoDetails,
    activeShotIndex,
    storyboardShots,
    activeQuality,
    activeTheme,
    activeLighting,
    activeOptics,
    activePacingFps,
    isGhibliMode,
    showHumanSubject,
    activeAspectRatio,
    loadedPhotoEl,
    openSourceVideoModel,
    cameraTrajectory,
    videoOverrides,
  ]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `panini-${activeQuality.toLowerCase().replace(/\s+/g, '-')}-${media.id}.png`;
    a.click();
  };

  const handleDownloadVideoWebm = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecordingWebm) return;

    try {
      const stream = (
        canvas as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream }
      ).captureStream?.(activePacingFps || 24);
      if (stream && typeof MediaRecorder !== 'undefined') {
        setIsRecordingWebm(true);
        const chunks: BlobPart[] = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `panini-video-${activeQuality.toLowerCase().replace(/\s+/g, '-')}-${media.id}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          setIsRecordingWebm(false);
        };
        recorder.start();
        window.setTimeout(() => {
          if (recorder.state !== 'inactive') recorder.stop();
        }, 1600);
        return;
      }
    } catch {
      // Fallback below
    }

    handleDownloadPng();
  };

  const chipBase = isDark
    ? 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700'
    : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300';
  const chipActive = 'border-sky-500 bg-sky-500/15 text-sky-400 font-semibold';

  return (
    <div className="mt-1 space-y-2.5">
      {/* Hidden WAV Audio Element — Always mounted so the on-video speaker toggle works in default & expanded views */}
      {veoSceneSpec.veo3AudioSpec && (
        <audio
          ref={veoAudioRef}
          src={veoSceneSpec.veo3AudioSpec.wavDataUrl}
          loop
          onEnded={() => setIsVeoAudioPlaying(false)}
          className="hidden"
        />
      )}

      {/* Explicit Generation Failure Banner (Always visible if validation fails — Zero Default Fallback) */}
      {veoSceneSpec.validationReport && !veoSceneSpec.validationReport.isValidated && (
        <div
          data-testid="video-generation-failed-banner"
          className="px-3 py-2 rounded-lg border border-rose-500/60 bg-rose-950/35 text-[11px] space-y-1"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-rose-300 font-bold">
            <span>
              ✗ {media.modality === 'Image' ? 'Image' : 'Video'} generation failed —{' '}
              {veoSceneSpec.validationReport.contextMatchStatus}
            </span>
            <span className="text-sky-300">
              Validation Score: {veoSceneSpec.validationReport.validationScorePct}%
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-300">
            {veoSceneSpec.validationReport.articulatedElements.map((el) => (
              <span key={el}>• {el}</span>
            ))}
          </div>
        </div>
      )}

      {/* Veo-3 Open-Source Spatio-Temporal DiT Header & Interactive 16:9 / 9:16 Aspect Ratio Strip */}
      {showVideoDetails && (
        <div
          data-testid="live-video-validation-strip"
          className={`px-3 py-2 rounded-lg border text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 ${
            isDark
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Veo-3 Open-Source DiT ({liveSynthesisPass}%) · Volumetric Raymarched &amp; fBm Shader
              </span>
            </span>
            <select
              aria-label="Open Source Video DiT Model"
              data-testid="veo3-opensource-model-select"
              value={openSourceVideoModel}
              onChange={(e) =>
                setOpenSourceVideoModel(e.target.value as OpenSourceVideoModelArchitecture)
              }
              className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700 text-[10px] font-mono"
            >
              <option value="Panini-Wan2.1-14B (3D Spatio-Temporal DiT)">
                Wan 2.1 14B (3D Spatio-Temporal DiT)
              </option>
              <option value="Panini-HunyuanVideo-13B">
                HunyuanVideo 13B (Dual-Stream DiT)
              </option>
              <option value="Panini-CogVideoX-5B + MMAudio Foley">
                CogVideoX-5B + MMAudio Foley
              </option>
            </select>
            <select
              aria-label="3D Camera Trajectory"
              data-testid="veo3-camera-trajectory-select"
              value={cameraTrajectory}
              onChange={(e) => setCameraTrajectory(e.target.value as Veo3CameraTrajectory)}
              className="px-2 py-0.5 rounded bg-slate-900 text-sky-300 border border-slate-700 text-[10px] font-mono"
            >
              <option value="65mm Anamorphic Dolly Push">65mm Anamorphic Dolly Push</option>
              <option value="FPV Drone Orbital Sweep">FPV Drone Orbital Sweep</option>
              <option value="Crane Counter-Poise Reveal">Crane Counter-Poise Reveal</option>
              <option value="Macro Shallow-DoF Rack Focus">Macro Shallow-DoF Rack Focus</option>
              <option value="Steadicam Tracking Shot">Steadicam Tracking Shot</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sky-400 font-semibold">
              {activeQuality} · {activePacingFps} FPS · {activeAspectRatio}
            </span>
            <div className="flex items-center gap-1 rounded bg-slate-900/90 p-0.5 border border-slate-700">
              <button
                type="button"
                data-testid="video-card-aspect-16-9"
                onClick={() => setActiveAspectRatio('16:9')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                  activeAspectRatio === '16:9'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                16:9 Landscape
              </button>
              <button
                type="button"
                data-testid="video-card-aspect-9-16"
                onClick={() => setActiveAspectRatio('9:16')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                  activeAspectRatio === '9:16'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                9:16 Portrait
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Camera Framing (Close-Up Face vs Medium vs Full-Body), Gender, Hair & Expression Bar */}
      {showVideoDetails && (
        <div
          data-testid="video-framing-anatomy-controls"
          className="px-3 py-2 rounded-lg border border-sky-500/30 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 text-[11px]"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] text-sky-300 font-semibold">Camera Framing:</span>
            {(
              [
                { id: 'closeup_portrait', label: 'Close-Up Face (85mm)' },
                { id: 'medium_shot', label: 'Medium (50mm)' },
                { id: 'full_body', label: 'Full-Body (35mm)' },
                { id: 'wide_scene', label: 'Wide Scene (24mm)' },
              ] as const
            ).map((frameOpt) => {
              const currentFraming =
                videoOverrides.cameraFraming ||
                veoSceneSpec.promptDecomposition?.humanAnatomy.cameraFraming ||
                'medium_shot';
              const isSelected = currentFraming === frameOpt.id;
              return (
                <button
                  key={frameOpt.id}
                  type="button"
                  data-testid={`video-framing-${frameOpt.id}`}
                  onClick={() =>
                    setVideoOverrides((prev) => ({
                      ...prev,
                      cameraFraming: frameOpt.id,
                    }))
                  }
                  className={`px-2 py-0.5 rounded font-mono text-[10px] transition ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {frameOpt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <select
              aria-label="Video Subject Gender Dimorphism"
              data-testid="video-gender-select"
              value={
                videoOverrides.gender ||
                veoSceneSpec.promptDecomposition?.humanAnatomy.gender ||
                'male'
              }
              onChange={(e) =>
                setVideoOverrides((prev) => ({
                  ...prev,
                  gender: e.target.value as HumanGenderType,
                }))
              }
              className="rounded bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-sky-300 border border-slate-700"
            >
              <option value="female">Female (Sculpted Jaw / Brows / Lashes)</option>
              <option value="male">Male (Angular Jaw / Brow Ridge)</option>
            </select>

            <select
              aria-label="Video Hair Structure & Headwear"
              data-testid="video-hair-select"
              value={
                videoOverrides.hairStructure ||
                veoSceneSpec.promptDecomposition?.humanAnatomy.hairStructure ||
                'side_part_pompadour'
              }
              onChange={(e) =>
                setVideoOverrides((prev) => ({
                  ...prev,
                  hairStructure: e.target.value as HairStructureType,
                }))
              }
              className="rounded bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-slate-700"
            >
              <option value="long_wavy">Hair: Long Flowing Wavy</option>
              <option value="shoulder_bob">Hair: Shoulder Bob</option>
              <option value="high_ponytail">Hair: High Ponytail</option>
              <option value="braided">Hair: Plaited Braids</option>
              <option value="curly_afro">Hair: Textured Curly / Afro</option>
              <option value="side_part_pompadour">Hair: Executive Side-Part</option>
              <option value="short_crop">Hair: Short Tapered Crop</option>
              <option value="turban_covered">Headwear: Pleated Sikh Turban (Dastar)</option>
            </select>

            <select
              aria-label="Video Facial Expression & Lip-Sync"
              data-testid="video-expression-select"
              value={
                videoOverrides.expression ||
                veoSceneSpec.promptDecomposition?.humanAnatomy.expression ||
                'speaking_lipsync'
              }
              onChange={(e) =>
                setVideoOverrides((prev) => ({
                  ...prev,
                  expression: e.target.value as FacialExpressionType,
                }))
              }
              className="rounded bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-slate-700"
            >
              <option value="speaking_lipsync">Expr: Speaking / Animated Visemes</option>
              <option value="smiling">Expr: Confident Smile</option>
              <option value="serene">Expr: Serene / Calm</option>
              <option value="focused">Expr: Focused / Analytical</option>
              <option value="neutral">Expr: Neutral</option>
            </select>
          </div>
        </div>
      )}

      {/* Prompt Decomposition Inspector: Domain, Gender, Hair, Cultural/Religious Flavours & Brand Emblem */}
      {showVideoDetails && veoSceneSpec.promptDecomposition && (
        <div
          data-testid="video-prompt-decomposition-badge"
          className="px-3 py-1.5 rounded-lg border border-sky-500/30 bg-slate-950/80 text-[10px] font-mono flex flex-wrap items-center justify-between gap-2 text-slate-300"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sky-300 font-semibold">
              Domain: {veoSceneSpec.promptDecomposition.scenarioDomain}
            </span>
            <span>·</span>
            <span className="text-cyan-300">
              Framing: {veoSceneSpec.promptDecomposition.humanAnatomy.cameraFraming} (
              {veoSceneSpec.promptDecomposition.humanAnatomy.cameraAngle})
            </span>
            {veoSceneSpec.promptDecomposition.humanAnatomy.hasHumanSubject && (
              <>
                <span>·</span>
                <span className="text-amber-300">
                  Anatomy: {veoSceneSpec.promptDecomposition.humanAnatomy.gender.toUpperCase()} /
                  Hair: {veoSceneSpec.promptDecomposition.humanAnatomy.hairStructure} / Headwear:{' '}
                  {veoSceneSpec.promptDecomposition.humanAnatomy.headwear} / Attire:{' '}
                  {veoSceneSpec.promptDecomposition.humanAnatomy.wardrobeStyle}
                </span>
              </>
            )}
            {veoSceneSpec.promptDecomposition.brandSpec.isBranded && (
              <>
                <span>·</span>
                <span className="text-emerald-300 font-semibold">
                  Brand Emblem: {veoSceneSpec.promptDecomposition.brandSpec.brandName} (
                  {veoSceneSpec.promptDecomposition.brandSpec.logoEmblemKind})
                </span>
              </>
            )}
          </div>
          <span className="text-slate-400">
            {veoSceneSpec.promptDecomposition.groundingSource} (
            {veoSceneSpec.promptDecomposition.ggufShardFile})
          </span>
        </div>
      )}

      {/* Contextual Video Validation Banner (Shown when Show more is active) */}
      {showVideoDetails &&
        veoSceneSpec.validationReport &&
        veoSceneSpec.validationReport.isValidated && (
          <div
            data-testid="video-contextual-validation-banner"
            className="px-3 py-2 rounded-lg border border-emerald-500/35 bg-emerald-950/20 text-[11px] space-y-1"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-emerald-300">
              <span>✓ {veoSceneSpec.validationReport.contextMatchStatus}</span>
              <span className="text-sky-300">
                Validation Score: {veoSceneSpec.validationReport.validationScorePct}%
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-300">
              {veoSceneSpec.validationReport.articulatedElements.map((el) => (
                <span key={el}>• {el}</span>
              ))}
            </div>
            {veoSceneSpec.pbrLightingPass && (
              <div
                data-testid="video-pbr-lighting-pass-badge"
                className="pt-1 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-amber-300"
              >
                <span>
                  PBR Pass: {veoSceneSpec.pbrLightingPass.architecturePattern} ·{' '}
                  {veoSceneSpec.pbrLightingPass.brdfLightingModel}
                </span>
                <span className="text-sky-300">
                  {veoSceneSpec.pbrLightingPass.subsurfaceScattering}
                </span>
              </div>
            )}
          </div>
        )}

      {/* Veo-3 Native Synchronized Foley & Ambient Audio Strip */}
      {showVideoDetails && veoSceneSpec.veo3AudioSpec && (
        <div
          data-testid="veo3-native-audio-bar"
          className="px-3 py-2 rounded-lg border border-amber-500/40 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 text-[11px]"
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="veo3-native-audio-toggle"
              aria-label={isVeoAudioPlaying ? 'Mute Video Audio' : 'Unmute and Play Video Audio'}
              onClick={toggleVeoSpeakerAudio}
              className={`px-2.5 py-1 rounded-md font-mono font-bold flex items-center gap-1.5 transition ${
                isVeoAudioPlaying
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              }`}
            >
              {isVeoAudioPlaying ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>
                {isVeoAudioPlaying
                  ? 'Sound On (Click Speaker to Mute)'
                  : 'Sound Off / Muted (Click Speaker to Play Audio)'}
              </span>
            </button>
            <span
              data-testid="shot-foley-sync-badge"
              className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 font-mono text-[10px] text-amber-300"
            >
              Foley Mode: {veoSceneSpec.veo3AudioSpec.foleyMode} · Shot{' '}
              {veoSceneSpec.veo3AudioSpec.shotNumber || 1}/{Math.max(1, storyboardShots.length)}
            </span>
            <span data-testid="active-foley-description" className="text-slate-200 font-medium">
              {veoSceneSpec.veo3AudioSpec.foleyDescription}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-amber-300">
            <span>{veoSceneSpec.veo3AudioSpec.ambientSoundscape}</span>
            <a
              href={veoSceneSpec.veo3AudioSpec.wavDataUrl}
              download={`panini-veo3-foley-${media.id}.wav`}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700"
            >
              .WAV Foley
            </a>
          </div>
        </div>
      )}

      {/* PRIMARY PROMPT-SYNTHESIZED VIDEO / IMAGE CANVAS — ALWAYS RENDERED FIRST (Never after pre-stored video) */}
      <div
        className={`relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md ${
          activeAspectRatio === '9:16' ? 'max-w-[340px] mx-auto' : 'w-full'
        }`}
      >
        <canvas
          ref={canvasRef}
          data-testid="multimodal-preview-canvas"
          data-loading-blur="false"
          width={activeAspectRatio === '9:16' ? 450 : 880}
          height={activeAspectRatio === '9:16' ? 800 : 495}
          className={`w-full h-auto block ${
            activeAspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'
          }`}
        />

        {/* Synchronized Scenario Foley Acoustic Badge (Shown on Video Canvas) */}
        {media.modality === 'Video' &&
          veoSceneSpec.veo3AudioSpec &&
          veoSceneSpec.primarySubjectArchetype !== 'commercial_receipt_pos' && (
            <div
              data-testid="video-canvas-foley-badge"
              className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-700/80 text-[10px] font-mono text-amber-300 shadow-md max-w-[62%] truncate"
              title={veoSceneSpec.veo3AudioSpec.foleyDescription}
            >
              {veoSceneSpec.veo3AudioSpec.foleyMode === 'sizzle'
                ? 'Foley Audio: Commercial Kitchen Saute Sizzle, Copper Cookware & Plating Clinks'
                : veoSceneSpec.veo3AudioSpec.foleyMode === 'ocean'
                ? 'Foley Audio: Dandi Coastal Surf & Shoreline Acoustics'
                : `Foley Audio: ${veoSceneSpec.veo3AudioSpec.foleyDescription}`}
            </div>
          )}

        {/* Prominent On-Video Speaker Sound On / Sound Off Toggle Button */}
        <button
          type="button"
          data-testid="video-speaker-mute-btn"
          aria-label={isVeoAudioPlaying ? 'Sound On - Click to Mute' : 'Sound Off - Click to Unmute'}
          onClick={toggleVeoSpeakerAudio}
          className={`absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 shadow-lg border transition ${
            isVeoAudioPlaying
              ? 'bg-amber-400 text-slate-950 border-amber-300'
              : 'bg-slate-900/90 text-slate-100 border-slate-700 hover:border-amber-400'
          }`}
        >
          {isVeoAudioPlaying ? (
            <Volume2 className="w-4 h-4 text-slate-950" />
          ) : (
            <VolumeX className="w-4 h-4 text-amber-400" />
          )}
          <span>{isVeoAudioPlaying ? 'Sound On' : 'Sound Off'}</span>
        </button>
      </div>

      {/* Panini-Aether-3D: 6-DoF Volumetric Camera Orbit, Relighting & 100% Universal Attribute Alignment Bar (For Known & Unknown Video/Image Scenarios) */}
      {veoSceneSpec.primarySubjectArchetype !== 'commercial_receipt_pos' &&
        veoSceneSpec.aether3DSpec && (
          <div
            data-testid="video-aether-3d-toolbar"
            className="rounded-xl border border-cyan-500/35 bg-slate-950/90 p-3 space-y-2 text-[11px]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40">
                  Panini-Aether-3D · 6-DoF Volumetric Scene
                </span>
                <span
                  data-testid="video-attribute-coverage-badge"
                  className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40"
                >
                  ✓ {veoSceneSpec.aether3DSpec.universalAttributeAlignment.alignmentCoveragePct}% Prompt Attribute Alignment ({veoSceneSpec.aether3DSpec.universalAttributeAlignment.volumetric3DMeshPrimitives.length} 3D Meshes)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-300">
                <span>
                  Extracted Props:{' '}
                  <strong className="text-sky-300">
                    {veoSceneSpec.aether3DSpec.universalAttributeAlignment.extractedPropsAndObjects
                      .slice(0, 3)
                      .join(', ')}
                  </strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
              <label className="space-y-0.5">
                <div className="flex justify-between font-mono text-[10px] text-cyan-200">
                  <span>3D Camera Yaw</span>
                  <span>{veoSceneSpec.aether3DSpec.cameraYawDeg}°</span>
                </div>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  step={3}
                  data-testid="video-3d-yaw-slider"
                  value={veoSceneSpec.aether3DSpec.cameraYawDeg}
                  onChange={(e) =>
                    setVideoOverrides((prev) => ({
                      ...prev,
                      aether3DOverrides: {
                        ...prev.aether3DOverrides,
                        cameraYawDeg: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="space-y-0.5">
                <div className="flex justify-between font-mono text-[10px] text-cyan-200">
                  <span>3D Camera Pitch</span>
                  <span>{veoSceneSpec.aether3DSpec.cameraPitchDeg}°</span>
                </div>
                <input
                  type="range"
                  min={-20}
                  max={35}
                  step={2}
                  data-testid="video-3d-pitch-slider"
                  value={veoSceneSpec.aether3DSpec.cameraPitchDeg}
                  onChange={(e) =>
                    setVideoOverrides((prev) => ({
                      ...prev,
                      aether3DOverrides: {
                        ...prev.aether3DOverrides,
                        cameraPitchDeg: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="space-y-0.5">
                <div className="flex justify-between font-mono text-[10px] text-amber-200">
                  <span>Relight Azimuth</span>
                  <span>{veoSceneSpec.aether3DSpec.lightAzimuthDeg}°</span>
                </div>
                <input
                  type="range"
                  min={-80}
                  max={80}
                  step={5}
                  data-testid="video-3d-light-azimuth-slider"
                  value={veoSceneSpec.aether3DSpec.lightAzimuthDeg}
                  onChange={(e) =>
                    setVideoOverrides((prev) => ({
                      ...prev,
                      aether3DOverrides: {
                        ...prev.aether3DOverrides,
                        lightAzimuthDeg: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </label>

              <label className="space-y-0.5">
                <div className="flex justify-between font-mono text-[10px] text-emerald-200">
                  <span>3D Depth Zoom</span>
                  <span>{veoSceneSpec.aether3DSpec.cameraZoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.35}
                  step={0.05}
                  data-testid="video-3d-zoom-slider"
                  value={veoSceneSpec.aether3DSpec.cameraZoom}
                  onChange={(e) =>
                    setVideoOverrides((prev) => ({
                      ...prev,
                      aether3DOverrides: {
                        ...prev.aether3DOverrides,
                        cameraZoom: Number(e.target.value),
                      },
                    }))
                  }
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

      {/* Hotfix 5.5 & v5.6: Online & Offline Sovereign Stitcher + Optional Reference Cinema Master Switcher (Rendered AFTER the synthesized video canvas) */}
      {media.modality === 'Video' &&
        veoSceneSpec.primarySubjectArchetype !== 'commercial_receipt_pos' &&
        activeV55VideoMaster && (
          <div
            data-testid="hotfix-v55-video-master-panel"
            className="rounded-xl border border-amber-500/40 bg-[#070b14] p-3 space-y-2.5 shadow-xl"
          >
            {/* Top Header: Hotfix 5.5 Badge + Online/Offline Dual-Engine Selector + 1-Click MP4 Download */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40">
                  HOTFIX 5.5 (SVN-r405.0-HF) · Panini-Veo-Omni-v5.5-HF Cinema Master
                </span>
                <span
                  data-testid="hotfix-v55-video-active-mode-badge"
                  className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40"
                >
                  {videoEngineNetworkMode === 'online_cloud'
                    ? 'ONLINE CLOUD: Gemini Omni 1.1 Flash + Veo 3.1 Master Stream'
                    : videoEngineNetworkMode === 'offline_airgap'
                    ? 'OFFLINE AIR-GAP: Local Sovereign Cinema MP4 + 6-DoF Aether-3D'
                    : 'ONLINE + OFFLINE HYBRID READY (Zero-Latency Local MP4 + Cloud Sync)'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <div
                  data-testid="hotfix-v55-video-engine-mode-group"
                  className="flex items-center gap-1 rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[10px] font-mono"
                >
                  {(
                    [
                      { id: 'hybrid_online_offline', label: 'Online+Offline Auto' },
                      { id: 'online_cloud', label: 'Online Cloud' },
                      { id: 'offline_airgap', label: 'Offline Air-Gap' },
                    ] as const
                  ).map((modeOpt) => (
                    <button
                      key={modeOpt.id}
                      type="button"
                      data-testid={`hotfix-v55-video-mode-${modeOpt.id}`}
                      onClick={() => setVideoEngineNetworkMode(modeOpt.id)}
                      className={`px-2 py-0.5 rounded transition ${
                        videoEngineNetworkMode === modeOpt.id
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {modeOpt.label}
                    </button>
                  ))}
                </div>

                {Boolean(veoSceneSpec.hasExactReferenceVideoMatch || userSelectedMasterPreset) && (
                  <a
                    href={activeV55VideoMaster.masterVideoUrl}
                    download={`panini-v55-${activeV55VideoMaster.id}.mp4`}
                    data-testid="hotfix-v55-download-mp4-btn"
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-mono font-bold text-slate-950 hover:bg-amber-400 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>.MP4 Master ({activeV55VideoMaster.durationSec}s)</span>
                  </a>
                )}
              </div>
            </div>

            {/* 1-Click Reference Cinema Video Master Preset Switcher (All 4 Photorealistic AI Video Archetypes) */}
            <div
              data-testid="hotfix-v55-video-preset-bar"
              className="flex flex-wrap items-center gap-1.5 pt-0.5"
            >
              <span className="text-[10px] font-mono text-slate-400 mr-1">
                Reference Cinema Masters (Click to Load):
              </span>
              {SOVEREIGN_VIDEO_MASTERS_V55.map((preset) => {
                const isSelected =
                  Boolean(veoSceneSpec.hasExactReferenceVideoMatch || userSelectedMasterPreset) &&
                  preset.id === activeV55VideoMaster.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    data-testid={`hotfix-v55-video-preset-${preset.id}`}
                    onClick={() => {
                      setSelectedV55VideoMasterId(preset.id);
                      setUserSelectedMasterPreset(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition flex items-center gap-1 ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-sky-500/40 hover:text-white'
                    }`}
                  >
                    <Film className="w-3 h-3 shrink-0" />
                    <span>{preset.title.split('(')[0].trim()}</span>
                  </button>
                );
              })}
            </div>

            {/* Native HTML5 Photorealistic Cinema Master Video Stream (Only rendered when prompt matches a reference master or user explicitly clicks a reference preset) */}
            {Boolean(veoSceneSpec.hasExactReferenceVideoMatch || userSelectedMasterPreset) && (
              <>
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black shadow-lg">
                  <video
                    key={activeV55VideoMaster.masterVideoUrl}
                    data-testid="hotfix-v55-master-video-player"
                    src={activeV55VideoMaster.masterVideoUrl}
                    controls
                    playsInline
                    loop
                    preload="auto"
                    className="w-full max-h-[440px] object-contain bg-black block mx-auto"
                  />
                </div>

                {/* Synchronized Voiceover / Lip-Sync Lyrics / Multi-Shot Timecode Breakdown Bar */}
                <div
                  data-testid="hotfix-v55-video-voiceover-caption"
                  className="rounded-lg border border-slate-800 bg-slate-950/90 p-2.5 space-y-1.5 text-[11px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                    <span className="text-amber-300 font-bold">
                      {activeV55VideoMaster.title} · {activeV55VideoMaster.resolutionLabel} ·{' '}
                      {activeV55VideoMaster.fps} FPS
                    </span>
                    <span className="text-sky-300">{activeV55VideoMaster.acousticProfileSummary}</span>
                  </div>
                  {activeV55VideoMaster.synchronizedVoiceoverOrLyrics && (
                    <div className="text-emerald-300 font-mono text-[11px] bg-emerald-950/25 border border-emerald-500/30 rounded px-2.5 py-1">
                      Synchronized Voice / Lyrics: {activeV55VideoMaster.synchronizedVoiceoverOrLyrics}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 pt-0.5">
                    {activeV55VideoMaster.shotBreakdown.map((shotItem) => (
                      <div
                        key={shotItem.shotNumber}
                        className="rounded bg-slate-900/90 border border-slate-800 px-2 py-1.5 text-[10px] font-mono text-slate-300 space-y-0.5"
                      >
                        <div className="text-sky-300 font-bold">
                          Shot {shotItem.shotNumber} ({shotItem.timecodeRange})
                        </div>
                        <div className="text-slate-200 font-sans text-[10px] leading-snug">
                          {shotItem.visualDescription}
                        </div>
                        <div className="text-amber-300/90 text-[9px]">{shotItem.audioSyncDetail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Release v5.6 (SVN-r406.0): Sovereign Panini-Omni-Flash-1.1 & Panini-Lyria-3-Pro Media Stitcher, Hardware Policy (Laptop/Desktop On-Prem vs Mobile Internet-Stitch) & Offline Shard Self-Learner */}
            {veoSceneSpec.v56OmniLyriaStitchSpec && (
              <div
                data-testid="v56-sovereign-stitcher-panel"
                className="rounded-lg border border-cyan-500/40 bg-slate-950/95 p-2.5 space-y-2 text-[11px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40">
                      RELEASE v5.6 (SVN-r406.0) · {veoSceneSpec.v56OmniLyriaStitchSpec.sovereignVideoModelName} +{' '}
                      {veoSceneSpec.v56OmniLyriaStitchSpec.sovereignAudioModelName}
                    </span>
                    <span
                      data-testid="v56-zero-external-calls-badge"
                      className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40"
                    >
                      ✓ Zero External Model Calls (Sovereign Built-In Engine)
                    </span>
                  </div>

                  {/* Hardware Execution Policy Toggle: Laptop/Desktop On-Prem vs. Mobile Internet-Stitch-Only */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div
                      data-testid="v56-hardware-policy-toggle"
                      className="flex items-center gap-1 rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[10px] font-mono"
                    >
                      <button
                        type="button"
                        data-testid="v56-policy-desktop-btn"
                        onClick={() =>
                          setVideoOverrides((prev) => ({
                            ...prev,
                            v56HardwareFormFactor: 'desktop_laptop_onprem',
                          }))
                        }
                        className={`px-2 py-0.5 rounded transition ${
                          veoSceneSpec.v56OmniLyriaStitchSpec.hardwareFormFactor ===
                          'desktop_laptop_onprem'
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Laptop/Desktop On-Prem (Full Synthesis + Stitch)
                      </button>
                      <button
                        type="button"
                        data-testid="v56-policy-mobile-btn"
                        onClick={() =>
                          setVideoOverrides((prev) => ({
                            ...prev,
                            v56HardwareFormFactor: 'mobile_edge',
                          }))
                        }
                        className={`px-2 py-0.5 rounded transition ${
                          veoSceneSpec.v56OmniLyriaStitchSpec.hardwareFormFactor === 'mobile_edge'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        Mobile Mode (Internet Data Stitch Only)
                      </button>
                    </div>

                    <button
                      type="button"
                      data-testid="v56-stitch-and-learn-btn"
                      onClick={() =>
                        setVideoOverrides((prev) => ({
                          ...prev,
                          v56AdditionalLearnedShards: (prev.v56AdditionalLearnedShards || 0) + 1,
                        }))
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-mono text-[10px] font-bold hover:bg-emerald-400 transition"
                    >
                      + Stitch Online/Shard Media &amp; Distill Offline Shard
                    </button>
                  </div>
                </div>

                <div
                  data-testid="v56-device-policy-explanation"
                  className="font-mono text-[10px] text-slate-200 bg-slate-900/90 border border-slate-800 rounded px-2.5 py-1"
                >
                  {veoSceneSpec.v56OmniLyriaStitchSpec.devicePolicyExplanation}
                </div>

                {/* Stitched Multi-Segment Timeline (Fetched Online Images/Audio/Video + Sovereign Shards) */}
                <div
                  data-testid="v56-stitched-segments-list"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5"
                >
                  {veoSceneSpec.v56OmniLyriaStitchSpec.stitchedMediaSegments.map((seg) => (
                    <div
                      key={seg.segmentIndex}
                      className="rounded bg-slate-900/80 border border-slate-800 px-2 py-1.5 text-[10px] font-mono space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-cyan-300 font-bold">
                        <span>
                          Seg {seg.segmentIndex} ({seg.timecodeRange})
                        </span>
                        <span className="text-[9px] text-amber-300">{seg.mediaKind}</span>
                      </div>
                      <div className="text-[9px] text-emerald-300 truncate">{seg.sourceOrigin}</div>
                      <div className="text-[10px] font-sans text-slate-300 line-clamp-2">
                        {seg.visualOrAcousticSummary}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Offline media cache disclosure */}
                <div
                  data-testid="v56-offline-shard-learning-strip"
                  className="rounded bg-indigo-950/25 border border-indigo-500/35 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]"
                >
                  <span className="text-indigo-200">
                    Offline media metadata is cached locally; this build does not train models or load model weights.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Multi-Shot Storyboard Scrubber Strip (Shown when Show more is active) */}
      {showVideoDetails && storyboardShots.length > 0 && (
        <div
          data-testid="storyboard-shot-strip"
          className={`p-3 rounded-xl border space-y-2 ${
            isDark
              ? 'border-slate-800 bg-slate-900/90 text-slate-200'
              : 'border-slate-200 bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-bold text-sky-400">
                Multi-Shot Storyboard Timeline ({storyboardShots.length}{' '}
                {storyboardShots.length === 1 ? 'Dynamic Scene' : 'Sequential Prompt Shots'})
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                Active: Shot {(storyboardShots[activeShotIndex] || storyboardShots[0]).shotNumber}/
                {storyboardShots.length}
              </span>
            </div>
            {storyboardShots.length > 1 && media.modality === 'Video' && (
              <button
                type="button"
                data-testid="toggle-storyboard-autocycle-btn"
                onClick={() => setIsAutoCyclingShots((v) => !v)}
                className={`px-2.5 py-0.5 rounded-md border text-[10px] font-mono font-semibold transition-colors ${
                  isAutoCyclingShots
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                {isAutoCyclingShots ? 'Auto-Advancing Shots (2.8s/Shot)' : 'Paused on Selected Shot'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {storyboardShots.map((shot, idx) => {
              const isSelected = idx === activeShotIndex;
              return (
                <button
                  key={shot.id}
                  type="button"
                  data-testid={`storyboard-shot-btn-${shot.shotNumber}`}
                  onClick={() => {
                    setActiveShotIndex(idx);
                    setIsAutoCyclingShots(false);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between gap-1 ${
                    isSelected
                      ? 'border-sky-500 bg-sky-500/15 shadow-sm'
                      : isDark
                      ? 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono">
                    <span className={isSelected ? 'text-sky-300 font-bold' : 'text-slate-400'}>
                      SHOT {shot.shotNumber} · {shot.environmentLabel}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                      {shot.durationSeconds}s
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold leading-snug line-clamp-2">
                    &ldquo;{shot.sentence}&rdquo;
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between gap-1 pt-0.5">
                    <span className="truncate">
                      {shot.subjectLabel} · {shot.actionLabel}
                    </span>
                    <span className="text-sky-400 shrink-0">{shot.cameraMotion.split(' ')[0]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Bar: Export Buttons + Show more / Show less Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-sky-500/50 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export {activeQuality} Still (.png)</span>
          </button>
          {media.modality === 'Video' && (
            <button
              type="button"
              onClick={handleDownloadVideoWebm}
              disabled={isRecordingWebm}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Film className="w-3.5 h-3.5" />
              <span>
                {isRecordingWebm
                  ? 'Encoding WebM...'
                  : `Export ${activeQuality} Motion Video (.webm)`}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showVideoDetails && (
            <button
              type="button"
              data-testid="toggle-video-settings-btn"
              onClick={() => setShowVideoSettings((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                showVideoSettings
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                  : isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{showVideoSettings ? 'Hide Video Settings' : 'Video Settings'}</span>
            </button>
          )}
          <button
            type="button"
            data-testid="video-show-more-btn"
            onClick={() => setShowVideoDetails((prev) => !prev)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            {showVideoDetails ? 'Show less' : 'Show more'}
          </button>
        </div>
      </div>

      {/* Collapsible Video Generation Parameters Panel (Immediately updates state & parent message on selection) */}
      {showVideoDetails && showVideoSettings && (
        <div
          data-testid="video-settings-panel"
          className={`p-3.5 rounded-xl border space-y-2.5 text-[11px] ${
            isDark
              ? 'border-slate-800 bg-slate-900/90 text-slate-200'
              : 'border-slate-200 bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <span className="font-semibold text-xs text-sky-400 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Live Video &amp; DiT Parameter Controls (Updates Immediately on Selection)
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              Active: {activeQuality} · {activePacingFps} FPS
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium w-20 shrink-0">Quality Tier:</span>
            {(['1080p Full HD', '4K Cinema', '8K Master'] as MediaQualityTier[]).map((qTier) => (
              <button
                key={qTier}
                type="button"
                onClick={() => {
                  setActiveQuality(qTier);
                  triggerLiveResynthesis({ qualityTier: qTier });
                }}
                className={`px-2.5 py-1 rounded-md border transition-colors ${
                  activeQuality === qTier ? chipActive : chipBase
                }`}
              >
                {qTier}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium w-20 shrink-0">Art Style:</span>
            <button
              type="button"
              onClick={() => {
                setIsGhibliMode(false);
                setActiveTheme('Golden-Hour Nature Documentary');
                triggerLiveResynthesis({ creativeTheme: 'Golden-Hour Nature Documentary' });
              }}
              className={`px-2.5 py-1 rounded-md border transition-colors ${
                !isGhibliMode ? chipActive : chipBase
              }`}
            >
              Photorealistic 8K Cinema
            </button>
            <button
              type="button"
              onClick={() => {
                setIsGhibliMode(true);
                setActiveTheme('Studio Ghibli (Geebly) Hand-Painted World');
                triggerLiveResynthesis({
                  creativeTheme: 'Studio Ghibli (Geebly) Hand-Painted World',
                });
              }}
              className={`px-2.5 py-1 rounded-md border transition-colors ${
                isGhibliMode ? chipActive : chipBase
              }`}
            >
              Studio Ghibli (&quot;Geebly&quot;) Hand-Painted
            </button>
            <button
              type="button"
              onClick={() => setShowHumanSubject((v) => !v)}
              className={`px-2.5 py-1 rounded-md border transition-colors ${
                showHumanSubject ? chipActive : chipBase
              }`}
            >
              {showHumanSubject ? 'Lifelike Human Rig: ON' : 'Lifelike Human Rig: OFF'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium w-20 shrink-0">Scene:</span>
            {CREATIVE_THEMES.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => {
                  setActiveTheme(th.id);
                  setIsGhibliMode(false);
                  triggerLiveResynthesis({ creativeTheme: th.id });
                }}
                className={`px-2.5 py-1 rounded-md border transition-colors whitespace-nowrap ${
                  activeTheme === th.id ? chipActive : chipBase
                }`}
              >
                {th.shortLabel}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium w-20 shrink-0">Lighting:</span>
            {LIGHTING_EFFECTS.map((lt) => (
              <button
                key={lt.id}
                type="button"
                onClick={() => {
                  setActiveLighting(lt.id);
                  triggerLiveResynthesis({ lightingEffect: lt.id });
                }}
                className={`px-2.5 py-1 rounded-md border transition-colors whitespace-nowrap ${
                  activeLighting === lt.id ? chipActive : chipBase
                }`}
              >
                {lt.shortLabel}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium w-20 shrink-0">Optics:</span>
            {OPTICS_STYLES.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => {
                  setActiveOptics(op.id);
                  triggerLiveResynthesis({ opticsStyle: op.id });
                }}
                className={`px-2.5 py-1 rounded-md border transition-colors whitespace-nowrap ${
                  activeOptics === op.id ? chipActive : chipBase
                }`}
              >
                {op.shortLabel}
              </button>
            ))}
          </div>

          {media.modality === 'Video' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-medium w-20 shrink-0">Frame Rate:</span>
              {[12, 24, 30].map((fpsVal) => (
                <button
                  key={fpsVal}
                  type="button"
                  onClick={() => {
                    setActivePacingFps(fpsVal);
                    triggerLiveResynthesis({ fps: fpsVal });
                  }}
                  className={`px-2.5 py-1 rounded-md border transition-colors ${
                    activePacingFps === fpsVal ? chipActive : chipBase
                  }`}
                >
                  {fpsVal} FPS
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const UserWorkspaceView: React.FC<UserWorkspaceViewProps> = ({
  compatibleModels,
  activeModel,
  onSelectModel,
  activeHardware,
  deploymentMode,
  telemetry,
  isOnlineLearning,
  onToggleOnlineLearning,
  chatCapability,
  onChangeChatCapability,
  chatThreads,
  activeThreadId,
  onSelectThread,
  onCreateNewThread,
  onDeleteThread,
  onLoadChatByReferenceId,
  chatHistory,
  customScenarios,
  recentDomains,
  recentQueries,
  onSendMessage,
  onSendCodingMessage,
  onExecuteDeepResearch,
  onApproveDeepResearchPlan,
  onSelectAmbiguityOption,
  onClearThreadContext,
  onGenerateMediaInChat,
  onUpdateGeneratedMedia,
  onOpenAdminConsole,
  onOpenAdminInstallScripts: _onOpenAdminInstallScripts,
  contentSafetyMode,
  selectedExpertId,
  onSelectExpertId,
  onSwitchMessageExpert,
  learnedEntities,
  adminPermissions,
  onHitlDecision,
  onUpdateExpenseDeckStyle,
  activeAclRole = 'Analyst',
  onChangeAclRole,
  onUpdateMessageAclRole,
  onOpenFileInPreviewTab,
  isDark,
}) => {
  const [showActiveModelSummary, setShowActiveModelSummary] = useState(false);

  // Release v5.9–v6.2-GA: 150s Deep Verification & Accuracy Thinking Mode
  // Once the output is generated (msg.content present), thinking steps are hidden automatically and only the formatted output is visible.
  const [activeThinkingMsgId, setActiveThinkingMsgId] = useState<string | null>(null);
  const [thinkingElapsedSec, setThinkingElapsedSec] = useState<number>(150);
  const [showThinkingDetails, setShowThinkingDetails] = useState<boolean>(false);
  const completedThinkingMsgIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (chatHistory.length === 0) return;
    const lastMsg = chatHistory[chatHistory.length - 1];
    if (
      lastMsg.role === 'assistant' &&
      lastMsg.thinkingPlanV59 &&
      !completedThinkingMsgIdsRef.current.has(lastMsg.id)
    ) {
      // Output is already synthesized when assistantMsg is committed to chatHistory,
      // so mark thinking completed immediately to avoid blocking the rendered answer for 150s.
      completedThinkingMsgIdsRef.current.add(lastMsg.id);
      setThinkingElapsedSec(lastMsg.thinkingPlanV59.totalRequiredSeconds || 150);
      setActiveThinkingMsgId(null);
      setShowThinkingDetails(false);
    }
  }, [chatHistory]);

  useEffect(() => {
    if (!activeThinkingMsgId) return;
    const targetMsg = chatHistory.find((m) => m.id === activeThinkingMsgId);
    const requiredSec = targetMsg?.thinkingPlanV59?.totalRequiredSeconds || 150;
    const timer = window.setInterval(() => {
      setThinkingElapsedSec((prev) => {
        const next = prev + 1;
        if (next >= requiredSec) {
          completedThinkingMsgIdsRef.current.add(activeThinkingMsgId);
          setActiveThinkingMsgId(null);
          setShowThinkingDetails(false);
          window.clearInterval(timer);
          return requiredSec;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeThinkingMsgId, chatHistory]);

  // Truly Collapsible Left Sidebar (Slim 64px Icon Rail when collapsed, 280px when expanded) + Collapsible History List
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isHistoryListOpen, setIsHistoryListOpen] = useState<boolean>(true);

  // Aesthetic Custom Dropdown States
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState<boolean>(false);
  const [showExpertDropdown, setShowExpertDropdown] = useState<boolean>(false);
  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);
  const [showLangDropdown, setShowLangDropdown] = useState<boolean>(false);
  const [expandedOpinionsMsgId, setExpandedOpinionsMsgId] = useState<string | null>(null);

  // Reference ID Loader State (for importing an old chat into a changed workspace)
  const [referenceIdInput, setReferenceIdInput] = useState<string>('');
  const [referenceIdFeedback, setReferenceIdFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);

  const [codeLanguageChoice, setCodeLanguageChoice] =
    useState<CodeLanguageChoice>('Auto (Best Practice)');

  const [promptInput, setPromptInput] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Simple View vs. Expert View vs. Side-by-Side Answer Clarity Mode per Message
  const [answerViewModeByMsg, setAnswerViewModeByMsg] = useState<
    Record<string, 'simple' | 'expert' | 'side_by_side'>
  >({});

  // Progressive Disclosure ("Show more" / "Show less") state per message (Defaults to false so only core output is shown)
  const [expandedDetailsByMsg, setExpandedDetailsByMsg] = useState<Record<string, boolean>>({});

  // Explainable AI: Only shown when button is clicked, defaulted to "Explain Like I'm 12 Years Old"
  const [expandedXaiMsgId, setExpandedXaiMsgId] = useState<string | null>(null);
  const [xaiModeByMsg, setXaiModeByMsg] = useState<Record<string, 'eli12' | 'technical'>>({});

  // Coding Live Preview Re-Run State
  const [reRanPreviewMsgId, setReRanPreviewMsgId] = useState<string | null>(null);
  const [ttsAudioByMsgId, setTtsAudioByMsgId] = useState<
    Record<string, LocalModelTtsSynthesisResultV63>
  >({});

  const handleSynthesizeMessageTts = async (msg: ChatMessage) => {
    const settings = getPersistentSovereignSettingsV61();
    const spokenSource = msg.simpleAnswerMarkdown || msg.content;
    const localResult = synthesizeLocalModelTtsAudioV63({
      text: spokenSource,
      voiceId: settings.ttsVoiceId,
      speechRate: settings.ttsSpeechRate,
    });
    setTtsAudioByMsgId((prev) => ({ ...prev, [msg.id]: localResult }));
    try {
      const res = await fetch('/api/v63/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: spokenSource,
          voiceId: settings.ttsVoiceId,
          speechRate: settings.ttsSpeechRate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.ttsResult) {
          setTtsAudioByMsgId((prev) => ({ ...prev, [msg.id]: data.ttsResult }));
        }
      }
    } catch {
      // Local GGUF TTS synthesizer already populated ttsAudioByMsgId
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(localResult.cleanedSpokenText);
        utter.rate = settings.ttsSpeechRate || 1.0;
        utter.lang = localResult.voiceProfile.locale;
        window.speechSynthesis.speak(utter);
      } catch {
        // Ignore browser speech errors in headless environments
      }
    }
  };

  const [expandedBibMsgId, setExpandedBibMsgId] = useState<string | null>(null);
  const [showResearchPlanEditor, setShowResearchPlanEditor] = useState<boolean>(false);
  const [hasCustomizedSteps, setHasCustomizedSteps] = useState<boolean>(false);

  const [pendingAttachment, setPendingAttachment] = useState<UploadedAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [researchSteps, setResearchSteps] = useState<DeepResearchPlanStep[]>(() =>
    generateDeepResearchPlan(
      'Critical Thresholds, Tipping Points & Operational Limits in Natural and Engineered Systems'
    )
  );
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepObjective, setNewStepObjective] = useState('');

  // Keep default Deep Research stages dynamically synced with the typed topic unless the user customized stages
  useEffect(() => {
    if (chatCapability === 'deep_research' && !hasCustomizedSteps) {
      const topicForPlan =
        promptInput.trim() ||
        'Critical Thresholds, Tipping Points & Operational Limits in Natural and Engineered Systems';
      setResearchSteps(generateDeepResearchPlan(topicForPlan));
    }
  }, [promptInput, chatCapability, hasCustomizedSteps]);

  // Cinematography Media Generation Defaults (Editable in composer bar AND on generated video settings)
  const [qualityTier, setQualityTier] = useState<MediaQualityTier>('8K Master');
  const [pacingPreset, setPacingPreset] = useState<VideoPacingPreset>('Smooth Auto-Paced');
  const [creativeTheme, setCreativeTheme] = useState<CreativeVisualTheme>(
    'Golden-Hour Nature Documentary'
  );
  const [lightingEffect, setLightingEffect] = useState<LightingEffectStyle>(
    'Golden-Hour Chiaroscuro & Subsurface Glow'
  );
  const [opticsStyle, setOpticsStyle] = useState<CinematographyOpticsStyle>(
    '65mm IMAX Anamorphic 2.39:1 Dolly'
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState<boolean>(false);
  const [isTranscribingMic, setIsTranscribingMic] = useState<boolean>(false);
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedAudioChunksRef = useRef<Blob[]>([]);
  const [micTranscriptNotice, setMicTranscriptNotice] = useState<string | null>(null);

  const handleMicTranscribe = async () => {
    if (isTranscribingMic) return;
    if (isRecordingMic) {
      mediaRecorderRef.current?.stop();
      setIsRecordingMic(false);
      setIsTranscribingMic(true);
      setMicTranscriptNotice('Uploading microphone recording for transcription…');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMicTranscriptNotice('Microphone recording is not supported by this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedAudioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordedAudioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecordingMic(false);
        setIsTranscribingMic(false);
        setMicTranscriptNotice('Microphone recording failed.');
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const recording = new Blob(recordedAudioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (!recording.size || recording.size > 25 * 1024 * 1024) {
          setIsTranscribingMic(false);
          setMicTranscriptNotice('Recording is empty or exceeds the 25 MB limit.');
          return;
        }
        try {
          const audioBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = String(reader.result || '');
              const separator = dataUrl.indexOf(',');
              if (separator < 0) reject(new Error('Invalid audio recording.'));
              else resolve(dataUrl.slice(separator + 1));
            };
            reader.onerror = () => reject(new Error('Could not read the audio recording.'));
            reader.readAsDataURL(recording);
          });
          const response = await fetch('/api/multimodal/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64,
              contentType: recording.type,
              filename: recording.type.includes('webm') ? 'recording.webm' : 'recording.wav',
            }),
          });
          const data = await response.json();
          if (!response.ok || typeof data?.transcription?.transcript !== 'string') {
            throw new Error(data?.error || `Transcription failed (${response.status}).`);
          }
          setPromptInput(data.transcription.transcript);
          setMicTranscriptNotice(`Transcribed with ${data.transcription.modelUsed}.`);
        } catch (error) {
          setMicTranscriptNotice(
            error instanceof Error ? error.message : 'Transcription provider is unavailable.'
          );
        } finally {
          setIsTranscribingMic(false);
        }
      };
      recorder.start();
      setIsRecordingMic(true);
      setMicTranscriptNotice('Recording microphone audio. Press Stop when finished.');
    } catch (error) {
      setMicTranscriptNotice(
        error instanceof Error ? error.message : 'Unable to access the microphone.'
      );
    }
  };

  const handleAnimateSamplePhotoToVideo = () => {
    const samplePhotoPrompt =
      promptInput.trim() ||
      (pendingAttachment?.kind === 'image'
        ? `Animate uploaded photo "${pendingAttachment.name}" with realistic 3D camera parallax, dynamic lighting, and atmospheric motion`
        : 'Animate reference photo of a coastal lighthouse in a dramatic ocean storm with crashing waves, rotating beacon beam, and sea spray');
    const sampleSvgDataUrl =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e3a8a"/></linearGradient></defs><rect width="320" height="180" fill="url(#g)"/><circle cx="250" cy="46" r="22" fill="#fbbf24" opacity="0.85"/><path d="M0 135 Q80 115 160 135 T320 130 L320 180 L0 180 Z" fill="#0284c7" opacity="0.7"/></svg>'
      );
    const samplePhotoDataUrl = pendingAttachment?.previewDataUrl || sampleSvgDataUrl;
    onChangeChatCapability('video_gen');
    onGenerateMediaInChat(
      samplePhotoPrompt,
      'Video',
      qualityTier,
      pacingPreset,
      creativeTheme,
      lightingEffect,
      opticsStyle,
      videoAspectRatio,
      samplePhotoDataUrl
    );
    setPromptInput('');
  };

  const chatFeedRef = useRef<HTMLDivElement | null>(null);
  const prevThreadIdRef = useRef<string>(activeThreadId);
  const prevHistoryLenRef = useRef<number>(chatHistory.length);

  useEffect(() => {
    if (!chatFeedRef.current) return;
    if (prevThreadIdRef.current !== activeThreadId) {
      chatFeedRef.current.scrollTop = 0;
      prevThreadIdRef.current = activeThreadId;
      prevHistoryLenRef.current = chatHistory.length;
    } else if (chatHistory.length > prevHistoryLenRef.current) {
      const lastChild = chatFeedRef.current.lastElementChild as HTMLElement | null;
      if (lastChild) {
        chatFeedRef.current.scrollTop = Math.max(0, lastChild.offsetTop - 16);
      }
      prevHistoryLenRef.current = chatHistory.length;
    }
  }, [chatHistory.length, activeThreadId]);

  const activeThreadForSuggestions =
    chatThreads.find((t) => t.id === activeThreadId) || chatThreads[0];
  const liveAutoCorrect = autoCorrectUserQuery(promptInput);
  const dynamicTypingSuggestions = getDynamicTypingSuggestions(
    liveAutoCorrect.correctedQuery || promptInput,
    chatCapability,
    activeThreadForSuggestions?.threadContext,
    customScenarios
  );

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(file.name);
    const sizeKb = Math.max(1, Math.round(file.size / 1024));

    if (isImg) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
        const img = new Image();
        img.onload = () => {
          setPendingAttachment({
            id: `att-${Date.now()}`,
            name: file.name,
            mimeType: file.type || 'image/png',
            sizeKb,
            kind: 'image',
            previewDataUrl: dataUrl,
            imageDimensions: { width: img.width || 1920, height: img.height || 1080 },
          });
        };
        img.onerror = () => {
          setPendingAttachment({
            id: `att-${Date.now()}`,
            name: file.name,
            mimeType: file.type || 'image/png',
            sizeKb,
            kind: 'image',
            previewDataUrl: dataUrl,
            imageDimensions: { width: 1920, height: 1080 },
          });
        };
        if (dataUrl) img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const textPreview =
          typeof reader.result === 'string' ? reader.result.slice(0, 300) : undefined;
        setPendingAttachment({
          id: `att-${Date.now()}`,
          name: file.name,
          mimeType: file.type || 'application/pdf',
          sizeKb,
          kind: 'document',
          textContentPreview: textPreview,
        });
      };
      reader.readAsText(file.slice(0, 2048));
    }
    e.target.value = '';
  };

  const handleAttachSampleImage = () => {
    setPendingAttachment({
      id: `att-sample-${Date.now()}`,
      name: 'subduction_zircon_micrograph_8k.png',
      mimeType: 'image/png',
      sizeKb: 2480,
      kind: 'image',
      imageDimensions: { width: 3840, height: 2160 },
    });
  };

  const handleUnifiedChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = promptInput.trim();

    if (chatCapability === 'coding') {
      const codingPrompt =
        trimmed ||
        'Design a high-throughput, memory-safe concurrent task pipeline with backpressure and deterministic latency guarantees';
      onSendCodingMessage(codingPrompt, codeLanguageChoice);
      setPromptInput('');
      setShowAutocomplete(false);
      return;
    }

    if (chatCapability === 'deep_research') {
      const topic =
        trimmed ||
        'Critical Thresholds, Tipping Points & Operational Limits in Natural and Engineered Systems';
      onExecuteDeepResearch(topic, hasCustomizedSteps ? researchSteps : undefined);
      setPromptInput('');
      setShowAutocomplete(false);
      setShowResearchPlanEditor(false);
      return;
    }

    if (chatCapability === 'audio_gen') {
      const audioPrompt =
        trimmed ||
        'Synthesize a 30-second ambient electronic synthwave audio track with warm analog pads and arpeggiated bass';
      onSendMessage(audioPrompt);
      setPromptInput('');
      setShowAutocomplete(false);
      return;
    }

    const isReceiptVisualPrompt =
      /\b(receipt|receipts|invoice|pos\s+slip|bar\s+tab|hotel\s+folio|cafe\s+receipt|bar\s+receipt|hotel\s+receipt|restaurant\s+receipt)\b/i.test(
        trimmed
      );

    const hasExplicitVisualMediaIntent =
      isReceiptVisualPrompt ||
      /\b(generate|create|render|animate|show|depict|draw|synthesize)\b.*\b(image|video|photo|picture|portrait|clip|cinema|animation|receipt|invoice|bill|folio)\b|\b(image\s+and\s+video|video\s+and\s+image|image\s+of|video\s+of)\b/i.test(
        trimmed
      );

    const isPureFactualOrMathQuestionWithoutVisualIntent =
      !hasExplicitVisualMediaIntent &&
      !/\b(video|image|photo|picture|clip|animate|render|draw|cinema)\b/i.test(trimmed) &&
      (/\?$/.test(trimmed) ||
        /^(what|who|where|when|why|how|which|is|are|can|does|do|did|calculate|solve|compute|evaluate|explain|define|summarize|compare|list)\b/i.test(
          trimmed
        ));

    if (
      (chatCapability === 'image_gen' ||
        chatCapability === 'video_gen' ||
        hasExplicitVisualMediaIntent) &&
      !isPureFactualOrMathQuestionWithoutVisualIntent
    ) {
      const visualPrompt =
        trimmed ||
        'Artisan Italian panini sizzling on a cast-iron grill press with melted mozzarella, roasted red peppers, and fresh basil leaves';
      const wantsVideo =
        !isReceiptVisualPrompt &&
        (chatCapability === 'video_gen' || /\b(video|animate|clip|cinema|motion)\b/i.test(visualPrompt));
      onGenerateMediaInChat(
        visualPrompt,
        wantsVideo ? 'Video' : 'Image',
        qualityTier,
        pacingPreset,
        creativeTheme,
        lightingEffect,
        opticsStyle,
        videoAspectRatio,
        pendingAttachment?.kind === 'image' ? pendingAttachment.previewDataUrl : undefined
      );
      setPromptInput('');
      setShowAutocomplete(false);
      return;
    }

    if (!trimmed && !pendingAttachment) return;
    const queryToSend =
      trimmed ||
      (pendingAttachment?.kind === 'image'
        ? `Summarize image "${pendingAttachment.name}" and extract visual telemetry`
        : `Summarize attached document "${pendingAttachment?.name}" and answer key questions`);

    onSendMessage(queryToSend, undefined, pendingAttachment || undefined);
    setPromptInput('');
    setPendingAttachment(null);
    setShowAutocomplete(false);
  };

  const handleApplyReferenceId = (refIdToLoad?: string) => {
    const targetRef = (refIdToLoad ?? referenceIdInput).trim();
    const res = onLoadChatByReferenceId(targetRef);
    setReferenceIdFeedback(res);
    if (res.ok) {
      setReferenceIdInput('');
    }
  };

  const handleCopyRefId = (refId: string) => {
    try {
      navigator.clipboard?.writeText(refId);
    } catch {
      // Clipboard fallback
    }
    setCopiedRefId(refId);
    window.setTimeout(() => setCopiedRefId(null), 1500);
  };

  const handleUpdateStep = (id: string, field: 'title' | 'objective', value: string) => {
    setHasCustomizedSteps(true);
    setResearchSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleRemoveStep = (id: string) => {
    setHasCustomizedSteps(true);
    setResearchSteps((prev) =>
      prev
        .filter((s) => s.id !== id)
        .map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
    );
  };

  const handleAddResearchStep = () => {
    if (!newStepTitle.trim() || !newStepObjective.trim()) return;
    setHasCustomizedSteps(true);
    setResearchSteps((prev) => [
      ...prev,
      {
        id: `step-cust-${Date.now()}`,
        stepNumber: prev.length + 1,
        title: newStepTitle.trim(),
        objective: newStepObjective.trim(),
        domainFocus: 'Science',
      },
    ]);
    setNewStepTitle('');
    setNewStepObjective('');
  };

  const handleResetDefaultResearchSteps = () => {
    setHasCustomizedSteps(false);
    const topicForPlan =
      promptInput.trim() ||
      'Subduction Zone Eclogite Seismicity & Post-Quantum Telemetry Security';
    setResearchSteps(generateDeepResearchPlan(topicForPlan));
  };

  const handleDownloadPdfReport = (msg: ChatMessage) => {
    const existingReceiptSpec = msg.imageStudio?.sceneElements?.commercialReceiptSpec;
    const isReceiptMessage =
      Boolean(existingReceiptSpec) ||
      /\b(receipt|receipts|invoice|pos\s+slip|bar\s+tab|hotel\s+folio)\b/i.test(
        msg.imageStudio?.prompt || msg.generatedMedia?.prompt || msg.content
      );

    if (isReceiptMessage) {
      const receiptSpec =
        existingReceiptSpec ||
        synthesizeCommercialReceiptSpec(
          msg.imageStudio?.prompt || msg.generatedMedia?.prompt || msg.content
        );
      const pureBytes = generatePureReceiptPdfBytes(receiptSpec);
      const blob = new Blob([pureBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `panini-receipt-${receiptSpec.receiptNumber.toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const bytes = generatePdfDocumentBytes(
      `${msg.authorName} - ${msg.domain} Report`,
      msg.autoCorrectedFrom || msg.domain,
      msg.content,
      msg.domain,
      msg.glassBox?.explainableAi,
      msg.bibliographyReferences
    );
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panini-${msg.domain.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${msg.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTextMarkdown = (msg: ChatMessage) => {
    const bibSection =
      msg.bibliographyReferences && msg.bibliographyReferences.length > 0
        ? `\n\n## Retrieved Sources (Not Independently Verified)\n` +
          msg.bibliographyReferences
            .map(
              (r) =>
                `[${r.refNumber}] ${r.authorsOrInstitution}${r.year > 0 ? ` (${r.year})` : ''}. ${r.title}. ${r.publicationOrSource}. URL: ${r.doiOrUrl}`
            )
            .join('\n')
        : '';
    const xaiSection = msg.glassBox
      ? `\n\n---\nExplainable AI (ELI12): ${msg.glassBox.explainableAi.eli12Explanation}\nKnowledge Source: ${msg.glassBox.explainableAi.knowledgeSourceMode}\n`
      : '';
    const fullText = `# ${msg.authorName} (${msg.domain})\nTimestamp: ${msg.timestamp}\n\n${msg.content}${bibSection}${xaiSection}`;
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panini-${msg.domain.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${msg.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const borderClass = isDark ? 'border-slate-800/90' : 'border-slate-200';
  const surfaceClass = isDark ? 'bg-slate-900/80' : 'bg-white';
  const subSurfaceClass = isDark ? 'bg-slate-950/75' : 'bg-slate-50';
  const dropdownMenuClass = isDark
    ? 'border-slate-700/90 bg-slate-900/95 text-slate-100 shadow-2xl shadow-black/70 backdrop-blur-xl'
    : 'border-slate-200 bg-white/95 text-slate-900 shadow-xl backdrop-blur-xl';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const headingText = isDark ? 'text-slate-100' : 'text-slate-900';

  const workspaceOptions: {
    id: ChatCapabilityMode;
    label: string;
    subtitle: string;
    badge: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'ask_math',
      label: 'Ask & Math',
      subtitle: 'Quick Answer & Basic Explanation (Click Show more for Proofs)',
      badge: 'Default',
      icon: <MessageSquare className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'coding',
      label: 'Coding',
      subtitle: 'Deterministic code draft (Show more for explanation & sandbox)',
      badge: 'Draft',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'deep_research',
      label: 'Deep Research',
      subtitle: 'Review proposed stages and source status; search only in Online mode',
      badge: 'Evidence plan',
      icon: <Globe className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'image_gen',
      label: 'Nano-Banana Image Studio',
      subtitle: 'Pure 8K Image Output (Click Show more for DiT & Inpainting Controls)',
      badge: 'FLUX.1 / 4K',
      icon: <ImageIcon className="w-4 h-4 text-violet-400" />,
    },
    {
      id: 'video_gen',
      label: 'Veo-3 Cinema Video Studio',
      subtitle: 'Pure Cinema Video + Speaker Audio (Click Show more for Storyboard & Controls)',
      badge: 'Wan 2.1 / Veo-3',
      icon: <Film className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'audio_gen',
      label: 'Audio Synthesize',
      subtitle: 'Focused Audio Player & Waveform (Click Show more for 4-Stem Mixer)',
      badge: 'Lyria-3 / WAV',
      icon: <Volume2 className="w-4 h-4 text-amber-400" />,
    },
  ];

  const activeWorkspaceOption =
    workspaceOptions.find((w) => w.id === chatCapability) || workspaceOptions[0];

  const activeThread = chatThreads.find((t) => t.id === activeThreadId) || chatThreads[0];
  const historicalReferenceThreads = chatThreads.filter(
    (t) => t.id !== activeThreadId && t.messages.length > 0
  );

  const isChatExpanded = chatHistory.length > 0;

  return (
    <div
      className={`grid grid-cols-1 ${
        isSidebarCollapsed ? 'lg:grid-cols-[64px_1fr]' : 'lg:grid-cols-[280px_1fr]'
      } gap-4 items-start transition-all duration-200`}
    >
      {/* TRULY COLLAPSIBLE LEFT SIDEBAR (Toggles between 280px Expanded & 64px Slim Icon Rail) */}
      <aside
        aria-label="Workspace Navigation and Collapsible Chat History"
        data-testid="chat-history-sidebar"
        className={`rounded-xl border ${borderClass} ${surfaceClass} ${
          isSidebarCollapsed ? 'p-2 items-center' : 'p-3.5'
        } flex flex-col justify-between min-h-[540px] space-y-4 transition-all duration-200`}
      >
        <div className="w-full space-y-3.5">
          {/* Top Bar: Sidebar Collapse/Expand Toggle + New Chat */}
          <div
            className={`flex ${
              isSidebarCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between gap-2'
            }`}
          >
            <button
              type="button"
              data-testid="collapse-chat-history-btn"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className={`px-2.5 py-2 rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText} hover:border-sky-500/50 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold`}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-sky-400" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-sky-400" />
                  <span>Collapse</span>
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="new-chat-btn"
              onClick={onCreateNewThread}
              title="Start New Chat Thread"
              className={`${
                isSidebarCollapsed ? 'p-2 w-full justify-center' : 'px-2.5 py-2'
              } text-xs font-semibold rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors flex items-center gap-1 whitespace-nowrap`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>New Chat</span>}
            </button>
          </div>

          {/* When Sidebar is Expanded: Show Collapsible Chat History List, Online Search Toggle & Model Selector */}
          {!isSidebarCollapsed ? (
            <>
              {/* Collapsible Thread List Section */}
              <div className="space-y-2">
                <button
                  type="button"
                  data-testid="toggle-history-list-btn"
                  onClick={() => setIsHistoryListOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between text-xs px-1.5 py-1 rounded ${mutedText} hover:text-sky-400 transition-colors`}
                >
                  <span className="font-semibold">
                    Chat History &amp; Ref IDs ({chatThreads.length})
                  </span>
                  {isHistoryListOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {isHistoryListOpen && (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {chatThreads.map((thread) => {
                      const isCurrent = thread.id === activeThreadId;
                      return (
                        <div
                          key={thread.id}
                          className={`group rounded-lg border transition-colors p-2 space-y-1 ${
                            isCurrent
                              ? isDark
                                ? 'border-sky-500/60 bg-sky-950/30 text-slate-100'
                                : 'border-sky-400 bg-sky-50/80 text-slate-900'
                              : `${borderClass} ${subSurfaceClass} hover:border-slate-700`
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectThread(thread.id)}
                              className="text-left min-w-0 flex-1"
                            >
                              <div className={`text-xs font-semibold truncate ${headingText}`}>
                                {thread.title}
                              </div>
                              <div className={`text-[11px] truncate ${mutedText}`}>
                                {thread.subtitle}
                              </div>
                            </button>
                            {chatThreads.length > 1 && (
                              <button
                                type="button"
                                onClick={() => onDeleteThread(thread.id)}
                                aria-label={`Delete thread ${thread.title}`}
                                className="opacity-60 hover:opacity-100 text-slate-400 hover:text-rose-400 p-1 shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-slate-800/50 text-[10px] font-mono">
                            <span className="text-sky-400 font-semibold">{thread.referenceId}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyRefId(thread.referenceId)}
                                className="text-slate-400 hover:text-sky-300 flex items-center gap-0.5"
                                title="Copy Reference ID"
                              >
                                <Copy className="w-2.5 h-2.5" />
                                <span>
                                  {copiedRefId === thread.referenceId ? 'Copied' : 'Copy'}
                                </span>
                              </button>
                              {!isCurrent && thread.messages.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleApplyReferenceId(thread.referenceId)}
                                  className="text-emerald-400 hover:underline font-semibold"
                                  title="Load this chat into current workspace"
                                >
                                  Load Here
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Multi-Engine Online Search Toggle (Fetches Live Internet Data in Online Mode) */}
              <div className={`pt-3 border-t ${borderClass} space-y-2`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${headingText}`}>Internet Grounding</span>
                  <span className="font-mono text-[10px] text-emerald-400">
                    {isOnlineLearning ? 'Live Web Active' : 'Air-Gapped'}
                  </span>
                </div>

                <button
                  type="button"
                  data-testid="toggle-online-learning-btn"
                  onClick={onToggleOnlineLearning}
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-between gap-2 ${
                    isOnlineLearning
                      ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                      : `${borderClass} ${subSurfaceClass} ${headingText} hover:border-sky-500/50`
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {isOnlineLearning ? (
                      <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <WifiOff className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    )}
                    <span className="truncate">
                      {isOnlineLearning ? 'Online · Source Lookup' : 'Offline · Deterministic Templates'}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono uppercase shrink-0">
                    {isOnlineLearning ? 'ONLINE' : 'LOCAL'}
                  </span>
                </button>
              </div>

              {/* Aesthetic Custom Active Panini Model Dropdown */}
              <div className={`pt-3 border-t ${borderClass} space-y-2 relative`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${headingText}`}>Demo Model Profile</span>
                  <button
                    type="button"
                    onClick={() => setShowActiveModelSummary(!showActiveModelSummary)}
                    className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                  >
                    {showActiveModelSummary ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Specs</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="custom-model-dropdown-btn"
                  onClick={() => setShowModelDropdown((v) => !v)}
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    isDark
                      ? 'border-sky-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 text-slate-100 hover:border-sky-400'
                      : 'border-sky-300 bg-sky-50/60 text-slate-900 hover:border-sky-500'
                  }`}
                >
                  <span className="truncate">
                    {activeModel.name} ({activeModel.totalParamsBillions}B)
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                </button>

                {showModelDropdown && (
                  <div
                    className={`absolute left-0 right-0 z-30 mt-1 rounded-xl border p-1.5 space-y-1 max-h-60 overflow-y-auto ${dropdownMenuClass}`}
                  >
                    {compatibleModels.map((opt) => {
                      const isSel = opt.model.id === activeModel.id;
                      return (
                        <button
                          key={opt.model.id}
                          type="button"
                          onClick={() => {
                            onSelectModel(opt.model.id);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full px-2.5 py-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between gap-2 ${
                            isSel
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                              : 'hover:bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <div className="truncate">
                            <div>{opt.model.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">
                              Profile metadata: {opt.model.totalParamsBillions}B total ·{' '}
                              {opt.model.activeParamsBillions}B active · {opt.model.accuracyBenchmarkPct}% unverified benchmark
                            </div>
                          </div>
                          {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className={`text-[11px] font-mono tabular-nums ${mutedText}`}>
                  {activeHardware.shortLabel} · estimated {telemetry.estimatedTokensPerSec} tok/s
                </div>
                <div
                  data-testid="model-runtime-disclaimer"
                  className={`text-[10px] leading-relaxed ${mutedText}`}
                >
                  Profile routing only. No LLM weights or inference runtime are bundled; responses
                  use deterministic local rules.
                </div>

                {showActiveModelSummary && (
                  <div
                    className={`p-2.5 rounded-lg border ${borderClass} ${subSurfaceClass} text-[11px] space-y-1`}
                  >
                    <div className={`font-semibold ${headingText}`}>{activeModel.family}</div>
                    <p className={mutedText}>{activeModel.xaiArchitectureSummary}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Collapsed Icon Rail Controls */
            <div className="flex flex-col items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                title={`Chat History (${chatThreads.length} Threads)`}
                className={`p-2 rounded-lg border ${borderClass} ${subSurfaceClass} text-sky-400 hover:border-sky-500/50`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onToggleOnlineLearning}
                title={isOnlineLearning ? 'Online Mode Active' : 'Offline Mode Active'}
                className={`p-2 rounded-lg border ${
                  isOnlineLearning
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                    : `${borderClass} ${subSurfaceClass} text-slate-400`
                }`}
              >
                {isOnlineLearning ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Gear Button: Opens Admin Console as a New Tab in the Top Header (Hidden Otherwise) */}
        <div className={`w-full pt-3 border-t ${borderClass}`}>
          <button
            type="button"
            data-testid="open-admin-console-gear-btn"
            onClick={onOpenAdminConsole}
            title="Open Admin Console as New Tab"
            className={`w-full ${
              isSidebarCollapsed ? 'p-2 justify-center' : 'px-3 py-2 justify-center'
            } text-xs font-semibold rounded-xl border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition-colors flex items-center gap-2`}
          >
            <Settings className="w-4 h-4 text-sky-400 shrink-0" />
            {!isSidebarCollapsed && <span>Open Admin Console Tab</span>}
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONVERSATION VIEWPORT:
          Google-Style Ultra-Minimal Search Space when NOT searching (chatHistory.length === 0);
          Automatically expands to full height & width AFTER a search/query is submitted (chatHistory.length > 0). */}
      <section
        aria-label="Active Conversation Workspace"
        data-testid="chat-workspace-container"
        className={`w-full ${
          isChatExpanded
            ? `max-w-full rounded-2xl border ${borderClass} ${surfaceClass} shadow-lg`
            : 'max-w-4xl mx-auto my-auto min-h-[540px] justify-center'
        } flex flex-col transition-all duration-300`}
      >
        {/* SLEEK COMPACT STATUS STRIP — ONLY SHOWN AFTER SEARCH IS SUBMITTED (Hidden on Google-style New Chat screen) */}
        {isChatExpanded && (
          <div
            className={`px-3.5 py-2 border-b ${borderClass} flex flex-wrap items-center justify-between gap-2 text-xs`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {/* Active Chat Reference ID Badge */}
              {activeThread && (
                <div
                  className={`px-2 py-1 rounded-lg border ${borderClass} ${subSurfaceClass} flex items-center gap-1.5 text-[11px] font-mono`}
                  title="Current Chat Reference ID — Use this ID to bring this conversation into any changed workspace"
                >
                  <Hash className="w-3 h-3 text-sky-400" />
                  <span className="text-sky-400 font-semibold" data-testid="active-chat-ref-id">
                    {activeThread.referenceId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyRefId(activeThread.referenceId)}
                    className="text-[10px] text-slate-400 hover:text-sky-300 ml-0.5"
                  >
                    {copiedRefId === activeThread.referenceId ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}

              {/* Content Safety Policy Status Badge */}
              <span
                data-testid="active-safety-mode-badge"
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border flex items-center gap-1 ${
                  contentSafetyMode === 'Child Mode'
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                    : contentSafetyMode === 'NSFW Mode'
                    ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                    : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                }`}
              >
                <Shield className="w-2.5 h-2.5" />
                <span>{contentSafetyMode}</span>
              </span>

              {/* Dynamic Active Parameter Summary Pill */}
              <span className={`text-[11px] font-mono ${mutedText}`}>
                <strong className={headingText}>{activeWorkspaceOption.label}</strong> ·{' '}
                {activeModel.name} ·{' '}
                {chatCapability === 'coding'
                  ? `Lang: ${codeLanguageChoice}`
                  : chatCapability === 'deep_research'
                  ? `${researchSteps.length} Stages (${hasCustomizedSteps ? 'Customized' : 'Auto-Synced'})`
                  : chatCapability === 'video_gen' || chatCapability === 'image_gen'
                  ? `${qualityTier} · ${creativeTheme}`
                  : isOnlineLearning
                  ? 'Live Internet Grounding'
                  : 'Offline + Entity Auto-Learn'}
              </span>
            </div>

            {/* Reference ID Input to Use Old Chat in Changed Workspace */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <label htmlFor="ref-id-loader-input" className={`text-[11px] font-medium ${mutedText}`}>
                Ref ID:
              </label>
              <input
                id="ref-id-loader-input"
                data-testid="reference-id-input"
                type="text"
                value={referenceIdInput}
                onChange={(e) => setReferenceIdInput(e.target.value)}
                placeholder="e.g. REF-1002"
                className={`w-24 px-2 py-1 text-[11px] font-mono rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText} focus:outline-none focus:border-sky-500`}
              />
              <button
                type="button"
                data-testid="load-reference-id-btn"
                onClick={() => handleApplyReferenceId()}
                className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-sky-500/50 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 transition-colors whitespace-nowrap"
              >
                Load Chat
              </button>
            </div>
          </div>
        )}

        {/* Optional Reference ID Status Banner */}
        {referenceIdFeedback && (
          <div
            className={`px-4 py-1.5 text-xs flex items-center justify-between border-b ${
              referenceIdFeedback.ok
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            }`}
          >
            <span>{referenceIdFeedback.message}</span>
            <button
              type="button"
              onClick={() => setReferenceIdFeedback(null)}
              className="text-[11px] underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ACTIVE MULTI-CONTEXT THREAD MEMORY BAR (Shows resolved entity sense & conversation memory across turns) */}
        {isChatExpanded && activeThread?.threadContext?.resolvedEntity && (
          <div
            data-testid="active-thread-context-bar"
            className={`px-4 py-2 border-b ${borderClass} ${
              isDark ? 'bg-indigo-950/25' : 'bg-indigo-50/70'
            } flex flex-wrap items-center justify-between gap-2 text-xs`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-semibold">
                Multi-Context Memory Active
              </span>
              <span className={`font-semibold ${headingText}`}>
                {activeThread.threadContext.resolvedSenseLabel ||
                  activeThread.threadContext.resolvedEntity}
              </span>
              <span className={`text-[11px] font-mono ${mutedText}`}>
                · {activeThread.threadContext.activeDomain} ({activeThread.threadContext.priorPrompts.length} turns in context)
              </span>
            </div>
            {onClearThreadContext && (
              <button
                type="button"
                data-testid="reset-thread-context-btn"
                onClick={onClearThreadContext}
                className="text-[11px] font-mono text-slate-400 hover:text-rose-400 underline"
              >
                Switch / Reset Context
              </button>
            )}
          </div>
        )}

        {/* Chat Stream: Pure Google-style minimal header when idle (chatHistory.length === 0); Expanded after search */}
        <div
          ref={chatFeedRef}
          className={`${
            isChatExpanded
              ? 'p-4 sm:p-5 space-y-4 max-h-[520px] overflow-y-auto scroll-smooth'
              : 'px-4 pt-8 pb-3 flex flex-col items-center justify-center'
          }`}
          aria-live="polite"
        >
          {chatHistory.length === 0 ? (
            <div
              data-testid="empty-workspace-state"
              className="flex flex-col items-center justify-center text-center space-y-3 py-2"
            >
              <h1
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${headingText}`}
              >
                Panini <span className="text-sky-400">400B</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
                <span
                  data-testid="active-safety-mode-badge"
                  className={`px-2.5 py-0.5 rounded-full border flex items-center gap-1 font-semibold ${
                    contentSafetyMode === 'Child Mode'
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                      : contentSafetyMode === 'NSFW Mode'
                      ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                      : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>{contentSafetyMode}</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full border ${borderClass} ${subSurfaceClass} ${mutedText}`}>
                  {activeModel.name} · Demo profile (no model weights loaded)
                </span>
                {learnedEntities.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full border border-sky-500/40 bg-sky-500/10 text-sky-300">
                    +{learnedEntities.length} Cached Research Records
                  </span>
                )}
              </div>
            </div>
          ) : (
            chatHistory.map((msg) => {
              const isUser = msg.role === 'user';
              const activeXaiTab = xaiModeByMsg[msg.id] || 'eli12';
              const isDetailsExpanded = Boolean(expandedDetailsByMsg[msg.id]);
              const isPureImageMsg = !isUser && Boolean(msg.imageStudio && !msg.generatedMedia);
              const isPureVideoMsg = !isUser && Boolean(msg.generatedMedia);
              const isPureAudioMsg =
                !isUser && Boolean(msg.musicTrack && !msg.generatedMedia && !msg.imageStudio);
              const isCodingMsg = !isUser && Boolean(msg.codingResolution);
              const isDeepResearchMsg =
                !isUser &&
                Boolean(
                  msg.bibliographyReferences ||
                    msg.deepResearchMetadata ||
                    msg.pendingResearchPlan
                );

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`w-full ${
                      isUser ? 'max-w-2xl' : 'max-w-full'
                    } p-4 rounded-xl border ${
                      isUser
                        ? isDark
                          ? 'border-sky-500/30 bg-sky-950/25'
                          : 'border-sky-200 bg-sky-50/60'
                        : `${borderClass} ${subSurfaceClass}`
                    } space-y-3`}
                  >
                    {/* Metadata Line (Shown for user messages, text/code/research messages, or when details are expanded) */}
                    {(isUser ||
                      isDetailsExpanded ||
                      (!isPureImageMsg && !isPureVideoMsg && !isPureAudioMsg)) && (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-semibold ${headingText}`}>{msg.authorName}</span>
                          <span aria-hidden="true" className={mutedText}>
                            ·
                          </span>
                          <span className="font-mono text-sky-400">{msg.domain}</span>
                          {isDetailsExpanded && msg.subDomain && (
                            <>
                              <span aria-hidden="true" className={mutedText}>
                                →
                              </span>
                              <span className="font-mono text-indigo-300">{msg.subDomain}</span>
                            </>
                          )}
                          {msg.selectedLanguage && (
                            <>
                              <span aria-hidden="true" className={mutedText}>
                                ·
                              </span>
                              <span className="font-mono text-emerald-400">
                                {msg.selectedLanguage}
                              </span>
                            </>
                          )}
                          {isDetailsExpanded && msg.safetyModeApplied && !isUser && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                msg.safetyModeApplied === 'Child Mode'
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                                  : msg.safetyModeApplied === 'NSFW Mode'
                                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {msg.safetyModeApplied}
                            </span>
                          )}
                          <span aria-hidden="true" className={mutedText}>
                            ·
                          </span>
                          <span className={`font-mono tabular-nums ${mutedText}`}>
                            {msg.timestamp}
                          </span>
                        </div>

                        {/* Explainable AI Button — Shown when details are expanded */}
                        {!isUser && isDetailsExpanded && msg.glassBox && (
                          <button
                            type="button"
                            data-testid="explainable-ai-btn"
                            onClick={() =>
                              setExpandedXaiMsgId(expandedXaiMsgId === msg.id ? null : msg.id)
                            }
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                              expandedXaiMsgId === msg.id
                                ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                                : `${borderClass} ${surfaceClass} text-sky-400 hover:border-sky-500/50`
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              {expandedXaiMsgId === msg.id
                                ? 'Hide Explainable AI'
                                : 'Explainable AI'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* SUB-DOMAIN EXPERT SWITCHER, STREAMING METHOD & MULTI-EXPERT OPINION COMPARISON (Shown on Show more) */}
                    {!isUser && isDetailsExpanded && msg.selectedExpert && (
                      <div
                        data-testid="message-expert-banner"
                        className={`p-3 rounded-xl border ${borderClass} ${surfaceClass} space-y-2 text-xs`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className={`font-semibold ${headingText}`}>
                              {msg.selectedExpert.name}
                            </span>
                            <span className={`text-[11px] ${mutedText}`}>
                              ({msg.selectedExpert.roleTitle} · {msg.selectedExpert.subDomain})
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/40">
                              {msg.selectedExpert.streamingMethod}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              htmlFor={`switch-expert-${msg.id}`}
                              className={`text-[11px] font-mono ${mutedText}`}
                            >
                              Switch Expert:
                            </label>
                            <select
                              id={`switch-expert-${msg.id}`}
                              data-testid="switch-message-expert-select"
                              value={msg.selectedExpert.id}
                              onChange={(e) => onSwitchMessageExpert(msg.id, e.target.value)}
                              className={`px-2 py-1 text-[11px] font-medium rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText} focus:outline-none focus:border-sky-500`}
                            >
                              {SUB_DOMAIN_EXPERTS.map((exp: SubDomainExpert) => (
                                <option key={exp.id} value={exp.id}>
                                  {exp.name} — {exp.domain}: {exp.subDomain}
                                </option>
                              ))}
                            </select>

                            {msg.contrastingOpinions && msg.contrastingOpinions.length > 0 && (
                              <button
                                type="button"
                                data-testid="compare-expert-opinions-btn"
                                onClick={() =>
                                  setExpandedOpinionsMsgId(
                                    expandedOpinionsMsgId === msg.id ? null : msg.id
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg border border-indigo-500/50 bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 text-[11px] font-semibold transition-colors"
                              >
                                {expandedOpinionsMsgId === msg.id
                                  ? 'Hide Expert Comparison'
                                  : `Compare Opinions (${msg.contrastingOpinions.length + 1})`}
                              </button>
                            )}
                          </div>
                        </div>

                        {msg.matchedScenario && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px] font-mono">
                            <span className="text-emerald-400">
                              Scenario Template Matched: {msg.matchedScenario.id} —{' '}
                              {msg.matchedScenario.title}
                            </span>
                            <span className={mutedText}>
                              Target Metric: {msg.matchedScenario.targetMetric}
                            </span>
                          </div>
                        )}

                        {expandedOpinionsMsgId === msg.id &&
                          msg.contrastingOpinions &&
                          msg.contrastingOpinions.length > 0 && (
                            <div
                              data-testid="multi-expert-opinions-panel"
                              className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800/70"
                            >
                              {msg.contrastingOpinions.map((op) => (
                                <div
                                  key={op.expertId}
                                  className={`p-2.5 rounded-lg border ${borderClass} ${subSurfaceClass} space-y-1 text-[11px]`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={`font-semibold ${headingText}`}>
                                      {op.expertName} ({op.subDomain})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onSwitchMessageExpert(msg.id, op.expertId)}
                                      className="text-[10px] font-mono text-sky-400 hover:underline"
                                    >
                                      Stream This View →
                                    </button>
                                  </div>
                                  <div className="text-[10px] font-mono text-indigo-300">
                                    {op.streamingMethod}
                                  </div>
                                  <p className={mutedText}>
                                    {renderInlineSpans(op.opinionSummary, isDark)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    )}

                    {/* Cached online source record (Shown on Show more) */}
                    {!isUser && isDetailsExpanded && msg.learnedEntity && (
                      <div
                        data-testid="wikipedia-learned-entity-badge"
                        className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300 font-semibold">
                            Cached source record from {msg.learnedEntity.publicationOrSource}:{' '}
                            <span className="underline">{msg.learnedEntity.entityTitle}</span>
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-emerald-200">
                          No model weights changed · {msg.learnedEntity.subDomain}
                        </span>
                      </div>
                    )}

                    {msg.autoCorrectedFrom && (
                      <div className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs flex flex-wrap items-center justify-between gap-2">
                        <span className="text-amber-300">
                          Auto-Corrected:{' '}
                          <span className="line-through opacity-75">{msg.autoCorrectedFrom}</span> →{' '}
                          <span className="font-semibold">{msg.content}</span>
                        </span>
                      </div>
                    )}

                    {msg.attachedFile && (
                      <div
                        className={`p-2.5 rounded-lg border ${borderClass} ${surfaceClass} flex items-center gap-2.5 text-xs`}
                      >
                        <Paperclip className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className={`font-semibold ${headingText}`}>
                          {msg.attachedFile.name} ({msg.attachedFile.sizeKb} KB)
                        </div>
                      </div>
                    )}

                    {/* CODING PRE-GENERATION VERIFICATION & BUG CHECKS PANEL (Shown on Show more) */}
                    {isDetailsExpanded && msg.codingResolution?.bugChecks && (
                      <div
                        data-testid="coding-bug-checks-panel"
                        className={`p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 space-y-2 text-xs`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" />
                            <span>
                              Pre-Generation Static Verification &amp; Bug Checks Passed (4/4 Gates)
                            </span>
                          </span>
                          <span className="font-mono text-[11px] text-emerald-300">
                            0 Bugs · Deterministic Safety Verified
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.codingResolution.bugChecks.map((chk, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg border ${borderClass} ${surfaceClass} text-[11px] space-y-0.5`}
                            >
                              <div className="flex items-center justify-between font-mono">
                                <span className={`font-semibold ${headingText}`}>
                                  {chk.checkName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                  {chk.status}
                                </span>
                              </div>
                              <p className={mutedText}>{chk.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* VIDEO OUTPUT: Shows ONLY video canvas + speaker audio by default; extra details behind Show more */}
                    {msg.generatedMedia && (
                      <RealisticMediaCanvas
                        media={msg.generatedMedia}
                        messageId={msg.id}
                        onUpdateMediaParams={onUpdateGeneratedMedia}
                        isDark={isDark}
                      />
                    )}

                    {/* BIOSCIENCE 3D LAB CARD */}
                    {!isUser &&
                      msg.bioscienceAnalysis &&
                      !isPureImageMsg &&
                      !isPureVideoMsg &&
                      !isPureAudioMsg && (
                        <BioscienceLabCard analysis={msg.bioscienceAnalysis} />
                      )}

                    {/* AUDIO SYNTHESIZE OUTPUT: Focuses purely on audio player + waveform by default */}
                    {!isUser && msg.musicTrack && !msg.generatedMedia && !msg.imageStudio && (
                      <MusicSynthStudioCard
                        initialTrack={msg.musicTrack}
                        isOnline={isOnlineLearning}
                      />
                    )}

                    {/* IMAGE OUTPUT: Shows ONLY image canvas by default */}
                    {!isUser && msg.imageStudio && !msg.generatedMedia && (
                      <ImageCreateAndEditCard initialImageSpec={msg.imageStudio} />
                    )}

                    {/* RELEASE v5.9-GA: >= 60s (62s) THINKING MODE TIMER & LIVE STREAM (Hidden automatically once output is generated) */}
                    {!isUser &&
                    activeThinkingMsgId === msg.id &&
                    msg.thinkingPlanV59 &&
                    thinkingElapsedSec < (msg.thinkingPlanV59.totalRequiredSeconds || 62) ? (
                      <div
                        data-testid="thinking-mode-active-card"
                        className={`p-4 rounded-xl border ${
                          isDark
                            ? 'border-sky-500/40 bg-slate-900/90'
                            : 'border-sky-300 bg-sky-50/70'
                        } space-y-3`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
                            <span className={`text-xs font-bold ${headingText}`}>
                              Thinking Mode — Deep Data Collection, Structuring &amp; Accuracy Verification
                            </span>
                            <span
                              data-testid="thinking-mode-timer-badge"
                              className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/40"
                            >
                              {thinkingElapsedSec}s / {msg.thinkingPlanV59.totalRequiredSeconds}s (150s Deep Research &amp; Accuracy Gate)
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              data-testid="thinking-mode-show-details-btn"
                              onClick={() => setShowThinkingDetails((prev) => !prev)}
                              className="px-2.5 py-1 rounded-lg border border-sky-500/50 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              {showThinkingDetails ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Hide Details</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Show Details</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              data-testid="thinking-mode-fast-forward-btn"
                              onClick={() => {
                                completedThinkingMsgIdsRef.current.add(msg.id);
                                setThinkingElapsedSec(
                                  msg.thinkingPlanV59?.totalRequiredSeconds || 150
                                );
                                setActiveThinkingMsgId(null);
                                setShowThinkingDetails(false);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-emerald-500/50 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete Verification Now</span>
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (thinkingElapsedSec /
                                    (msg.thinkingPlanV59.totalRequiredSeconds || 150)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>

                        {/* Compact 5-Stage Status Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-[11px]">
                          {msg.thinkingPlanV59.stages.map((stg) => {
                            const isDone = thinkingElapsedSec >= stg.endSec;
                            const isCurrent =
                              thinkingElapsedSec >= stg.startSec &&
                              thinkingElapsedSec < stg.endSec;
                            return (
                              <div
                                key={stg.stageId}
                                className={`px-2.5 py-1.5 rounded-lg border font-mono ${
                                  isDone
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                    : isCurrent
                                    ? 'border-sky-500/50 bg-sky-500/15 text-sky-200 font-semibold'
                                    : `${borderClass} ${surfaceClass} ${mutedText}`
                                }`}
                              >
                                <div>
                                  {isDone ? '✓ ' : isCurrent ? '● ' : '○ '}
                                  {stg.title}
                                </div>
                                <div className="text-[10px] opacity-75">
                                  {stg.startSec}s–{stg.endSec}s
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* ONLY IF USER CLICKS "Show Details" IN THINKING MODE: Present Live Data Stream & Backend Engineered Prompt */}
                        {showThinkingDetails && (
                          <div
                            data-testid="thinking-mode-live-stream"
                            className="p-3 rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] text-emerald-300 space-y-2 max-h-64 overflow-y-auto"
                          >
                            <div className="text-sky-400 font-bold border-b border-slate-800 pb-1">
                              [LIVE DATA STREAM — BACKEND PROMPT ENGINEERING &amp; MULTI-SOURCE VERIFICATION]
                            </div>
                            {msg.engineeredPromptSpecV59 && (
                              <div className="text-slate-300 space-y-0.5 border-b border-slate-800/80 pb-2">
                                <div>
                                  <span className="text-amber-300">Target Entity:</span>{' '}
                                  {msg.engineeredPromptSpecV59.extractedEntityTarget} ·{' '}
                                  <span className="text-amber-300">Abstention Token:</span> &quot;
                                  {msg.engineeredPromptSpecV59.strictAbstentionRule.slice(0, 60)}...&quot;
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Engineered Prompt:{' '}
                                  {msg.engineeredPromptSpecV59.engineeredSystemPrompt}
                                </div>
                              </div>
                            )}
                            {msg.thinkingPlanV59.stages
                              .filter((stg) => thinkingElapsedSec >= stg.startSec)
                              .map((stg) => (
                                <div key={stg.stageId} className="space-y-1">
                                  <div className="text-sky-300 font-semibold">
                                    [{stg.startSec}s–{stg.endSec}s] {stg.title}: {stg.detail}
                                  </div>
                                  {stg.liveStreamLines.map((line, lIdx) => (
                                    <div key={lIdx} className="pl-3 text-emerald-300/90">
                                      ↳ {line}
                                    </div>
                                  ))}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* RELEASE v5.7-ALPHA: BI-DIRECTIONAL INPUT & OUTPUT GUARDRAILS BANNER (Hidden unless Show more or blocked) */}
                        {!isUser &&
                          (msg.inputGuardrail || msg.outputGuardrail) &&
                          (isDetailsExpanded || msg.inputGuardrail?.isBlocked) && (
                            <BiDirectionalGuardrailBanner
                              inputGuardrail={msg.inputGuardrail}
                              outputGuardrail={msg.outputGuardrail}
                              isDark={isDark}
                            />
                          )}

                        {/* RELEASE v5.7-ALPHA: BOUNDED AGENT ORCHESTRATOR & HITL APPROVAL GATE (Hidden unless Show more or pending HITL) */}
                        {!isUser &&
                          msg.agentOrchestrator &&
                          (isDetailsExpanded ||
                            Boolean(msg.agentOrchestrator.pendingHitlApproval)) && (
                            <BoundedAgentOrchestratorCard
                              orchestrator={msg.agentOrchestrator}
                              onHitlDecision={(decision) => onHitlDecision?.(msg.id, decision)}
                              isDark={isDark}
                            />
                          )}

                        {/* RELEASE v5.7-ALPHA: END-TO-END RECEIPT-TO-EXPENSE-DECK WORKBENCH */}
                        {!isUser && msg.expenseDeckBundle && (
                          <ReceiptToExpenseDeckWorkbenchCard
                            bundle={msg.expenseDeckBundle}
                            onChangeBrandOrRuntime={(brandStyle, sandboxRuntime) =>
                              onUpdateExpenseDeckStyle?.(msg.id, brandStyle, sandboxRuntime)
                            }
                            onOpenFileInPreviewTab={onOpenFileInPreviewTab}
                            isDark={isDark}
                          />
                        )}

                        {/* RELEASE v5.7-BETA: PHASE 2 KNOWLEDGE PIPELINE (Shown only when Show more is expanded) */}
                        {!isUser && isDetailsExpanded && msg.knowledgeMcpPipeline && (
                          <KnowledgePipelineAndMcpCardV57
                            pipeline={msg.knowledgeMcpPipeline}
                            onChangeAclRole={(newRole) => onUpdateMessageAclRole?.(msg.id, newRole)}
                            isDark={isDark}
                          />
                        )}

                        {/* RELEASE v5.7-GA: PHASE 3 PRODUCTION ARCHITECTURE (Shown only when Show more is expanded) */}
                        {!isUser && isDetailsExpanded && (
                          <Phase3ProductionArchitectureCardV57
                            messageId={msg.id}
                            referenceId={activeThread?.referenceId || 'REF-1042'}
                            promptText={msg.content.slice(0, 140)}
                            activeRole={msg.knowledgeMcpPipeline?.activeRole || 'Analyst'}
                            initialOtelTrace={msg.otelTraceWaterfall}
                            initialAsyncJob={msg.asyncJobRecord}
                            initialFeedback={msg.userFeedbackRating}
                            isDark={isDark}
                          />
                        )}

                        {/* MAPS & SEARCH GROUNDING (Shown when Show more is active) */}
                        {!isUser &&
                          isDetailsExpanded &&
                          (msg.mapsGrounding || msg.searchGrounding) && (
                            <SpatialMapsAndSearchCard
                              mapsGrounding={msg.mapsGrounding}
                              searchGrounding={msg.searchGrounding}
                            />
                          )}

                        {!isUser && msg.researchError && (
                          <div
                            role="alert"
                            data-testid="deep-research-error"
                            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
                          >
                            {msg.researchError}
                          </div>
                        )}
                        {!isUser && msg.researchWarning && (
                          <div
                            role="status"
                            data-testid="deep-research-warning"
                            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
                          >
                            {msg.researchWarning}
                          </div>
                        )}
                        {!isUser && msg.searchWarning && (
                          <div
                            role="status"
                            data-testid="search-warning"
                            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
                          >
                            {msg.searchWarning}
                          </div>
                        )}

                        {/* PRIMARY TEXT / CODE / RESEARCH / ASK-MATH FORMATTED OUTPUT (Only formatted output visible once Thinking Mode completes) */}
                        {isUser ? (
                          renderFormattedMessage(msg.content, isDark)
                        ) : isPureImageMsg || isPureVideoMsg || isPureAudioMsg ? (
                          isDetailsExpanded ? (
                            renderFormattedMessage(msg.content, isDark)
                          ) : msg.simpleAnswerMarkdown ? (
                            <div data-testid="ask-math-quick-answer-view">
                              {renderFormattedMessage(msg.simpleAnswerMarkdown, isDark)}
                            </div>
                          ) : null
                        ) : isCodingMsg && !isDetailsExpanded ? (
                          <div data-testid="coding-pure-code-view" className="space-y-3">
                            {msg.codingResolution ? (
                              <CodingMultiFormatWorkbenchCard
                                codingResolution={msg.codingResolution}
                                isDark={isDark}
                                isDetailsExpanded={false}
                                onOpenFileInPreviewTab={onOpenFileInPreviewTab}
                              />
                            ) : (
                              renderFormattedMessage(msg.content, isDark)
                            )}
                          </div>
                        ) : isCodingMsg && isDetailsExpanded ? (
                          <div data-testid="coding-expanded-view" className="space-y-3">
                            {msg.codingResolution && (
                              <CodingMultiFormatWorkbenchCard
                                codingResolution={msg.codingResolution}
                                isDark={isDark}
                                isDetailsExpanded={true}
                                onOpenFileInPreviewTab={onOpenFileInPreviewTab}
                              />
                            )}
                            {renderFormattedMessage(msg.content, isDark)}
                          </div>
                        ) : isDeepResearchMsg && !isDetailsExpanded ? (
                          <div data-testid="deep-research-findings-view">
                            {renderFormattedMessage(msg.content, isDark)}
                          </div>
                        ) : !isDetailsExpanded ? (
                          /* ASK / MATH DEFAULT: Show full formatted output with grounded tables & citations */
                          <div data-testid="ask-math-quick-answer-view">
                            {renderFormattedMessage(msg.content, isDark)}
                          </div>
                        ) : msg.simpleAnswerMarkdown ? (
                      /* EXPANDED ("Show more"): Full Side-by-Side / Simple / Expert View Tabs */
                      <div data-testid="answer-clarity-container" className="space-y-3 pt-1">
                        <div
                          data-testid="answer-clarity-tabs"
                          className={`p-2 rounded-xl border ${borderClass} ${surfaceClass} flex flex-wrap items-center justify-between gap-2 text-xs`}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className={`font-bold ${headingText}`}>
                              Answer Clarity Mode:
                            </span>
                            <span className={`text-[11px] ${mutedText}`}>
                              Compare plain-English Everyday Guide with Technical Expert View
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(
                              [
                                {
                                  id: 'side_by_side',
                                  label: 'Side-by-Side (Simple + Expert)',
                                  testId: 'tab-side-by-side-view',
                                },
                                {
                                  id: 'simple',
                                  label: 'Simple View (Everyday Guide)',
                                  testId: 'tab-simple-view',
                                },
                                {
                                  id: 'expert',
                                  label: 'Expert View (Technical)',
                                  testId: 'tab-expert-view',
                                },
                              ] as const
                            ).map((tab) => {
                              const currentViewMode =
                                answerViewModeByMsg[msg.id] || 'side_by_side';
                              const isActive = currentViewMode === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  data-testid={tab.testId}
                                  onClick={() =>
                                    setAnswerViewModeByMsg((prev) => ({
                                      ...prev,
                                      [msg.id]: tab.id,
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                                    isActive
                                      ? tab.id === 'simple'
                                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                        : tab.id === 'expert'
                                        ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                                        : 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                                      : `${borderClass} ${subSurfaceClass} ${mutedText} hover:text-slate-200`
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {(answerViewModeByMsg[msg.id] || 'side_by_side') === 'side_by_side' && (
                          <div
                            data-testid="side-by-side-answer-grid"
                            className="grid grid-cols-1 lg:grid-cols-2 gap-3.5"
                          >
                            <div
                              data-testid="simple-view-panel"
                              className={`p-3.5 rounded-xl border ${
                                isDark
                                  ? 'border-emerald-500/40 bg-emerald-950/15'
                                  : 'border-emerald-300 bg-emerald-50/60'
                              } space-y-2`}
                            >
                              <div className="flex items-center justify-between border-b border-emerald-500/25 pb-1.5 text-xs">
                                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Simple View — Everyday Plain-English Guide</span>
                                </span>
                                <span className="font-mono text-[10px] text-emerald-300">
                                  Easy to Understand
                                </span>
                              </div>
                              {renderFormattedMessage(msg.simpleAnswerMarkdown, isDark)}
                            </div>

                            <div
                              data-testid="expert-view-panel"
                              className={`p-3.5 rounded-xl border ${
                                isDark
                                  ? 'border-sky-500/35 bg-slate-900/70'
                                  : 'border-sky-200 bg-slate-50'
                              } space-y-2`}
                            >
                              <div className="flex items-center justify-between border-b border-sky-500/25 pb-1.5 text-xs">
                                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 shrink-0" />
                                  <span>Expert View — Technical &amp; Domain Synthesis</span>
                                </span>
                                <span className="font-mono text-[10px] text-sky-300">
                                  Full Depth
                                </span>
                              </div>
                              {renderFormattedMessage(msg.content, isDark)}
                            </div>
                          </div>
                        )}

                        {(answerViewModeByMsg[msg.id] || 'side_by_side') === 'simple' && (
                          <div
                            data-testid="simple-view-panel"
                            className={`p-4 rounded-xl border ${
                              isDark
                                ? 'border-emerald-500/40 bg-emerald-950/15'
                                : 'border-emerald-300 bg-emerald-50/60'
                            } space-y-2`}
                          >
                            <div className="flex items-center justify-between border-b border-emerald-500/25 pb-1.5 text-xs">
                              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Simple View — Everyday Plain-English Guide</span>
                              </span>
                              <span className="font-mono text-[10px] text-emerald-300">
                                Zero Jargon · Real-World Analogy
                              </span>
                            </div>
                            {renderFormattedMessage(msg.simpleAnswerMarkdown, isDark)}
                          </div>
                        )}

                        {(answerViewModeByMsg[msg.id] || 'side_by_side') === 'expert' && (
                          <div
                            data-testid="expert-view-panel"
                            className={`p-4 rounded-xl border ${
                              isDark
                                ? 'border-sky-500/35 bg-slate-900/70'
                                : 'border-sky-200 bg-slate-50'
                            } space-y-2`}
                          >
                            <div className="flex items-center justify-between border-b border-sky-500/25 pb-1.5 text-xs">
                              <span className="font-bold text-sky-400 flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 shrink-0" />
                                <span>Expert View — Technical &amp; Domain Synthesis</span>
                              </span>
                              <span className="font-mono text-[10px] text-sky-300">
                                Full Technical Details
                              </span>
                            </div>
                            {renderFormattedMessage(msg.content, isDark)}
                          </div>
                        )}
                      </div>
                    ) : (
                      renderFormattedMessage(msg.content, isDark)
                    )}
                      </>
                    )}

                    {/* CODING LIVE EXECUTION OUTPUT PREVIEW SECTION (Shown on Show more) */}
                    {isDetailsExpanded && msg.codingResolution?.executionPreviewOutput && (
                      <div
                        data-testid="coding-live-preview-panel"
                        className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-xs"
                      >
                        <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5" />
                            <span>
                              Live Code Execution &amp; Output Preview ({msg.codingResolution.resolvedLanguage}{' '}
                              Sandbox)
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setReRanPreviewMsgId(msg.id)}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-mono text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            <span>
                              {reRanPreviewMsgId === msg.id
                                ? 'Verified Output (0ms Drift)'
                                : 'Re-Run Preview'}
                            </span>
                          </button>
                        </div>
                        <pre className="p-3.5 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                          <code>{msg.codingResolution.executionPreviewOutput}</code>
                        </pre>
                      </div>
                    )}

                    {/* Multi-Engine Online Search Stream Telemetry (Shown on Show more) */}
                    {isDetailsExpanded && msg.multiEngineStream && (
                      <div
                        className={`p-3 rounded-lg border ${borderClass} ${surfaceClass} space-y-2 text-xs`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`font-semibold flex items-center gap-1.5 ${headingText}`}>
                            <Globe className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              Live Search Providers ({msg.multiEngineStream.activeEnginesCount}{' '}
                              returned results)
                            </span>
                          </span>
                          <span className="font-mono text-[11px] text-emerald-400">
                            Zero 3rd-Party Online AI Models Referenced
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {msg.multiEngineStream.engines.map((eng) => (
                            <div
                              key={eng.engineId}
                              className={`p-2 rounded border ${borderClass} ${subSurfaceClass} text-[11px] space-y-0.5`}
                            >
                              <div className="flex items-center justify-between font-mono">
                                <span className="text-sky-400 font-semibold">{eng.engineName}</span>
                                <span className={mutedText}>
                                  {eng.latencyMs === undefined ? 'Live source' : `${eng.latencyMs}ms`}
                                  {eng.matchedScenarioId ? ` · ${eng.matchedScenarioId}` : ''}
                                </span>
                              </div>
                              <p className={`truncate ${mutedText}`}>{eng.streamedSnippet}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deep Research Scenario Registration (Shown on Show more) */}
                    {isDetailsExpanded && msg.deepResearchMetadata && (
                      <div
                        data-testid="deep-research-scenario-metadata"
                        className={`p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 space-y-1.5 text-xs`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                            <span>
                              Scenario saved · model weights unchanged
                            </span>
                          </span>
                        </div>
                        <div className={`text-[11px] font-mono ${mutedText}`}>
                          Scenario: {msg.deepResearchMetadata.scenarioId} · Retrieved{' '}
                          {msg.deepResearchMetadata.sourceRecordsRetrieved} source records; these are not training data.
                        </div>
                      </div>
                    )}

                    {/* Deep Research Bibliography with Valid Clickable Links (Shown on Show more) */}
                    {isDetailsExpanded &&
                      msg.bibliographyReferences &&
                      msg.bibliographyReferences.length > 0 && (
                        <div
                          data-testid="deep-research-bibliography"
                          className={`p-3 rounded-lg border ${borderClass} ${surfaceClass} space-y-2 text-xs`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-semibold flex items-center gap-1.5 ${headingText}`}>
                              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                              <span>
                                Retrieved Research Sources ({msg.bibliographyReferences.length})
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedBibMsgId(expandedBibMsgId === msg.id ? null : msg.id)
                              }
                              className="text-[11px] font-mono text-sky-400 hover:underline"
                            >
                              {expandedBibMsgId === msg.id ? 'Collapse' : 'Show Compact / Expand'}
                            </button>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            {(expandedBibMsgId === msg.id
                              ? msg.bibliographyReferences
                              : msg.bibliographyReferences.slice(0, 4)
                            ).map((ref) => (
                              <div
                                key={ref.refNumber}
                                className={`p-2.5 rounded-lg border ${borderClass} ${subSurfaceClass} text-[11px] space-y-1`}
                              >
                                <div className={headingText}>
                                  <span className="font-mono text-sky-400 font-semibold mr-1.5">
                                    [{ref.refNumber}]
                                  </span>
                                  <span className="font-semibold">{ref.title}</span>
                                  {ref.year > 0 ? ` (${ref.year})` : ''}
                                </div>
                                <div className={mutedText}>
                                  {ref.authorsOrInstitution} · {ref.publicationOrSource}
                                </div>
                                <div className="pt-0.5">
                                  <a
                                    href={ref.doiOrUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 break-all"
                                  >
                                    <span>{ref.doiOrUrl}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {msg.clarificationOptions && msg.clarificationOptions.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Select a Clarified Use Case below to run:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.clarificationOptions.map((opt, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => onSendMessage(opt.fullPrompt, opt.domain)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-sky-500/50 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition-colors text-left"
                            >
                              {opt.label} ({opt.domain}) -&gt;
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* POLYSEMOUS ENTITY CONTEXT CLARIFICATION CARD */}
                    {msg.ambiguityClarification &&
                      msg.ambiguityClarification.options.length > 0 && (
                        <div
                          data-testid="ambiguity-clarification-card"
                          className={`mt-2 p-3.5 rounded-xl border border-amber-500/50 ${
                            isDark ? 'bg-amber-950/20' : 'bg-amber-50/70'
                          } space-y-2.5`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                              <HelpCircle className="w-4 h-4 shrink-0" />
                              <span>
                                Choose Exact Context for &ldquo;{msg.ambiguityClarification.entityName}&rdquo; (Locks Multi-Turn Thread Memory):
                              </span>
                            </span>
                            <span className="font-mono text-[10px] text-amber-300">
                              Click a meaning or reply in chat
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {msg.ambiguityClarification.options.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                data-testid={`ambiguity-option-${opt.senseKey}`}
                                onClick={() => {
                                  if (onSelectAmbiguityOption) {
                                    onSelectAmbiguityOption(opt);
                                  } else {
                                    onSendMessage(opt.expandedPrompt, opt.domain);
                                  }
                                }}
                                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                                  isDark
                                    ? 'border-sky-500/40 bg-slate-900/90 hover:border-sky-400 hover:bg-sky-950/40'
                                    : 'border-sky-300 bg-white hover:border-sky-500'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-xs font-bold ${headingText}`}>
                                    {opt.label}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 shrink-0">
                                    {opt.badge}
                                  </span>
                                </div>
                                <p className={`text-[11px] leading-snug ${mutedText}`}>
                                  {opt.description}
                                </p>
                                <div className="text-[10px] font-mono text-emerald-400 pt-0.5">
                                  Select Context &amp; Continue →
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* MULTI-STAGE DEEP RESEARCH FLOW / METHODOLOGY (Hidden by default; shown when Show more is clicked) */}
                    {isDetailsExpanded && msg.pendingResearchPlan && (
                      <div
                        data-testid="deep-research-plan-approval-card"
                        className={`mt-2 p-4 rounded-xl border border-indigo-500/50 ${
                          isDark ? 'bg-indigo-950/25' : 'bg-indigo-50/70'
                        } space-y-3 text-xs`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/30 pb-2">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span className={`font-bold text-sm ${headingText}`}>
                              Multi-Stage Deep Research Flow ({msg.pendingResearchPlan.steps.length} Topic-Focused Stages · Plain-English Thresholds)
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            {msg.pendingResearchPlan.status === 'completed'
                              ? 'Completed'
                              : msg.pendingResearchPlan.status === 'executing'
                              ? 'Searching'
                              : msg.pendingResearchPlan.status === 'failed'
                              ? 'Failed'
                              : 'Awaiting approval'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {msg.pendingResearchPlan.steps.map((stg, idx) => (
                            <div
                              key={stg.id}
                              data-testid={`deep-research-plan-stage-${idx + 1}`}
                              className={`p-3 rounded-lg border ${borderClass} ${surfaceClass} space-y-2`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-indigo-400 font-semibold">
                                  Stage {idx + 1} · {stg.domainFocus}
                                </span>
                                <span className="text-emerald-400">100% On-Topic · Verified</span>
                              </div>
                              <div className={`font-semibold text-xs ${headingText}`}>
                                {stg.title}
                              </div>
                              <p className={`text-[11px] leading-relaxed ${mutedText}`}>
                                {stg.objective}
                              </p>
                              {(stg.thresholdSummary || stg.realWorldExample) && (
                                <div
                                  className={`p-2 rounded-md border ${
                                    isDark
                                      ? 'border-emerald-500/25 bg-emerald-950/20'
                                      : 'border-emerald-300 bg-emerald-50/70'
                                  } text-[11px] space-y-1`}
                                >
                                  {stg.thresholdSummary && (
                                    <div>
                                      <span className="font-semibold text-emerald-400">
                                        Plain-English Threshold:{' '}
                                      </span>
                                      <span className={headingText}>{stg.thresholdSummary}</span>
                                    </div>
                                  )}
                                  {(stg.belowThresholdBehavior || stg.aboveThresholdBehavior) && (
                                    <div className={mutedText}>
                                      <span className="font-medium text-sky-400">
                                        Below vs. Above:{' '}
                                      </span>
                                      {stg.belowThresholdBehavior} {stg.aboveThresholdBehavior}
                                    </div>
                                  )}
                                  {stg.realWorldExample && (
                                    <div className={mutedText}>
                                      <span className="font-medium text-amber-400">
                                        Everyday Example:{' '}
                                      </span>
                                      {stg.realWorldExample}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PROACTIVE MULTI-CONTEXT FOLLOW-UP & CLARIFYING QUESTIONS (Shown on Show more) */}
                    {!isUser &&
                      isDetailsExpanded &&
                      msg.followUpQuestions &&
                      msg.followUpQuestions.length > 0 && (
                        <div
                          data-testid="proactive-followup-questions"
                          className={`mt-2 pt-2.5 border-t ${borderClass} space-y-1.5`}
                        >
                          <div className="text-[11px] font-mono text-sky-400 flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" />
                            <span>
                              Multi-Context Follow-Up Questions (Continues current thread context):
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUpQuestions.map((fq, idx) => (
                              <button
                                key={idx}
                                type="button"
                                data-testid={`followup-question-chip-${idx}`}
                                onClick={() => {
                                  if (fq.toLowerCase().includes('deep research')) {
                                    onChangeChatCapability('deep_research');
                                    onExecuteDeepResearch(fq);
                                  } else if (fq.toLowerCase().includes('8k video')) {
                                    onGenerateMediaInChat(
                                      fq,
                                      'Video',
                                      qualityTier,
                                      pacingPreset,
                                      creativeTheme,
                                      lightingEffect,
                                      opticsStyle
                                    );
                                  } else {
                                    onSendMessage(fq);
                                  }
                                }}
                                className={`px-2.5 py-1.5 rounded-lg border ${borderClass} ${surfaceClass} hover:border-sky-500/60 text-[11px] ${headingText} transition-colors text-left flex items-center gap-1.5`}
                              >
                                <span className="text-sky-400 font-mono">↳</span>
                                <span>{fq}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* MULTI-STAGE SYMBOLIC MATH PROOFS (Shown on Show more) */}
                    {isDetailsExpanded && msg.mathStages && msg.mathStages.length > 0 && (
                      <div
                        data-testid="math-symbolic-proof-stages"
                        className={`mt-2 pt-3 border-t ${borderClass} space-y-2`}
                      >
                        <div className="text-xs font-semibold text-sky-400">
                          Multi-Stage Symbolic &amp; Numerical Proof ({msg.mathStages.length} Stages):
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {msg.mathStages.map((stg) => (
                            <div
                              key={stg.stageNumber}
                              className={`p-3 rounded-lg border ${borderClass} ${surfaceClass} text-xs space-y-1`}
                            >
                              <div className={`font-semibold ${headingText}`}>{stg.title}</div>
                              <div className="font-mono text-sky-400 text-[11px]">
                                {stg.equationOrSymbolicRule}
                              </div>
                              <p className={mutedText}>{stg.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EXPLAINABLE AI DRAWER — ONLY SHOWN WHEN CLICKED */}
                    {!isUser && isDetailsExpanded && msg.glassBox && expandedXaiMsgId === msg.id && (
                      <div
                        data-testid="explainable-ai-panel"
                        className={`mt-2 p-3.5 rounded-xl border border-sky-500/40 bg-sky-500/5 text-xs space-y-2.5`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-sky-400" />
                            <span className={`font-semibold ${headingText}`}>
                              Explainable AI (Default: Explain Like I&apos;m 12 Years Old)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setXaiModeByMsg((prev) => ({ ...prev, [msg.id]: 'eli12' }))
                              }
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                                activeXaiTab === 'eli12'
                                  ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                                  : `${borderClass} ${surfaceClass} ${mutedText}`
                              }`}
                            >
                              Explain Like I&apos;m 12 (Default)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setXaiModeByMsg((prev) => ({ ...prev, [msg.id]: 'technical' }))
                              }
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                                activeXaiTab === 'technical'
                                  ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                                  : `${borderClass} ${surfaceClass} ${mutedText}`
                              }`}
                            >
                              Technical Pathway
                            </button>
                          </div>
                        </div>

                        {activeXaiTab === 'eli12' ? (
                          <div
                            data-testid="xai-eli12-content"
                            className={`p-3 rounded-lg border ${borderClass} ${surfaceClass} leading-relaxed ${headingText}`}
                          >
                            <div className="text-[11px] font-mono text-amber-400 mb-1">
                              Explain Like I&apos;m 12 Years Old (Simple &amp; Clear Walkthrough):
                            </div>
                            <p className="text-xs">
                              {renderInlineSpans(
                                msg.glassBox.explainableAi.eli12Explanation ||
                                  `Imagine a super-organized library: Panini looked at your question, opened the exact ${msg.domain} guidebook on your computer without sending anything to third-party AI servers, double-checked all math and facts, and wrote this clear answer for you!`,
                                isDark
                              )}
                            </p>
                          </div>
                        ) : (
                          <ul className={`space-y-1 ${mutedText} font-mono text-[11px]`}>
                            {msg.glassBox.explainableAi.decisionPathway.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* PROGRESSIVE DISCLOSURE ("Show more" / "Show less") + EXPORT ACTIONS */}
                    {!isUser && (
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/40">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            data-testid="message-show-more-btn"
                            onClick={() =>
                              setExpandedDetailsByMsg((prev) => ({
                                ...prev,
                                [msg.id]: !prev[msg.id],
                              }))
                            }
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition-colors flex items-center gap-1.5"
                          >
                            {isDetailsExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" />
                                <span>Show less</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" />
                                <span>Show more</span>
                              </>
                            )}
                          </button>
                          {onOpenFileInPreviewTab && activeThinkingMsgId !== msg.id && (
                            <button
                              type="button"
                              data-testid="message-open-preview-tab-btn"
                              onClick={() => {
                                if (msg.codingResolution) {
                                  const files = buildPreviewableArtifactsFromCodingResolutionV59(
                                    msg.codingResolution,
                                    msg.timestamp
                                  );
                                  onOpenFileInPreviewTab(files, files[0]?.id);
                                } else {
                                  const reportArtifact: PreviewableFileArtifactV59 = {
                                    id: `prev-pdf-${msg.id}`,
                                    fileName: `panini-report-${msg.id.slice(-5)}.pdf`,
                                    fileExtension: 'pdf',
                                    mimeType: 'application/pdf',
                                    sourceCapability: `${msg.domain} Workspace`,
                                    createdAt: msg.timestamp,
                                    subjectTitle: `${msg.domain} Grounded Report — ${msg.authorName}`,
                                    summaryDescription: `Verified report preview before PDF download (${msg.verifiedFacts?.length || 0} grounded citations)`,
                                    rawTextOrHtmlContent: msg.content,
                                  };
                                  onOpenFileInPreviewTab([reportArtifact], reportArtifact.id);
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>
                                {msg.codingResolution?.researchedPptxDeck
                                  ? 'Preview .PPTX & Files in Preview Tab'
                                  : 'Preview Downloadable File in Preview Tab'}
                              </span>
                            </button>
                          )}
                          {activeThinkingMsgId !== msg.id && (
                            <button
                              type="button"
                              data-testid="chat-message-tts-btn"
                              onClick={() => handleSynthesizeMessageTts(msg)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors flex items-center gap-1.5"
                              title="Synthesize accessible audio using the Local Model TTS Voice selected in Hardware & Preset Env Settings"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>
                                {ttsAudioByMsgId[msg.id]
                                  ? `Replay TTS (${ttsAudioByMsgId[msg.id].voiceProfile.displayName.split(' ')[0]})`
                                  : 'Read Aloud (Local Model TTS)'}
                              </span>
                            </button>
                          )}
                          {msg.pendingResearchPlan &&
                            (msg.pendingResearchPlan.status === 'awaiting_approval' ||
                              msg.pendingResearchPlan.status === 'failed') &&
                            onApproveDeepResearchPlan && (
                              <button
                                type="button"
                                data-testid="approve-deep-research-plan-btn"
                                onClick={() =>
                                  onApproveDeepResearchPlan(
                                    msg.id,
                                    msg.pendingResearchPlan!.topic,
                                    msg.pendingResearchPlan!.steps
                                  )
                                }
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                              >
                                {msg.pendingResearchPlan.status === 'failed'
                                  ? 'Retry Search & Run'
                                  : 'Approve Plan & Run'}
                              </button>
                            )}
                        </div>

                        {isDetailsExpanded && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadPdfReport(msg)}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border ${borderClass} ${surfaceClass} ${headingText} hover:border-sky-500/60 transition-colors flex items-center gap-1`}
                            >
                              <Download className="w-3 h-3 text-sky-400" />
                              <span>
                                {msg.bibliographyReferences
                                  ? 'Export Research & Bibliography PDF (.pdf)'
                                  : 'Export PDF (.pdf)'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadTextMarkdown(msg)}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border ${borderClass} ${surfaceClass} ${headingText} hover:border-sky-500/60 transition-colors flex items-center gap-1`}
                            >
                              <FileText className="w-3 h-3 text-emerald-400" />
                              <span>Export Markdown (.md)</span>
                            </button>

                            {msg.synthesizedUseCase && (
                              <span className={`text-[11px] font-mono ${mutedText}`}>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 inline mr-1" />
                                Use Case {msg.synthesizedUseCase.id} Indexed
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Local Model TTS Accessibility Audio Player (v6.3-GA) */}
                    {ttsAudioByMsgId[msg.id] && (
                      <div
                        data-testid="chat-message-tts-audio-player"
                        className={`mt-2 p-2.5 rounded-xl border border-violet-500/35 ${subSurfaceClass} flex flex-wrap items-center justify-between gap-3 text-xs`}
                      >
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-violet-400 shrink-0" />
                          <div>
                            <div className={`font-semibold ${headingText}`}>
                              Local Model Neural TTS · {ttsAudioByMsgId[msg.id].voiceProfile.displayName}
                            </div>
                            <div className={`text-[11px] font-mono ${mutedText}`}>
                              {ttsAudioByMsgId[msg.id].voiceProfile.ggufVocalizerModel} ·{' '}
                              {ttsAudioByMsgId[msg.id].sampleRateHz}Hz PCM ·{' '}
                              {ttsAudioByMsgId[msg.id].durationSeconds}s ({ttsAudioByMsgId[msg.id].speechRate}x)
                            </div>
                          </div>
                        </div>
                        <audio
                          controls
                          autoPlay
                          src={ttsAudioByMsgId[msg.id].audioDataUrl}
                          className="h-8 w-64 max-w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* COMPOSER / GOOGLE-STYLE SEARCH BAR AREA */}
        <div
          className={`${
            isChatExpanded
              ? `p-4 border-t ${borderClass} ${subSurfaceClass} space-y-3`
              : 'w-full max-w-3xl mx-auto px-2 pb-10 space-y-3'
          }`}
        >
          {/* 1. Coding Studio Bar with Aesthetic Language Dropdown */}
          {chatCapability === 'coding' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-semibold flex items-center gap-1.5 ${headingText}`}>
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Language:</span>
                </span>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLangDropdown((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                      isDark
                        ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    <span>{codeLanguageChoice}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {showLangDropdown && (
                    <div
                      className={`absolute bottom-full left-0 mb-1.5 w-52 rounded-xl border p-1.5 space-y-1 z-30 ${dropdownMenuClass}`}
                    >
                      {CODE_LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            setCodeLanguageChoice(lang);
                            setShowLangDropdown(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between ${
                            codeLanguageChoice === lang
                              ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                              : 'hover:bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <span>{lang}</span>
                          {codeLanguageChoice === lang && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className={`text-[11px] font-mono text-emerald-400`}>
                Pre-Generation Bug Checks + Live Output Preview Enabled
              </span>
            </div>
          )}

          {/* 2. Deep Research Plan Bar (Synced with topic or Custom Stages + Live Internet Grounding) */}
          {chatCapability === 'deep_research' && (
            <div className="space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className={`font-semibold ${headingText}`}>
                    Deep Research ({researchSteps.length} proposed evidence-focused stages ·{' '}
                    {hasCustomizedSteps ? 'Custom Stages Active' : 'Auto-Synced with Topic'} ·{' '}
                    {isOnlineLearning ? 'Online source retrieval' : 'No external sources'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasCustomizedSteps && (
                    <button
                      type="button"
                      onClick={handleResetDefaultResearchSteps}
                      className="text-[11px] font-mono text-amber-400 hover:underline"
                    >
                      Reset Default Stages
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="customize-research-stages-btn"
                    onClick={() => setShowResearchPlanEditor(!showResearchPlanEditor)}
                    className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {showResearchPlanEditor
                        ? 'Hide Stage Customizer'
                        : `Customize ${researchSteps.length} Stages`}
                    </span>
                  </button>
                </div>
              </div>

              {showResearchPlanEditor && (
                <div className="space-y-2 pt-1" data-testid="research-stage-editor">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {researchSteps.map((step, idx) => (
                      <div
                        key={step.id}
                        className={`p-2.5 rounded-lg border ${borderClass} ${surfaceClass} space-y-1.5`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-sky-400 font-semibold">
                            Stage {idx + 1} · {step.domainFocus} (Plain-English Threshold Enforced)
                          </span>
                          {researchSteps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(step.id)}
                              className="text-rose-400 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          data-testid={`deep-research-stage-title-${idx}`}
                          aria-label={`Step ${idx + 1} title`}
                          value={step.title}
                          onChange={(e) => handleUpdateStep(step.id, 'title', e.target.value)}
                          className={`w-full px-2 py-1 text-xs font-medium rounded border ${borderClass} ${subSurfaceClass} ${headingText}`}
                        />
                        <input
                          type="text"
                          data-testid={`deep-research-stage-objective-${idx}`}
                          aria-label={`Step ${idx + 1} objective`}
                          value={step.objective}
                          onChange={(e) => handleUpdateStep(step.id, 'objective', e.target.value)}
                          className={`w-full px-2 py-1 text-[11px] rounded border ${borderClass} ${subSurfaceClass} ${mutedText}`}
                        />
                        {step.thresholdSummary && (
                          <div className={`text-[10px] ${mutedText} pt-0.5`}>
                            <span className="font-semibold text-emerald-400">Threshold Focus: </span>
                            {step.thresholdSummary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      aria-label="New research step title"
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                      placeholder="New stage title..."
                      className={`px-2.5 py-1.5 text-xs rounded border ${borderClass} ${surfaceClass} ${headingText}`}
                    />
                    <input
                      type="text"
                      aria-label="New research step objective"
                      value={newStepObjective}
                      onChange={(e) => setNewStepObjective(e.target.value)}
                      placeholder="New stage objective..."
                      className={`flex-1 px-2.5 py-1.5 text-xs rounded border ${borderClass} ${surfaceClass} ${headingText}`}
                    />
                    <button
                      type="button"
                      onClick={handleAddResearchStep}
                      className={`px-3 py-1.5 text-xs font-semibold rounded border ${borderClass} ${headingText} hover:border-sky-500/60 whitespace-nowrap`}
                    >
                      + Add Stage
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3A. Dedicated Nano-Banana Open-Source Image Studio Composer Bar (Strictly Separate from Video) */}
          {chatCapability === 'image_gen' && (
            <div
              data-testid="image-studio-composer-bar"
              className="flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-violet-500/20 border border-violet-500/40 text-violet-300 font-mono text-[11px] font-bold">
                  Nano-Banana Open-Source Image DiT
                </span>
                <span className={`font-semibold ml-1 ${headingText}`}>Aspect:</span>
                {(['16:9', '9:16', '1:1'] as VideoAspectRatio[]).map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    data-testid={`composer-image-aspect-${ar.replace(':', '-')}`}
                    onClick={() => setVideoAspectRatio(ar)}
                    className={`px-2 py-1 text-[11px] font-mono rounded-md border transition-colors ${
                      videoAspectRatio === ar
                        ? 'border-violet-500 bg-violet-500/20 text-violet-300 font-bold'
                        : `${borderClass} ${surfaceClass} ${mutedText}`
                    }`}
                  >
                    {ar === '16:9' ? '16:9 Wide' : ar === '9:16' ? '9:16 Portrait' : '1:1 Square'}
                  </button>
                ))}
                {(['1080p Full HD', '4K Cinema', '8K Master'] as MediaQualityTier[]).map((qt) => (
                  <button
                    key={qt}
                    type="button"
                    onClick={() => setQualityTier(qt)}
                    className={`px-2 py-1 text-[11px] font-mono rounded-md border transition-colors ${
                      qualityTier === qt
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold'
                        : `${borderClass} ${surfaceClass} ${mutedText}`
                    }`}
                  >
                    {qt}
                  </button>
                ))}
              </div>
              <span className={`text-[11px] font-mono ${mutedText}`}>
                FLUX.1-Dev 12B · SDXL-Lightning · PixArt-Sigma 4K · Region Inpainting &amp; Split Compare
              </span>
            </div>
          )}

          {/* 3B. Dedicated Veo-3 Open-Source Cinema Video & Foley Studio Composer Bar (Strictly Separate from Image) */}
          {chatCapability === 'video_gen' && (
            <div
              data-testid="video-studio-composer-bar"
              className="flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold">
                  Veo-3 Open-Source Video DiT + Foley
                </span>
                <span className={`font-semibold ml-1 ${headingText}`}>Aspect:</span>
                {(['16:9', '9:16'] as VideoAspectRatio[]).map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    data-testid={`composer-aspect-${ar.replace(':', '-')}`}
                    onClick={() => setVideoAspectRatio(ar)}
                    className={`px-2 py-1 text-[11px] font-mono rounded-md border transition-colors ${
                      videoAspectRatio === ar
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                        : `${borderClass} ${surfaceClass} ${mutedText}`
                    }`}
                  >
                    {ar === '16:9' ? '16:9 Landscape' : '9:16 Portrait'}
                  </button>
                ))}

                {/* Animate Photo into Video (Panini-Omni-Cinema) */}
                <button
                  type="button"
                  data-testid="animate-photo-video-btn"
                  onClick={handleAnimateSamplePhotoToVideo}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-violet-500/50 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition-colors flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Animate Photo to Video ({videoAspectRatio})</span>
                </button>

                {(['1080p Full HD', '4K Cinema', '8K Master'] as MediaQualityTier[]).map((qt) => (
                  <button
                    key={qt}
                    type="button"
                    onClick={() => setQualityTier(qt)}
                    className={`px-2 py-1 text-[11px] font-mono rounded-md border transition-colors ${
                      qualityTier === qt
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold'
                        : `${borderClass} ${surfaceClass} ${mutedText}`
                    }`}
                  >
                    {qt}
                  </button>
                ))}
              </div>
              <span className={`text-[11px] font-mono ${mutedText}`}>
                Wan 2.1 14B · HunyuanVideo 13B · Synchronized PCM Foley Audio
              </span>
            </div>
          )}

          {/* LIVE VOICE CONVERSATION DRAWER (Panini-Voice-Live) */}
          <LiveVoiceConversationDrawer
            isOpen={isLiveVoiceOpen}
            onClose={() => setIsLiveVoiceOpen(false)}
            onSendVoiceTurnToWorkspace={(voicePrompt: string) => {
              onSendMessage(voicePrompt);
            }}
            enableMultilingual={adminPermissions?.enableMultilingual ?? true}
          />

          {/* MICROPHONE SPEECH-TO-TEXT TRANSCRIPTION FEEDBACK BAR */}
          {micTranscriptNotice && (
            <div
              data-testid="mic-transcript-notice"
              className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 text-rose-200">
                <Mic className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{micTranscriptNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setMicTranscriptNotice(null)}
                className="text-[11px] font-mono text-rose-300 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Queued Attachment Bar */}
          {pendingAttachment && (
            <div className="p-2.5 rounded-lg border border-emerald-500/50 bg-emerald-500/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Paperclip className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className={`font-semibold ${headingText}`}>
                  {pendingAttachment.name} ({pendingAttachment.sizeKb} KB)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSendMessage(
                      pendingAttachment.kind === 'image'
                        ? `Summarize image "${pendingAttachment.name}" and extract visual telemetry.`
                        : `Summarize document "${pendingAttachment.name}" and extract key findings.`,
                      undefined,
                      pendingAttachment
                    );
                    setPendingAttachment(null);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  Summarize Now
                </button>
                <button
                  type="button"
                  onClick={() => setPendingAttachment(null)}
                  className={`px-2 py-1 text-xs rounded border ${borderClass} ${mutedText}`}
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Live Auto-Correct Bar */}
          {liveAutoCorrect.wasCorrected && (
            <div className="px-3 py-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className={headingText}>
                <span className="font-semibold text-sky-400">Auto-Correct:</span>{' '}
                <span>{liveAutoCorrect.correctedQuery}</span>
              </div>
              <button
                type="button"
                onClick={() => setPromptInput(liveAutoCorrect.correctedQuery)}
                className="text-xs font-semibold text-sky-400 hover:underline"
              >
                Apply
              </button>
            </div>
          )}

          {/* SPACIOUS TWO-TIER GOOGLE-STYLE SEARCH BAR & WORKSPACE COMPOSER */}
          <form
            onSubmit={handleUnifiedChatSubmit}
            data-testid="two-tier-search-form"
            className={`w-full rounded-2xl border ${borderClass} ${surfaceClass} ${
              !isChatExpanded ? 'p-3.5 shadow-2xl' : 'p-3 shadow-md'
            } space-y-2.5 transition-all`}
          >
            {/* TIER 1 (TOP ROW): Full-Width Roomy Search Input + Primary Submit Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1 relative flex items-center">
                <Search className="w-4 h-4 text-sky-400 absolute left-3.5 pointer-events-none" />
                <label htmlFor="user-chat-input" className="sr-only">
                  Prompt Input
                </label>
                <input
                  id="user-chat-input"
                  data-testid="chat-prompt-input"
                  type="text"
                  value={promptInput}
                  onChange={(e) => {
                    setPromptInput(e.target.value);
                  }}
                  placeholder={
                    chatCapability === 'coding'
                      ? `Describe code to synthesize (${codeLanguageChoice})...`
                      : chatCapability === 'deep_research'
                      ? 'Enter a research topic to synthesize a Deep Research report...'
                      : chatCapability === 'image_gen' || chatCapability === 'video_gen'
                      ? `Describe ${qualityTier} contextual image or video scene...`
                      : chatCapability === 'audio_gen'
                      ? 'Describe audio, music, foley, or acoustic track to synthesize...'
                      : activeThread?.threadContext?.resolvedEntity
                      ? `Ask a follow-up about ${activeThread.threadContext.resolvedSenseLabel || activeThread.threadContext.resolvedEntity}, or search a new topic...`
                      : 'Search any topic, biography, equation, or entity (e.g., Panini, Mahatma Gandhi, Quantum Coherence)...'
                  }
                  className={`w-full pl-10 pr-20 py-3 min-h-[52px] text-base rounded-xl border ${borderClass} ${subSurfaceClass} ${headingText} focus:outline-none focus:border-sky-500 transition-colors`}
                />
                <div className="absolute right-2.5 flex items-center gap-1">
                  {promptInput.length > 0 && (
                    <button
                      type="button"
                      aria-label="Clear search query"
                      onClick={() => setPromptInput('')}
                      className="text-xs font-mono text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="mic-transcribe-btn"
                    onClick={handleMicTranscribe}
                    title="Record microphone audio, then transcribe using the configured speech provider"
                    className={`p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs font-semibold ${
                      isRecordingMic
                        ? 'border-rose-500 bg-rose-500/20 text-rose-300 animate-pulse'
                        : 'border-slate-700 bg-slate-800/90 text-sky-300 hover:border-sky-500/60'
                    }`}
                    disabled={isTranscribingMic}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[11px]">
                      {isTranscribingMic ? 'Transcribing…' : isRecordingMic ? 'Stop' : 'Record'}
                    </span>
                  </button>
                </div>
              </div>

              {adminPermissions?.enableOffTheHookVoice !== false && (
                <button
                  type="button"
                  data-testid="live-voice-toggle-btn"
                  onClick={() => setIsLiveVoiceOpen((prev) => !prev)}
                  title="Open Panini Off-the-Hook Hands-Free Multilingual Voice Duplex (Panini-Voice-Duplex)"
                  className={`px-3.5 py-3 min-h-[52px] text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isLiveVoiceOpen
                      ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                      : `${borderClass} ${subSurfaceClass} text-rose-300 hover:border-rose-500/60`
                  }`}
                >
                  <Radio className="w-4 h-4 text-rose-400" />
                  <span>Off-the-Hook Voice</span>
                </button>
              )}

              <button
                type="submit"
                data-testid="chat-submit-btn"
                className="px-5 py-3 min-h-[52px] text-sm font-bold rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-sm"
              >
                {!isChatExpanded ? (
                  <Search className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {chatCapability === 'coding'
                    ? 'Synthesize Code'
                    : chatCapability === 'deep_research'
                    ? 'Run Deep Research'
                    : chatCapability === 'image_gen'
                    ? 'Synthesize Image'
                    : chatCapability === 'video_gen'
                    ? 'Synthesize Video'
                    : chatCapability === 'audio_gen'
                    ? 'Synthesize Audio'
                    : !isChatExpanded
                    ? 'Search'
                    : 'Send'}
                </span>
              </button>
            </div>

            {/* TIER 2 (BOTTOM COMPANION CONTROL ROW): Workspace Selector, Sub-Domain Expert, Attach & Sample */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/50">
              <div className="flex flex-wrap items-center gap-2">
                {/* Workspace Mode Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    data-testid="workspace-mode-dropdown-btn"
                    onClick={() => {
                      setShowWorkspaceDropdown((prev) => !prev);
                      setShowExpertDropdown(false);
                    }}
                    title="Select Workspace Mode (Ask & Math, Coding, Deep Research, 8K Cinema Studio)"
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isDark
                        ? 'border-sky-500/50 bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 text-slate-100 hover:border-sky-400 shadow-sm'
                        : 'border-sky-300 bg-sky-50 text-slate-900 hover:border-sky-500'
                    }`}
                  >
                    {activeWorkspaceOption.icon}
                    <span className="whitespace-nowrap">{activeWorkspaceOption.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                  </button>

                  {showWorkspaceDropdown && (
                    <div
                      data-testid="workspace-mode-dropdown-menu"
                      className={`absolute ${
                        isChatExpanded ? 'bottom-full mb-2' : 'top-full mt-2'
                      } left-0 z-40 w-80 rounded-xl border p-2 space-y-1 ${dropdownMenuClass}`}
                    >
                      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-sky-400 border-b border-slate-800/80 mb-1">
                        Select Chat Workspace (Auto-Validates Model)
                      </div>
                      {workspaceOptions.map((opt) => {
                        const isSelected = opt.id === chatCapability;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            data-testid={`workspace-option-${opt.id}`}
                            onClick={() => {
                              onChangeChatCapability(opt.id);
                              setShowWorkspaceDropdown(false);
                              setReferenceIdFeedback(null);
                            }}
                            className={`w-full p-2.5 rounded-lg text-left transition-colors flex items-start gap-2.5 ${
                              isSelected
                                ? isDark
                                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40'
                                  : 'bg-sky-100 text-sky-900 border border-sky-300'
                                : isDark
                                ? 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                                : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                            }`}
                          >
                            <span className="mt-0.5 shrink-0">{opt.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-semibold">{opt.label}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300">
                                  {opt.badge}
                                </span>
                              </div>
                              <div className={`text-[11px] leading-snug mt-0.5 ${mutedText}`}>
                                {opt.subtitle}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Domain & Sub-Domain Expert Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    data-testid="expert-selector-dropdown-btn"
                    onClick={() => {
                      setShowExpertDropdown((prev) => !prev);
                      setShowWorkspaceDropdown(false);
                    }}
                    title="Select Domain / Sub-Domain Expert or Auto-Detect from Prompt"
                    className={`px-3 py-1.5 rounded-xl border ${borderClass} ${subSurfaceClass} ${headingText} hover:border-indigo-500/60 text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap`}
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="max-w-[160px] truncate">
                      {selectedExpertId === 'auto'
                        ? 'Expert: Auto'
                        : SUB_DOMAIN_EXPERTS.find((e) => e.id === selectedExpertId)?.name ||
                          'Expert: Auto'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-indigo-400" />
                  </button>

                  {showExpertDropdown && (
                    <div
                      data-testid="expert-selector-dropdown-menu"
                      className={`absolute ${
                        isChatExpanded ? 'bottom-full mb-2' : 'top-full mt-2'
                      } left-0 z-40 w-80 max-h-72 overflow-y-auto rounded-xl border p-2 space-y-1 ${dropdownMenuClass}`}
                    >
                      <button
                        type="button"
                        data-testid="expert-option-auto"
                        onClick={() => {
                          onSelectExpertId('auto');
                          setShowExpertDropdown(false);
                        }}
                        className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between ${
                          selectedExpertId === 'auto'
                            ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 font-semibold'
                            : 'hover:bg-slate-800/70 text-slate-300'
                        }`}
                      >
                        <div>
                          <div>Auto-Select Sub-Domain Expert (Recommended)</div>
                          <div className={`text-[10px] ${mutedText}`}>
                            Routes by prompt &amp; text synthesis across 36 specialists
                          </div>
                        </div>
                        {selectedExpertId === 'auto' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}
                      </button>

                      {SUB_DOMAIN_EXPERTS.map((exp) => {
                        const isSel = selectedExpertId === exp.id;
                        return (
                          <button
                            key={exp.id}
                            type="button"
                            data-testid={`expert-option-${exp.id}`}
                            onClick={() => {
                              onSelectExpertId(exp.id);
                              setShowExpertDropdown(false);
                            }}
                            className={`w-full p-2 rounded-lg text-left text-xs transition-colors flex items-start justify-between gap-2 ${
                              isSel
                                ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 font-semibold'
                                : 'hover:bg-slate-800/70 text-slate-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate">
                                {exp.name}{' '}
                                <span className="text-[10px] font-mono text-sky-400">
                                  [{exp.domain}]
                                </span>
                              </div>
                              <div className={`text-[10px] truncate ${mutedText}`}>
                                {exp.subDomain} · {exp.streamingMethod}
                              </div>
                            </div>
                            {isSel && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt,.md,.csv,.json"
                  onChange={handleFileUploadChange}
                  className="hidden"
                  id="chat-attachment-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach Image or Document"
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border ${borderClass} ${subSurfaceClass} ${headingText} hover:border-sky-500/60 transition-colors flex items-center gap-1.5 whitespace-nowrap`}
                >
                  <Paperclip className="w-3.5 h-3.5 text-sky-400" />
                  <span>Attach</span>
                </button>
                <button
                  type="button"
                  data-testid="quick-receipt-expense-deck-btn"
                  onClick={() => {
                    const sampleReceiptAttachment: UploadedAttachment = {
                      id: `att-receipt-${Date.now()}`,
                      name: 'jumeirah-dubai-hotel-receipt-800aed.jpg',
                      mimeType: 'image/jpeg',
                      sizeKb: 184,
                      kind: 'image',
                      textContentPreview:
                        'Jumeirah Al Naseem Hotel Dubai · Folio #JUM-800 · Grand Total: 800.00 AED (5% VAT + 10% Service Charge Included)',
                    };
                    onSendMessage(
                      'Upload receipt for Jumeirah Dubai Hotel 800 AED (contact Card 4532-1111-2222-3333 or finance@acme.com): build me an expense deck and post to SAP ERP',
                      'Mathematics',
                      sampleReceiptAttachment
                    );
                  }}
                  title="Run v5.7-alpha End-to-End Receipt -> Expense Deck Pipeline (Guardrails + Bounded Orchestrator + HITL + Sandboxed PPTX/DOCX/XLSX/PDF)"
                  className={`px-2.5 py-1.5 text-[11px] font-mono rounded-xl border border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors whitespace-nowrap`}
                >
                  Receipt → Expense Deck
                </button>
                <button
                  type="button"
                  data-testid="quick-hybrid-rag-mcp-btn"
                  onClick={() => {
                    onSendMessage(
                      'Audit SAP S/4HANA VAT reconciliation, SharePoint Dubai 800 AED hospitality policy, and MCP Server Registry permissions',
                      'Science'
                    );
                  }}
                  title="Run v5.7-beta Phase 2 Hybrid Search (BM25 + Vector + Reranker), OCR Table Extraction, Document ACL Filtering & 6-Server MCP Registry Audit"
                  className="px-2.5 py-1.5 text-[11px] font-mono rounded-xl border border-sky-500/50 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 transition-colors whitespace-nowrap"
                >
                  Hybrid RAG + MCP Audit
                </button>
                <label className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
                  <span>ACL:</span>
                  <select
                    data-testid="composer-acl-role-selector"
                    value={activeAclRole}
                    onChange={(e) => onChangeAclRole?.(e.target.value as DocumentAclRole)}
                    className="px-2 py-1 rounded-lg bg-slate-900 text-sky-300 border border-slate-700 font-mono text-[11px]"
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Developer">Developer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </label>
                {isChatExpanded && (
                  <button
                    type="button"
                    onClick={handleAttachSampleImage}
                    title="Attach Sample 8K Micrograph"
                    className={`px-2.5 py-1.5 text-[11px] font-mono rounded-xl border ${borderClass} ${subSurfaceClass} text-emerald-400 hover:border-emerald-500/60 transition-colors whitespace-nowrap`}
                  >
                    + Sample
                  </button>
                )}
              </div>

              <span className={`text-[11px] font-mono ${mutedText}`}>
                {promptInput.trim().length > 0
                  ? `${dynamicTypingSuggestions.length} dynamic suggestions below`
                  : 'Panini Unified Offline-First Shard Engine Ready'}
              </span>
            </div>
          </form>

          {/* STRICT BOTTOM-ONLY DYNAMIC TYPING SUGGESTIONS (Appears ONLY below the search bar when typing — zero pre-suggestions on click) */}
          {promptInput.trim().length > 0 && dynamicTypingSuggestions.length > 0 && (
            <div
              data-testid="bottom-dynamic-suggestions"
              className={`p-3 rounded-xl border ${borderClass} ${surfaceClass} space-y-2 shadow-lg`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-sky-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Dynamic Prompt Suggestions for &ldquo;{promptInput.trim().slice(0, 38)}&rdquo;:
                  </span>
                </span>
                <span className={mutedText}>Click to populate or refine context</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {dynamicTypingSuggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    data-testid={`dynamic-suggestion-item-${sug.id}`}
                    onClick={() => {
                      setPromptInput(sug.promptText);
                    }}
                    className={`p-2.5 rounded-lg border ${borderClass} ${subSurfaceClass} hover:border-sky-500/60 text-left transition-colors flex items-center justify-between gap-2 text-xs`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono text-[10px] shrink-0">
                          {sug.badge}
                        </span>
                        <span className={`font-semibold truncate ${headingText}`}>
                          {sug.label}
                        </span>
                      </div>
                      <div className={`text-[11px] truncate mt-0.5 ${mutedText}`}>
                        {sug.promptText}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-sky-400 shrink-0">Use →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
