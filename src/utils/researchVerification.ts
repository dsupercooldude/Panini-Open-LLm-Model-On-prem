export interface ResearchEvidenceSource {
  title: string;
  url: string;
  snippet: string;
}

export interface ClaimEvidenceMatch {
  title: string;
  url: string;
  host: string;
  matchedTerms: string[];
}

export interface ClaimEvidenceCheck {
  claim: string;
  status: 'cross_source_supported' | 'single_source_supported' | 'unverified';
  supportingSources: ClaimEvidenceMatch[];
}

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'although', 'among', 'because', 'been', 'before',
  'being', 'between', 'both', 'could', 'does', 'during', 'each', 'from', 'have', 'having',
  'into', 'more', 'most', 'other', 'over', 'same', 'should', 'some', 'such', 'than', 'that',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'under',
  'until', 'very', 'were', 'what', 'when', 'where', 'which', 'while', 'with', 'would',
  'your', 'you', 'will', 'shall', 'must', 'does', 'used', 'using',
]);

function termsIn(text: string): Set<string> {
  return new Set(
    (text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
      .filter((term) => (term.length > 2 || /^\d{2,}$/.test(term)) && !STOP_WORDS.has(term))
  );
}

function extractClaims(answer: string): string[] {
  const prose = answer
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g, ' ');
  const unique = new Set<string>();
  for (const part of prose.split(/[.!?]\s+|\r?\n+/)) {
    const claim = part.replace(/^\s*(?:[-*#>]+\s*|\d+[.)]\s*)/, '').trim();
    if (termsIn(claim).size < 4 || claim.length > 1000) continue;
    unique.add(claim);
    if (unique.size >= 20) break;
  }
  return [...unique];
}

function normalizedHost(urlText: string): string | undefined {
  try {
    const url = new URL(urlText);
    return url.protocol === 'https:' ? url.hostname.toLowerCase().replace(/^www\./, '') : undefined;
  } catch {
    return undefined;
  }
}

function findSupportingSources(claim: string, sources: ResearchEvidenceSource[]): ClaimEvidenceMatch[] {
  const claimTerms = termsIn(claim);
  const claimNumbers = [...claimTerms].filter((term) => /^\d+$/.test(term));
  const uniqueHosts = new Set<string>();
  const matches: ClaimEvidenceMatch[] = [];

  for (const source of sources) {
    const host = normalizedHost(source.url);
    if (!host || !source.snippet.trim() || uniqueHosts.has(host)) continue;

    const sourceTerms = termsIn(source.snippet);
    const matchedTerms = [...claimTerms].filter((term) => sourceTerms.has(term));
    if (claimNumbers.some((number) => !sourceTerms.has(number))) continue;
    if (matchedTerms.length < Math.min(4, claimTerms.size)) continue;
    if (matchedTerms.length / claimTerms.size < 0.55) continue;

    uniqueHosts.add(host);
    matches.push({
      title: source.title.slice(0, 300),
      url: source.url,
      host,
      matchedTerms,
    });
  }
  return matches;
}

export function verifyClaimsAgainstSources(
  answer: string,
  sources: ResearchEvidenceSource[]
): ClaimEvidenceCheck[] {
  return extractClaims(answer).map((claim) => {
    const supportingSources = findSupportingSources(claim, sources);
    return {
      claim,
      status:
        supportingSources.length > 1
          ? 'cross_source_supported'
          : supportingSources.length === 1
            ? 'single_source_supported'
            : 'unverified',
      supportingSources,
    };
  });
}

export function summarizeClaimEvidence(checks: ClaimEvidenceCheck[]): string {
  const crossSourceCount = checks.filter((check) => check.status === 'cross_source_supported').length;
  const singleSourceCount = checks.filter((check) => check.status === 'single_source_supported').length;
  const unverifiedCount = checks.filter((check) => check.status === 'unverified').length;
  return `Evidence match (lexical, not proof): ${crossSourceCount} claims match snippets from multiple hosts, ${singleSourceCount} match one host, and ${unverifiedCount} have no close match.`;
}