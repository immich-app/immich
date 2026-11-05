import { lang } from '#lib/stores/preferences.store.ts';
import { test } from '#test/unit/fixtures.ts';
import { get } from 'svelte/store';
import { describe, expect } from 'vitest';
import { load } from './+layout.ts';

describe('root layout', () => {
  test('sets the text direction when the language changes', async () => {
    const previous = get(lang);
    await load({ fetch, url: new URL('http://localhost/photos') } as never);

    lang.set('ar');

    try {
      await expect.poll(() => document.body.getAttribute('dir')).toBe('rtl');
    } finally {
      lang.set(previous);
    }
  });
});
