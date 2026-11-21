import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { test } from '#test/unit/fixtures.ts';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';

const ONE_HOUR = 60 * 60 * 1000;

describe('AuthManager', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('stays authenticated after the app idles', async ({ data }) => {
    await authManager.load();

    vi.advanceTimersByTime(ONE_HOUR);

    expect(authManager.authenticated).toBe(true);
    expect(authManager.user.id).toBe(data.user.id);
  });
});
