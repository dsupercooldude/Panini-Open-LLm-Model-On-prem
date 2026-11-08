import test from 'node:test';
import assert from 'node:assert/strict';
import {
  summarizeClaimEvidence,
  verifyClaimsAgainstSources,
  type ResearchEvidenceSource,
} from './researchVerification';

const claim = 'SQLite stores persistent production sessions using a durable local database.';

test('claim evidence requires matching text from distinct HTTPS hosts', () => {
  const sources: ResearchEvidenceSource[] = [
    {
      title: 'Source one',
      url: 'https://www.alpha.example/article',
      snippet: 'SQLite stores persistent production sessions using a durable local database.',
    },
    {
      title: 'Duplicate host',
      url: 'https://alpha.example/another-page',
      snippet: 'SQLite stores persistent production sessions using a durable local database.',
    },
    {
      title: 'Independent source',
      url: 'https://beta.example/report',
      snippet: 'A durable local SQLite database can store persistent production sessions.',
    },
  ];

  const [check] = verifyClaimsAgainstSources(claim, sources);
  assert.equal(check.status, 'cross_source_supported');
  assert.deepEqual(check.supportingSources.map((source) => source.host), [
    'alpha.example',
    'beta.example',
  ]);
  assert.match(summarizeClaimEvidence([check]), /lexical, not proof/);
});

test('claim evidence rejects HTTP sources, weak matches, and mismatched numbers', () => {
  const [check] = verifyClaimsAgainstSources(
    'The platform supports 128 languages through robust machine translation services.',
    [
      {
        title: 'HTTP source',
        url: 'http://alpha.example',
        snippet: 'The platform supports 128 languages through robust machine translation services.',
      },
      {
        title: 'Different value',
        url: 'https://beta.example',
        snippet: 'The platform supports 64 languages through robust machine translation services.',
      },
      {
        title: 'Unrelated',
        url: 'https://gamma.example',
        snippet: 'This source describes an unrelated product and services.',
      },
    ]
  );
  assert.equal(check.status, 'unverified');
  assert.deepEqual(check.supportingSources, []);
});

test('claim extraction ignores code blocks and short fragments', () => {
  const checks = verifyClaimsAgainstSources(
    'Use a button.\n\n```ts\nconst answer = "SQLite stores durable production sessions with local database persistence";\n```',
    []
  );
  assert.equal(checks.length, 0);
});