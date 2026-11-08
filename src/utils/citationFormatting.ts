export interface CitationSource {
  title: string;
  url: string;
  snippet: string;
  publicationOrSource?: string;
}

function usableSources(sources: CitationSource[] | undefined): CitationSource[] {
  return (sources || [])
    .filter((source) => {
      try {
        const url = new URL(source.url);
        return (
          url.protocol === 'https:' &&
          !url.username &&
          !url.password &&
          Boolean(source.snippet.trim())
        );
      } catch {
        return false;
      }
    })
    .slice(0, 8);
}

export function formatEvidenceForModel(sources: CitationSource[] | undefined): string | undefined {
  const evidence = usableSources(sources).map((source, index) => ({
    citation: `[S${index + 1}]`,
    title: source.title.slice(0, 300),
    url: source.url,
    publisher: source.publicationOrSource?.slice(0, 200) || '',
    excerpt: source.snippet.slice(0, 1200),
  }));
  return evidence.length ? JSON.stringify(evidence) : undefined;
}

export function appendValidCitationReferences(
  answer: string,
  sources: CitationSource[] | undefined
): string {
  const availableSources = usableSources(sources);
  const cited = new Set<number>();
  const sanitizedAnswer = answer.replace(/\[S(\d+)\]/g, (citation, rawIndex: string) => {
    const index = Number(rawIndex);
    if (Number.isInteger(index) && index >= 1 && index <= availableSources.length) {
      cited.add(index);
      return citation;
    }
    return '[unrecognized citation]';
  });
  if (!cited.size) return sanitizedAnswer;

  const references = [...cited]
    .sort((left, right) => left - right)
    .map((index) => {
      const source = availableSources[index - 1];
      const title = source.title.replace(/[\[\]]/g, '\\$&').slice(0, 300);
      return `- [S${index}] [${title}](${source.url})`;
    });
  return `${sanitizedAnswer}\n\n### Sources\n${references.join('\n')}`;
}
