import { init, register, t, waitLocale } from 'svelte-i18n';
import { get } from 'svelte/store';
import { beforeAll, describe, expect, it } from 'vitest';

describe('cmdk top search label', () => {
  beforeAll(async () => {
    register('en-US', () => import('$i18n/en.json'));
    await init({ fallbackLocale: 'en-US', initialLocale: 'en-US' });
    await waitLocale('en-US');
  });

  it('interpolates the live query text', () => {
    expect(get(t)('cmdk_top_search_label', { values: { query: 'wataaaaaaa' } })).toBe('Search for "wataaaaaaa"');
  });
});
