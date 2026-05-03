import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Shared hoisted mocks — used by navigation tests to flip admin/feature-flag state.
// Must appear BEFORE the GlobalSearchManager import because the manager binds these
// modules at module load; vi.doMock inside tests is too late.
const { mockUser } = vi.hoisted(() => ({
  // id is used by the cmdk-recent store to scope localStorage per user — every
  // test in this suite runs under the same synthetic user unless it explicitly
  // flips `mockUser.current` to something else.
  mockUser: { current: { id: 'test-user', isAdmin: true } as { id: string; isAdmin: boolean } | null },
}));
vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: {
    get authenticated() {
      return mockUser.current !== null;
    },
    get user() {
      return mockUser.current;
    },
  },
}));

const { mockFlags } = vi.hoisted(() => ({
  mockFlags: {
    valueOrUndefined: { search: true, map: true, trash: true } as Record<string, boolean> | undefined,
  },
}));
vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: mockFlags,
}));

import { goto } from '$app/navigation';
import * as recentModule from '$lib/stores/cmdk-recent';
import { addEntry, getEntries, __resetForTests as resetRecentStore } from '$lib/stores/cmdk-recent';
import {
  AssetVisibility,
  getAlbumInfo,
  getAlbumNames,
  getAllPeople,
  getAllSpaces,
  getAllTags,
  getMlHealth,
  getSpace,
  searchAssets,
  searchPerson,
  searchPlaces,
  searchSmart,
  type PersonResponseDto,
  type SharedSpaceResponseDto,
} from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { computeCommandScore } from 'bits-ui';
import { installFakeAbortTimeout, restoreAbortTimeout } from './__tests__/fake-abort-timeout';
import { commandContextManager } from './command-context-manager.svelte';
import { COMMAND_ITEMS, type CommandItem } from './command-items';
import {
  GlobalSearchManager,
  RECONCILE_ORDER_BY_SCOPE,
  type EntityItem,
  type Provider,
  type ProviderStatus,
  type SearchMode,
  type Sections,
} from './global-search-manager.svelte';
import { NAVIGATION_ITEMS } from './navigation-items';
import type { TimelineAsset } from './timeline-manager/types';

// File-level reset so mock state cannot leak between describe blocks. Tests that
// mutate these should still set what they want in their own beforeEach, but this
// guarantees that forgetting to reset cannot poison later tests.
afterEach(() => {
  mockUser.current = { id: 'test-user', isAdmin: true };
  mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
  mockI18nLocale.current = 'en';
  mockPage.route.id = null;
  mockPage.params = {};
  mockPage.url = new URL('https://gallery.test/photos');
  commandContextManager.setAlbum(null);
  commandContextManager.setSpace(null);
  commandContextManager.setSelection(null);
});

vi.mock('@immich/sdk', async () => ({
  ...(await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk')),
  searchSmart: vi.fn(),
  searchAssets: vi.fn(),
  searchPerson: vi.fn(),
  searchPlaces: vi.fn(),
  getAllTags: vi.fn(),
  getMlHealth: vi.fn(),
  getAlbumNames: vi.fn(),
  getAllSpaces: vi.fn(),
  getAlbumInfo: vi.fn(),
  getSpace: vi.fn(),
  // Default bare-@ tests in prior suites rely on an empty-people baseline so the
  // people section lands at `empty` (not `ok`) when a test doesn't set its own mock.
  // The Task 6 suite overrides this with vi.mocked(getAllPeople).mockResolvedValue(...).
  getAllPeople: vi.fn().mockResolvedValue({ people: [], total: 0, hidden: 0, hasNextPage: false }),
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

const { mockPage } = vi.hoisted(() => ({
  mockPage: {
    route: { id: null as string | null },
    params: {} as Record<string, string>,
    url: new URL('https://gallery.test/photos'),
  },
}));
vi.mock('$app/state', () => ({ page: mockPage }));

// Stub `@immich/ui` so `toastManager.warning` is spyable. The components that
// use the real toast UI are not exercised in this manager-only suite; keep the
// stub minimal (just the members the manager actually touches).
vi.mock('@immich/ui', () => ({
  toastManager: { warning: vi.fn(), danger: vi.fn(), primary: vi.fn(), success: vi.fn() },
  themeManager: { toggle: vi.fn(), setPreference: vi.fn(), value: 'light' },
}));

// Mock ONLY svelte-i18n's `locale` store so tests can control it. The `t` store
// keeps its real implementation so translation calls resolve via fallbackLocale='dev'.
// `setLocale(v)` drives all live subscribers — required by the cache-invalidation test
// which asserts that a locale change clears the navigation memo cache.
const { mockI18nLocale } = vi.hoisted(() => {
  const subscribers = new Set<(v: string | null) => void>();
  const state = {
    current: 'en' as string | null,
    subscribers,
    setLocale(v: string | null) {
      state.current = v;
      for (const sub of subscribers) {
        sub(v);
      }
    },
  };
  return { mockI18nLocale: state };
});
vi.mock('svelte-i18n', async (orig) => {
  const actual = await orig<typeof import('svelte-i18n')>();
  return {
    ...actual,
    locale: {
      subscribe: (run: (v: string | null) => void) => {
        run(mockI18nLocale.current);
        mockI18nLocale.subscribers.add(run);
        return () => {
          mockI18nLocale.subscribers.delete(run);
        };
      },
    },
  };
});

const flushMicrotasks = () => new Promise((resolve) => queueMicrotask(() => resolve(undefined)));

const makeTimelineAsset = (overrides: Partial<TimelineAsset> = {}): TimelineAsset =>
  ({
    id: 'asset-1',
    ownerId: 'test-user',
    ratio: 1,
    thumbhash: null,
    localDateTime: '2026-01-01T00:00:00.000Z',
    fileCreatedAt: '2026-01-01T00:00:00.000Z',
    visibility: AssetVisibility.Timeline,
    isFavorite: false,
    isTrashed: false,
    isVideo: false,
    isImage: true,
    stack: null,
    duration: null,
    projectionType: null,
    livePhotoVideoId: null,
    city: null,
    country: null,
    people: null,
    ...overrides,
  }) as unknown as TimelineAsset;

describe('GlobalSearchManager (skeleton)', () => {
  let manager: GlobalSearchManager;

  beforeEach(() => {
    localStorage.clear();
    mockPage.route.id = null;
    mockPage.params = {};
    mockPage.url = new URL('https://gallery.test/photos');
    manager = new GlobalSearchManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts closed with empty query and smart mode', () => {
    expect(manager.isOpen).toBe(false);
    expect(manager.query).toBe('');
    expect(manager.mode).toBe('smart');
  });

  it('open() sets isOpen=true', () => {
    manager.open();
    expect(manager.isOpen).toBe(true);
  });

  it('open() records the requested presentation', () => {
    manager.open('dropdown');

    expect(manager.isOpen).toBe(true);
    expect(manager.presentation).toBe('dropdown');

    manager.open('modal');
    expect(manager.presentation).toBe('modal');
  });

  it('toggle() swaps presentation instead of closing when another surface is open', () => {
    manager.open('dropdown');

    manager.toggle('modal');

    expect(manager.isOpen).toBe(true);
    expect(manager.presentation).toBe('modal');

    manager.toggle('modal');
    expect(manager.isOpen).toBe(false);
  });

  it('close() resets presentation back to modal', () => {
    manager.open('dropdown');

    manager.close();

    expect(manager.isOpen).toBe(false);
    expect(manager.presentation).toBe('modal');
  });

  it('open() hydrates the current searchable page query and sort', () => {
    mockPage.url = new URL('https://gallery.test/photos?q=beach&sort=asc');
    manager.open();

    expect(manager.isOpen).toBe(true);
    expect(manager.query).toBe('beach');
    expect(manager.searchSortOrder).toBe('asc');
  });

  it('open() clears the modal query once after activating a text search', () => {
    const m = new GlobalSearchManager();
    mockPage.url = new URL('https://gallery.test/photos');

    m.open('modal');
    m.activateSearch('beach');
    m.close();
    mockPage.url = new URL('https://gallery.test/photos?q=beach&sort=asc');

    m.open('modal');

    expect(m.query).toBe('');
    expect(m.searchSortOrder).toBe('relevance');
  });

  it('open() still hydrates the dropdown query after activating a text search', () => {
    const m = new GlobalSearchManager();
    mockPage.url = new URL('https://gallery.test/photos');

    m.open('modal');
    m.activateSearch('beach');
    m.close();
    mockPage.url = new URL('https://gallery.test/photos?q=beach&sort=asc');

    m.open('dropdown');

    expect(m.query).toBe('beach');
    expect(m.searchSortOrder).toBe('asc');
  });

  it('open() resets the search draft sort to relevance when the current searchable page has no query', () => {
    mockPage.url = new URL('https://gallery.test/photos');
    manager.open();

    expect(manager.query).toBe('');
    expect(manager.searchSortOrder).toBe('relevance');
  });

  it('close() resets sections to idle and clears active item', () => {
    manager.open();
    manager.sections.photos = { status: 'loading' };
    manager.activeItemId = 'photo:abc';
    manager.close();
    expect(manager.isOpen).toBe(false);
    expect(manager.sections.photos).toEqual({ status: 'idle' });
    expect(manager.sections.people).toEqual({ status: 'idle' });
    expect(manager.activeItemId).toBe(null);
  });

  it('close() resets query so reopening and re-typing the same string runs a new batch', () => {
    manager.open();
    manager.query = 'beach';
    manager.close();
    expect(manager.query).toBe('');
  });

  it('toggle() flips state', () => {
    manager.toggle();
    expect(manager.isOpen).toBe(true);
    manager.toggle();
    expect(manager.isOpen).toBe(false);
  });

  it('providers is an instance-bound record with one entry per Sections key', () => {
    const providers = (manager as unknown as { providers: Record<string, unknown> }).providers;
    expect(Object.keys(providers).sort()).toEqual([
      'albums',
      'commands',
      'navigation',
      'people',
      'photos',
      'places',
      'spaces',
      'tags',
    ]);
  });

  describe('searchQueryType sanity check', () => {
    it('falls back to smart when localStorage value is invalid', () => {
      localStorage.setItem('searchQueryType', 'evil_value');
      manager = new GlobalSearchManager();
      expect(manager.mode).toBe('smart');
      expect(localStorage.getItem('searchQueryType')).toBe('smart');
    });

    it('falls back to smart when localStorage value is empty string', () => {
      localStorage.setItem('searchQueryType', '');
      manager = new GlobalSearchManager();
      expect(manager.mode).toBe('smart');
    });

    it('returns smart when key is absent', () => {
      manager = new GlobalSearchManager();
      expect(manager.mode).toBe('smart');
    });

    it('uses persisted value when valid', () => {
      for (const m of ['smart', 'metadata', 'description', 'ocr'] as const) {
        localStorage.setItem('searchQueryType', m);
        manager = new GlobalSearchManager();
        expect(manager.mode).toBe(m);
      }
    });

    it('falls back to smart and does not throw when localStorage access throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(() => new GlobalSearchManager()).not.toThrow();
      expect(new GlobalSearchManager().mode).toBe('smart');
    });
  });
});

describe('setQuery', () => {
  let manager: GlobalSearchManager;
  let calls: Array<{ key: string; query: string; mode: SearchMode }>;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    manager = new GlobalSearchManager();
    calls = [];
    const makeStub = (key: keyof Sections, minLen: number): Provider => ({
      key,
      topN: 5,
      minQueryLength: minLen,
      run: async (query, mode, signal) => {
        calls.push({ key, query, mode });
        return new Promise<ProviderStatus>((resolve, reject) => {
          signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
          setTimeout(() => resolve({ status: 'ok', items: [], total: 0 }), 0);
        });
      },
    });
    (manager as unknown as { providers: Record<keyof Sections, Provider> }).providers = {
      photos: makeStub('photos', 1),
      people: makeStub('people', 2),
      places: makeStub('places', 2),
      tags: makeStub('tags', 2),
      albums: makeStub('albums', 2),
      spaces: makeStub('spaces', 2),
      navigation: makeStub('navigation', 2),
      commands: makeStub('commands', 2),
    };
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('empty query sets sections to idle', async () => {
    manager.setQuery('');
    await vi.advanceTimersByTimeAsync(200);
    expect(calls).toEqual([]);
    expect(manager.sections.photos).toEqual({ status: 'idle' });
  });

  it('query length 1 fires only photos', async () => {
    manager.setQuery('a');
    await vi.advanceTimersByTimeAsync(200);
    expect(calls.map((c) => c.key).sort()).toEqual(['photos']);
  });

  it('query length ≥ 2 fires all six providers', async () => {
    manager.setQuery('ab');
    await vi.advanceTimersByTimeAsync(200);
    expect(calls.map((c) => c.key).sort()).toEqual(['albums', 'people', 'photos', 'places', 'spaces', 'tags']);
  });

  it('debounces rapid keystrokes — only the last value fires', async () => {
    manager.setQuery('a');
    manager.setQuery('ab');
    manager.setQuery('abc');
    await vi.advanceTimersByTimeAsync(200);
    expect(new Set(calls.map((c) => c.query))).toEqual(new Set(['abc']));
  });

  it('new keystroke aborts previous batch silently', async () => {
    const providers = (manager as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    providers.photos.run = (_q: string, _m: SearchMode, signal: AbortSignal) =>
      new Promise<ProviderStatus>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('x'), { name: 'AbortError' })));
      });
    manager.setQuery('first');
    await vi.advanceTimersByTimeAsync(200);
    manager.setQuery('second');
    await vi.advanceTimersByTimeAsync(200);
    expect(manager.sections.photos.status).not.toBe('timeout');
  });

  it('5 s timeout marks section as timeout when provider never resolves', async () => {
    const providers = (manager as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    providers.photos.run = (_q: string, _m: SearchMode, signal: AbortSignal) =>
      new Promise<ProviderStatus>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('x'), { name: 'AbortError' })));
      });
    manager.setQuery('hang');
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(15_100);
    expect(manager.sections.photos.status).toBe('timeout');
  });

  it('close() aborts in-flight batch silently', async () => {
    const providers = (manager as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    providers.photos.run = (_q: string, _m: SearchMode, signal: AbortSignal) =>
      new Promise<ProviderStatus>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('x'), { name: 'AbortError' })));
      });
    manager.setQuery('inflight');
    await vi.advanceTimersByTimeAsync(200);
    manager.close();
    expect(manager.sections.photos.status).toBe('idle');
  });

  it('synchronous throw from a provider does not crash runBatch', async () => {
    const providers = (manager as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    providers.photos.run = () => {
      throw new Error('sync boom');
    };
    manager.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    expect(manager.sections.photos).toEqual({ status: 'error', message: 'sync boom' });
  });
});

describe('real providers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [{ id: 'a' }, { id: 'b' }], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([{ id: 'p1', name: 'Alice' }] as unknown as Awaited<
      ReturnType<typeof searchPerson>
    >);
    vi.mocked(searchPlaces).mockResolvedValue([
      { name: 'Santa Cruz', latitude: 36.97, longitude: -122.03 },
    ] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('photos uses searchSmart in smart mode with withSharedSpaces=true', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    expect(searchSmart).toHaveBeenCalledOnce();
    expect(searchSmart).toHaveBeenCalledWith(
      expect.objectContaining({
        smartSearchDto: expect.objectContaining({ query: 'beach', withSharedSpaces: true }),
      }),
      expect.anything(),
    );
    expect(m.sections.photos.status).toBe('ok');
  });

  it('photos uses searchAssets with originalFileName in metadata mode', async () => {
    localStorage.setItem('searchQueryType', 'metadata');
    const m = new GlobalSearchManager();
    m.setQuery('IMG_0042');
    await vi.advanceTimersByTimeAsync(200);
    expect(searchAssets).toHaveBeenCalledWith(
      expect.objectContaining({
        metadataSearchDto: expect.objectContaining({ originalFileName: 'IMG_0042' }),
      }),
      expect.anything(),
    );
  });

  it('photos uses searchAssets with description field in description mode', async () => {
    localStorage.setItem('searchQueryType', 'description');
    const m = new GlobalSearchManager();
    m.setQuery('sunset');
    await vi.advanceTimersByTimeAsync(200);
    expect(searchAssets).toHaveBeenCalledWith(
      expect.objectContaining({
        metadataSearchDto: expect.objectContaining({ description: 'sunset' }),
      }),
      expect.anything(),
    );
  });

  it('photos uses searchAssets with ocr field in ocr mode', async () => {
    localStorage.setItem('searchQueryType', 'ocr');
    const m = new GlobalSearchManager();
    m.setQuery('ACME');
    await vi.advanceTimersByTimeAsync(200);
    expect(searchAssets).toHaveBeenCalledWith(
      expect.objectContaining({
        metadataSearchDto: expect.objectContaining({ ocr: 'ACME' }),
      }),
      expect.anything(),
    );
  });

  it('people provider calls searchPerson with name and withHidden=false', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('alice');
    await vi.advanceTimersByTimeAsync(200);
    expect(searchPerson).toHaveBeenCalledWith(
      { name: 'alice', withHidden: false, withSharedSpaces: true },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('places provider calls searchPlaces with name', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('santa');
    await vi.advanceTimersByTimeAsync(200);
    expect(searchPlaces).toHaveBeenCalledWith(
      { name: 'santa' },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('photos provider returns { status: error } when SDK throws non-abort error', async () => {
    vi.mocked(searchSmart).mockRejectedValueOnce(new Error('network down'));
    const m = new GlobalSearchManager();
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    await Promise.resolve();
    expect(m.sections.photos).toEqual({ status: 'error', message: 'network down' });
  });

  it('people provider caps results at top 5', async () => {
    vi.mocked(searchPerson).mockResolvedValue(
      Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, name: `P${i}` })) as unknown as Awaited<
        ReturnType<typeof searchPerson>
      >,
    );
    const m = new GlobalSearchManager();
    m.setQuery('al');
    await vi.advanceTimersByTimeAsync(200);
    const section = m.sections.people;
    expect(section.status).toBe('ok');
    if (section.status === 'ok') {
      expect(section.items.length).toBe(5);
      expect(section.total).toBe(8);
    }
  });

  it('places provider caps results at top 3', async () => {
    vi.mocked(searchPlaces).mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => ({ name: `P${i}`, latitude: i, longitude: i })) as unknown as Awaited<
        ReturnType<typeof searchPlaces>
      >,
    );
    const m = new GlobalSearchManager();
    m.setQuery('sa');
    await vi.advanceTimersByTimeAsync(200);
    const section = m.sections.places;
    expect(section.status).toBe('ok');
    if (section.status === 'ok') {
      expect(section.items.length).toBe(3);
      expect(section.total).toBe(6);
    }
  });
});

describe('tag provider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPerson>>);
    vi.mocked(searchPlaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
    vi.mocked(getAllTags).mockResolvedValue([
      { id: 't1', name: 'beach', color: null },
      { id: 't2', name: 'beer', color: null },
      { id: 't3', name: 'mountain', color: null },
    ] as unknown as Awaited<ReturnType<typeof getAllTags>>);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('filters tags by case-insensitive substring on name', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('BE');
    await vi.advanceTimersByTimeAsync(200);
    const section = m.sections.tags;
    expect(section.status).toBe('ok');
    if (section.status === 'ok') {
      expect((section.items as Array<{ name: string }>).map((t) => t.name).sort()).toEqual(['beach', 'beer']);
    }
  });

  it('caches getAllTags across keystrokes', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('be');
    await vi.advanceTimersByTimeAsync(200);
    m.setQuery('mou');
    await vi.advanceTimersByTimeAsync(200);
    expect(getAllTags).toHaveBeenCalledTimes(1);
  });

  it('close() clears cache; reopen refetches', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('be');
    await vi.advanceTimersByTimeAsync(200);
    m.close();
    m.open();
    m.setQuery('be');
    await vi.advanceTimersByTimeAsync(200);
    expect(getAllTags).toHaveBeenCalledTimes(2);
  });

  it('disables tag provider at > 20 000 tags', async () => {
    vi.mocked(getAllTags).mockResolvedValue(
      Array.from({ length: 20_001 }, (_, i) => ({ id: `t${i}`, name: `tag${i}`, color: null })) as unknown as Awaited<
        ReturnType<typeof getAllTags>
      >,
    );
    // Silence the console.warn from the 20k-cap branch
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = new GlobalSearchManager();
    m.setQuery('tag');
    await vi.advanceTimersByTimeAsync(200);
    expect(m.sections.tags).toEqual({ status: 'error', message: 'tag_cache_too_large' });
    warnSpy.mockRestore();
  });

  it('invalidates cache on storage event for cmdk.tags.version', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('be');
    await vi.advanceTimersByTimeAsync(200);
    globalThis.dispatchEvent(new StorageEvent('storage', { key: 'cmdk.tags.version', newValue: '2' }));
    m.setQuery('mou');
    await vi.advanceTimersByTimeAsync(200);
    expect(getAllTags).toHaveBeenCalledTimes(2);
  });

  it('getAllTags failure renders error row, retries on next keystroke', async () => {
    vi.mocked(getAllTags).mockRejectedValueOnce(new Error('boom'));
    const m = new GlobalSearchManager();
    m.setQuery('be');
    await vi.advanceTimersByTimeAsync(200);
    expect(m.sections.tags.status).toBe('error');
    vi.mocked(getAllTags).mockResolvedValueOnce([{ id: 't1', name: 'beach', color: null }] as unknown as Awaited<
      ReturnType<typeof getAllTags>
    >);
    m.setQuery('bea');
    await vi.advanceTimersByTimeAsync(200);
    expect(m.sections.tags.status).toBe('ok');
  });
});

describe('setMode', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPerson>>);
    vi.mocked(searchPlaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
    vi.mocked(getAllTags).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllTags>>);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('aborts in-flight photos only, re-runs with new mode; people untouched', async () => {
    let photosCalls = 0;
    let peopleCalls = 0;
    const m = new GlobalSearchManager();
    const providers = (m as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    providers.photos.run = () => {
      photosCalls++;
      return Promise.resolve({ status: 'ok' as const, items: [], total: 0 });
    };
    providers.people.run = () => {
      peopleCalls++;
      return Promise.resolve({ status: 'ok' as const, items: [], total: 0 });
    };
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    expect(photosCalls).toBe(1);
    expect(peopleCalls).toBe(1);
    m.setMode('metadata');
    await vi.advanceTimersByTimeAsync(10);
    expect(photosCalls).toBe(2);
    expect(peopleCalls).toBe(1);
  });

  it('setMode during pending debounce restarts timer with new mode', async () => {
    const m = new GlobalSearchManager();
    const providers = (m as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    const photosRun = vi.fn().mockResolvedValue({ status: 'ok', items: [], total: 0 } as ProviderStatus);
    providers.photos.run = photosRun;
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(50);
    m.setMode('metadata');
    await vi.advanceTimersByTimeAsync(200);
    expect(photosRun).toHaveBeenCalledOnce();
    expect(photosRun).toHaveBeenCalledWith('beach', 'metadata', expect.any(AbortSignal));
  });

  it('persists mode to localStorage', () => {
    const m = new GlobalSearchManager();
    m.setMode('ocr');
    expect(localStorage.getItem('searchQueryType')).toBe('ocr');
  });

  it('setMode with empty query is a no-op for providers', async () => {
    const m = new GlobalSearchManager();
    const providers = (m as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    const photosRun = vi.fn();
    providers.photos.run = photosRun;
    m.setMode('metadata');
    await vi.advanceTimersByTimeAsync(200);
    expect(photosRun).not.toHaveBeenCalled();
  });
});

describe('cursor identity', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPerson>>);
    vi.mocked(searchPlaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
    vi.mocked(getAllTags).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllTags>>);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('preserves activeItemId when a later section populates above it', async () => {
    const m = new GlobalSearchManager();
    const providers = (m as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    providers.people.run = () =>
      Promise.resolve({ status: 'ok' as const, items: [{ id: 'p1', name: 'Alice' }], total: 1 });
    providers.photos.run = () =>
      Promise.resolve({ status: 'ok' as const, items: [{ id: 'a1' }, { id: 'a2' }], total: 2 });
    m.setQuery('alice');
    await vi.advanceTimersByTimeAsync(200);
    m.setActiveItem('person:p1');
    expect(m.activeItemId).toBe('person:p1');
    m.sections.photos = { status: 'ok', items: [{ id: 'a3' }], total: 1 };
    m.reconcileCursor();
    expect(m.activeItemId).toBe('person:p1');
  });

  it('falls back to first top-section row when tracked id disappears', async () => {
    const m = new GlobalSearchManager();
    const providers = (m as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    providers.photos.run = () =>
      Promise.resolve({ status: 'ok' as const, items: [{ id: 'a1' }, { id: 'a2' }], total: 2 });
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    m.setActiveItem('photo:a1');
    providers.photos.run = () => Promise.resolve({ status: 'ok' as const, items: [{ id: 'a9' }], total: 1 });
    // Use a query whose characters don't fuzzy-score against any command corpus,
    // so the commands section stays empty and cursor fallback lands on photos.
    m.setQuery('whale');
    await vi.advanceTimersByTimeAsync(200);
    expect(m.activeItemId).toBe('photo:a9');
  });
});

describe('Enter race', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPerson>>);
    vi.mocked(searchPlaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
    vi.mocked(getAllTags).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllTags>>);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('getActiveItem captures the currently-highlighted item by reference', async () => {
    const m = new GlobalSearchManager();
    const providers = (m as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    providers.photos.run = () => Promise.resolve({ status: 'ok' as const, items: [{ id: 'a1' }], total: 1 });
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    m.setActiveItem('photo:a1');
    const active = m.getActiveItem();
    expect(active?.kind).toBe('photo');
    expect((active?.data as { id: string }).id).toBe('a1');
  });

  it('Enter on stale cursor returns null (no-op at call site)', () => {
    const m = new GlobalSearchManager();
    m.activeItemId = 'photo:nonexistent';
    expect(m.getActiveItem()).toBe(null);
  });
});

describe('ML health retroactive promotion', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPerson>>);
    vi.mocked(searchPlaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
    vi.mocked(getAllTags).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllTags>>);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('sets mlHealthy=false when photos times out in smart mode', async () => {
    const m = new GlobalSearchManager();
    const providers = (m as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    providers.photos.run = (_q: string, _mode: SearchMode, signal: AbortSignal) =>
      new Promise<ProviderStatus>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('x'), { name: 'AbortError' })));
      });
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(15_100);
    expect(m.mlHealthy).toBe(false);
  });

  it('does NOT promote banner in non-smart mode', async () => {
    localStorage.setItem('searchQueryType', 'metadata');
    const m = new GlobalSearchManager();
    const providers = (m as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    providers.photos.run = (_q: string, _mode: SearchMode, signal: AbortSignal) =>
      new Promise<ProviderStatus>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('x'), { name: 'AbortError' })));
      });
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(15_100);
    expect(m.mlHealthy).toBe(true);
  });
});

describe('activate()', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetRecentStore();
  });

  it('activate("photo", item) calls goto with /photos/:id and records recent entry', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activate('photo', { id: 'a1', originalFileName: 'sunset.jpg' });
    expect(goto).toHaveBeenCalledWith('/photos/a1');
    const entries = getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ kind: 'photo', id: 'photo:a1', assetId: 'a1', label: 'sunset.jpg' });
    expect(m.isOpen).toBe(false);
  });

  it('activate("person", item) navigates to /people/:id and records recent entry', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activate('person', { id: 'p1', name: 'Alice' });
    expect(goto).toHaveBeenCalledWith('/people/p1');
    const entries = getEntries();
    expect(entries[0]).toMatchObject({ kind: 'person', personId: 'p1', label: 'Alice' });
  });

  it('activate("person", item) opens identity-backed space-primary people as shared timeline search', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activate('person', {
      id: 'space-person-1',
      name: 'Alice',
      primaryProfile: { type: 'space-person', id: 'space-person-1', spaceId: 'space-1' },
      filterId: 'space-person:space-person-1',
    });

    const route = vi.mocked(goto).mock.calls[0][0] as string;
    const url = new URL(route, 'https://gallery.test');
    expect(url.pathname).toBe('/search');
    expect(JSON.parse(url.searchParams.get('query') ?? '{}')).toEqual({
      personIds: ['space-person:space-person-1'],
      withSharedSpaces: true,
    });
    expect(getEntries()).toHaveLength(0);
  });

  it('activate("person", item) navigates legacy space-primary people to the space person route', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activate('person', {
      id: 'space-person-1',
      name: 'Alice',
      primaryProfile: { type: 'space-person', id: 'space-person-1', spaceId: 'space-1' },
    });
    expect(goto).toHaveBeenCalledWith('/spaces/space-1/people/space-person-1');
    expect(getEntries()).toHaveLength(0);
  });

  it('activate("place", item) navigates to /map with hash and records recent entry', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activate('place', { name: 'Paris', latitude: 48.8566, longitude: 2.3522 });
    expect(goto).toHaveBeenCalledWith('/map#12/48.8566/2.3522');
    const entries = getEntries();
    expect(entries[0]).toMatchObject({ kind: 'place', id: 'place:48.8566:2.3522', label: 'Paris' });
  });

  it('activate("tag", item) navigates to /search with tagIds and records recent entry', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activate('tag', { id: 't1', name: 'beach' });
    const firstCall = vi.mocked(goto).mock.calls[0]?.[0] as string;
    expect(firstCall).toContain('/search');
    expect(decodeURIComponent(firstCall)).toContain('"tagIds":["t1"]');
    const entries = getEntries();
    expect(entries[0]).toMatchObject({ kind: 'tag', id: 'tag:t1', tagId: 't1', label: 'beach' });
  });
});

describe('activate("command")', () => {
  let manager: GlobalSearchManager;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetRecentStore();
    manager = new GlobalSearchManager();
    manager.open();
  });

  it('calls the handler exactly once and does not write RECENT', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const cmd: CommandItem = { id: 'cmd:test', labelKey: 'x', descriptionKey: 'x', icon: '', handler };
    const addEntrySpy = vi.spyOn(recentModule, 'addEntry');
    manager.activate('command', cmd);
    await flushMicrotasks();
    expect(handler).toHaveBeenCalledOnce();
    expect(addEntrySpy).not.toHaveBeenCalled();
    expect(getEntries()).toHaveLength(0);
  });

  it('is a no-op while same command is in flight', async () => {
    let resolve!: () => void;
    const handler = vi.fn().mockReturnValue(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );
    const cmd: CommandItem = { id: 'cmd:test', labelKey: 'x', descriptionKey: 'x', icon: '', handler };
    manager.activate('command', cmd);
    manager.activate('command', cmd);
    await flushMicrotasks();
    expect(handler).toHaveBeenCalledOnce();
    resolve();
  });

  it('clears the in-flight key after the handler settles', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const cmd: CommandItem = { id: 'cmd:test', labelKey: 'x', descriptionKey: 'x', icon: '', handler };
    manager.activate('command', cmd);
    await flushMicrotasks();
    await flushMicrotasks(); // one for the handler, one for .finally
    manager.activate('command', cmd);
    await flushMicrotasks();
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('swallows handler rejections via console.error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = vi.fn().mockRejectedValue(new Error('boom'));
    const cmd: CommandItem = { id: 'cmd:test', labelKey: 'x', descriptionKey: 'x', icon: '', handler };
    manager.activate('command', cmd);
    await flushMicrotasks();
    await flushMicrotasks();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[cmdk] command handler failed',
      expect.objectContaining({ id: 'cmd:test' }),
    );
    consoleErrorSpy.mockRestore();
  });

  it('closes the palette before the handler runs', async () => {
    const order: string[] = [];
    const closeSpy = vi.spyOn(manager, 'close').mockImplementation(() => {
      order.push('close');
    });
    const handler = vi.fn().mockImplementation(() => {
      order.push('handler');
    });
    const cmd: CommandItem = { id: 'cmd:test', labelKey: 'x', descriptionKey: 'x', icon: '', handler };
    manager.activate('command', cmd);
    await flushMicrotasks();
    expect(order).toEqual(['close', 'handler']);
    closeSpy.mockRestore();
  });

  it('passes CommandContext to the handler at activate time', async () => {
    mockPage.route.id = '/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]';
    commandContextManager.setAlbum({
      id: 'a1',
      albumName: 'X',
      ownerId: 'u',
      isOwner: true,
      isMember: false,
      raw: { id: 'a1' } as unknown as import('@immich/sdk').AlbumResponseDto,
    });
    const handler = vi.fn().mockResolvedValue(undefined);
    const cmd: CommandItem = { id: 'cmd:ctx_probe', labelKey: 'x', descriptionKey: 'x', icon: '', handler };
    manager.activate('command', cmd);
    await flushMicrotasks();
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ album: expect.objectContaining({ id: 'a1' }) }));
    commandContextManager.setAlbum(null);
    mockPage.route.id = null;
  });

  it('command activation passes a fresh selection context after selection changes while the palette is open', async () => {
    mockPage.route.id = '/(user)/photos/[[assetId=id]]';
    let assets = [makeTimelineAsset({ id: 'asset-before', ownerId: 'test-user' })];
    commandContextManager.setSelection({
      routeId: mockPage.route.id,
      token: Symbol('selection-test'),
      options: {
        getAssets: () => assets,
        clearSelection: vi.fn(),
        canAddToAlbum: () => true,
      },
    });

    manager.setQuery('>');
    await flushMicrotasks();
    const section = manager.sections.commands;
    expect(section.status).toBe('ok');
    if (section.status !== 'ok') {
      return;
    }
    const item = section.items.find((item) => item.id === 'cmd:selection_add_to_album')!;
    const handlerSpy = vi.spyOn(item, 'handler').mockResolvedValue(undefined);
    assets = [makeTimelineAsset({ id: 'asset-after', ownerId: 'test-user' })];
    manager.activate('command', item);
    await flushMicrotasks();

    expect(handlerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        selection: expect.objectContaining({ selectedAssetIds: ['asset-after'] }),
      }),
    );
    handlerSpy.mockRestore();
  });

  it('drift guard: zero-arg v1.3 command still fires while album context registered', async () => {
    commandContextManager.setAlbum({
      id: 'a1',
      albumName: 'X',
      ownerId: 'u',
      isOwner: true,
      isMember: false,
      raw: { id: 'a1' } as unknown as import('@immich/sdk').AlbumResponseDto,
    });
    const themeCmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:theme')!;
    const { themeManager } = await import('@immich/ui');
    const toggleSpy = vi.spyOn(themeManager, 'toggle').mockImplementation(() => undefined);
    manager.activate('command', themeCmd);
    await flushMicrotasks();
    expect(toggleSpy).toHaveBeenCalledOnce();
    toggleSpy.mockRestore();
    commandContextManager.setAlbum(null);
  });

  it('startConfirm sets pendingConfirmId, cancelConfirm clears it', () => {
    type WithPrivateStart = { startConfirm: (id: string) => void };
    (manager as unknown as WithPrivateStart).startConfirm('cmd:test');
    expect(manager.pendingConfirmId).toBe('cmd:test');
    manager.cancelConfirm();
    expect(manager.pendingConfirmId).toBeNull();
  });

  it('3s timeout auto-clears pendingConfirmId', () => {
    vi.useFakeTimers();
    type WithPrivateStart = { startConfirm: (id: string) => void };
    (manager as unknown as WithPrivateStart).startConfirm('cmd:test');
    vi.advanceTimersByTime(3000);
    expect(manager.pendingConfirmId).toBeNull();
    vi.useRealTimers();
  });

  it('stale-timer guard: new confirm during window does not clear new id', () => {
    vi.useFakeTimers();
    type WithPrivateStart = { startConfirm: (id: string) => void };
    const start = (manager as unknown as WithPrivateStart).startConfirm.bind(manager);
    start('cmd:a');
    vi.advanceTimersByTime(1000);
    start('cmd:b');
    vi.advanceTimersByTime(2000);
    expect(manager.pendingConfirmId).toBe('cmd:b');
    vi.advanceTimersByTime(1000);
    expect(manager.pendingConfirmId).toBeNull();
    vi.useRealTimers();
  });

  it('close() clears pendingConfirmId', () => {
    type WithPrivateStart = { startConfirm: (id: string) => void };
    (manager as unknown as WithPrivateStart).startConfirm('cmd:test');
    manager.close();
    expect(manager.pendingConfirmId).toBeNull();
  });

  describe('destructive activate', () => {
    const makeDestructive = (id: string, handler = vi.fn().mockResolvedValue(undefined)): CommandItem => ({
      id: id as `cmd:${string}`,
      labelKey: 'x',
      descriptionKey: 'y',
      icon: 'z',
      destructive: true,
      handler,
    });

    it('first Enter on destructive: palette stays open, handler NOT called, pending set', async () => {
      const cmd = makeDestructive('cmd:destruct');
      manager.activate('command', cmd);
      await flushMicrotasks();
      expect(manager.isOpen).toBe(true);
      expect(cmd.handler).not.toHaveBeenCalled();
      expect(manager.pendingConfirmId).toBe('cmd:destruct');
    });

    it('second Enter within window: palette closes, handler called, pending cleared', async () => {
      const cmd = makeDestructive('cmd:destruct');
      manager.activate('command', cmd);
      manager.activate('command', cmd);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(cmd.handler).toHaveBeenCalledOnce();
      expect(manager.isOpen).toBe(false);
      expect(manager.pendingConfirmId).toBeNull();
    });

    it('destructive A then destructive B: pending flips, only B fires on confirm', async () => {
      const a = makeDestructive('cmd:destruct_a');
      const b = makeDestructive('cmd:destruct_b');
      manager.activate('command', a);
      expect(manager.pendingConfirmId).toBe('cmd:destruct_a');
      manager.activate('command', b);
      expect(manager.pendingConfirmId).toBe('cmd:destruct_b');
      manager.activate('command', b);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(b.handler).toHaveBeenCalledOnce();
      expect(a.handler).not.toHaveBeenCalled();
    });

    it('destructive A then non-destructive C: pending cleared, C fires, A never', async () => {
      const a = makeDestructive('cmd:destruct_a');
      const handlerC = vi.fn().mockResolvedValue(undefined);
      const c: CommandItem = { id: 'cmd:safe_c', labelKey: 'x', descriptionKey: 'y', icon: 'z', handler: handlerC };
      manager.activate('command', a);
      manager.activate('command', c);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(handlerC).toHaveBeenCalledOnce();
      expect(a.handler).not.toHaveBeenCalled();
      expect(manager.pendingConfirmId).toBeNull();
    });

    it('held-Enter guard: three sync activates on destructive → handler called at most once', async () => {
      const cmd = makeDestructive('cmd:destruct');
      manager.activate('command', cmd);
      manager.activate('command', cmd);
      manager.activate('command', cmd);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(cmd.handler).toHaveBeenCalledTimes(1);
    });

    it('rapid mouse double-click: two sync activates fire exactly once', async () => {
      const cmd = makeDestructive('cmd:destruct');
      manager.activate('command', cmd);
      manager.activate('command', cmd);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(cmd.handler).toHaveBeenCalledOnce();
    });

    it('entity-row activation while pending cancels confirm via close()', () => {
      const cmd = makeDestructive('cmd:destruct');
      manager.activate('command', cmd);
      expect(manager.pendingConfirmId).toBe('cmd:destruct');
      // Activate a nav row — its branch runs `this.close()` which calls `cancelConfirm`.
      const navItem = NAVIGATION_ITEMS[0];
      manager.activate('nav', navItem);
      expect(manager.pendingConfirmId).toBeNull();
    });

    it('setQuery while pending cancels confirm', () => {
      const cmd = makeDestructive('cmd:destruct');
      manager.activate('command', cmd);
      expect(manager.pendingConfirmId).not.toBeNull();
      manager.setQuery('x');
      expect(manager.pendingConfirmId).toBeNull();
    });

    it('setActiveItem to different id while pending cancels confirm', () => {
      const cmd = makeDestructive('cmd:destruct');
      manager.activate('command', cmd);
      expect(manager.pendingConfirmId).not.toBeNull();
      manager.setActiveItem('cmd:other');
      expect(manager.pendingConfirmId).toBeNull();
    });

    it('setActiveItem back to pending id keeps confirm alive', () => {
      const cmd = makeDestructive('cmd:destruct');
      manager.activate('command', cmd);
      expect(manager.pendingConfirmId).toBe('cmd:destruct');
      manager.setActiveItem('cmd:destruct');
      expect(manager.pendingConfirmId).toBe('cmd:destruct');
    });
  });

  it('two different commands in rapid Enter each fire (independent in-flight keys)', async () => {
    const handlerA = vi.fn().mockResolvedValue(undefined);
    const handlerB = vi.fn().mockResolvedValue(undefined);
    const cmdA: CommandItem = { id: 'cmd:testA', labelKey: 'x', descriptionKey: 'x', icon: '', handler: handlerA };
    const cmdB: CommandItem = { id: 'cmd:testB', labelKey: 'y', descriptionKey: 'y', icon: '', handler: handlerB };
    manager.activate('command', cmdA);
    manager.activate('command', cmdB);
    await flushMicrotasks();
    expect(handlerA).toHaveBeenCalledOnce();
    expect(handlerB).toHaveBeenCalledOnce();
  });

  it('handler runs to completion even if palette is closed immediately after activate', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const cmd: CommandItem = { id: 'cmd:test', labelKey: 'x', descriptionKey: 'x', icon: '', handler };
    manager.activate('command', cmd);
    manager.close(); // immediate close in the same sync tick
    await expect(flushMicrotasks()).resolves.toBeUndefined();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('cmd:clear_recents activated through the manager empties RECENT across open/close/open', async () => {
    addEntry({ kind: 'query', id: 'query:hello', text: 'hello', lastUsed: Date.now() });
    expect(getEntries().length).toBeGreaterThan(0);

    const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:clear_recents')!;
    manager.activate('command', cmd);
    await flushMicrotasks();
    await flushMicrotasks(); // let .finally settle

    // Reopen — RECENT should be empty.
    manager.close();
    manager.open();
    expect(getEntries()).toEqual([]);
  });

  it('activateSearch preserves same-route params, drops stale space asset ids, and carries an explicit sort', () => {
    const m = new GlobalSearchManager();
    mockPage.url = new URL('https://gallery.test/spaces/space-1/photos/asset-123?view=grid');
    m.searchSortOrder = 'asc';

    m.activateSearch('beach');

    expect(goto).toHaveBeenCalledWith('/spaces/space-1/photos?view=grid&q=beach&sort=asc');
  });

  it('activateSearch with empty text clears the committed searchable-page query', () => {
    const m = new GlobalSearchManager();
    mockPage.url = new URL('https://gallery.test/photos?q=mountain&sort=asc&view=grid');

    m.activateSearch('');

    expect(goto).toHaveBeenCalledWith('/photos?view=grid');
    expect(getEntries()).toEqual([]);
  });

  it('activateSearch falls back to /photos and drops unrelated params', () => {
    const m = new GlobalSearchManager();
    mockPage.url = new URL('https://gallery.test/albums?view=list');

    m.activateSearch('beach');

    expect(goto).toHaveBeenCalledWith('/photos?q=beach');
  });

  it('activateSearch falls back from /spaces/:id/people to /photos', () => {
    const m = new GlobalSearchManager();
    mockPage.url = new URL('https://gallery.test/spaces/space-1/people');

    m.activateSearch('beach');

    expect(goto).toHaveBeenCalledWith('/photos?q=beach');
  });

  it('applySearchSort immediately updates the current searchable page and marks the next navigate to keep the palette open', async () => {
    const m = new GlobalSearchManager();
    mockPage.url = new URL('https://gallery.test/photos?q=beach');
    m.open();

    await m.applySearchSort('asc', 'beach');

    expect(goto).toHaveBeenCalledWith('/photos?q=beach&sort=asc', {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
    expect(m.consumeKeepOpenOnNextNavigate()).toBe(true);
    expect(m.consumeKeepOpenOnNextNavigate()).toBe(false);
  });

  it('applySearchSort does not arm keep-open when the palette is closed', async () => {
    const m = new GlobalSearchManager();
    mockPage.url = new URL('https://gallery.test/photos?q=beach');

    await m.applySearchSort('asc', 'beach');

    expect(goto).toHaveBeenCalledWith('/photos?q=beach&sort=asc', {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
    expect(m.consumeKeepOpenOnNextNavigate()).toBe(false);
  });

  it('applySearchSort persists an explicit pre-search sort on searchable pages', async () => {
    const m = new GlobalSearchManager();
    mockPage.url = new URL('https://gallery.test/spaces/space-1');

    await m.applySearchSort('desc', '');

    expect(goto).toHaveBeenCalledWith('/spaces/space-1?sort=desc', {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
    expect(m.consumeKeepOpenOnNextNavigate()).toBe(false);
  });

  it('open resets pre-search page sorting back to relevance for a new search session', () => {
    const m = new GlobalSearchManager();
    mockPage.url = new URL('https://gallery.test/photos?sort=asc');

    m.open();

    expect(m.query).toBe('');
    expect(m.searchSortOrder).toBe('relevance');
  });
});

describe('activateRecent()', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetRecentStore();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPerson>>);
    vi.mocked(searchPlaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
    vi.mocked(getAllTags).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllTags>>);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('query entries replay through activateSearch without changing mode', () => {
    const m = new GlobalSearchManager();
    const spy = vi.spyOn(m, 'activateSearch').mockImplementation(() => {});

    m.mode = 'ocr';
    m.activateRecent({ kind: 'query', id: 'query:beach', text: 'beach', lastUsed: 1 });

    expect(spy).toHaveBeenCalledWith('beach');
    expect(m.mode).toBe('ocr');
  });

  it('photo entry navigates and closes', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activateRecent({ kind: 'photo', id: 'photo:a1', assetId: 'a1', label: 'x.jpg', lastUsed: 1 });
    expect(goto).toHaveBeenCalledWith('/photos/a1');
    expect(m.isOpen).toBe(false);
  });

  it('person entry navigates and closes', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activateRecent({ kind: 'person', id: 'person:p1', personId: 'p1', label: 'Alice', lastUsed: 1 });
    expect(goto).toHaveBeenCalledWith('/people/p1');
    expect(m.isOpen).toBe(false);
  });

  it('place entry navigates and closes', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activateRecent({
      kind: 'place',
      id: 'place:48.8566:2.3522',
      latitude: 48.8566,
      longitude: 2.3522,
      label: 'Paris',
      lastUsed: 1,
    });
    expect(goto).toHaveBeenCalledWith('/map#12/48.8566/2.3522');
    expect(m.isOpen).toBe(false);
  });

  it('tag entry navigates and closes', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activateRecent({ kind: 'tag', id: 'tag:t1', tagId: 't1', label: 'beach', lastUsed: 1 });
    const firstCall = vi.mocked(goto).mock.calls[0]?.[0] as string;
    expect(firstCall).toContain('/search');
    expect(m.isOpen).toBe(false);
  });

  it('updates lastUsed on re-activation', () => {
    const m = new GlobalSearchManager();
    m.open();
    const now = Date.now();
    m.activateRecent({ kind: 'photo', id: 'photo:a1', assetId: 'a1', label: 'x.jpg', lastUsed: 1 });
    const entries = getEntries();
    expect(entries[0].lastUsed).toBeGreaterThanOrEqual(now);
  });

  it('delegates album entries to activateAlbum', () => {
    const m = new GlobalSearchManager();
    // Stub the inner method so the test does not depend on the SDK / addEntry plumbing.
    const spy = vi.spyOn(m, 'activateAlbum').mockResolvedValue(undefined);
    m.open();
    m.activateRecent({
      kind: 'album',
      id: 'album:abc',
      albumId: 'abc',
      label: 'x',
      thumbnailAssetId: null,
      lastUsed: 1,
    });
    expect(spy).toHaveBeenCalledWith('abc');
    expect(goto).not.toHaveBeenCalled();
  });

  it('delegates space entries to activateSpace', () => {
    const m = new GlobalSearchManager();
    const spy = vi.spyOn(m, 'activateSpace').mockResolvedValue(undefined);
    m.open();
    m.activateRecent({
      kind: 'space',
      id: 'space:s1',
      spaceId: 's1',
      label: 'x',
      colorHex: null,
      lastUsed: 1,
    });
    expect(spy).toHaveBeenCalledWith('s1');
    expect(goto).not.toHaveBeenCalled();
  });

  it('does NOT bump lastUsed on album entries (inner activateAlbum owns the write)', () => {
    const m = new GlobalSearchManager();
    // Stub the inner activate so it cannot perform the success-path addEntry.
    // What remains in the recent store after activateRecent must therefore be
    // exactly what the caller put there pre-activation — no up-front bump.
    vi.spyOn(m, 'activateAlbum').mockResolvedValue(undefined);
    addEntry({
      kind: 'album',
      id: 'album:abc',
      albumId: 'abc',
      label: 'x',
      thumbnailAssetId: null,
      lastUsed: 1,
    });
    m.open();
    m.activateRecent({
      kind: 'album',
      id: 'album:abc',
      albumId: 'abc',
      label: 'x',
      thumbnailAssetId: null,
      lastUsed: 1,
    });
    const entry = getEntries().find((e) => e.id === 'album:abc');
    expect(entry?.lastUsed).toBe(1);
  });

  it('does NOT bump lastUsed on space entries (inner activateSpace owns the write)', () => {
    const m = new GlobalSearchManager();
    vi.spyOn(m, 'activateSpace').mockResolvedValue(undefined);
    addEntry({
      kind: 'space',
      id: 'space:s1',
      spaceId: 's1',
      label: 'x',
      colorHex: null,
      lastUsed: 1,
    });
    m.open();
    m.activateRecent({
      kind: 'space',
      id: 'space:s1',
      spaceId: 's1',
      label: 'x',
      colorHex: null,
      lastUsed: 1,
    });
    const entry = getEntries().find((e) => e.id === 'space:s1');
    expect(entry?.lastUsed).toBe(1);
  });

  it('does NOT call this.close() for album entries (close would abort closeSignal)', () => {
    const m = new GlobalSearchManager();
    vi.spyOn(m, 'activateAlbum').mockResolvedValue(undefined);
    m.open();
    m.activateRecent({
      kind: 'album',
      id: 'album:abc',
      albumId: 'abc',
      label: 'x',
      thumbnailAssetId: null,
      lastUsed: 1,
    });
    // Palette stays open; the eventual route navigation (or 404 toast) dismisses it.
    expect(m.isOpen).toBe(true);
  });

  it('does NOT call this.close() for space entries (close would abort closeSignal)', () => {
    const m = new GlobalSearchManager();
    vi.spyOn(m, 'activateSpace').mockResolvedValue(undefined);
    m.open();
    m.activateRecent({
      kind: 'space',
      id: 'space:s1',
      spaceId: 's1',
      label: 'x',
      colorHex: null,
      lastUsed: 1,
    });
    expect(m.isOpen).toBe(true);
  });
});

describe('topNavigationMatch', () => {
  // Promotes a nav item to the "Top result" band when the query almost-exactly
  // matches its label. Read-only derived on the manager, sourced from whatever
  // `sections.navigation` currently holds — the nav provider runs synchronously
  // so these tests drive it via the full setQuery/debounce flow.
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPerson>>);
    vi.mocked(searchPlaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
    vi.mocked(getAllTags).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllTags>>);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('is null before any query is set', () => {
    const m = new GlobalSearchManager();
    m.open();
    expect(m.topNavigationMatch).toBeNull();
  });

  it('promotes People when the user types "people"', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('people');
    // Navigation runs synchronously inside setQuery so sections.navigation is
    // already populated; no timers or awaits needed.
    expect(m.topNavigationMatch?.id).toBe('nav:userPages:people');
  });

  it('promotes Favorites when the user types "favorites" (prefix match)', () => {
    // Query chosen so it does NOT also match any command label — `album` now
    // trips `cmd:new_album` which (correctly) suppresses the nav promotion.
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('favorites');
    expect(m.topNavigationMatch?.id).toBe('nav:userPages:favorites');
  });

  it('promotes Classification Settings for "auto-classification" (compound query)', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('auto-classification');
    // Admin user in beforeEach — the item is adminOnly.
    expect(m.topNavigationMatch?.id).toBe('nav:systemSettings:classification');
  });

  it('returns null when the query is shorter than the 3-char floor', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('sp');
    // The nav provider runs from 1 char so it fires, but the almost-exact
    // gate still rejects short queries so the promotion slot stays empty.
    expect(m.topNavigationMatch).toBeNull();
  });

  it('returns null when no nav item label almost-matches the query', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('zzzzzz');
    expect(m.topNavigationMatch).toBeNull();
  });
});

describe('topSearchMatch', () => {
  it('is present only for non-empty all-scope queries', () => {
    const m = new GlobalSearchManager();
    m.query = ' beach ';
    expect(m.topSearchMatch).toEqual({ id: 'top-search', query: 'beach' });

    m.query = '';
    expect(m.topSearchMatch).toBeNull();

    m.query = '@alice';
    expect(m.topSearchMatch).toBeNull();
  });
});

describe('removeRecent()', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetRecentStore();
  });

  it('removes the matching recent entry from the store', () => {
    addEntry({ kind: 'query', id: 'query:beach', text: 'beach', lastUsed: 1 });
    addEntry({ kind: 'query', id: 'query:sunset', text: 'sunset', lastUsed: 2 });
    const m = new GlobalSearchManager();
    m.removeRecent('query:beach');
    expect(getEntries().map((e) => e.id)).toEqual(['query:sunset']);
  });

  it('bumps recentsRevision so Svelte-derived views can re-read', () => {
    // The component's `recentEntries` derived depends on `manager.recentsRevision`
    // because cmdk-recent is a plain-function store (not a Svelte store). Without
    // a reactive tick, a mid-session mutation would leave the deleted row in the
    // DOM until the palette closed and reopened.
    addEntry({ kind: 'query', id: 'query:beach', text: 'beach', lastUsed: 1 });
    const m = new GlobalSearchManager();
    const before = m.recentsRevision;
    m.removeRecent('query:beach');
    expect(m.recentsRevision).toBeGreaterThan(before);
  });

  it('no-op on a missing id — revision unchanged', () => {
    const m = new GlobalSearchManager();
    const before = m.recentsRevision;
    m.removeRecent('does-not-exist');
    expect(m.recentsRevision).toBe(before);
  });

  it('reconciles the cursor after removing the currently-highlighted recent', () => {
    // When the user deletes the active row, the highlight must move to the next
    // available entry so keyboard users do not end up on a dead cursor.
    addEntry({ kind: 'query', id: 'query:beach', text: 'beach', lastUsed: 1 });
    addEntry({ kind: 'query', id: 'query:sunset', text: 'sunset', lastUsed: 2 });
    const m = new GlobalSearchManager();
    m.open();
    m.setActiveItem('query:sunset');
    m.removeRecent('query:sunset');
    // 'query:sunset' is gone, the remaining entry 'query:beach' must take the highlight.
    expect(m.activeItemId).toBe('query:beach');
  });
});

describe('announcementText', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('returns empty string while any provider is still loading', () => {
    const m = new GlobalSearchManager();
    m.sections = {
      photos: { status: 'loading' },
      people: { status: 'ok', items: [{ id: 'p1' }], total: 1 },
      places: { status: 'empty' },
      tags: { status: 'empty' },
      albums: { status: 'empty' },
      spaces: { status: 'empty' },
      navigation: { status: 'empty' },
      commands: { status: 'empty' },
    };
    expect(m.announcementText).toBe('');
  });

  it('aggregates non-zero counts once all providers have settled', () => {
    const m = new GlobalSearchManager();
    m.sections = {
      photos: { status: 'ok', items: [{ id: 'a1' }], total: 42 },
      people: { status: 'ok', items: [{ id: 'p1' }], total: 5 },
      places: { status: 'empty' },
      tags: { status: 'ok', items: [{ id: 't1' }], total: 3 },
      albums: { status: 'empty' },
      spaces: { status: 'empty' },
      navigation: { status: 'empty' },
      commands: { status: 'empty' },
    };
    expect(m.announcementText).toBe('42 photos, 5 people, 3 tags');
  });

  it('returns "" if all settled sections are empty', () => {
    const m = new GlobalSearchManager();
    m.sections = {
      photos: { status: 'empty' },
      people: { status: 'empty' },
      places: { status: 'empty' },
      tags: { status: 'empty' },
      albums: { status: 'empty' },
      spaces: { status: 'empty' },
      navigation: { status: 'empty' },
      commands: { status: 'empty' },
    };
    expect(m.announcementText).toBe('');
  });
});

describe('reconcileCursor fallback + getActiveItem edge cases', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    // getActiveItem now consults recents when the query is empty, so stale entries
    // from prior describes would mask the section-based edge cases this block tests.
    resetRecentStore();
  });

  it('reconcileCursor sets activeItemId to null when all sections are empty', () => {
    const m = new GlobalSearchManager();
    m.activeItemId = 'photo:ghost';
    m.sections = {
      photos: { status: 'empty' },
      people: { status: 'empty' },
      places: { status: 'empty' },
      tags: { status: 'empty' },
      albums: { status: 'empty' },
      spaces: { status: 'empty' },
      navigation: { status: 'empty' },
      commands: { status: 'empty' },
    };
    m.reconcileCursor();
    expect(m.activeItemId).toBe(null);
  });

  it('getActiveItem returns null when the target section is still loading', () => {
    const m = new GlobalSearchManager();
    m.activeItemId = 'photo:a1';
    m.sections = {
      photos: { status: 'loading' },
      people: { status: 'idle' },
      places: { status: 'idle' },
      tags: { status: 'idle' },
      albums: { status: 'idle' },
      spaces: { status: 'idle' },
      navigation: { status: 'idle' },
      commands: { status: 'idle' },
    };
    expect(m.getActiveItem()).toBe(null);
  });

  it('getActiveItem returns null for an activeItemId with no prefix separator', () => {
    const m = new GlobalSearchManager();
    m.activeItemId = 'malformed';
    expect(m.getActiveItem()).toBe(null);
  });
});

describe('edge-case guards', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPerson>>);
    vi.mocked(searchPlaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
    vi.mocked(getAllTags).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllTags>>);
    vi.mocked(getMlHealth).mockResolvedValue({ smartSearchHealthy: true } as never);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('setQuery while closed: leaves no visible state after next open/type cycle', async () => {
    const m = new GlobalSearchManager();
    // Never opened. setQuery mutates internal query but no UI is bound so it's harmless.
    m.setQuery('phantom');
    await vi.advanceTimersByTimeAsync(200);
    // Sections get loaded states because we run providers. Ensure close() cleans up.
    m.close();
    expect(m.query).toBe('');
    expect(m.sections.photos).toEqual({ status: 'idle' });
    // Now open and type — the fresh cycle should work normally.
    m.open();
    m.setQuery('real');
    await vi.advanceTimersByTimeAsync(200);
    expect(searchSmart).toHaveBeenCalled();
  });

  it('ML probe resolving after close() does not mutate mlHealthy', async () => {
    let resolveProbe!: (v: { smartSearchHealthy: boolean }) => void;
    vi.mocked(getMlHealth).mockImplementationOnce(() => new Promise((r) => (resolveProbe = r)));
    const m = new GlobalSearchManager();
    m.open();
    expect(m.mlHealthy).toBe(true);
    m.close();
    // Late probe resolution with a false value — should be discarded.
    resolveProbe({ smartSearchHealthy: false });
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();
    expect(m.mlHealthy).toBe(true);
  });

  it('activateRecent with corrupt photo entry (missing assetId) no-ops and closes', () => {
    const m = new GlobalSearchManager();
    m.open();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    m.activateRecent({
      kind: 'photo',
      id: 'photo:ghost',
      assetId: '' as unknown as string,
      label: '',
      lastUsed: 1,
    });
    expect(warnSpy).toHaveBeenCalled();
    expect(m.isOpen).toBe(false);
    warnSpy.mockRestore();
  });

  it('activateRecent with corrupt place entry (non-finite lat) no-ops and closes', () => {
    const m = new GlobalSearchManager();
    m.open();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    m.activateRecent({
      kind: 'place',
      id: 'place:bad',
      latitude: Number.NaN,
      longitude: 0,
      label: 'Broken',
      lastUsed: 1,
    });
    expect(warnSpy).toHaveBeenCalled();
    expect(m.isOpen).toBe(false);
    warnSpy.mockRestore();
  });

  it('activateRecent with corrupt query entry (blank text) no-ops and closes', () => {
    const m = new GlobalSearchManager();
    m.open();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    m.activateRecent({
      kind: 'query',
      id: 'query:bad',
      text: '   ',
      lastUsed: 1,
    });
    expect(warnSpy).toHaveBeenCalled();
    expect(m.isOpen).toBe(false);
    warnSpy.mockRestore();
  });

  it('unicode / emoji query is passed through to providers untouched', async () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('🍕 café München');
    await vi.advanceTimersByTimeAsync(200);
    expect(searchSmart).toHaveBeenCalledWith(
      expect.objectContaining({
        smartSearchDto: expect.objectContaining({ query: '🍕 café München' }),
      }),
      expect.anything(),
    );
  });
});

describe('ML health probe on open', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(getMlHealth).mockResolvedValue({ smartSearchHealthy: true } as never);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('probes on first open and caches for the session', async () => {
    const m = new GlobalSearchManager();
    m.open();
    await vi.advanceTimersByTimeAsync(0);
    m.close();
    m.open();
    await vi.advanceTimersByTimeAsync(0);
    expect(getMlHealth).toHaveBeenCalledOnce();
  });

  it('sets mlHealthy=false when probe reports unhealthy', async () => {
    vi.mocked(getMlHealth).mockResolvedValue({ smartSearchHealthy: false } as never);
    const m = new GlobalSearchManager();
    m.open();
    await vi.advanceTimersByTimeAsync(0);
    expect(m.mlHealthy).toBe(false);
  });

  it('trusts current state if probe throws', async () => {
    vi.mocked(getMlHealth).mockRejectedValue(new Error('net'));
    const m = new GlobalSearchManager();
    m.open();
    await vi.advanceTimersByTimeAsync(0);
    expect(m.mlHealthy).toBe(true);
  });
});

describe('tagsDisabled persists across close/reopen', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPerson>>);
    vi.mocked(searchPlaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('once disabled for one session, stays disabled after close + reopen', async () => {
    vi.mocked(getAllTags).mockResolvedValue(
      Array.from({ length: 20_001 }, (_, i) => ({ id: `t${i}`, name: `tag${i}`, color: null })) as unknown as Awaited<
        ReturnType<typeof getAllTags>
      >,
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = new GlobalSearchManager();
    m.setQuery('tag');
    await vi.advanceTimersByTimeAsync(200);
    expect(m.sections.tags).toEqual({ status: 'error', message: 'tag_cache_too_large' });
    const callsAfterFirst = vi.mocked(getAllTags).mock.calls.length;
    m.close();
    m.open();
    // Swap mock to a tiny list — if tagsDisabled reset, this would succeed and repopulate.
    vi.mocked(getAllTags).mockResolvedValue([{ id: 't1', name: 'beach', color: null }] as unknown as Awaited<
      ReturnType<typeof getAllTags>
    >);
    m.setQuery('tag');
    await vi.advanceTimersByTimeAsync(200);
    expect(m.sections.tags).toEqual({ status: 'error', message: 'tag_cache_too_large' });
    // getAllTags should NOT have been re-invoked because tagsDisabled short-circuits.
    expect(vi.mocked(getAllTags).mock.calls.length).toBe(callsAfterFirst);
    warnSpy.mockRestore();
  });
});

describe('navigation section scaffolding', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('sections.navigation starts as idle', () => {
    const m = new GlobalSearchManager();
    expect(m.sections.navigation).toEqual({ status: 'idle' });
  });

  it('sectionForKind("nav") returns sections.navigation', () => {
    const m = new GlobalSearchManager();
    m.sections.navigation = {
      status: 'ok',
      items: [{ id: 'nav:userPages:photos' }] as never[],
      total: 1,
    };
    m.activeItemId = 'nav:userPages:photos';
    const active = m.getActiveItem();
    expect(active?.kind).toBe('nav');
  });

  it('announcementText includes navigation count as "N pages" when ok', () => {
    const m = new GlobalSearchManager();
    m.sections = {
      photos: { status: 'empty' },
      people: { status: 'empty' },
      places: { status: 'empty' },
      tags: { status: 'empty' },
      albums: { status: 'empty' },
      spaces: { status: 'empty' },
      navigation: { status: 'ok', items: [{ id: 'nav:userPages:photos' }] as never[], total: 5 },
      commands: { status: 'empty' },
    };
    expect(m.announcementText).toBe('5 pages');
  });

  it('reconcileCursor falls through to navigation when entity sections are empty', () => {
    const m = new GlobalSearchManager();
    m.sections = {
      photos: { status: 'empty' },
      people: { status: 'empty' },
      places: { status: 'empty' },
      tags: { status: 'empty' },
      albums: { status: 'empty' },
      spaces: { status: 'empty' },
      navigation: { status: 'ok', items: [{ id: 'nav:userPages:photos' }] as never[], total: 1 },
      commands: { status: 'empty' },
    };
    m.activeItemId = null;
    m.reconcileCursor();
    expect(m.activeItemId).toBe('nav:userPages:photos');
  });
});

describe('navigation memo cache', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockI18nLocale.current = 'en';
  });

  it('builds cache on first access for the current locale', () => {
    const m = new GlobalSearchManager();
    const cache = (
      m as unknown as { getNavigationSearchStrings: () => Map<string, string> }
    ).getNavigationSearchStrings();
    expect(cache.size).toBe(NAVIGATION_ITEMS.length);
    for (const [id, str] of cache) {
      expect(id.startsWith('nav:')).toBe(true);
      expect(str.length).toBeGreaterThan(0);
    }
  });

  it('reuses the cached table on subsequent calls', () => {
    const m = new GlobalSearchManager();
    const a = (m as unknown as { getNavigationSearchStrings: () => Map<string, string> }).getNavigationSearchStrings();
    const b = (m as unknown as { getNavigationSearchStrings: () => Map<string, string> }).getNavigationSearchStrings();
    expect(a).toBe(b);
  });

  it('handles a null locale gracefully (svelte-i18n before init)', () => {
    mockI18nLocale.current = null;
    const m = new GlobalSearchManager();
    const cache = (
      m as unknown as { getNavigationSearchStrings: () => Map<string, string> }
    ).getNavigationSearchStrings();
    expect(cache.size).toBe(NAVIGATION_ITEMS.length);
  });

  it('clears the cached table when the locale subscription fires with a new value', () => {
    const m = new GlobalSearchManager();
    const first = (
      m as unknown as { getNavigationSearchStrings: () => Map<string, string> }
    ).getNavigationSearchStrings();
    // Drive the subscribers: this mirrors svelte-i18n emitting a new locale after
    // the user switches language. The manager's locale subscription should fire
    // and clear `navigationSearchCache`, forcing the next call to rebuild.
    mockI18nLocale.setLocale('de');
    const second = (
      m as unknown as { getNavigationSearchStrings: () => Map<string, string> }
    ).getNavigationSearchStrings();
    expect(second).not.toBe(first);
    expect(second.size).toBe(NAVIGATION_ITEMS.length);
  });
});

describe('getActiveItem nav branch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('returns a nav ActiveItem when activeItemId is a nav id matching navigation.items', () => {
    const m = new GlobalSearchManager();
    m.sections = {
      photos: { status: 'empty' },
      people: { status: 'empty' },
      places: { status: 'empty' },
      tags: { status: 'empty' },
      albums: { status: 'empty' },
      spaces: { status: 'empty' },
      navigation: {
        status: 'ok',
        items: [
          {
            id: 'nav:userPages:photos',
            category: 'userPages',
            labelKey: 'photos',
            descriptionKey: 'cmdk_nav_photos_description',
            icon: 'x',
            route: '/photos',
            adminOnly: false,
          },
        ] as never[],
        total: 1,
      },
      commands: { status: 'empty' },
    };
    m.activeItemId = 'nav:userPages:photos';
    const active = m.getActiveItem();
    expect(active).not.toBeNull();
    expect(active?.kind).toBe('nav');
    if (active?.kind === 'nav') {
      expect(active.data.id).toBe('nav:userPages:photos');
    }
  });

  it('returns null when activeItemId is a nav id not present in the navigation section', () => {
    const m = new GlobalSearchManager();
    m.sections = {
      photos: { status: 'empty' },
      people: { status: 'empty' },
      places: { status: 'empty' },
      tags: { status: 'empty' },
      albums: { status: 'empty' },
      spaces: { status: 'empty' },
      navigation: {
        status: 'ok',
        items: [{ id: 'nav:userPages:photos' } as never],
        total: 1,
      },
      commands: { status: 'empty' },
    };
    m.activeItemId = 'nav:userPages:map'; // not in the section
    expect(m.getActiveItem()).toBeNull();
  });
});

describe('runNavigationProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
    mockI18nLocale.current = 'en';
  });

  // Calls the private runNavigationProvider. The original signature was `(query)`;
  // Task 7 changed it to `(payload, scope)`. All tests in this block exercise the
  // scope='all' + non-empty-payload branch (or the empty-payload → empty branch),
  // both of which still behave identically to the old `(query)` signature. Pass
  // 'all' as the default so the suite keeps pinning fuzzy search behavior.
  function runNav(m: GlobalSearchManager, query: string): ProviderStatus<unknown> {
    return (
      m as unknown as { runNavigationProvider: (p: string, s: 'all' | 'nav') => ProviderStatus<unknown> }
    ).runNavigationProvider(query, 'all');
  }

  it('returns empty only for an empty query; fires on a single character', () => {
    const m = new GlobalSearchManager();
    expect(runNav(m, '').status).toBe('empty');
    // Single-letter queries must reach the scorer so system-settings and
    // action items surface immediately as the user starts typing.
    expect(runNav(m, 't').status).toBe('ok');
  });

  it('returns ok with classification_settings in the result set for query "classific"', () => {
    const m = new GlobalSearchManager();
    const result = runNav(m, 'classific');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      const labels = result.items.map((i) => (i as { labelKey: string }).labelKey);
      expect(labels).toContain('admin.classification_settings');
    }
  });

  it('filters admin-only items for non-admin users', () => {
    // Query 'trash' matches both:
    //   - nav:userPages:trash           (adminOnly:false, labelKey='trash')
    //   - nav:systemSettings:trash      (adminOnly:true,  labelKey='admin.trash_settings')
    // Under non-admin this yields status='ok' with only the user-pages entry,
    // so the assertion is forced to run (no vacuous-loop path).
    mockUser.current = { id: 'test-user', isAdmin: false };
    const m = new GlobalSearchManager();
    const result = runNav(m, 'trash');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      const ids = result.items.map((i) => (i as { id: string }).id);
      expect(ids).toContain('nav:userPages:trash');
      expect(ids).not.toContain('nav:systemSettings:trash');
      expect(result.items.every((i) => (i as { adminOnly: boolean }).adminOnly === false)).toBe(true);
    }
  });

  it('admin users see both admin and non-admin matches (baseline for the admin filter test)', () => {
    mockUser.current = { id: 'test-user', isAdmin: true };
    const m = new GlobalSearchManager();
    const result = runNav(m, 'trash');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      const ids = result.items.map((i) => (i as { id: string }).id);
      expect(ids).toContain('nav:userPages:trash');
      expect(ids).toContain('nav:systemSettings:trash');
    }
  });

  it('filters items gated on a disabled feature flag', () => {
    // Query 'map' (admin=true) DEFINITELY matches:
    //   - nav:userPages:map            (featureFlag:'map')
    //   - nav:systemSettings:location  (labelKey='admin.map_gps_settings', no flag)
    // With map flag disabled, status='ok' is guaranteed because the system-settings
    // item is still present, so the negative assertion is non-vacuous.
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: false, trash: true };
    const m = new GlobalSearchManager();
    const result = runNav(m, 'map');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      const ids = result.items.map((i) => (i as { id: string }).id);
      expect(ids).not.toContain('nav:userPages:map');
      expect(ids).toContain('nav:systemSettings:location');
    }
  });

  it('items gated on a feature flag are hidden when flags have not loaded yet (SSR window)', () => {
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = undefined;
    const m = new GlobalSearchManager();
    const result = runNav(m, 'map');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      const ids = result.items.map((i) => (i as { id: string }).id);
      expect(ids).not.toContain('nav:userPages:map');
      expect(ids).toContain('nav:systemSettings:location');
    }
  });

  it('includes a featureFlag-gated item when the flag is enabled (positive path)', () => {
    mockUser.current = { id: 'test-user', isAdmin: false };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
    const m = new GlobalSearchManager();
    const result = runNav(m, 'map');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      const ids = result.items.map((i) => (i as { id: string }).id);
      expect(ids).toContain('nav:userPages:map');
    }
  });

  it('sorts results by descending computeCommandScore', () => {
    mockUser.current = { id: 'test-user', isAdmin: true };
    const m = new GlobalSearchManager();
    // Reproduce the corpus lookups via the same cache the implementation uses, so
    // we can re-score each item and assert the returned order is monotonically
    // non-increasing. This pins the sort direction; if anyone flips the comparator
    // to ascending or removes the sort, this test fails on a query that has
    // multiple matches with distinct scores.
    const cache = (
      m as unknown as { getNavigationSearchStrings: () => Map<string, string> }
    ).getNavigationSearchStrings();
    const result = runNav(m, 'set');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.items.length).toBeGreaterThan(1);
      let prev = Infinity;
      for (const item of result.items) {
        const corpus = cache.get((item as { id: string }).id);
        expect(corpus).toBeDefined();
        const score = computeCommandScore(corpus!, 'set');
        expect(score).toBeLessThanOrEqual(prev);
        expect(score).toBeGreaterThan(0);
        prev = score;
      }
    }
  });

  it('hyphenated query is tolerated by computeCommandScore (key fallback locale)', () => {
    // Test setup uses svelte-i18n with `fallbackLocale: 'dev'`, which renders the literal
    // i18n key for missing translations. The searchable corpus for the classification item
    // is therefore "admin.classification_settings admin.classification_settings_description".
    // 'class-set' matches because chars c-l-a-s-s-_-s-e-t all appear in order and the
    // hyphen is tolerated by bits-ui's tokenizer.
    const m = new GlobalSearchManager();
    const result = runNav(m, 'class-set');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      const labels = result.items.map((i) => (i as { labelKey: string }).labelKey);
      expect(labels).toContain('admin.classification_settings');
    }
  });
});

describe('commands provider', () => {
  let manager: GlobalSearchManager;

  // Mutable handle to the live COMMAND_ITEMS runtime array. Declared `readonly` at
  // the type level but plain `Array` at runtime, so the gating tests inject a
  // fabricated item via push/pop around the test body. Pushing onto the real array
  // mirrors what a new command registration would look like in production.
  const commandItemsMut = COMMAND_ITEMS as unknown as CommandItem[];

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
    mockI18nLocale.current = 'en';
    manager = new GlobalSearchManager();
    manager.open();
  });

  it('bare `>` populates commands section with all items alphabetical by label', async () => {
    manager.setQuery('>');
    await flushMicrotasks();
    const section = manager.sections.commands;
    expect(section.status).toBe('ok');
    if (section.status === 'ok') {
      const labels = section.items.map((c) => c.labelKey);
      expect(labels).toEqual([...labels].sort());
      // Sanity: the seed item from Task 1 is present under bare `>`.
      expect(labels).toContain('theme');
    }
  });

  it('selection commands are hidden under bare > when ctx.selection is null', async () => {
    commandContextManager.setSelection(null);
    manager.setQuery('>');
    await flushMicrotasks();
    const section = manager.sections.commands;
    expect(section.status).toBe('ok');
    if (section.status === 'ok') {
      expect(section.items.some((item) => item.id.startsWith('cmd:selection_'))).toBe(false);
    }
  });

  it('selection commands appear from the live provider context', async () => {
    mockPage.route.id = '/(user)/photos/[[assetId=id]]';
    commandContextManager.setSelection({
      routeId: mockPage.route.id,
      token: Symbol('selection-test'),
      options: {
        getAssets: () => [makeTimelineAsset({ id: 'asset-1', ownerId: 'test-user' })],
        clearSelection: vi.fn(),
        canAddToAlbum: () => true,
        canAddToSpace: () => true,
        getOnFavorite: () => vi.fn(),
        getOnArchive: () => vi.fn(),
        getOnDelete: () => vi.fn(),
        getOnUndoDelete: () => vi.fn(),
      },
    });

    manager.setQuery('>');
    await flushMicrotasks();
    const section = manager.sections.commands;
    expect(section.status).toBe('ok');
    if (section.status === 'ok') {
      expect(section.items.map((item) => item.id)).toEqual(
        expect.arrayContaining([
          'cmd:selection_add_to_album',
          'cmd:selection_add_to_space',
          'cmd:selection_favorite',
          'cmd:selection_archive',
          'cmd:selection_delete',
        ]),
      );
      expect(section.items.some((item) => item.id === 'cmd:selection_add_to_current_space')).toBe(false);
    }
  });

  it('topCommandMatch ranks eligible almost-exact command matches by score', () => {
    mockPage.route.id = '/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]';
    commandContextManager.setSpace({
      id: 'space-1',
      name: 'Shared',
      createdById: 'test-user',
      isOwner: true,
      isMember: false,
      canWrite: true,
      raw: { id: 'space-1', name: 'Shared', createdById: 'test-user' } as unknown as SharedSpaceResponseDto,
      members: [],
    });
    commandContextManager.setSelection({
      routeId: mockPage.route.id,
      token: Symbol('selection-test'),
      options: {
        getAssets: () => [makeTimelineAsset({ id: 'asset-1', ownerId: 'test-user' })],
        clearSelection: vi.fn(),
        canAddToAlbum: () => true,
        getOnFavorite: () => vi.fn(),
        getOnArchive: () => vi.fn(),
        getOnDelete: () => vi.fn(),
      },
    });

    manager.setQuery('add member');

    expect(manager.topCommandMatch?.id).toBe('cmd:space_add_member');
    expect(manager.topCommandMatch?.id).not.toBe('cmd:selection_add_to_album');
  });

  it('under `@alice`, commands section is empty', async () => {
    manager.setQuery('@alice');
    await flushMicrotasks();
    expect(manager.sections.commands.status).toBe('empty');
  });

  it('under `#tag`, commands section is empty', async () => {
    manager.setQuery('#tag');
    await flushMicrotasks();
    expect(manager.sections.commands.status).toBe('empty');
  });

  it('under `/album`, commands section is empty', async () => {
    manager.setQuery('/album');
    await flushMicrotasks();
    expect(manager.sections.commands.status).toBe('empty');
  });

  it('render order invariant: RECONCILE_ORDER_BY_SCOPE.all and .nav both start with "commands"', () => {
    expect(RECONCILE_ORDER_BY_SCOPE.all[0]).toBe('commands');
    expect(RECONCILE_ORDER_BY_SCOPE.nav[0]).toBe('commands');
  });

  it('defensive gating: fabricated adminOnly command is filtered for non-admin user', async () => {
    const adminCmd: CommandItem = {
      id: 'cmd:test-admin-only',
      labelKey: 'test_admin_only_label',
      descriptionKey: 'test_admin_only_description',
      icon: '',
      handler: () => undefined,
      adminOnly: true,
    };
    commandItemsMut.push(adminCmd);
    try {
      // Non-admin user: fabricated command must NOT appear under bare `>`.
      mockUser.current = { id: 'test-user', isAdmin: false };
      const nonAdmin = new GlobalSearchManager();
      nonAdmin.open();
      nonAdmin.setQuery('>');
      await flushMicrotasks();
      const nonAdminSection = nonAdmin.sections.commands;
      expect(nonAdminSection.status).toBe('ok');
      if (nonAdminSection.status === 'ok') {
        expect(nonAdminSection.items.some((c) => c.id === adminCmd.id)).toBe(false);
      }

      // Admin user: same fabricated command MUST appear.
      mockUser.current = { id: 'test-user', isAdmin: true };
      const admin = new GlobalSearchManager();
      admin.open();
      admin.setQuery('>');
      await flushMicrotasks();
      const adminSection = admin.sections.commands;
      expect(adminSection.status).toBe('ok');
      if (adminSection.status === 'ok') {
        expect(adminSection.items.some((c) => c.id === adminCmd.id)).toBe(true);
      }
    } finally {
      // Remove the fabricated item regardless of assertion outcome so later
      // describe blocks see a clean COMMAND_ITEMS.
      const idx = commandItemsMut.findIndex((c) => c.id === adminCmd.id);
      if (idx !== -1) {
        commandItemsMut.splice(idx, 1);
      }
    }
  });

  it('isAvailable=false excludes command from provider output', async () => {
    const gated: CommandItem = {
      id: 'cmd:test-gated-off',
      labelKey: 'test_gated_off_label',
      descriptionKey: 'test_gated_off_description',
      icon: '',
      handler: () => undefined,
      isAvailable: () => false,
    };
    commandItemsMut.push(gated);
    try {
      manager.setQuery('>');
      await flushMicrotasks();
      const section = manager.sections.commands;
      expect(section.status).toBe('ok');
      if (section.status === 'ok') {
        expect(section.items.some((c) => c.id === gated.id)).toBe(false);
      }
    } finally {
      const idx = commandItemsMut.findIndex((c) => c.id === gated.id);
      if (idx !== -1) {
        commandItemsMut.splice(idx, 1);
      }
    }
  });

  it('isAvailable=true includes the command', async () => {
    const allowed: CommandItem = {
      id: 'cmd:test-gated-on',
      labelKey: 'test_gated_on_label',
      descriptionKey: 'test_gated_on_description',
      icon: '',
      handler: () => undefined,
      isAvailable: () => true,
    };
    commandItemsMut.push(allowed);
    try {
      manager.setQuery('>');
      await flushMicrotasks();
      const section = manager.sections.commands;
      expect(section.status).toBe('ok');
      if (section.status === 'ok') {
        expect(section.items.some((c) => c.id === allowed.id)).toBe(true);
      }
    } finally {
      const idx = commandItemsMut.findIndex((c) => c.id === allowed.id);
      if (idx !== -1) {
        commandItemsMut.splice(idx, 1);
      }
    }
  });

  it('isAvailable throwing excludes the command and logs', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const throwing: CommandItem = {
      id: 'cmd:test-gated-throw',
      labelKey: 'test_gated_throw_label',
      descriptionKey: 'test_gated_throw_description',
      icon: '',
      handler: () => undefined,
      isAvailable: () => {
        throw new Error('boom');
      },
    };
    commandItemsMut.push(throwing);
    try {
      manager.setQuery('>');
      await flushMicrotasks();
      const section = manager.sections.commands;
      expect(section.status).toBe('ok');
      if (section.status === 'ok') {
        expect(section.items.some((c) => c.id === throwing.id)).toBe(false);
      }
      expect(errorSpy).toHaveBeenCalledWith('[cmdk] isAvailable threw', expect.objectContaining({ id: throwing.id }));
    } finally {
      const idx = commandItemsMut.findIndex((c) => c.id === throwing.id);
      if (idx !== -1) {
        commandItemsMut.splice(idx, 1);
      }
      errorSpy.mockRestore();
    }
  });

  it('admin gating applies to all 8 v1.3.1 commands', async () => {
    const v131Ids = [
      'cmd:run_thumbnail_gen',
      'cmd:run_metadata_extraction',
      'cmd:run_smart_search',
      'cmd:run_face_detection',
      'cmd:run_face_recognition',
      'cmd:pause_all_queues',
      'cmd:resume_all_queues',
      'cmd:clear_failed_jobs',
    ];

    mockUser.current = { id: 'test-user', isAdmin: false };
    const nonAdmin = new GlobalSearchManager();
    nonAdmin.open();
    nonAdmin.setQuery('>');
    await flushMicrotasks();
    const nonAdminSection = nonAdmin.sections.commands;
    expect(nonAdminSection.status).toBe('ok');
    if (nonAdminSection.status === 'ok') {
      for (const id of v131Ids) {
        expect(
          nonAdminSection.items.some((c) => c.id === id),
          `${id} must be hidden for non-admin`,
        ).toBe(false);
      }
    }

    mockUser.current = { id: 'test-user', isAdmin: true };
    const admin = new GlobalSearchManager();
    admin.open();
    admin.setQuery('>');
    await flushMicrotasks();
    const adminSection = admin.sections.commands;
    expect(adminSection.status).toBe('ok');
    if (adminSection.status === 'ok') {
      for (const id of v131Ids) {
        expect(
          adminSection.items.some((c) => c.id === id),
          `${id} must be visible for admin`,
        ).toBe(true);
      }
    }
  });

  it('commandInFlight guard blocks rapid double-activation of cmd:run_thumbnail_gen', async () => {
    // Replace the real handler with a never-resolving promise so the in-flight
    // marker stays set for the duration of this test. Pulling in the full SDK
    // mock just for this is overkill — swap the handler directly on the live item.
    const realCmd = commandItemsMut.find((c) => c.id === 'cmd:run_thumbnail_gen');
    expect(realCmd).toBeDefined();
    const handlerSpy = vi.fn(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );
    const originalHandler = realCmd!.handler;
    realCmd!.handler = handlerSpy;
    try {
      mockUser.current = { id: 'test-user', isAdmin: true };
      const manager = new GlobalSearchManager();
      manager.open();
      manager.setQuery('>');
      await flushMicrotasks();
      const section = manager.sections.commands;
      expect(section.status).toBe('ok');
      if (section.status !== 'ok') {
        return;
      }
      const item = section.items.find((i) => i.id === 'cmd:run_thumbnail_gen')!;

      // Two rapid activations; the guard should block the second.
      manager.activate('command', item);
      manager.activate('command', item);
      await flushMicrotasks();

      expect(handlerSpy).toHaveBeenCalledTimes(1);
    } finally {
      realCmd!.handler = originalHandler;
    }
  });

  it('defensive gating: fabricated featureFlag command is filtered when flag is off', async () => {
    const flaggedCmd: CommandItem = {
      id: 'cmd:test-flagged',
      labelKey: 'test_flagged_label',
      descriptionKey: 'test_flagged_description',
      icon: '',
      handler: () => undefined,
      // 'map' is one of the flags the test harness already exposes via mockFlags.
      featureFlag: 'map',
    };
    commandItemsMut.push(flaggedCmd);
    try {
      // Flag off: fabricated command must NOT appear.
      mockFlags.valueOrUndefined = { search: true, map: false, trash: true };
      const off = new GlobalSearchManager();
      off.open();
      off.setQuery('>');
      await flushMicrotasks();
      const offSection = off.sections.commands;
      expect(offSection.status).toBe('ok');
      if (offSection.status === 'ok') {
        expect(offSection.items.some((c) => c.id === flaggedCmd.id)).toBe(false);
      }

      // Flag on: fabricated command MUST appear.
      mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
      const on = new GlobalSearchManager();
      on.open();
      on.setQuery('>');
      await flushMicrotasks();
      const onSection = on.sections.commands;
      expect(onSection.status).toBe('ok');
      if (onSection.status === 'ok') {
        expect(onSection.items.some((c) => c.id === flaggedCmd.id)).toBe(true);
      }
    } finally {
      const idx = commandItemsMut.findIndex((c) => c.id === flaggedCmd.id);
      if (idx !== -1) {
        commandItemsMut.splice(idx, 1);
      }
    }
  });
});

describe('setQuery synchronous navigation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
    mockI18nLocale.current = 'en';
    vi.mocked(searchSmart).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchPerson).mockResolvedValue([] as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
    vi.mocked(getMlHealth).mockResolvedValue({ smartSearchHealthy: true } as never);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('navigation section updates synchronously BEFORE the debounce fires', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('classific');
    // No timer advancement. Entity sections are loading, navigation is already ok.
    expect(m.sections.navigation.status).toBe('ok');
    expect(m.sections.photos.status).toBe('loading');
    expect(m.sections.people.status).toBe('loading');
    expect(m.sections.places.status).toBe('loading');
    expect(m.sections.tags.status).toBe('loading');
  });

  it('runBatch does NOT re-invoke runNavigationProvider after the debounce', () => {
    const m = new GlobalSearchManager();
    const spy = vi.spyOn(
      m as unknown as { runNavigationProvider: (p: string, s: 'all' | 'nav') => unknown },
      'runNavigationProvider',
    );
    m.open();
    m.setQuery('classific');
    expect(spy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(200);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('empty query resets navigation back to idle', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('classific');
    expect(m.sections.navigation.status).toBe('ok');
    m.setQuery('');
    expect(m.sections.navigation.status).toBe('idle');
  });
});

describe('SWR loading rules', () => {
  beforeEach(() => {
    // resetAllMocks (not clearAllMocks) so any stray mockResolvedValueOnce /
    // mockImplementationOnce queued by a prior test is fully dropped. clear
    // only wipes call history, not implementation queues — which lets a prior
    // Once leak into the next test and consume the mockResolvedValueOnce we
    // set up here, returning the default empty payload instead.
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
    mockI18nLocale.current = 'en';
    vi.mocked(searchSmart).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchPerson).mockResolvedValue([] as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
    vi.mocked(getMlHealth).mockResolvedValue({ smartSearchHealthy: true } as never);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('flips empty → loading on new keystroke', async () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('xxxx');
    await vi.advanceTimersByTimeAsync(200);
    expect(m.sections.photos.status).toBe('empty');
    m.setQuery('yyyy');
    expect(m.sections.photos.status).toBe('loading');
  });

  it('flips error → loading on new keystroke', async () => {
    vi.mocked(searchSmart).mockImplementation(({ smartSearchDto }) => {
      if (smartSearchDto.query === 'xxxx') {
        return Promise.reject(new Error('boom'));
      }
      return Promise.resolve({ assets: { items: [], nextPage: null } } as never);
    });
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('xxxx');
    await vi.advanceTimersByTimeAsync(200);
    expect(m.sections.photos.status).toBe('error');
    m.setQuery('yyyy');
    expect(m.sections.photos.status).toBe('loading');
  });

  it('flips idle → loading on FIRST keystroke (cold open)', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('a');
    expect(m.sections.photos.status).toBe('loading');
  });

  it('batchInFlight is true during setQuery and false after all providers settle', async () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('beach');
    expect(m.batchInFlight).toBe(true);
    await vi.advanceTimersByTimeAsync(200);
    expect(m.batchInFlight).toBe(false);
  });

  it('cold-open first keystroke: navigation is ok instantly, entity sections flip to loading', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('classific');
    expect(m.sections.navigation.status).toBe('ok');
    expect(m.sections.photos.status).toBe('loading');
    expect(m.sections.people.status).toBe('loading');
  });

  it('setMode preserves ok photos until re-run completes (SWR)', async () => {
    const m = new GlobalSearchManager();
    const photosProvider = (m as unknown as { providers: { photos: Provider<EntityItem> } }).providers.photos;
    const originalPhotosRun = photosProvider.run;
    let resolveRerun!: () => void;

    photosProvider.run = vi.fn((_query: string, mode: SearchMode) => {
      if (mode === 'smart') {
        return Promise.resolve({
          status: 'ok',
          items: [{ id: 'a1' } as EntityItem],
          total: 1,
        } as ProviderStatus<EntityItem>);
      }
      return new Promise((r) => (resolveRerun = () => r({ status: 'empty' } as ProviderStatus<EntityItem>))) as Promise<
        ProviderStatus<EntityItem>
      >;
    });

    try {
      m.open();
      m.setQuery('beach');
      await vi.advanceTimersByTimeAsync(200);
      expect(m.sections.photos.status).toBe('ok');
      m.setMode('metadata');
      expect(m.sections.photos.status).toBe('ok');
      await flushMicrotasks();
      resolveRerun();
      await vi.advanceTimersByTimeAsync(10);
    } finally {
      photosProvider.run = originalPhotosRun;
    }
  });

  it('setMode joins the batch counter — mode switch during live batch does NOT drop stripe early', async () => {
    const m = new GlobalSearchManager();
    const photosProvider = (m as unknown as { providers: { photos: Provider<EntityItem> } }).providers.photos;
    const originalPhotosRun = photosProvider.run;
    let resolvePhotos!: () => void;

    photosProvider.run = vi.fn((_query: string, mode: SearchMode) => {
      if (mode === 'smart') {
        return new Promise(
          (r) => (resolvePhotos = () => r({ status: 'empty' } as ProviderStatus<EntityItem>)),
        ) as Promise<ProviderStatus<EntityItem>>;
      }
      return Promise.resolve({ status: 'empty' } as ProviderStatus<EntityItem>);
    });

    try {
      m.open();
      m.setQuery('beach');
      await vi.advanceTimersByTimeAsync(200);
      expect(m.batchInFlight).toBe(true);
      // Mode switch while photos is still in flight — counter should increment, not reset.
      m.setMode('metadata');
      expect(m.batchInFlight).toBe(true);
      // setMode's re-run resolves first from the provider override above.
      await vi.advanceTimersByTimeAsync(10);
      // Original photos is still unresolved — batchInFlight MUST remain true.
      expect(m.batchInFlight).toBe(true);
      // Finally, let the original photos resolve.
      resolvePhotos();
      await vi.advanceTimersByTimeAsync(10);
      expect(m.batchInFlight).toBe(false);
    } finally {
      photosProvider.run = originalPhotosRun;
    }
  });

  it('stale-batch providers do not deadlock batchInFlight after a new batch supersedes', async () => {
    let resolveStalePhotos!: () => void;
    const m = new GlobalSearchManager();
    const providers = (m as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    const originalPhotosRun = providers.photos.run;
    let invocationCount = 0;
    providers.photos.run = vi.fn((query, mode, signal) => {
      invocationCount++;
      if (invocationCount === 1) {
        return new Promise<ProviderStatus>((resolve) => {
          resolveStalePhotos = () => resolve({ status: 'ok' as const, items: [], total: 0 });
        });
      }
      return originalPhotosRun(query, mode, signal);
    });
    try {
      m.open();
      m.setQuery('first');
      await vi.advanceTimersByTimeAsync(200);
      expect(m.batchInFlight).toBe(true);
      // Second query — runBatch2 resets counter and uses the default empty mock so it settles fast.
      m.setQuery('second');
      await vi.advanceTimersByTimeAsync(200);
      expect(m.batchInFlight).toBe(false);
      // Release stale photos — check-before-decrement guard must prevent corruption.
      resolveStalePhotos();
      await vi.advanceTimersByTimeAsync(10);
      expect((m as unknown as { inFlightCounter: number }).inFlightCounter).toBe(0);
      expect(m.batchInFlight).toBe(false);
    } finally {
      providers.photos.run = originalPhotosRun;
    }
  });

  it('runBatch entry resets inFlightCounter to zero before incrementing per-provider', async () => {
    const m = new GlobalSearchManager();
    m.open();
    (m as unknown as { inFlightCounter: number }).inFlightCounter = 99;
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    expect((m as unknown as { inFlightCounter: number }).inFlightCounter).toBe(0);
  });

  it('setMode with empty query is a no-op (cold open)', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setMode('metadata');
    expect(m.batchInFlight).toBe(false);
    expect(m.sections.photos.status).toBe('idle');
    expect((m as unknown as { inFlightCounter: number }).inFlightCounter).toBe(0);
  });

  it('rapid mode switching does not decrement counter below zero', async () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    m.setMode('metadata');
    m.setMode('description');
    m.setMode('ocr');
    m.setMode('smart');
    await vi.advanceTimersByTimeAsync(100);
    expect(m.batchInFlight).toBe(false);
    expect((m as unknown as { inFlightCounter: number }).inFlightCounter).toBe(0);
  });
});

describe('activate navigation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetRecentStore();
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
  });

  const classificationItem = {
    id: 'nav:systemSettings:classification',
    category: 'systemSettings' as const,
    labelKey: 'admin.classification_settings',
    descriptionKey: 'admin.classification_settings_description',
    icon: 'x',
    route: '/admin/system-settings?isOpen=classification',
    adminOnly: true,
  };

  it('system-settings item: goto + persist navigate recent', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activate('nav', classificationItem);
    expect(goto).toHaveBeenCalledWith('/admin/system-settings?isOpen=classification');
    const entries = getEntries();
    expect(entries[0]).toMatchObject({
      kind: 'navigate',
      id: 'nav:systemSettings:classification',
      route: '/admin/system-settings?isOpen=classification',
      adminOnly: true,
    });
  });

  it('user-page item: goto + persist navigate recent with adminOnly:false', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activate('nav', {
      id: 'nav:userPages:photos',
      category: 'userPages' as const,
      labelKey: 'photos',
      descriptionKey: 'cmdk_nav_photos_description',
      icon: 'x',
      route: '/photos',
      adminOnly: false,
    });
    expect(goto).toHaveBeenCalledWith('/photos');
    expect(getEntries()[0]).toMatchObject({ kind: 'navigate', id: 'nav:userPages:photos', adminOnly: false });
  });

  it('closes the palette after navigating', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.activate('nav', classificationItem);
    expect(m.isOpen).toBe(false);
  });
});

describe('activateRecent stale admin purge', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetRecentStore();
  });

  const navEntry = {
    kind: 'navigate' as const,
    id: 'nav:admin:users',
    route: '/admin/users',
    labelKey: 'users',
    icon: 'x',
    adminOnly: true,
    lastUsed: 1,
  };

  it('admin user: navigates normally and does NOT purge', () => {
    mockUser.current = { id: 'test-user', isAdmin: true };
    const m = new GlobalSearchManager();
    m.open();
    addEntry(navEntry);
    m.activateRecent(navEntry);
    expect(goto).toHaveBeenCalledWith('/admin/users');
    expect(getEntries().some((e) => e.id === 'nav:admin:users')).toBe(true);
  });

  it('non-admin user: warns, purges entry, does NOT navigate', () => {
    mockUser.current = { id: 'test-user', isAdmin: false };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = new GlobalSearchManager();
    m.open();
    addEntry(navEntry);
    m.activateRecent(navEntry);
    expect(warnSpy).toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(getEntries().some((e) => e.id === 'nav:admin:users')).toBe(false);
    expect(m.isOpen).toBe(false);
    warnSpy.mockRestore();
  });

  it('non-admin user navigating to a NON-admin recent entry works normally', () => {
    mockUser.current = { id: 'test-user', isAdmin: false };
    const m = new GlobalSearchManager();
    m.open();
    const userPageEntry = {
      kind: 'navigate' as const,
      id: 'nav:userPages:photos',
      route: '/photos',
      labelKey: 'photos',
      icon: 'x',
      adminOnly: false,
      lastUsed: 1,
    };
    addEntry(userPageEntry);
    m.activateRecent(userPageEntry);
    expect(goto).toHaveBeenCalledWith('/photos');
    expect(getEntries().some((e) => e.id === 'nav:userPages:photos')).toBe(true);
  });
});

describe('batch lifecycle: close, empty-query, grace window (review fixes)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
    mockI18nLocale.current = 'en';
    vi.mocked(searchSmart).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchPerson).mockResolvedValue([] as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('setQuery(empty) resets batchInFlight, inFlightCounter, and _batchInFlightStartedAt', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('beach');
    expect(m.batchInFlight).toBe(true);
    m.setQuery('');
    expect(m.batchInFlight).toBe(false);
    expect((m as unknown as { inFlightCounter: number }).inFlightCounter).toBe(0);
    expect(m.batchInFlightStartedAt).toBe(0);
  });

  it('_batchInFlightStartedAt is +Infinity during the 150ms debounce window (grace hidden)', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('beach');
    // Sync check — no timer advancement yet, runBatch has not fired.
    expect(m.batchInFlightStartedAt).toBe(Number.POSITIVE_INFINITY);
    // Grace-window contract: `now - startedAt > 200` must be false, so the stripe stays hidden.
    expect(performance.now() - m.batchInFlightStartedAt > 200).toBe(false);
  });

  it('_batchInFlightStartedAt becomes a real performance.now() timestamp after runBatch fires', async () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    expect(Number.isFinite(m.batchInFlightStartedAt)).toBe(true);
    expect(m.batchInFlightStartedAt).toBeGreaterThanOrEqual(0);
  });

  it('setMode decrements counter when photos provider rejects (catch path)', async () => {
    // Use a stable default, not `mockResolvedValueOnce`, because stray async work
    // from nearby tests can consume a one-shot smart-search response before this
    // manager's first batch runs, making the initial assertion flaky in CI.
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [{ id: 'initial' } as never], nextPage: null },
    } as never);
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    expect(m.sections.photos.status).toBe('ok');
    vi.mocked(searchAssets).mockRejectedValueOnce(new Error('boom'));
    m.setMode('metadata');
    expect(m.batchInFlight).toBe(true);
    await vi.advanceTimersByTimeAsync(10);
    expect(m.batchInFlight).toBe(false);
    expect((m as unknown as { inFlightCounter: number }).inFlightCounter).toBe(0);
    expect(m.sections.photos.status).toBe('error');
  });

  it('setQuery reconciles cursor synchronously so stale nav highlight is not left behind', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('theme');
    // At this point reconcileCursor has placed activeItemId on the first nav item
    // (because photos/people/places/tags are all loading). Manually poison the cursor.
    m.activeItemId = 'nav:nonexistent-item';
    m.setQuery('themes');
    // After setQuery, reconcileCursor must have replaced the stale id with something
    // that exists in the current navigation section (or null).
    expect(m.activeItemId).not.toBe('nav:nonexistent-item');
  });
});

describe('activateRecent stale-state purge (review fix U2)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetRecentStore();
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
  });

  it('purges a navigate recent whose feature flag is now disabled', () => {
    mockFlags.valueOrUndefined = { search: true, map: false, trash: true };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = new GlobalSearchManager();
    m.open();
    const mapEntry = {
      kind: 'navigate' as const,
      id: 'nav:userPages:map',
      route: '/map',
      labelKey: 'map',
      icon: 'x',
      adminOnly: false,
      lastUsed: 1,
    };
    addEntry(mapEntry);
    m.activateRecent(mapEntry);
    expect(warnSpy).toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(getEntries().some((e) => e.id === 'nav:userPages:map')).toBe(false);
    warnSpy.mockRestore();
  });

  it('purges a navigate recent whose NavigationItem no longer exists in the catalog', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = new GlobalSearchManager();
    m.open();
    const ghostEntry = {
      kind: 'navigate' as const,
      id: 'nav:removed:feature',
      route: '/removed',
      labelKey: 'removed',
      icon: 'x',
      adminOnly: false,
      lastUsed: 1,
    };
    addEntry(ghostEntry);
    m.activateRecent(ghostEntry);
    expect(warnSpy).toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(getEntries().some((e) => e.id === 'nav:removed:feature')).toBe(false);
    warnSpy.mockRestore();
  });

  it('admin status re-check uses the live NavigationItem.adminOnly, not the stored entry', () => {
    // Saved entry has adminOnly=false (stale), but nav:systemSettings:classification is
    // actually adminOnly=true in the live catalog. A non-admin user should still be purged.
    mockUser.current = { id: 'test-user', isAdmin: false };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = new GlobalSearchManager();
    m.open();
    const entry = {
      kind: 'navigate' as const,
      id: 'nav:systemSettings:classification',
      route: '/admin/system-settings?isOpen=classification',
      labelKey: 'admin.classification_settings',
      icon: 'x',
      adminOnly: false, // stale — live catalog says true
      lastUsed: 1,
    };
    addEntry(entry);
    m.activateRecent(entry);
    expect(warnSpy).toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(getEntries().some((e) => e.id === entry.id)).toBe(false);
    warnSpy.mockRestore();
  });
});

describe('setMode stale photos race (review fix U3)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
    mockI18nLocale.current = 'en';
    vi.mocked(searchPerson).mockResolvedValue([] as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('stale first-setMode photos does not overwrite fresh second-setMode photos', async () => {
    // Initial batch: photos = [initial]
    // Use a stable default, not `mockResolvedValueOnce`, because stray async work
    // from nearby tests can consume a one-shot smart-search response before this
    // manager's first batch runs, making the initial assertion flaky in CI.
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [{ id: 'initial' } as never], nextPage: null },
    } as never);
    // First setMode (metadata): slow — stays pending until resolvePhotos1().
    let resolvePhotos1!: () => void;
    vi.mocked(searchAssets).mockImplementationOnce(
      () =>
        new Promise(
          (r) => (resolvePhotos1 = () => r({ assets: { items: [{ id: 'stale' } as never], nextPage: null } } as never)),
        ),
    );
    // Second setMode (description): fast — resolves to {fresh}.
    vi.mocked(searchAssets).mockResolvedValueOnce({
      assets: { items: [{ id: 'fresh' } as never], nextPage: null },
    } as never);

    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('beach');
    await vi.advanceTimersByTimeAsync(200);
    expect(m.sections.photos.status).toBe('ok');

    m.setMode('metadata'); // starts photos1 (stuck)
    m.setMode('description'); // aborts photos1's photosController, starts photos2 (fast)
    await vi.advanceTimersByTimeAsync(10); // photos2 resolves → photos should be {fresh}
    if (m.sections.photos.status === 'ok') {
      const ids = m.sections.photos.items.map((p) => (p as { id: string }).id);
      expect(ids).toContain('fresh');
    }

    // Now release photos1 — its .then runs. Without the U3 fix it would overwrite
    // sections.photos with [stale]. With the fix, signal.aborted check prevents the write.
    resolvePhotos1();
    await vi.advanceTimersByTimeAsync(10);
    expect(m.sections.photos.status).toBe('ok');
    if (m.sections.photos.status === 'ok') {
      const ids = m.sections.photos.items.map((p) => (p as { id: string }).id);
      expect(ids).toContain('fresh');
      expect(ids).not.toContain('stale');
    }
    expect(m.batchInFlight).toBe(false);
    expect((m as unknown as { inFlightCounter: number }).inFlightCounter).toBe(0);
  });
});

describe('Batch 4 post-review: route consistency, SWR cursor, debounce-window close (NF1/CG2/UE1/UE2)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetRecentStore();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
    mockI18nLocale.current = 'en';
    vi.mocked(searchSmart).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchPerson).mockResolvedValue([] as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
  });
  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  // NF1 / CG1: the fix uses LIVE NavigationItem.route, not the stored entry.route.
  // An upstream rename (route change) would otherwise leak 404s via recents.
  it('activateRecent navigates to the LIVE NavigationItem.route even when the saved entry.route is stale', () => {
    const m = new GlobalSearchManager();
    m.open();
    // Saved entry has a fake old path; the live catalog has '/memories' for memories.
    const staleEntry = {
      kind: 'navigate' as const,
      id: 'nav:userPages:memories',
      route: '/old-memories-path',
      labelKey: 'memories',
      icon: 'x',
      adminOnly: false,
      lastUsed: 1,
    };
    addEntry(staleEntry);
    m.activateRecent(staleEntry);
    // NAVIGATION_ITEMS defines memories.route as '/memories'. The live value must win.
    expect(goto).toHaveBeenCalledWith('/memories');
    expect(goto).not.toHaveBeenCalledWith('/old-memories-path');
  });

  // CG2: reconcileCursor inside setQuery must NOT jump the highlight off a valid
  // SWR-preserved photo cursor when the user types another keystroke.
  // UE1: close() fired during the 150ms debounce window (before runBatch ever ran).
  // Prior tests close AFTER runBatch has fired; this one verifies the earlier state.
  it('close() during the debounce window clears pending runBatch and resets all state', () => {
    const m = new GlobalSearchManager();
    m.open();
    m.setQuery('beach');
    expect(m.batchInFlight).toBe(true);
    expect(m.batchInFlightStartedAt).toBe(Number.POSITIVE_INFINITY);
    m.close();
    expect(m.batchInFlight).toBe(false);
    expect(m.batchInFlightStartedAt).toBe(0);
    expect((m as unknown as { inFlightCounter: number }).inFlightCounter).toBe(0);
    // Advancing time should NOT fire the pending runBatch — it was cleared.
    vi.advanceTimersByTime(500);
    expect(m.batchInFlight).toBe(false);
    expect(m.sections.photos.status).toBe('idle');
  });

  // UE2: feature-flag ENABLED positive path — mirrors the disabled-→-purge test.
  it("activateRecent navigates normally when the navigate entry's feature flag is enabled", () => {
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
    const m = new GlobalSearchManager();
    m.open();
    const mapEntry = {
      kind: 'navigate' as const,
      id: 'nav:userPages:map',
      route: '/map',
      labelKey: 'map',
      icon: 'x',
      adminOnly: false,
      lastUsed: 1,
    };
    addEntry(mapEntry);
    m.activateRecent(mapEntry);
    expect(goto).toHaveBeenCalledWith('/map');
    expect(getEntries().some((e) => e.id === 'nav:userPages:map')).toBe(true);
  });
});

describe('getActiveItem recent-entry preview lookup (cold open)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetRecentStore();
  });

  it('synthesizes a photo ActiveItem from a photo recent when the query is empty', () => {
    addEntry({ kind: 'photo', id: 'photo:a1', assetId: 'a1', label: 'sunset.jpg', lastUsed: 1 });
    const m = new GlobalSearchManager();
    m.open();
    m.activeItemId = 'photo:a1';
    const active = m.getActiveItem();
    expect(active).not.toBeNull();
    expect(active?.kind).toBe('photo');
    if (active?.kind === 'photo') {
      const data = active.data as { id: string; originalFileName: string };
      expect(data.id).toBe('a1');
      expect(data.originalFileName).toBe('sunset.jpg');
    }
  });

  it('synthesizes a person ActiveItem from a person recent', () => {
    addEntry({
      kind: 'person',
      id: 'person:p1',
      personId: 'p1',
      label: 'Alice',
      lastUsed: 1,
    });
    const m = new GlobalSearchManager();
    m.open();
    m.activeItemId = 'person:p1';
    const active = m.getActiveItem();
    expect(active?.kind).toBe('person');
    if (active?.kind === 'person') {
      const data = active.data as { id: string; name: string };
      expect(data.id).toBe('p1');
      expect(data.name).toBe('Alice');
    }
  });

  it('synthesizes a place ActiveItem from a place recent', () => {
    addEntry({
      kind: 'place',
      id: 'place:48.8566:2.3522',
      label: 'Paris',
      latitude: 48.8566,
      longitude: 2.3522,
      lastUsed: 1,
    });
    const m = new GlobalSearchManager();
    m.open();
    m.activeItemId = 'place:48.8566:2.3522';
    const active = m.getActiveItem();
    expect(active?.kind).toBe('place');
    if (active?.kind === 'place') {
      const data = active.data as { name: string; latitude: number; longitude: number };
      expect(data.name).toBe('Paris');
      expect(data.latitude).toBe(48.8566);
      expect(data.longitude).toBe(2.3522);
    }
  });

  it('synthesizes a tag ActiveItem from a tag recent', () => {
    addEntry({ kind: 'tag', id: 'tag:t1', tagId: 't1', label: 'vacation', lastUsed: 1 });
    const m = new GlobalSearchManager();
    m.open();
    m.activeItemId = 'tag:t1';
    const active = m.getActiveItem();
    expect(active?.kind).toBe('tag');
    if (active?.kind === 'tag') {
      const data = active.data as { id: string; name: string };
      expect(data.id).toBe('t1');
      expect(data.name).toBe('vacation');
    }
  });

  it('returns null for a query-kind recent (no meaningful preview)', () => {
    addEntry({ kind: 'query', id: 'query:beach', text: 'beach', lastUsed: 1 });
    const m = new GlobalSearchManager();
    m.open();
    m.activeItemId = 'query:beach';
    expect(m.getActiveItem()).toBeNull();
  });

  it('returns null for a navigate-kind recent (no preview pane for nav items)', () => {
    addEntry({
      kind: 'navigate',
      id: 'nav:userPages:photos',
      route: '/photos',
      labelKey: 'photos',
      icon: 'x',
      adminOnly: false,
      lastUsed: 1,
    });
    const m = new GlobalSearchManager();
    m.open();
    m.activeItemId = 'nav:userPages:photos';
    expect(m.getActiveItem()).toBeNull();
  });

  it('activate nav: same-pathname navigation uses a full browser reload, not goto', () => {
    // When the user is already on /admin/system-settings and picks a different
    // system-settings accordion, SvelteKit's client-side `goto` only updates query
    // params without re-running the page component — URL-backed state (e.g.,
    // SettingAccordionState) stays on its stale initial value. The manager must
    // detect this case and do a full browser navigation so every component remounts.
    const originalLocation = globalThis.location;
    const hrefSetter = vi.fn();
    const fakeLocation: Record<string, unknown> = {
      pathname: '/admin/system-settings',
    };
    Object.defineProperty(fakeLocation, 'href', {
      configurable: true,
      get: () => 'http://localhost/admin/system-settings?isOpen=classification',
      set: (v: string) => hrefSetter(v),
    });
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: fakeLocation,
    });
    try {
      const m = new GlobalSearchManager();
      m.open();
      m.activate('nav', {
        id: 'nav:systemSettings:video-transcoding',
        category: 'systemSettings' as const,
        labelKey: 'admin.transcoding_settings',
        descriptionKey: 'admin.transcoding_settings_description',
        icon: 'x',
        route: '/admin/system-settings?isOpen=video-transcoding',
        adminOnly: true,
      });
      // Full browser navigation via location.href = route
      expect(hrefSetter).toHaveBeenCalledWith('/admin/system-settings?isOpen=video-transcoding');
      // Client-side goto must NOT have fired — that would leave the accordion stale.
      expect(goto).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('activate nav: different-pathname navigation uses client-side goto (unchanged)', () => {
    const originalLocation = globalThis.location;
    const fakeLocation: Record<string, unknown> = {
      pathname: '/photos',
      href: 'http://localhost/photos',
    };
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: fakeLocation,
    });
    try {
      const m = new GlobalSearchManager();
      m.open();
      m.activate('nav', {
        id: 'nav:systemSettings:video-transcoding',
        category: 'systemSettings' as const,
        labelKey: 'admin.transcoding_settings',
        descriptionKey: 'admin.transcoding_settings_description',
        icon: 'x',
        route: '/admin/system-settings?isOpen=video-transcoding',
        adminOnly: true,
      });
      expect(goto).toHaveBeenCalledWith('/admin/system-settings?isOpen=video-transcoding');
    } finally {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('falls through to section lookup when activeItemId does not match any recent', () => {
    // Empty recents store, activeItemId matches a section item. getActiveItem should
    // still resolve via the section path (not dead-end at the recent-lookup branch).
    const m = new GlobalSearchManager();
    m.activeItemId = 'photo:a1';
    m.sections = {
      photos: { status: 'ok', items: [{ id: 'a1', originalFileName: 'x.jpg' } as never], total: 1 },
      people: { status: 'empty' },
      places: { status: 'empty' },
      tags: { status: 'empty' },
      albums: { status: 'empty' },
      spaces: { status: 'empty' },
      navigation: { status: 'empty' },
      commands: { status: 'empty' },
    };
    // query is empty but no recent matches — fall-through to section.
    const active = m.getActiveItem();
    expect(active?.kind).toBe('photo');
  });
});

describe('closeSignal lifecycle', () => {
  it('aborts on close(), creates fresh signal on open()', () => {
    const sut = new GlobalSearchManager();
    sut.open();
    const firstSignal = sut.closeSignal;
    expect(firstSignal.aborted).toBe(false);

    sut.close();
    expect(firstSignal.aborted).toBe(true);

    sut.open();
    expect(sut.closeSignal.aborted).toBe(false);
    expect(sut.closeSignal).not.toBe(firstSignal);
  });
});

describe('album catalog fetch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('dedupes by id, preferring the shared record', async () => {
    const response = [
      { id: 'a1', albumName: 'Beach', shared: false, albumThumbnailAssetId: null, assetCount: 1 },
      { id: 'a1', albumName: 'Beach', shared: true, albumThumbnailAssetId: 't', assetCount: 1 },
      { id: 'a2', albumName: 'Solo', shared: false, albumThumbnailAssetId: null, assetCount: 0 },
    ];
    vi.mocked(getAlbumNames).mockResolvedValue(response as unknown as Awaited<ReturnType<typeof getAlbumNames>>);

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.ensureAlbumsCache();

    expect(sut.albumsCache).toHaveLength(2);
    expect(sut.albumsCache?.find((a) => a.id === 'a1')).toMatchObject({
      shared: true,
      albumThumbnailAssetId: 't',
    });
    expect(sut.albumsCache?.find((a) => a.id === 'a2')).toMatchObject({ shared: false });
  });

  it('returns the same in-flight promise across concurrent ensureAlbumsCache() calls', async () => {
    vi.mocked(getAlbumNames).mockResolvedValue([
      { id: 'a1', albumName: 'X', shared: false, albumThumbnailAssetId: null, assetCount: 0 },
    ] as unknown as Awaited<ReturnType<typeof getAlbumNames>>);

    const sut = new GlobalSearchManager();
    sut.open();
    const p1 = sut.ensureAlbumsCache();
    const p2 = sut.ensureAlbumsCache();
    await Promise.all([p1, p2]);

    expect(getAlbumNames).toHaveBeenCalledTimes(1);
    expect(sut.albumsCache).toHaveLength(1);
  });

  it('uses closeSignal for the fetch (survives batch rotation)', async () => {
    // The fetch binds to closeSignal, not the per-keystroke batchController, so
    // rotating the batch must NOT reject the catalog fetch.
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(getAlbumNames).mockImplementation((opts) => {
      capturedSignal = (opts as { signal?: AbortSignal } | undefined)?.signal;
      return Promise.resolve([]) as unknown as ReturnType<typeof getAlbumNames>;
    });

    const sut = new GlobalSearchManager();
    sut.open();
    const promise = sut.ensureAlbumsCache();
    // batchController is protected; cast to reach it from the test — the test
    // must exercise batch rotation specifically, which lives on that field.
    (sut as unknown as { batchController: AbortController | null }).batchController?.abort();
    await expect(promise).resolves.toBeUndefined();
    expect(capturedSignal).toBe(sut.closeSignal);
  });

  it('AbortError on close does NOT transition section to error', async () => {
    vi.mocked(getAlbumNames).mockImplementation((opts) => {
      const signal = (opts as { signal?: AbortSignal } | undefined)?.signal;
      return new Promise((_, reject) => {
        signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      }) as unknown as ReturnType<typeof getAlbumNames>;
    });

    const sut = new GlobalSearchManager();
    sut.open();
    const p = sut.ensureAlbumsCache();
    sut.close();
    await p;
    expect(sut.sections.albums.status).not.toBe('error');
  });

  it('non-abort error transitions albums section to error and rethrows', async () => {
    vi.mocked(getAlbumNames).mockRejectedValue(new Error('network down'));
    const sut = new GlobalSearchManager();
    sut.open();
    await expect(sut.ensureAlbumsCache()).rejects.toThrow('network down');
    expect(sut.sections.albums.status).toBe('error');
  });

  it('reopening after a rejected fetch does not satisfy the next ensureAlbumsCache()', async () => {
    vi.mocked(getAlbumNames).mockRejectedValueOnce(new Error('first fails'));
    const sut = new GlobalSearchManager();
    sut.open();
    await expect(sut.ensureAlbumsCache()).rejects.toThrow('first fails');

    // Next open: must reset the cached promise so the retry actually fires.
    vi.mocked(getAlbumNames).mockResolvedValueOnce([
      { id: 'a1', albumName: 'Recovered', shared: false, albumThumbnailAssetId: null, assetCount: 0 },
    ] as unknown as Awaited<ReturnType<typeof getAlbumNames>>);
    sut.close();
    sut.open();
    await sut.ensureAlbumsCache();
    expect(getAlbumNames).toHaveBeenCalledTimes(2);
    expect(sut.albumsCache).toHaveLength(1);
  });
});

describe('spaces catalog fetch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('populates spacesCache with the raw response (no dedupe needed)', async () => {
    const response = [
      { id: 's1', name: 'Family', createdAt: '2026-01-01', createdById: 'u1' },
      { id: 's2', name: 'Friends', createdAt: '2026-01-02', createdById: 'u1' },
    ];
    vi.mocked(getAllSpaces).mockResolvedValue(response as unknown as Awaited<ReturnType<typeof getAllSpaces>>);

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.ensureSpacesCache();

    expect(sut.spacesCache).toHaveLength(2);
    expect(getAllSpaces).toHaveBeenCalledWith(expect.objectContaining({ signal: sut.closeSignal }));
  });

  it('AbortError on close does NOT transition section to error', async () => {
    vi.mocked(getAllSpaces).mockImplementation((opts) => {
      const signal = (opts as { signal?: AbortSignal } | undefined)?.signal;
      return new Promise((_, reject) => {
        signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      }) as unknown as ReturnType<typeof getAllSpaces>;
    });

    const sut = new GlobalSearchManager();
    sut.open();
    const p = sut.ensureSpacesCache();
    sut.close();
    await p;
    expect(sut.sections.spaces.status).not.toBe('error');
  });

  it('non-abort error transitions spaces section to error and rethrows', async () => {
    vi.mocked(getAllSpaces).mockRejectedValue(new Error('boom'));
    const sut = new GlobalSearchManager();
    sut.open();
    await expect(sut.ensureSpacesCache()).rejects.toThrow('boom');
    expect(sut.sections.spaces.status).toBe('error');
  });

  it('dedupes concurrent ensureSpacesCache() calls into a single fetch', async () => {
    vi.mocked(getAllSpaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllSpaces>>);
    const sut = new GlobalSearchManager();
    sut.open();
    await Promise.all([sut.ensureSpacesCache(), sut.ensureSpacesCache()]);
    expect(getAllSpaces).toHaveBeenCalledTimes(1);
  });
});

describe('runBatch dispatches albums and spaces providers', () => {
  // Wires Task 10's runAlbums + Task 11's runSpaces into the runBatch dispatch.
  // Without this wiring, typing fires only photos/people/places/tags and the albums
  // and spaces sections would stay at `loading` forever for any query over
  // minQueryLength. runBatch is protected and driven from `setQuery` in every
  // other suite — use the same entry point here.
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    // Keep the entity providers quiet so only the methods under test drive state.
    vi.mocked(searchSmart).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchPerson).mockResolvedValue([] as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
    vi.mocked(getAlbumNames).mockResolvedValue([] as never);
    vi.mocked(getAllSpaces).mockResolvedValue([] as never);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('runBatch calls runAlbums and runSpaces with the query', async () => {
    const sut = new GlobalSearchManager();
    sut.open();
    const runAlbums = vi.spyOn(sut, 'runAlbums').mockResolvedValue(undefined);
    const runSpaces = vi.spyOn(sut, 'runSpaces').mockResolvedValue(undefined);
    sut.setQuery('hawaii');
    await vi.advanceTimersByTimeAsync(200);
    expect(runAlbums).toHaveBeenCalledWith('hawaii');
    expect(runSpaces).toHaveBeenCalledWith('hawaii');
  });

  it('runBatch still excludes navigation from the async dispatch tuple', async () => {
    // Regression pin: nav flows through a synchronous filter inside setQuery
    // (runNavigationProvider), not the async batch. If runBatch ever iterates
    // 'navigation', the stub provider's run() would fire — assert it does not.
    const sut = new GlobalSearchManager();
    sut.open();
    const providers = (sut as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    const navRun = vi.spyOn(providers.navigation, 'run');
    sut.setQuery('hawaii');
    await vi.advanceTimersByTimeAsync(200);
    expect(navRun).not.toHaveBeenCalled();
  });
});

describe('activation state', () => {
  it('tracks in-flight activations', () => {
    const sut = new GlobalSearchManager();
    sut.activationInFlight.add('album:x');
    expect(sut.activationInFlight.has('album:x')).toBe(true);
    expect(sut.activationInFlight.size).toBe(1);
  });

  it('pendingActivation is initially null', () => {
    const sut = new GlobalSearchManager();
    expect(sut.pendingActivation).toBeNull();
  });
});

describe('activateAlbum', () => {
  // Minimum fields that satisfy AlbumResponseDto for the code paths exercised here.
  // The manager only reads `albumName` and `albumThumbnailAssetId` when writing the
  // recent entry — the rest is structural padding to keep the Awaited<> cast happy.
  const albumResponse = {
    id: 'a1',
    albumName: 'Hawaii 2024',
    albumThumbnailAssetId: 'thumb-a1',
    shared: false,
    assetCount: 42,
    albumUsers: [],
    assets: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    hasSharedLink: false,
    owner: { id: 'u1', name: 'me', email: 'me@x', profileImagePath: '', avatarColor: 'primary' },
    ownerId: 'u1',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-01-02T00:00:00Z',
  } as unknown as Awaited<ReturnType<typeof getAlbumInfo>>;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetRecentStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('happy path: resolves + writes recent + navigates', async () => {
    vi.mocked(getAlbumInfo).mockResolvedValue(albumResponse);

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.activateAlbum('a1');

    expect(getAlbumInfo).toHaveBeenCalledWith({ id: 'a1' }, expect.objectContaining({ signal: sut.closeSignal }));
    expect(goto).toHaveBeenCalledWith('/albums/a1');

    const entries = getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: 'album',
      id: 'album:a1',
      albumId: 'a1',
      label: 'Hawaii 2024',
      thumbnailAssetId: 'thumb-a1',
    });
  });

  it('closes the palette after successful navigation', async () => {
    vi.mocked(getAlbumInfo).mockResolvedValue(albumResponse);

    const sut = new GlobalSearchManager();
    sut.open();
    expect(sut.isOpen).toBe(true);
    await sut.activateAlbum('a1');
    expect(sut.isOpen).toBe(false);
  });

  it('404: toast + removeById + no navigation', async () => {
    // Seed a stale recent so the purge path has something to remove.
    addEntry({
      kind: 'album',
      id: 'album:a1',
      albumId: 'a1',
      label: 'Stale',
      thumbnailAssetId: null,
      lastUsed: 1,
    });
    vi.mocked(getAlbumInfo).mockRejectedValue(Object.assign(new Error('not found'), { status: 404 }));

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.activateAlbum('a1');

    expect(toastManager.warning).toHaveBeenCalledTimes(1);
    expect(getEntries().find((e) => e.id === 'album:a1')).toBeUndefined();
    expect(goto).not.toHaveBeenCalled();
  });

  it('does NOT close the palette on stale-entry (404) so the user sees the toast', async () => {
    vi.mocked(getAlbumInfo).mockRejectedValue(Object.assign(new Error('not found'), { status: 404 }));

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.activateAlbum('a1');
    expect(sut.isOpen).toBe(true);
  });

  it('403: toast + removeById + no navigation', async () => {
    addEntry({
      kind: 'album',
      id: 'album:a1',
      albumId: 'a1',
      label: 'Stale',
      thumbnailAssetId: null,
      lastUsed: 1,
    });
    vi.mocked(getAlbumInfo).mockRejectedValue(Object.assign(new Error('forbidden'), { status: 403 }));

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.activateAlbum('a1');

    expect(toastManager.warning).toHaveBeenCalledTimes(1);
    expect(getEntries().find((e) => e.id === 'album:a1')).toBeUndefined();
    expect(goto).not.toHaveBeenCalled();
  });

  // Gallery's server `requireAccess` middleware raises BadRequestException (HTTP 400)
  // for both "row missing" and "no access" — so a stale RECENT id surfaces as 400,
  // not 404/403. Treat it identically to the canonical stale-cache statuses.
  it('400: toast + removeById + no navigation (Gallery requireAccess)', async () => {
    addEntry({
      kind: 'album',
      id: 'album:a1',
      albumId: 'a1',
      label: 'Stale',
      thumbnailAssetId: null,
      lastUsed: 1,
    });
    vi.mocked(getAlbumInfo).mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.activateAlbum('a1');

    expect(toastManager.warning).toHaveBeenCalledTimes(1);
    expect(getEntries().find((e) => e.id === 'album:a1')).toBeUndefined();
    expect(goto).not.toHaveBeenCalled();
  });

  it('401: re-throws to global auth interceptor', async () => {
    const authError = Object.assign(new Error('unauthorized'), { status: 401 });
    vi.mocked(getAlbumInfo).mockRejectedValue(authError);

    const sut = new GlobalSearchManager();
    sut.open();
    await expect(sut.activateAlbum('a1')).rejects.toBe(authError);

    expect(toastManager.warning).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(getEntries()).toHaveLength(0);
  });

  it('double-Enter guard: second call no-ops while first is in flight', async () => {
    // Deferred promise so the first activation sits pending while we fire the second.
    let resolveInfo: (v: Awaited<ReturnType<typeof getAlbumInfo>>) => void = () => {};
    const deferred = new Promise<Awaited<ReturnType<typeof getAlbumInfo>>>((resolve) => {
      resolveInfo = resolve;
    });
    vi.mocked(getAlbumInfo).mockReturnValue(deferred as ReturnType<typeof getAlbumInfo>);

    const sut = new GlobalSearchManager();
    sut.open();
    const first = sut.activateAlbum('a1');
    const second = sut.activateAlbum('a1');
    resolveInfo(albumResponse);
    await Promise.all([first, second]);

    expect(getAlbumInfo).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledTimes(1);
  });

  it('escape-during-resolve: close() aborts, no navigation', async () => {
    vi.mocked(getAlbumInfo).mockImplementation((_args, opts) => {
      const signal = (opts as { signal?: AbortSignal } | undefined)?.signal;
      return new Promise((_, reject) => {
        signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      }) as unknown as ReturnType<typeof getAlbumInfo>;
    });

    const sut = new GlobalSearchManager();
    sut.open();
    const activation = sut.activateAlbum('a1');
    sut.close();
    await activation;

    expect(goto).not.toHaveBeenCalled();
    expect(toastManager.warning).not.toHaveBeenCalled();
  });

  it('keystroke-during-activation: batch.abort() does NOT abort activation', async () => {
    let resolveInfo: (v: Awaited<ReturnType<typeof getAlbumInfo>>) => void = () => {};
    const deferred = new Promise<Awaited<ReturnType<typeof getAlbumInfo>>>((resolve) => {
      resolveInfo = resolve;
    });
    // Implementation ignores the signal — we want the activation to survive a batch
    // rotation, so even if the batch controller aborts the fetch must still resolve.
    vi.mocked(getAlbumInfo).mockReturnValue(deferred as ReturnType<typeof getAlbumInfo>);

    const sut = new GlobalSearchManager();
    sut.open();
    const activation = sut.activateAlbum('a1');
    // Rotate the batch controller — simulates a fresh keystroke landing while the
    // activation is still in flight. Activation binds to closeSignal, not
    // batchController, so this must NOT short-circuit the navigation.
    (sut as unknown as { batchController: AbortController | null }).batchController = new AbortController();
    (sut as unknown as { batchController: AbortController }).batchController.abort();
    resolveInfo(albumResponse);
    await activation;

    expect(goto).toHaveBeenCalledWith('/albums/a1');
  });

  it('pending-row affordance: pendingActivation set at 200ms', async () => {
    vi.useFakeTimers();
    vi.mocked(getAlbumInfo).mockImplementation(
      () =>
        new Promise((resolve) => {
          // Resolve after 300ms of virtual time.
          setTimeout(() => resolve(albumResponse), 300);
        }) as unknown as ReturnType<typeof getAlbumInfo>,
    );

    const sut = new GlobalSearchManager();
    sut.open();
    const activation = sut.activateAlbum('a1');

    await vi.advanceTimersByTimeAsync(100);
    expect(sut.pendingActivation).toBeNull();

    await vi.advanceTimersByTimeAsync(100); // total = 200ms
    expect(sut.pendingActivation).toBe('album:a1');

    await vi.advanceTimersByTimeAsync(200); // total = 400ms — past the 300ms resolve
    await activation;
    expect(sut.pendingActivation).toBeNull();
  });

  it('pending-timer cleared on fast resolve (<200ms)', async () => {
    vi.useFakeTimers();
    vi.mocked(getAlbumInfo).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(albumResponse), 50);
        }) as unknown as ReturnType<typeof getAlbumInfo>,
    );

    const sut = new GlobalSearchManager();
    sut.open();
    const activation = sut.activateAlbum('a1');
    await vi.advanceTimersByTimeAsync(50);
    await activation;
    // Past the 200ms pending threshold — if the timer wasn't cleared in `finally`,
    // pendingActivation would now flip to 'album:a1' even though activation is done.
    await vi.advanceTimersByTimeAsync(300);

    expect(sut.pendingActivation).toBeNull();
  });
});

describe('activateSpace', () => {
  // Minimum fields that satisfy SharedSpaceResponseDto for the code paths exercised
  // here. The manager only reads `name` and `color` when writing the recent entry —
  // the rest is structural padding to keep the Awaited<> cast happy.
  const spaceResponse = {
    id: 's1',
    name: 'Family',
    color: 'primary',
    createdAt: '2026-01-01T00:00:00Z',
    createdById: 'u1',
    updatedAt: '2026-01-01T00:00:00Z',
  } as unknown as Awaited<ReturnType<typeof getSpace>>;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    resetRecentStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('happy path: resolves + writes recent + navigates', async () => {
    vi.mocked(getSpace).mockResolvedValue(spaceResponse);

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.activateSpace('s1');

    expect(getSpace).toHaveBeenCalledWith({ id: 's1' }, expect.objectContaining({ signal: sut.closeSignal }));
    expect(goto).toHaveBeenCalledWith('/spaces/s1');

    const entries = getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: 'space',
      id: 'space:s1',
      spaceId: 's1',
      label: 'Family',
      colorHex: 'primary',
    });
  });

  it('closes the palette after successful navigation', async () => {
    vi.mocked(getSpace).mockResolvedValue(spaceResponse);

    const sut = new GlobalSearchManager();
    sut.open();
    expect(sut.isOpen).toBe(true);
    await sut.activateSpace('s1');
    expect(sut.isOpen).toBe(false);
  });

  it('does NOT close the palette on stale-entry (404) so the user sees the toast', async () => {
    vi.mocked(getSpace).mockRejectedValue(Object.assign(new Error('not found'), { status: 404 }));

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.activateSpace('s1');
    expect(sut.isOpen).toBe(true);
  });

  it('404: toast + removeById + no navigation', async () => {
    // Seed a stale recent so the purge path has something to remove.
    addEntry({
      kind: 'space',
      id: 'space:s1',
      spaceId: 's1',
      label: 'Stale',
      colorHex: null,
      lastUsed: 1,
    });
    vi.mocked(getSpace).mockRejectedValue(Object.assign(new Error('not found'), { status: 404 }));

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.activateSpace('s1');

    expect(toastManager.warning).toHaveBeenCalledTimes(1);
    expect(getEntries().find((e) => e.id === 'space:s1')).toBeUndefined();
    expect(goto).not.toHaveBeenCalled();
  });

  it('403: toast + removeById + no navigation', async () => {
    addEntry({
      kind: 'space',
      id: 'space:s1',
      spaceId: 's1',
      label: 'Stale',
      colorHex: null,
      lastUsed: 1,
    });
    vi.mocked(getSpace).mockRejectedValue(Object.assign(new Error('forbidden'), { status: 403 }));

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.activateSpace('s1');

    expect(toastManager.warning).toHaveBeenCalledTimes(1);
    expect(getEntries().find((e) => e.id === 'space:s1')).toBeUndefined();
    expect(goto).not.toHaveBeenCalled();
  });

  // Gallery's server `requireAccess` middleware raises BadRequestException (HTTP 400)
  // for both "row missing" and "no access" — so a stale RECENT id surfaces as 400,
  // not 404/403. Treat it identically to the canonical stale-cache statuses.
  it('400: toast + removeById + no navigation (Gallery requireAccess)', async () => {
    addEntry({
      kind: 'space',
      id: 'space:s1',
      spaceId: 's1',
      label: 'Stale',
      colorHex: null,
      lastUsed: 1,
    });
    vi.mocked(getSpace).mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));

    const sut = new GlobalSearchManager();
    sut.open();
    await sut.activateSpace('s1');

    expect(toastManager.warning).toHaveBeenCalledTimes(1);
    expect(getEntries().find((e) => e.id === 'space:s1')).toBeUndefined();
    expect(goto).not.toHaveBeenCalled();
  });

  it('401: re-throws to global auth interceptor', async () => {
    const authError = Object.assign(new Error('unauthorized'), { status: 401 });
    vi.mocked(getSpace).mockRejectedValue(authError);

    const sut = new GlobalSearchManager();
    sut.open();
    await expect(sut.activateSpace('s1')).rejects.toBe(authError);

    expect(toastManager.warning).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(getEntries()).toHaveLength(0);
  });

  it('double-Enter guard: second call no-ops while first is in flight', async () => {
    // Deferred promise so the first activation sits pending while we fire the second.
    let resolveInfo: (v: Awaited<ReturnType<typeof getSpace>>) => void = () => {};
    const deferred = new Promise<Awaited<ReturnType<typeof getSpace>>>((resolve) => {
      resolveInfo = resolve;
    });
    vi.mocked(getSpace).mockReturnValue(deferred as ReturnType<typeof getSpace>);

    const sut = new GlobalSearchManager();
    sut.open();
    const first = sut.activateSpace('s1');
    const second = sut.activateSpace('s1');
    resolveInfo(spaceResponse);
    await Promise.all([first, second]);

    expect(getSpace).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledTimes(1);
  });

  it('escape-during-resolve: close() aborts, no navigation', async () => {
    vi.mocked(getSpace).mockImplementation((_args, opts) => {
      const signal = (opts as { signal?: AbortSignal } | undefined)?.signal;
      return new Promise((_, reject) => {
        signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      }) as unknown as ReturnType<typeof getSpace>;
    });

    const sut = new GlobalSearchManager();
    sut.open();
    const activation = sut.activateSpace('s1');
    sut.close();
    await activation;

    expect(goto).not.toHaveBeenCalled();
    expect(toastManager.warning).not.toHaveBeenCalled();
  });

  it('keystroke-during-activation: batch.abort() does NOT abort activation', async () => {
    let resolveInfo: (v: Awaited<ReturnType<typeof getSpace>>) => void = () => {};
    const deferred = new Promise<Awaited<ReturnType<typeof getSpace>>>((resolve) => {
      resolveInfo = resolve;
    });
    // Implementation ignores the signal — we want the activation to survive a batch
    // rotation, so even if the batch controller aborts the fetch must still resolve.
    vi.mocked(getSpace).mockReturnValue(deferred as ReturnType<typeof getSpace>);

    const sut = new GlobalSearchManager();
    sut.open();
    const activation = sut.activateSpace('s1');
    // Rotate the batch controller — simulates a fresh keystroke landing while the
    // activation is still in flight. Activation binds to closeSignal, not
    // batchController, so this must NOT short-circuit the navigation.
    (sut as unknown as { batchController: AbortController | null }).batchController = new AbortController();
    (sut as unknown as { batchController: AbortController }).batchController.abort();
    resolveInfo(spaceResponse);
    await activation;

    expect(goto).toHaveBeenCalledWith('/spaces/s1');
  });

  it('pending-row affordance: pendingActivation set at 200ms', async () => {
    vi.useFakeTimers();
    vi.mocked(getSpace).mockImplementation(
      () =>
        new Promise((resolve) => {
          // Resolve after 300ms of virtual time.
          setTimeout(() => resolve(spaceResponse), 300);
        }) as unknown as ReturnType<typeof getSpace>,
    );

    const sut = new GlobalSearchManager();
    sut.open();
    const activation = sut.activateSpace('s1');

    await vi.advanceTimersByTimeAsync(100);
    expect(sut.pendingActivation).toBeNull();

    await vi.advanceTimersByTimeAsync(100); // total = 200ms
    expect(sut.pendingActivation).toBe('space:s1');

    await vi.advanceTimersByTimeAsync(200); // total = 400ms — past the 300ms resolve
    await activation;
    expect(sut.pendingActivation).toBeNull();
  });

  it('pending-timer cleared on fast resolve (<200ms)', async () => {
    vi.useFakeTimers();
    vi.mocked(getSpace).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(spaceResponse), 50);
        }) as unknown as ReturnType<typeof getSpace>,
    );

    const sut = new GlobalSearchManager();
    sut.open();
    const activation = sut.activateSpace('s1');
    await vi.advanceTimersByTimeAsync(50);
    await activation;
    // Past the 200ms pending threshold — if the timer wasn't cleared in `finally`,
    // pendingActivation would now flip to 'space:s1' even though activation is done.
    await vi.advanceTimersByTimeAsync(300);

    expect(sut.pendingActivation).toBeNull();
  });
});

describe('prefix scoping — deriveds', () => {
  it('setQuery(@alice) derives scope=people, payload=alice', () => {
    const m = new GlobalSearchManager();
    m.setQuery('@alice');
    expect(m.scope).toBe('people');
    expect(m.payload).toBe('alice');
  });

  it('setQuery(alice) derives scope=all, payload=alice', () => {
    const m = new GlobalSearchManager();
    m.setQuery('alice');
    expect(m.scope).toBe('all');
    expect(m.payload).toBe('alice');
  });

  it('scope stable across keystrokes within same prefix', () => {
    const m = new GlobalSearchManager();
    m.setQuery('@');
    m.setQuery('@a');
    m.setQuery('@al');
    expect(m.scope).toBe('people');
    expect(m.payload).toBe('al');
  });

  it('setQuery(@alice) then setQuery("") returns scope to all', () => {
    const m = new GlobalSearchManager();
    m.setQuery('@alice');
    expect(m.scope).toBe('people');
    m.setQuery('');
    expect(m.scope).toBe('all');
    expect(m.payload).toBe('');
  });
});

describe('prefix scoping — runBatch gating', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPerson>>);
    vi.mocked(searchPlaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
    vi.mocked(getAllTags).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllTags>>);
    vi.mocked(getAlbumNames).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAlbumNames>>);
    vi.mocked(getAllSpaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllSpaces>>);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('scope people: only people provider invoked, other entity sections idle', async () => {
    const m = new GlobalSearchManager();
    // Pre-populate unrelated sections to 'ok' to prove they get force-reset.
    m.sections.photos = { status: 'ok', items: [{ id: 'p1' } as never], total: 1 };
    m.sections.albums = { status: 'ok', items: [{ id: 'a1' } as never], total: 1 };

    m.setQuery('@alice');
    await vi.advanceTimersByTimeAsync(150);

    expect(m.sections.photos.status).toBe('idle');
    expect(m.sections.albums.status).toBe('idle');
    expect(m.sections.places.status).toBe('idle');
    expect(m.sections.tags.status).toBe('idle');
    expect(m.sections.spaces.status).toBe('idle');
  });

  it('scope collections: only albums + spaces providers invoked; others idle', async () => {
    const m = new GlobalSearchManager();
    m.sections.photos = { status: 'ok', items: [{ id: 'p1' } as never], total: 1 };
    m.sections.people = { status: 'ok', items: [{ id: 'a1' } as never], total: 1 };
    m.sections.tags = { status: 'ok', items: [{ id: 't1' } as never], total: 1 };

    m.setQuery('/trip');
    await vi.advanceTimersByTimeAsync(150);

    expect(m.sections.photos.status).toBe('idle');
    expect(m.sections.people.status).toBe('idle');
    expect(m.sections.places.status).toBe('idle');
    expect(m.sections.tags.status).toBe('idle');
    // albums + spaces will be ok/empty depending on cache mocks
  });

  it('scope nav: ENTITY_KEYS_BY_SCOPE.nav === [] — no entity providers invoked', async () => {
    const m = new GlobalSearchManager();
    const providers = (m as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    const providerRuns = new Map<string, ReturnType<typeof vi.fn>>();
    for (const key of ['photos', 'people', 'places', 'tags', 'albums', 'spaces'] as const) {
      const run = vi.fn().mockResolvedValue({ status: 'empty' });
      providerRuns.set(key, run);
      providers[key].run = run;
    }

    m.setQuery('>theme');
    await vi.advanceTimersByTimeAsync(150);

    for (const run of providerRuns.values()) {
      expect(run).not.toHaveBeenCalled();
    }
    // Navigation section populated via synchronous runNavigationProvider, not runBatch.
    expect(m.sections.navigation.status).toBe('ok');
  });

  it('scope people with bare @ bypasses minQueryLength', async () => {
    const m = new GlobalSearchManager();
    const getAllPeopleSpy = vi.mocked(getAllPeople);
    getAllPeopleSpy.mockClear();

    m.setQuery('@'); // payload.length = 0, below people.minQueryLength = 2
    await vi.advanceTimersByTimeAsync(150);

    // people.minQueryLength=2 would normally set section to idle; bypass
    // dispatches to the bare-suggestions branch instead.
    expect(m.sections.people.status).not.toBe('idle');
    expect(getAllPeopleSpy).toHaveBeenCalledTimes(1);
  });

  it('scope people with single-char payload relaxes minQueryLength to 1', async () => {
    const m = new GlobalSearchManager();
    const searchPersonSpy = vi.mocked(searchPerson);
    searchPersonSpy.mockClear();

    m.setQuery('@a');
    await vi.advanceTimersByTimeAsync(150);

    expect(searchPersonSpy).toHaveBeenCalledWith(
      { name: 'a', withHidden: false, withSharedSpaces: true },
      expect.anything(),
    );
  });
});

describe('prefix scoping — bare suggestions (tags/albums/spaces)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchSmart>>);
    vi.mocked(searchAssets).mockResolvedValue({
      assets: { items: [], nextPage: null },
    } as unknown as Awaited<ReturnType<typeof searchAssets>>);
    vi.mocked(searchPerson).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPerson>>);
    vi.mocked(searchPlaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof searchPlaces>>);
    vi.mocked(getAllTags).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllTags>>);
    vi.mocked(getAlbumNames).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAlbumNames>>);
    vi.mocked(getAllSpaces).mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllSpaces>>);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('# bare returns tagsCache sorted by updatedAt desc, top 5', async () => {
    const m = new GlobalSearchManager();
    (m as unknown as { tagsCache: unknown }).tagsCache = [
      { id: 't1', name: 'old', updatedAt: '2026-01-01T00:00:00Z' },
      { id: 't2', name: 'new', updatedAt: '2026-04-15T00:00:00Z' },
      { id: 't3', name: 'mid', updatedAt: '2026-02-15T00:00:00Z' },
    ] as never;

    m.setQuery('#');
    await vi.advanceTimersByTimeAsync(150);

    expect(m.sections.tags.status).toBe('ok');
    const items = (m.sections.tags as { items: { id: string }[] }).items;
    expect(items.map((i) => i.id)).toEqual(['t2', 't3', 't1']);
  });

  it('# bare with empty tagsCache returns empty', async () => {
    const m = new GlobalSearchManager();
    (m as unknown as { tagsCache: unknown }).tagsCache = [];
    m.setQuery('#');
    await vi.advanceTimersByTimeAsync(150);
    expect(m.sections.tags.status).toBe('empty');
  });

  it('# bare under tagsDisabled returns error: tag_cache_too_large', async () => {
    const m = new GlobalSearchManager();
    (m as unknown as { tagsDisabled: boolean }).tagsDisabled = true;
    (m as unknown as { tagsCache: unknown }).tagsCache = null;
    m.setQuery('#');
    await vi.advanceTimersByTimeAsync(150);
    expect(m.sections.tags.status).toBe('error');
    expect((m.sections.tags as { message: string }).message).toBe('tag_cache_too_large');
  });

  it('/ bare writes albums sorted endDate desc, spaces sorted lastActivityAt??createdAt desc', async () => {
    const m = new GlobalSearchManager();
    // AlbumNameDto: sort by endDate ?? '' desc (most recent photo in album as activity proxy).
    m.albumsCache = [
      { id: 'a1', albumName: 'Old', endDate: '2026-01-01T00:00:00Z' },
      { id: 'a2', albumName: 'New', endDate: '2026-04-15T00:00:00Z' },
      { id: 'a3', albumName: 'Empty' /* endDate missing — sinks */ },
    ] as never;
    m.spacesCache = [
      { id: 's1', name: 'Quiet', createdAt: '2026-01-01T00:00:00Z', lastActivityAt: null },
      { id: 's2', name: 'Active', createdAt: '2026-02-01T00:00:00Z', lastActivityAt: '2026-04-10T00:00:00Z' },
    ] as never;

    m.setQuery('/');
    await vi.advanceTimersByTimeAsync(150);

    expect((m.sections.albums as { items: { id: string }[] }).items.map((i) => i.id)).toEqual(['a2', 'a1', 'a3']);
    expect((m.sections.spaces as { items: { id: string }[] }).items.map((i) => i.id)).toEqual(['s2', 's1']);
  });

  it('/ bare with BOTH zero albums AND zero spaces: both sections empty', async () => {
    const m = new GlobalSearchManager();
    m.albumsCache = [];
    m.spacesCache = [];

    m.setQuery('/');
    await vi.advanceTimersByTimeAsync(150);

    expect(m.sections.albums.status).toBe('empty');
    expect(m.sections.spaces.status).toBe('empty');
  });

  it('/ bare mixed empty: albums ok, spaces empty', async () => {
    const m = new GlobalSearchManager();
    m.albumsCache = [{ id: 'a1', albumName: 'Only', endDate: '2026-04-15T00:00:00Z' }] as never;
    m.spacesCache = [];

    m.setQuery('/');
    await vi.advanceTimersByTimeAsync(150);

    expect(m.sections.albums.status).toBe('ok');
    expect(m.sections.spaces.status).toBe('empty');
  });

  it('/ bare mixed empty (symmetric): albums empty, spaces ok', async () => {
    const m = new GlobalSearchManager();
    m.albumsCache = [];
    m.spacesCache = [{ id: 's1', name: 'Only', createdAt: '2026-04-15T00:00:00Z' }] as never;

    m.setQuery('/');
    await vi.advanceTimersByTimeAsync(150);

    expect(m.sections.albums.status).toBe('empty');
    expect(m.sections.spaces.status).toBe('ok');
  });
});

const mockPerson = (id: string, name: string, updatedAt?: string): PersonResponseDto => ({
  id,
  name,
  birthDate: null,
  isHidden: false,
  thumbnailPath: '',
  type: 'person',
  updatedAt,
});

describe('prefix scoping — bare @ suggestions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    // Quiet the other providers so only people drives state.
    vi.mocked(searchSmart).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
    vi.mocked(getAlbumNames).mockResolvedValue([] as never);
    vi.mocked(getAllSpaces).mockResolvedValue([] as never);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('bare @ calls getAllPeople once; subsequent bare @ reads cache', async () => {
    const m = new GlobalSearchManager();
    const getAllPeopleSpy = vi.mocked(getAllPeople);
    getAllPeopleSpy.mockResolvedValue({
      people: [
        mockPerson('older', 'Zack', '2026-01-01T00:00:00Z'),
        mockPerson('newer', 'Alice', '2026-04-15T00:00:00Z'),
      ],
      total: 2,
      hidden: 0,
      hasNextPage: false,
    });

    m.setQuery('@');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();

    // Assert comparator was applied (newer updatedAt first).
    expect(m.sections.people.status).toBe('ok');
    const items = (m.sections.people as { items: { id: string }[] }).items;
    expect(items.map((i) => i.id)).toEqual(['newer', 'older']);

    m.setQuery('@a');
    await vi.advanceTimersByTimeAsync(150);
    m.setQuery('@');
    await vi.advanceTimersByTimeAsync(150);

    expect(getAllPeopleSpy).toHaveBeenCalledTimes(1);
  });

  it('concurrent bare @ joins same peoplePromise (getAllPeople fires once)', async () => {
    const m = new GlobalSearchManager();
    const getAllPeopleSpy = vi.mocked(getAllPeople);
    let resolve: (v: unknown) => void;
    getAllPeopleSpy.mockImplementation(() => new Promise((r) => (resolve = r as (v: unknown) => void)) as never);

    m.setQuery('@');
    await vi.advanceTimersByTimeAsync(150);
    m.setQuery('@a'); // would fire searchPerson
    m.setQuery('@'); // back to bare — should NOT start a second getAllPeople
    await vi.advanceTimersByTimeAsync(150);

    resolve!({ people: [mockPerson('p1', 'Alice')], total: 1, hidden: 0, hasNextPage: false });
    await vi.runAllTimersAsync();

    expect(getAllPeopleSpy).toHaveBeenCalledTimes(1);
  });

  it('stale bare-@ rejection after @alice resolves does NOT stomp ok results', async () => {
    const m = new GlobalSearchManager();
    const getAllPeopleSpy = vi.mocked(getAllPeople);
    let rejectFn: (e: Error) => void;
    getAllPeopleSpy.mockImplementation(() => new Promise((_, r) => (rejectFn = r as (e: Error) => void)) as never);
    vi.mocked(searchPerson).mockResolvedValue([mockPerson('p1', 'Alice')] as never);

    m.setQuery('@'); // bare, starts getAllPeople fetch
    await vi.advanceTimersByTimeAsync(150);
    m.setQuery('@alice'); // now non-bare; searchPerson resolves
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();

    expect(m.sections.people.status).toBe('ok');

    rejectFn!(new Error('network'));
    // Flush microtasks so the catch branch runs.
    await vi.runAllTimersAsync();
    await Promise.resolve();

    expect(m.sections.people.status).toBe('ok'); // not stomped to error
  });

  it('bare @ network error while still at bare @ writes error to section', async () => {
    const m = new GlobalSearchManager();
    vi.mocked(getAllPeople).mockRejectedValue(new Error('network down'));

    m.setQuery('@');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();
    await Promise.resolve();

    expect(m.sections.people.status).toBe('error');
    expect((m.sections.people as { message: string }).message).toBe('network down');
  });

  it('bare @ with zero named people returns empty', async () => {
    const m = new GlobalSearchManager();
    vi.mocked(getAllPeople).mockResolvedValue({ people: [], total: 0, hidden: 0, hasNextPage: false });
    m.setQuery('@');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();
    expect(m.sections.people.status).toBe('empty');
  });

  it('getAllPeople provider timeout transitions section to timeout', async () => {
    const m = new GlobalSearchManager();
    // getAllPeople binds to closeSignal (not per-keystroke AbortSignal.timeout),
    // so this test simulates a fetch that never resolves within the window; the
    // provider-level AbortSignal.timeout inside runBatch fires and the
    // surrounding people.run catch branch writes 'timeout'.
    vi.mocked(getAllPeople).mockImplementation(
      (_args, opts) =>
        new Promise((_, reject) => {
          opts?.signal?.addEventListener('abort', () => {
            const err = new DOMException('timeout', 'TimeoutError');
            reject(err);
          });
        }) as never,
    );

    m.setQuery('@');
    await vi.advanceTimersByTimeAsync(150); // debounce fires
    await vi.advanceTimersByTimeAsync(15_000); // AbortSignal.timeout fires
    await vi.runAllTimersAsync();

    expect(m.sections.people.status).toBe('timeout');
  });

  it('close + reopen resets peopleSuggestionsCache and peoplePromise', async () => {
    const m = new GlobalSearchManager();
    const getAllPeopleSpy = vi.mocked(getAllPeople);
    getAllPeopleSpy.mockResolvedValue({ people: [mockPerson('p1', 'Alice')], total: 1, hidden: 0, hasNextPage: false });

    m.open();
    m.setQuery('@');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();
    m.close();
    m.open();
    m.setQuery('@');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();

    expect(getAllPeopleSpy).toHaveBeenCalledTimes(2);
  });
});

describe('prefix scoping — runNavigationProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    mockUser.current = { id: 'test-user', isAdmin: true };
    mockFlags.valueOrUndefined = { search: true, map: true, trash: true };
    mockI18nLocale.current = 'en';
    vi.mocked(searchSmart).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchPerson).mockResolvedValue([] as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
    vi.mocked(getAlbumNames).mockResolvedValue([] as never);
    vi.mocked(getAllSpaces).mockResolvedValue([] as never);
    vi.mocked(getAllPeople).mockResolvedValue({ people: [], total: 0, hidden: 0, hasNextPage: false } as never);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('scope nav bare: count equals the filtered catalog length (no slice)', async () => {
    mockUser.current = { id: 'admin', isAdmin: true };
    const m = new GlobalSearchManager();
    m.setQuery('>');
    await vi.advanceTimersByTimeAsync(150);

    // Filtered catalog: iterate NAVIGATION_ITEMS with the same admin + flag gate.
    // User is admin here, so adminOnly is never restrictive — filter only on flags.
    const flags = mockFlags.valueOrUndefined;
    const expected = NAVIGATION_ITEMS.filter((i) => !i.featureFlag || flags?.[i.featureFlag]).length;

    expect(m.sections.navigation.status).toBe('ok');
    const items = (m.sections.navigation as { items: { id: string }[] }).items;
    expect(items.length).toBe(expected); // strict equality — no slice
  });

  it('scope nav bare: items sorted alphabetically by translated label', async () => {
    mockUser.current = { id: 'admin', isAdmin: true };
    const m = new GlobalSearchManager();
    m.setQuery('>');
    await vi.advanceTimersByTimeAsync(150);
    const items = (m.sections.navigation as { items: { id: string; labelKey: string }[] }).items;
    const translate = (k: string) => k; // stub: identity (tests exercise sort stability, not full i18n)
    const labels = items.map((i) => translate(i.labelKey));
    const sorted = [...labels].sort((a, b) => a.localeCompare(b));
    expect(labels).toEqual(sorted);
  });

  it('scope nav with payload: fuzzy search payload over filtered items', async () => {
    mockUser.current = { id: 'admin', isAdmin: true };
    const m = new GlobalSearchManager();
    m.setQuery('>theme');
    await vi.advanceTimersByTimeAsync(150);
    expect(m.sections.navigation.status).toBe('ok');
    const items = (m.sections.navigation as { items: { id: string }[] }).items;
    // 'theme' matches nav:systemSettings:theme (labelKey='admin.theme_settings').
    expect(items.some((i) => i.id === 'nav:systemSettings:theme')).toBe(true);
  });

  it('scope people (any payload): navigation section is empty', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('@alice');
    await vi.advanceTimersByTimeAsync(150);
    expect(m.sections.navigation.status).toBe('empty');
  });

  it('scope all with payload: existing fuzzy behavior preserved', async () => {
    mockUser.current = { id: 'admin', isAdmin: true };
    const m = new GlobalSearchManager();
    m.setQuery('classification');
    await vi.advanceTimersByTimeAsync(150);
    expect(m.sections.navigation.status).toBe('ok');
  });

  it('scope nav for non-admin with restrictive flags: returns empty (not ok:[])', async () => {
    // The provider's empty-guard branch returns { status: 'empty' } when the
    // scored/sorted list is empty — NOT { status: 'ok', items: [] }. This test
    // pins that invariant via the fuzzy-match path (an unmatchable payload
    // under scope 'nav' also hits the empty-guard), because the bare-`>` path
    // can only yield empty when NAVIGATION_ITEMS itself has zero eligible
    // rows — unreachable with the current catalog, which contains user pages
    // without adminOnly or featureFlag gates.
    mockUser.current = { id: 'user', isAdmin: false };
    mockFlags.valueOrUndefined = {};
    const m = new GlobalSearchManager();
    m.setQuery('>xyz-no-match-at-all-zzz');
    await vi.advanceTimersByTimeAsync(150);
    expect(m.sections.navigation.status).toBe('empty');
    // Crucially, not `{ status: 'ok', items: [] }` — the branch guard
    // short-circuits to 'empty' so the section is hidden in the palette.
    expect((m.sections.navigation as { items?: unknown }).items).toBeUndefined();
  });
});

describe('prefix scoping — setQuery SWR scope behavior', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchPerson).mockResolvedValue([] as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
    vi.mocked(getAlbumNames).mockResolvedValue([] as never);
    vi.mocked(getAllSpaces).mockResolvedValue([] as never);
    vi.mocked(getAllPeople).mockResolvedValue({ people: [], total: 0, hidden: 0, hasNextPage: false } as never);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('scope transition from all to people force-idles non-people sections BEFORE debounce fires', () => {
    const m = new GlobalSearchManager();
    m.sections.photos = { status: 'ok', items: [{ id: 'p1' }] as never, total: 1 };
    m.sections.albums = { status: 'ok', items: [{ id: 'a1' }] as never, total: 1 };

    m.setQuery('@alice');
    // Do NOT advance timers — assert state IMMEDIATELY (pre-debounce).
    expect(m.sections.photos.status).toBe('idle');
    expect(m.sections.albums.status).toBe('idle');
    expect(m.sections.people.status).toBe('loading');
  });

  it('scope away (people → all) clears SWR-stale state on non-photo sections', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('@alice');
    await vi.advanceTimersByTimeAsync(150);
    m.setQuery('alice');
    // All entity sections should be loading (they were idle under @, now scope all dispatches)
    expect(m.sections.photos.status).toBe('loading');
  });

  it('within-scope payload change preserves ok sections (existing SWR)', async () => {
    const m = new GlobalSearchManager();
    vi.mocked(searchPerson).mockResolvedValue([mockPerson('p1', 'Alice')] as never);
    m.setQuery('@al');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();
    expect(m.sections.people.status).toBe('ok');

    // Adding a char — scope and provider stay the same. people section should NOT
    // flip to loading; ok is SWR-preserved.
    m.setQuery('@ali');
    expect(m.sections.people.status).toBe('ok');
  });

  it('scope transition aborts the prior batchController', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('alice');
    await vi.advanceTimersByTimeAsync(150);
    const priorBatch = m['batchController'];
    expect(priorBatch).not.toBeNull();
    expect(priorBatch?.signal.aborted).toBe(false);

    m.setQuery('@alice');
    expect(priorBatch?.signal.aborted).toBe(true);
    expect(m['batchController']).not.toBe(priorBatch); // fresh controller
  });

  it('rapid scope thrash (@ → # → /) aborts cleanly and inFlightCounter stays consistent', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('@alice');
    m.setQuery('#xmas');
    m.setQuery('/trip');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();

    // After all transitions settle, batchInFlight must drop to false (no stranded counter).
    expect(m.batchInFlight).toBe(false);
    // Only the final scope's sections should be non-idle (collections).
    expect(m.sections.photos.status).toBe('idle');
    expect(m.sections.people.status).toBe('idle');
    expect(m.sections.tags.status).toBe('idle');
  });

  it('/ while albumsCache promise is in-flight: callers join the same promise', async () => {
    const m = new GlobalSearchManager();
    const getAlbumNamesSpy = vi.mocked(getAlbumNames);
    let resolve: (v: unknown) => void;
    getAlbumNamesSpy.mockImplementation(() => new Promise((r) => (resolve = r as (v: unknown) => void)));

    m.setQuery('/tr');
    await vi.advanceTimersByTimeAsync(150);
    m.setQuery('/tri');
    await vi.advanceTimersByTimeAsync(150);
    // Both dispatches await the same albumsPromise.
    resolve!([{ id: 'a1', albumName: 'Trip' }] as never);
    await vi.runAllTimersAsync();

    const callsForManager = getAlbumNamesSpy.mock.calls.filter(([options]) => options?.signal === m.closeSignal);
    expect(callsForManager).toHaveLength(1);
  });
});

describe('prefix scoping — reconcileCursor', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchPerson).mockResolvedValue([] as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
    vi.mocked(getAlbumNames).mockResolvedValue([] as never);
    vi.mocked(getAllSpaces).mockResolvedValue([] as never);
    vi.mocked(getAllPeople).mockResolvedValue({ people: [], total: 0, hidden: 0, hasNextPage: false } as never);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('all reconcile order is [photos, albums, spaces, people, places, tags, navigation]', () => {
    const m = new GlobalSearchManager();
    // All sections empty except albums with one item.
    m.sections.albums = { status: 'ok', items: [{ id: 'a1' }] as never, total: 1 };
    m.setActiveItem(null);
    m.reconcileCursor();
    expect(m.activeItemId).toBe('album:a1');
  });

  it('scope transition preserves cursor when target stays in scope', () => {
    const m = new GlobalSearchManager();
    m.sections.people = { status: 'ok', items: [{ id: 'alice-id' } as never], total: 1 };
    m.setActiveItem('person:alice-id');

    m.setQuery('@');
    // Do not advance — prove cursor is still on Alice through the synchronous scope transition.
    expect(m.activeItemId).toBe('person:alice-id');
  });

  it('scope transition reconciles when target exits scope', () => {
    const m = new GlobalSearchManager();
    m.sections.photos = { status: 'ok', items: [{ id: 'p1' } as never], total: 1 };
    m.sections.people = { status: 'ok', items: [{ id: 'alice-id' } as never], total: 1 };
    m.setActiveItem('photo:p1');

    m.setQuery('@alice');
    // Photo cursor exits scope; reconcile picks first person.
    expect(m.activeItemId).toBe('person:alice-id');
  });

  it('/trip lands cursor on first album (albums before spaces)', async () => {
    const m = new GlobalSearchManager();
    m.albumsCache = [{ id: 'a1', albumName: 'Trip 2024', endDate: '2026-04-15T00:00:00Z' }] as never;
    m.spacesCache = [{ id: 's1', name: 'Trip club', createdAt: '2026-04-15T00:00:00Z' }] as never;
    m.setQuery('/trip');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();
    expect(m.activeItemId).toBe('album:a1');
  });
});

describe('prefix scoping — setMode under scope', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchPerson).mockResolvedValue([] as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
    vi.mocked(getAlbumNames).mockResolvedValue([] as never);
    vi.mocked(getAllSpaces).mockResolvedValue([] as never);
    vi.mocked(getAllPeople).mockResolvedValue({ people: [], total: 0, hidden: 0, hasNextPage: false } as never);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('setMode under scope persists mode but does NOT dispatch request', async () => {
    const m = new GlobalSearchManager();
    const searchSmartSpy = vi.mocked(searchSmart);
    const searchAssetsSpy = vi.mocked(searchAssets);
    searchSmartSpy.mockClear();
    searchAssetsSpy.mockClear();

    m.setQuery('@alice');
    await vi.advanceTimersByTimeAsync(150);
    searchSmartSpy.mockClear(); // ignore any prior dispatches
    const priorPhotosController = m['photosController'];

    m.setMode('metadata');
    await vi.advanceTimersByTimeAsync(150);

    expect(m.mode).toBe('metadata');
    expect(localStorage.getItem('searchQueryType')).toBe('metadata');
    expect(searchSmartSpy).not.toHaveBeenCalled();
    expect(searchAssetsSpy).not.toHaveBeenCalled();
    // photosController must NOT have been recreated under scope — same reference.
    expect(m['photosController']).toBe(priorPhotosController);
  });

  it('setMode under scope all still dispatches photos re-run', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('alice');
    await vi.advanceTimersByTimeAsync(150);
    const searchAssetsSpy = vi.mocked(searchAssets);
    searchAssetsSpy.mockClear();

    m.setMode('metadata');
    await vi.advanceTimersByTimeAsync(150);

    expect(searchAssetsSpy).toHaveBeenCalled();
  });
});

describe('prefix scoping — announcementText', () => {
  beforeAll(async () => {
    // Load the real en bundle so `get(t)('cmdk_announce_scoped_*')` resolves to
    // English copy rather than raw keys. The rest of this suite uses fallbackLocale
    // 'dev' (raw keys) — the scope-cue assertions here check the translated prefix.
    const { init, register, waitLocale } = await import('svelte-i18n');
    register('en-US', () => import('$i18n/en.json'));
    await init({ fallbackLocale: 'en-US' });
    await waitLocale('en-US');
  });

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    installFakeAbortTimeout();
    vi.mocked(searchSmart).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
    vi.mocked(searchPerson).mockResolvedValue([] as never);
    vi.mocked(searchPlaces).mockResolvedValue([] as never);
    vi.mocked(getAllTags).mockResolvedValue([] as never);
    vi.mocked(getAlbumNames).mockResolvedValue([] as never);
    vi.mocked(getAllSpaces).mockResolvedValue([] as never);
    vi.mocked(getAllPeople).mockResolvedValue({ people: [], total: 0, hidden: 0, hasNextPage: false } as never);
  });

  afterEach(() => {
    restoreAbortTimeout();
    vi.useRealTimers();
  });

  it('scope people announcement prefixed with "Scoped to people."', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('@alice');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();
    expect(m.announcementText).toMatch(/Scoped to people/i);
  });

  it('scope tags announcement prefixed with "Scoped to tags."', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('#xmas');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();
    expect(m.announcementText).toMatch(/Scoped to tags/i);
  });

  it('scope collections announcement prefixed with "Scoped to albums and spaces."', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('/trip');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();
    expect(m.announcementText).toMatch(/Scoped to albums and spaces/i);
  });

  it('scope nav announcement prefixed with "Scoped to pages."', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('>theme');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();
    expect(m.announcementText).toMatch(/Scoped to pages/i);
  });

  it('scope all announcement has no "Scoped to" prefix', async () => {
    const m = new GlobalSearchManager();
    m.setQuery('alice');
    await vi.advanceTimersByTimeAsync(150);
    await vi.runAllTimersAsync();
    expect(m.announcementText).not.toMatch(/Scoped to/i);
  });
});

describe('prefix scoping — defensive recent replay of scoped query', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('activateRecent({kind:query, text:"@alice"}) replays the raw scoped text through activateSearch', () => {
    const m = new GlobalSearchManager();
    const spy = vi.spyOn(m, 'activateSearch').mockImplementation(() => {});

    m.activateRecent({ kind: 'query', id: 'query:@alice', text: '@alice', lastUsed: Date.now() });

    expect(spy).toHaveBeenCalledWith('@alice');
  });
});
