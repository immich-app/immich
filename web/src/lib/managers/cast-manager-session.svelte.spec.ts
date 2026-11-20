import { castManager } from '#lib/managers/cast-manager.svelte.ts';
import { factory } from '#test/unit/factories.ts';
import { test } from '#test/unit/fixtures.ts';
import { DateTime } from 'luxon';
import { afterEach, beforeEach, expect, vi } from 'vitest';

const connectedDestination = vi.hoisted(() => ({ loadMedia: vi.fn() }));

vi.mock('#lib/utils/cast/gcast-destination.svelte.ts', () => ({
  GCastDestination: class {
    isConnected = true;
    initialize = () => Promise.resolve(true);
    loadMedia = connectedDestination.loadMedia;
  },
}));

let now = DateTime.now();

const castSessions = (...tokens: string[]) => ({
  createSession: () => ({
    json: { ...factory.session(), token: tokens.shift()!, expiresAt: DateTime.now().plus({ minutes: 15 }).toISO()! },
  }),
});

beforeEach(() => {
  now = now.plus({ days: 1 });
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now.toJSDate());
  connectedDestination.loadMedia.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

test('casts media with a 15 minute cast session', async ({ api }) => {
  api.on(castSessions('cast-token'));

  await castManager.loadMedia('/api/assets/1/thumbnail');

  expect(api.createSession).toHaveBeenCalledWith({
    body: { duration: 900, deviceOS: 'Google Cast', deviceType: 'Cast' },
  });
  expect(connectedDestination.loadMedia).toHaveBeenCalledWith('/api/assets/1/thumbnail', 'cast-token', false);
});

test('reuses the cast session for the next media', async ({ api }) => {
  api.on(castSessions('cast-token'));
  await castManager.loadMedia('/api/assets/1/thumbnail');

  await castManager.loadMedia('/api/assets/2/thumbnail');

  expect(api.createSession).toHaveBeenCalled();
  expect(api.createSession.calls).toHaveLength(1);
  expect(connectedDestination.loadMedia).toHaveBeenLastCalledWith('/api/assets/2/thumbnail', 'cast-token', false);
});

test('replaces a cast session that is about to expire', async ({ api }) => {
  api.on(castSessions('expiring-token', 'fresh-token'));
  await castManager.loadMedia('/api/assets/1/thumbnail');
  vi.setSystemTime(now.plus({ minutes: 14, seconds: 55 }).toJSDate());

  await castManager.loadMedia('/api/assets/2/thumbnail');

  expect(api.createSession).toHaveBeenCalled();
  expect(api.createSession.calls).toHaveLength(2);
  expect(connectedDestination.loadMedia).toHaveBeenLastCalledWith('/api/assets/2/thumbnail', 'fresh-token', false);
});
