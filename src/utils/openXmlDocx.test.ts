import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOpenXmlDocxBytes } from './openXmlDocx';

test('DOCX export is an OpenXML ZIP containing model-authored document text', () => {
  const bytes = generateOpenXmlDocxBytes('# Research summary\n\n- Supported claim [S1]');
  assert.equal(Buffer.from(bytes).subarray(0, 4).toString('hex'), '504b0304');
  const archive = Buffer.from(bytes).toString('utf8');
  assert.match(archive, /\[Content_Types\]\.xml/);
  assert.match(archive, /word\/document\.xml/);
  assert.match(archive, /Research summary/);
  assert.match(archive, /Supported claim \[S1\]/);
  assert.throws(() => generateOpenXmlDocxBytes(' '), /must contain/);
});
