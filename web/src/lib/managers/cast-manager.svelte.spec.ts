import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { castManager } from '#lib/managers/cast-manager.svelte.ts';
import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { describe, expect } from 'vitest';

describe('castManager', () => {
  test('does not offer or load google cast when cast is disabled', async () => {
    authManager.setUser(factory.user());
    authManager.setPreferences(factory.preferences({ cast: { gCastEnabled: false } }));

    eventManager.emit('AppInit');

    await expect.poll(() => castManager.initialized).toBe(true);
    expect(castManager.availableDestinations).toEqual([]);
    expect(document.querySelector('script[src*="cast_sender.js"]')).toBeNull();
  });
});
