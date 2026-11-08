import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendValidCitationReferences,
  formatEvidenceForModel,
  type CitationSource,
} from './citationFormatting';

const sources: CitationSource[] = [
  {
    title: 'Source [one]',
    url: 'https://alpha.example/report',
    snippet: 'A source excerpt with relevant information.',
    publicationOrSource: 'Alpha',
  },
  {
    title: 'Untrusted HTTP source',
    url: 'http://invalid.example/report',
    snippet: 'This source must not enter the model prompt.',
  },
  {
    title: 'Credential URL source',
    url: 'https://user:password@beta.example/report',
    snippet: 'This source must also be rejected.',
  },
  {
    title: 'Second source',
    url: 'https://beta.example/report',
    snippet: 'Another source excerpt with useful details.',
  },
];

test('model evidence uses stable source IDs and omits invalid or empty sources', () => {
  const evidence = JSON.parse(formatEvidenceForModel(sources) || 'null') as Array<{
    citation: string;
    title: string;
  }>;
  assert.deepEqual(evidence.map((source) => source.citation), ['[S1]', '[S2]']);
  assert.equal(evidence[0].title, 'Source [one]');
  assert.doesNotMatch(JSON.stringify(evidence), /This source must not enter/);
  assert.doesNotMatch(JSON.stringify(evidence), /This source must also be rejected/);
});

test('citation references only resolve to supplied HTTPS excerpts', () => {
  const answer = appendValidCitationReferences(
    'The answer cites [S2] and invents [S9].',
    sources
  );
  assert.match(answer, /The answer cites \[S2\] and invents \[unrecognized citation\]\./);
  assert.match(answer, /\[S2\] \[Second source\]\(https:\/\/beta\.example\/report\)/);
  assert.doesNotMatch(answer, /alpha\.example/);
});

test('answers without source IDs do not receive an unused bibliography', () => {
  assert.equal(
    appendValidCitationReferences('No citations were provided.', sources),
    'No citations were provided.'
  );
});
