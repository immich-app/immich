import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const allowedPages = [
  'src/routes/(user)/photos/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte',
];

const deniedPages = [
  'src/routes/(user)/favorites/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/folders/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/map/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/trash/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/locked/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/utilities/duplicates/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/utilities/large-files/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/memory/[[photos=photos]]/[[assetId=id]]/+page.svelte',
];

const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('v1.5A selection command page boundaries', () => {
  it('registers selection context only on approved pages in this slice', () => {
    for (const path of allowedPages) {
      expect(read(path), `${path} should register v1.5A selection context`).toContain('registerSelectionContext');
    }
    for (const path of deniedPages) {
      expect(read(path), `${path} is out of scope for v1.5A`).not.toContain('registerSelectionContext');
    }
  });
});
