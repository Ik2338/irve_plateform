import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('installer search sends certificationLevel expected by the backend', async () => {
  const page = await readFile(
    new URL('../src/app/installers/search/page.tsx', import.meta.url),
    'utf8',
  );
  const api = await readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');

  assert.match(page, /params\.certificationLevel = certification/);
  assert.doesNotMatch(page, /params\.certification = certification/);
  assert.match(api, /certificationLevel\?: string/);
});
