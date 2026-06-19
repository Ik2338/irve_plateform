import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const quoteFiles = [
  'src/app/dashboard/installer/page.tsx',
  'src/app/dashboard/installer/quotes/new/page.tsx',
  'src/app/dashboard/installer/quotes/[id]/page.tsx',
  'src/app/dashboard/page.tsx',
];

test('quote UI files do not expose VAT labels or calculations', async () => {
  for (const file of quoteFiles) {
    const content = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');

    assert.equal(/TVA|TTC|VAT_RATE|vatRate|totalTTC|\btva\b/i.test(content), false, file);
  }
});
