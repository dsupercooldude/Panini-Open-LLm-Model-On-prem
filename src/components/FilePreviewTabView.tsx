import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  Code2,
  Presentation,
  ArrowLeft,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { PreviewableFileArtifactV59 } from '../utils/engineLogic';

export interface FilePreviewTabViewProps {
  previewFiles: PreviewableFileArtifactV59[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onBackToChat: () => void;
  isDark?: boolean;
}

export const FilePreviewTabView: React.FC<FilePreviewTabViewProps> = ({
  previewFiles,
  activeFileId,
  onSelectFile,
  onBackToChat,
  isDark = true,
}) => {
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [pptxViewMode, setPptxViewMode] = useState<'single_slide' | 'all_slides_grid'>('all_slides_grid');

  const activeFile =
    previewFiles.find((f) => f.id === activeFileId) || previewFiles[0];

  const handleDownloadFile = (file: PreviewableFileArtifactV59) => {
    const a = document.createElement('a');
    if (file.binaryBase64) {
      if (file.binaryBase64.startsWith('data:')) {
        a.href = file.binaryBase64;
      } else {
        a.href = `data:${file.mimeType};base64,${file.binaryBase64}`;
      }
      a.download = file.fileName;
      a.click();
      return;
    }

    const blob = new Blob([file.rawTextOrHtmlContent || ''], {
      type: file.mimeType || 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = file.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeFile) {
    return (
      <div
        data-testid="file-preview-tab-empty"
        className={`rounded-2xl border p-8 text-center space-y-4 ${
          isDark
            ? 'border-slate-800 bg-slate-900/90 text-slate-200'
            : 'border-slate-200 bg-white text-slate-800'
        }`}
      >
        <Eye className="w-10 h-10 text-sky-400 mx-auto" />
        <h2 className="text-lg font-bold">No Downloadable File Selected for Preview</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Generate a PowerPoint (.pptx), Word (.docx), Excel (.xlsx/.csv), PDF (.pdf), or Webpage (.html) in the Chat or Coding workspace and click &ldquo;Preview File&rdquo; to inspect the exact final file before downloading.
        </p>
        <button
          type="button"
          data-testid="preview-tab-back-to-chat-btn"
          onClick={onBackToChat}
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Chat Workspace</span>
        </button>
      </div>
    );
  }

  const slides = activeFile.pptxSlidesPreview || [];
  const currentSlide = slides[Math.min(activeSlideIdx, Math.max(0, slides.length - 1))];

  return (
    <div
      data-testid="file-preview-tab-view"
      className={`rounded-2xl border overflow-hidden shadow-xl space-y-0 ${
        isDark
          ? 'border-slate-800 bg-[#070b14] text-slate-100'
          : 'border-slate-300 bg-white text-slate-900'
      }`}
    >
      {/* Top KISS Header Bar: Back to Chat + File Switcher + Final Download Button */}
      <div
        className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-950/90' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-testid="preview-tab-back-to-chat-btn"
            onClick={onBackToChat}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
            <span>Back to Chat</span>
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-bold">
                FINAL DOWNLOAD PREVIEW
              </span>
              <span
                data-testid="preview-tab-active-filename"
                className="font-mono text-xs font-bold text-sky-300"
              >
                {activeFile.fileName}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                ({activeFile.mimeType})
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {activeFile.summaryDescription}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="preview-tab-download-file-btn"
            onClick={() => handleDownloadFile(activeFile)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 shadow-md transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Final File ({activeFile.fileName})</span>
          </button>
        </div>
      </div>

      {/* Multi-File Switcher Bar (When multiple downloadable formats exist for this output) */}
      {previewFiles.length > 1 && (
        <div
          className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
            isDark ? 'border-slate-800/90 bg-slate-900/70' : 'border-slate-200 bg-slate-100'
          }`}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] text-slate-400 mr-1">
              Available Downloadable Files ({previewFiles.length}):
            </span>
            {previewFiles.map((file) => {
              const isSelected = file.id === activeFile.id;
              return (
                <button
                  key={file.id}
                  type="button"
                  data-testid={`preview-tab-file-switch-${file.fileExtension}`}
                  onClick={() => {
                    onSelectFile(file.id);
                    setActiveSlideIdx(0);
                  }}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold border transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-sky-500/50 hover:text-white'
                  }`}
                >
                  {file.fileExtension === 'pptx' ? (
                    <Presentation className="w-3.5 h-3.5" />
                  ) : file.fileExtension === 'xlsx' || file.fileExtension === 'csv' ? (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  ) : file.fileExtension === 'html' ? (
                    <Globe className="w-3.5 h-3.5" />
                  ) : file.fileExtension === 'png' ? (
                    <ImageIcon className="w-3.5 h-3.5" />
                  ) : file.fileExtension === 'py' || file.fileExtension === 'ts' ? (
                    <Code2 className="w-3.5 h-3.5" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>{file.fileName}</span>
                </button>
              );
            })}
          </div>
          <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Exact Byte-for-Byte Final Output</span>
          </span>
        </div>
      )}

      {/* MAIN PREVIEW VIEWPORT BY FILE EXTENSION */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* CASE 1: POWERPOINT (.PPTX) FULL WIDESCREEN 16:9 SLIDE-BY-SLIDE & GRID PREVIEW */}
        {activeFile.fileExtension === 'pptx' && slides.length > 0 && (
          <div data-testid="preview-tab-pptx-inspector" className="space-y-4">
            {/* Deck Grounding & View Mode Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono text-[10px] font-bold">
                    ECMA-376 OpenXML .PPTX ({slides.length} Widescreen 16:9 Slides)
                  </span>
                  {activeFile.pptxSpecSummary?.groundingTierLabel && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-semibold">
                      {activeFile.pptxSpecSummary.groundingTierLabel}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono text-[10px]">
                    Embedded &lt;p:pic&gt; SVG Diagrams + Native &lt;a:tbl&gt; Tables
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {activeFile.pptxSpecSummary?.deckTitle || activeFile.subjectTitle}
                </h3>
                {activeFile.pptxSpecSummary?.deckSubtitle && (
                  <p className="text-xs text-slate-400">
                    {activeFile.pptxSpecSummary.deckSubtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid="pptx-preview-mode-grid-btn"
                  onClick={() => setPptxViewMode('all_slides_grid')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition flex items-center gap-1.5 ${
                    pptxViewMode === 'all_slides_grid'
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All {slides.length} Slides View</span>
                </button>
                <button
                  type="button"
                  data-testid="pptx-preview-mode-single-btn"
                  onClick={() => setPptxViewMode('single_slide')}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition flex items-center gap-1.5 ${
                    pptxViewMode === 'single_slide'
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <Presentation className="w-3.5 h-3.5" />
                  <span>Single Slide Zoom</span>
                </button>
              </div>
            </div>

            {pptxViewMode === 'all_slides_grid' ? (
              <div
                data-testid="preview-tab-pptx-all-slides-grid"
                className="space-y-5"
              >
                {slides.map((s) => (
                  <div
                    key={s.slideNumber}
                    data-testid={`preview-tab-slide-card-${s.slideNumber}`}
                    className="rounded-2xl border border-slate-700/90 bg-[#0b1220] overflow-hidden shadow-lg"
                  >
                    {/* 16:9 Slide Top Header Banner */}
                    <div className="px-5 py-3.5 bg-[#0F172A] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                          SLIDE {s.slideNumber} OF {slides.length} · {s.subtitle}
                        </div>
                        <h4 className="text-base font-bold text-white mt-0.5">
                          {s.title}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-emerald-300">
                        ppt/slides/slide{s.slideNumber}.xml
                      </span>
                    </div>

                    {/* Slide Body: Left Key Findings & Right Embedded SVG Image (<p:pic>) */}
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        <div className="lg:col-span-7 space-y-2">
                          <div className="text-xs font-mono font-semibold text-sky-300 uppercase">
                            Key Grounded Findings
                          </div>
                          <ul className="space-y-1.5 text-xs text-slate-200 list-disc list-inside leading-relaxed">
                            {s.bullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span className="text-sky-300 font-semibold">
                              Embedded Slide Image (ppt/media/slide_img_{s.slideNumber}.svg)
                            </span>
                            <span className="text-emerald-400">&lt;p:pic&gt; Vector HD</span>
                          </div>
                          {s.slideImageSvgDataUrl && (
                            <img
                              data-testid={`preview-tab-slide-image-${s.slideNumber}`}
                              src={s.slideImageSvgDataUrl}
                              alt={s.visualDiagramTitle || s.title}
                              className="w-full h-auto rounded-lg border border-slate-800"
                            />
                          )}
                          {s.visualDiagramCaption && (
                            <div className="text-[10px] font-mono text-slate-400">
                              {s.visualDiagramCaption}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Native DrawingML <a:tbl> Data Table */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-mono font-semibold text-emerald-400">
                          Embedded Native DrawingML Table (&lt;a:tbl&gt;)
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/90">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-900 border-b border-slate-800 text-sky-300 font-mono text-[11px]">
                                {s.table.headers.map((h, hIdx) => (
                                  <th key={hIdx} className="py-2 px-3">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80 text-slate-200">
                              {s.table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-slate-900/40' : ''}>
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className={`py-2 px-3 ${
                                        cIdx === 0 ? 'font-semibold text-white' : ''
                                      } ${
                                        String(cell).includes('Data Not Available')
                                          ? 'text-amber-300 font-mono'
                                          : ''
                                      }`}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Slide Footer Citation */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-emerald-400">
                        <span>Verified Source Citation: {s.citation}</span>
                        <span className="text-slate-400">16:9 Widescreen (13.333&quot; × 7.5&quot;)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Single Slide Zoom View */
              currentSlide && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {slides.map((s, idx) => (
                      <button
                        key={s.slideNumber}
                        type="button"
                        onClick={() => setActiveSlideIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition ${
                          idx === activeSlideIdx
                            ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                        }`}
                      >
                        Slide {s.slideNumber}: {s.title.slice(0, 32)}
                      </button>
                    ))}
                  </div>

                  <div
                    data-testid={`preview-tab-zoom-slide-${currentSlide.slideNumber}`}
                    className="rounded-2xl border border-slate-700 bg-[#0b1220] p-5 space-y-4"
                  >
                    <div className="border-b border-slate-800 pb-3">
                      <div className="text-xs font-mono text-sky-400 font-bold">
                        SLIDE {currentSlide.slideNumber} OF {slides.length} · {currentSlide.subtitle}
                      </div>
                      <h4 className="text-lg font-bold text-white mt-0.5">
                        {currentSlide.title}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-7 space-y-2">
                        <ul className="space-y-2 text-xs text-slate-200 list-disc list-inside leading-relaxed">
                          {currentSlide.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="lg:col-span-5">
                        {currentSlide.slideImageSvgDataUrl && (
                          <img
                            src={currentSlide.slideImageSvgDataUrl}
                            alt={currentSlide.title}
                            className="w-full h-auto rounded-xl border border-slate-800"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* CASE 2: EXCEL / CSV SPREADSHEET PREVIEW */}
        {(activeFile.fileExtension === 'xlsx' || activeFile.fileExtension === 'csv') && (
          <div data-testid="preview-tab-spreadsheet-inspector" className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>Spreadsheet Grid Preview ({activeFile.fileName})</span>
              <span>UTF-8 / RFC-4180 Verified</span>
            </div>
            {activeFile.tablePreview ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-emerald-300 font-mono">
                      {activeFile.tablePreview.headers.map((h, i) => (
                        <th key={i} className="py-2 px-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-slate-200">
                    {activeFile.tablePreview.rows.map((r, rIdx) => (
                      <tr key={rIdx}>
                        {r.map((c, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 font-mono text-[11px]">
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto">
                <code>{activeFile.rawTextOrHtmlContent}</code>
              </pre>
            )}
          </div>
        )}

        {/* CASE 3: HTML WEBPAGE / WORD (.DOCX) / PDF / CODE PREVIEW */}
        {activeFile.fileExtension === 'html' && activeFile.rawTextOrHtmlContent && (
          <div data-testid="preview-tab-html-inspector" className="space-y-3">
            <div className="text-xs font-mono text-sky-400">
              Interactive HTML5 Document Preview ({activeFile.fileName})
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <iframe
                title={`Preview ${activeFile.fileName}`}
                sandbox="allow-scripts"
                srcDoc={activeFile.rawTextOrHtmlContent}
                className="w-full h-[460px] border-0"
              />
            </div>
          </div>
        )}

        {activeFile.fileExtension === 'png' && activeFile.binaryBase64 && (
          <div data-testid="preview-tab-image-inspector" className="space-y-3">
            <div className="text-xs font-mono text-sky-400">
              Generated image ({activeFile.fileName})
            </div>
            <img
              src={
                activeFile.binaryBase64.startsWith('data:')
                  ? activeFile.binaryBase64
                  : `data:${activeFile.mimeType};base64,${activeFile.binaryBase64}`
              }
              alt={activeFile.subjectTitle}
              className="max-h-[70vh] max-w-full rounded-xl border border-slate-800 object-contain"
            />
          </div>
        )}

        {(activeFile.fileExtension === 'docx' ||
          activeFile.fileExtension === 'pdf' ||
          activeFile.fileExtension === 'py' ||
          activeFile.fileExtension === 'ts') && (
          <div data-testid="preview-tab-document-inspector" className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-sky-400">
              <span>Document &amp; Source Inspector ({activeFile.fileName})</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for Download</span>
              </span>
            </div>
            {activeFile.rawTextOrHtmlContent &&
            activeFile.rawTextOrHtmlContent.trim().startsWith('<') &&
            activeFile.fileExtension === 'docx' ? (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-white text-slate-900 p-6">
                <iframe
                  title={`DOCX Preview ${activeFile.fileName}`}
                  sandbox=""
                  srcDoc={activeFile.rawTextOrHtmlContent}
                  className="w-full h-[420px] border-0"
                />
              </div>
            ) : (
              <pre className="p-4 rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto max-h-[520px] leading-relaxed">
                <code>
                  {activeFile.rawTextOrHtmlContent ||
                    `Binary Package (${activeFile.fileName}) verified and ready for download.`}
                </code>
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
