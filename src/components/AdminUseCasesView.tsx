import React, { useState } from 'react';
import {
  ALL_DOMAINS,
  DomainCategory,
  UseCaseScenario,
  TOTAL_PRETRAINED_SCENARIOS,
  queryScenarioCatalog,
  translateNlpToUseCase,
} from '../utils/engineLogic';
import { Sparkles, Search, Eye, EyeOff, Plus, CheckCircle2 } from 'lucide-react';

interface AdminUseCasesViewProps {
  customScenarios: UseCaseScenario[];
  onAddCustomScenario: (scenario: UseCaseScenario, processedByBackend: boolean) => void;
  isDark: boolean;
}

export const AdminUseCasesView: React.FC<AdminUseCasesViewProps> = ({
  customScenarios,
  onAddCustomScenario,
  isDark,
}) => {
  const [nlpInput, setNlpInput] = useState(
    'Create a cybersecurity use case for auditing zero-knowledge proof circuits and ML-KEM-1024 handshakes on ARM64 mobile NPUs'
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastTranslated, setLastTranslated] = useState<{
    scenario: UseCaseScenario;
    backendEngine: string;
  } | null>(null);

  // On-demand Use-Case Catalog Summary button state ("Model summaries and usecase summaries should be provided only when summary button is clicked")
  const [showTaxonomySummary, setShowTaxonomySummary] = useState(false);
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);

  // Catalog filter & pagination state
  const [filterDomain, setFilterDomain] = useState<DomainCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const catalogResult = queryScenarioCatalog(
    filterDomain,
    searchQuery,
    page,
    10,
    customScenarios
  );

  const handleTranslateAndAddNlp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim() || isTranslating) return;

    setIsTranslating(true);
    const nextOffset = customScenarios.length + 1;

    try {
      const resp = await fetch('/api/nlp/translate-usecase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nlpDescription: nlpInput.trim(),
          customCountOffset: nextOffset,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.ok && data.useCase) {
          setLastTranslated({
            scenario: data.useCase,
            backendEngine: data.processedBy || 'Backend Express NLP Translator',
          });
          onAddCustomScenario(data.useCase, true);
          setNlpInput('');
          setPage(1);
          setIsTranslating(false);
          return;
        }
      }
    } catch {
      // Fallback to local deterministic engine if offline
    }

    const fallbackScenario = translateNlpToUseCase(nlpInput.trim(), nextOffset);
    setLastTranslated({
      scenario: fallbackScenario,
      backendEngine: 'Local Air-Gapped NLP Translator Fallback',
    });
    onAddCustomScenario(fallbackScenario, false);
    setNlpInput('');
    setPage(1);
    setIsTranslating(false);
  };

  const borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
  const surfaceClass = isDark ? 'bg-slate-900/70' : 'bg-white';
  const subSurfaceClass = isDark ? 'bg-slate-950/60' : 'bg-slate-50';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const headingText = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="space-y-6">
      {/* Header + On-Demand Use-Case Taxonomy Summary Button */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b ${borderClass}`}
      >
        <div>
          <h2 className={`text-lg font-semibold ${headingText}`}>
            Admin Use-Cases Repository ({catalogResult.totalCatalogCount.toLocaleString()} Total) &
            Backend NLP Use-Case Builder
          </h2>
          <p className={`text-xs ${mutedText} mt-0.5`}>
            Manage the 10,000 pretrained domain scenarios and dynamically add new use cases using natural-language translation in the backend.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTaxonomySummary(!showTaxonomySummary)}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 self-start whitespace-nowrap shrink-0 ${
            showTaxonomySummary
              ? 'bg-sky-500 text-slate-950 border-sky-500'
              : `${borderClass} ${surfaceClass} ${headingText} hover:border-sky-500/60`
          }`}
        >
          {showTaxonomySummary ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide Use-Case Summary</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>View Use-Case Summary</span>
            </>
          )}
        </button>
      </div>

      {/* ON-DEMAND USE-CASE SUMMARY PANEL (Shown only when Summary button is clicked) */}
      {showTaxonomySummary && (
        <div className={`border-2 border-sky-500/50 ${surfaceClass} rounded-xl p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={`text-sm font-semibold ${headingText}`}>
              10,000+ Pretrained & Dynamic Use-Case Taxonomy Summary
            </h3>
            <span className="text-xs font-mono text-sky-400">
              {TOTAL_PRETRAINED_SCENARIOS.toLocaleString()} Pretrained + {customScenarios.length}{' '}
              NLP/Search-Added Scenarios
            </span>
          </div>
          <p className={`text-xs ${mutedText}`}>
            These scenarios power the User Workspace&apos;s unified autocomplete suggestions, automatic domain routing, and multi-stage verification:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {ALL_DOMAINS.map((dom, idx) => {
              const count = idx === 3 || idx === 4 || idx === 5 ? 1428 : 1429;
              const customInDom = customScenarios.filter((c) => c.domain === dom).length;
              return (
                <div
                  key={dom}
                  className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass} space-y-1`}
                >
                  <div className={`font-semibold ${headingText}`}>{dom}</div>
                  <div className="font-mono text-sky-400">
                    {count.toLocaleString()} Base {customInDom > 0 ? `+ ${customInDom} Custom` : ''}
                  </div>
                  <div className={`text-[11px] ${mutedText}`}>
                    Auto-routes queries to {dom} specialist MoE experts & XAI verifiers.
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADMIN NLP-TO-USE-CASE GENERATOR (Translates NLP in Backend Express Route /api/nlp/translate-usecase) */}
      <div className={`border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className={`text-sm font-semibold ${headingText} flex items-center gap-2`}>
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Add New Use Case via Natural Language (Backend NLP-to-Use-Case Translation)</span>
            </h3>
            <p className={`text-xs ${mutedText} mt-0.5`}>
              Describe any new domain scenario in plain English. The backend NLP engine automatically extracts the target domain, title, quantization tier, expert routing, and starter prompt.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 shrink-0">
            Endpoint: POST /api/nlp/translate-usecase
          </span>
        </div>

        <form onSubmit={handleTranslateAndAddNlp} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <label htmlFor="admin-nlp-usecase-input" className="sr-only">
              Natural Language Use-Case Description
            </label>
            <input
              id="admin-nlp-usecase-input"
              type="text"
              value={nlpInput}
              onChange={(e) => setNlpInput(e.target.value)}
              placeholder="e.g., Create a geology use case for modeling deep mantle plume kimberlite diamond ascent..."
              className={`flex-1 px-3.5 py-2.5 text-xs rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
            />
            <button
              type="submit"
              disabled={isTranslating}
              className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {isTranslating
                  ? 'Translating NLP in Backend...'
                  : 'Translate NLP & Add Use Case'}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className={mutedText}>Quick NLP Templates:</span>
            <button
              type="button"
              onClick={() =>
                setNlpInput(
                  'Create a mathematics use case for proving stochastic Ito-Stratonovich PDE convergence bounds'
                )
              }
              className={`px-2 py-1 rounded border ${borderClass} ${subSurfaceClass} ${headingText} hover:border-sky-500/50`}
            >
              Stochastic PDE Proof (Math)
            </button>
            <button
              type="button"
              onClick={() =>
                setNlpInput(
                  'Design a computer programming use case for zero-copy WebGPU WGSL matrix multiplication kernels'
                )
              }
              className={`px-2 py-1 rounded border ${borderClass} ${subSurfaceClass} ${headingText} hover:border-sky-500/50`}
            >
              WebGPU Kernel (Programming)
            </button>
            <button
              type="button"
              onClick={() =>
                setNlpInput(
                  'Analyze historical Venetian Arsenal standardized galley production and timber logistics'
                )
              }
              className={`px-2 py-1 rounded border ${borderClass} ${subSurfaceClass} ${headingText} hover:border-sky-500/50`}
            >
              Venetian Logistics (History)
            </button>
          </div>
        </form>

        {lastTranslated && (
          <div
            className={`p-3.5 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-xs space-y-1`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-emerald-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Translated & Indexed: {lastTranslated.scenario.id} —{' '}
                  {lastTranslated.scenario.title}
                </span>
              </span>
              <span className="font-mono text-[11px]">{lastTranslated.backendEngine}</span>
            </div>
            <div className={`font-mono text-[11px] ${headingText}`}>
              Domain: {lastTranslated.scenario.domain} · Quant:{' '}
              {lastTranslated.scenario.recommendedQuant} · Routed Experts:{' '}
              {lastTranslated.scenario.activeExperts.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* ADMIN USE-CASE CATALOG TABLE WITH ON-DEMAND SUMMARY BUTTON PER ROW */}
      <div className={`border ${borderClass} ${surfaceClass} rounded-xl p-5 space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setFilterDomain('All');
                setPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                filterDomain === 'All'
                  ? 'bg-sky-500 text-slate-950 border-sky-500 font-semibold'
                  : `${borderClass} ${subSurfaceClass} ${headingText}`
              }`}
            >
              All ({catalogResult.totalCatalogCount.toLocaleString()})
            </button>
            {ALL_DOMAINS.map((dom) => (
              <button
                key={dom}
                type="button"
                onClick={() => {
                  setFilterDomain(dom);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                  filterDomain === dom
                    ? 'bg-sky-500 text-slate-950 border-sky-500 font-semibold'
                    : `${borderClass} ${subSurfaceClass} ${headingText}`
                }`}
              >
                {dom}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${mutedText}`} />
            <input
              type="text"
              aria-label="Search Admin Use Cases"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search 10,000+ use cases..."
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border ${borderClass} ${subSurfaceClass} ${headingText}`}
            />
          </div>
        </div>

        <div className={`divide-y ${isDark ? 'divide-slate-800/70' : 'divide-slate-200'}`}>
          {catalogResult.items.map((scn) => {
            const isSummaryOpen = expandedScenarioId === scn.id;
            return (
              <div key={scn.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
                      <span className="text-sky-400 font-semibold">{scn.id}</span>
                      <span className={mutedText}>· {scn.domain}</span>
                      {scn.isCustom && (
                        <span className="text-emerald-400 font-semibold">
                          [NLP / SEARCH ADDED]
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-semibold ${headingText}`}>{scn.title}</div>
                  </div>

                  {/* On-Demand Use-Case Summary Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedScenarioId(isSummaryOpen ? null : scn.id)
                    }
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors self-start sm:self-center whitespace-nowrap shrink-0 ${
                      isSummaryOpen
                        ? 'bg-sky-500 text-slate-950 border-sky-500 font-semibold'
                        : `${borderClass} ${subSurfaceClass} ${headingText} hover:border-sky-500/60`
                    }`}
                  >
                    {isSummaryOpen ? 'Hide Summary' : 'View Use-Case Summary'}
                  </button>
                </div>

                {isSummaryOpen && (
                  <div
                    className={`p-3 rounded-lg border ${borderClass} ${subSurfaceClass} text-xs space-y-1.5`}
                  >
                    <div>
                      <span className={`font-semibold ${headingText}`}>Use-Case Summary & Capability: </span>
                      <span className={mutedText}>{scn.expectedCapability}</span>
                    </div>
                    <div>
                      <span className={`font-semibold ${headingText}`}>Starter Prompt Template: </span>
                      <span className="font-mono text-sky-300 text-[11px]">
                        {scn.starterPrompt}
                      </span>
                    </div>
                    <div className={`font-mono text-[11px] ${mutedText}`}>
                      Recommended Quantization: {scn.recommendedQuant} · Routed MoE Experts:{' '}
                      {scn.activeExperts.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div
          className={`pt-3 border-t ${borderClass} flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums ${mutedText}`}
        >
          <span>
            Showing page {page} of {Math.max(1, Math.ceil(catalogResult.totalMatched / 10))} (
            {catalogResult.totalMatched.toLocaleString()} matching scenarios)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1 rounded border ${borderClass} ${headingText} disabled:opacity-40`}
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page * 10 >= catalogResult.totalMatched}
              onClick={() => setPage((p) => p + 1)}
              className={`px-3 py-1 rounded border ${borderClass} ${headingText} disabled:opacity-40`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
