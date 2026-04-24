import { authManager } from '$lib/managers/auth-manager.svelte';
import type { SearchMode } from '$lib/managers/global-search-manager.svelte';

// Recents are scoped per logged-in user so multi-account browsers (user A logs
// out, user B logs in on the same device) never leak each other's palette
// history. The localStorage key is suffixed with the user id, and reads/writes
// for a null user are a silent no-op — an anonymous bucket would get inherited
// by whichever user logs in next, which is the same bug we are trying to fix.
const STORAGE_KEY_PREFIX = 'cmdk.recent:';
const MAX_ENTRIES = 20;

export type RecentEntry =
  | { kind: 'query'; id: string; text: string; lastUsed: number }
  | { kind: 'photo'; id: string; assetId: string; label: string; lastUsed: number }
  | { kind: 'person'; id: string; personId: string; label: string; lastUsed: number }
  | { kind: 'place'; id: string; latitude: number; longitude: number; label: string; lastUsed: number }
  | { kind: 'tag'; id: string; tagId: string; label: string; lastUsed: number }
  | {
      kind: 'album';
      id: string;
      albumId: string;
      label: string;
      thumbnailAssetId: string | null;
      lastUsed: number;
    }
  | { kind: 'space'; id: string; spaceId: string; label: string; colorHex: string | null; lastUsed: number }
  | {
      kind: 'navigate';
      id: string;
      route: string;
      labelKey: string;
      icon: string;
      adminOnly: boolean;
      lastUsed: number;
    };

let warnedOnce = false;

type LegacyQueryRecentEntry = {
  kind: 'query';
  id: string;
  text: string;
  mode?: SearchMode;
  lastUsed: number;
};

type StoredRecentEntry = RecentEntry | LegacyQueryRecentEntry;

function warn(err: unknown) {
  if (warnedOnce) {
    return;
  }
  warnedOnce = true;

  console.warn('[cmdk.recent]', err);
}

function currentStorageKey(): string | null {
  const id = authManager.authenticated ? authManager.user?.id : undefined;
  return id ? `${STORAGE_KEY_PREFIX}${id}` : null;
}

function normalizeRecentEntry(entry: StoredRecentEntry): RecentEntry | null {
  if (entry.kind !== 'query') {
    return entry;
  }

  const text = entry.text.trim();
  if (text.length === 0) {
    return null;
  }

  return {
    kind: 'query',
    id: `query:${text.toLowerCase()}`,
    text,
    lastUsed: entry.lastUsed,
  };
}

function rawRead(key: string): RecentEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed
      .map((entry) => normalizeRecentEntry(entry as StoredRecentEntry))
      .filter(Boolean) as RecentEntry[];

    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      rawWrite(key, normalized);
    }

    return normalized;
  } catch (error) {
    warn(error);
    return [];
  }
}

function rawWrite(key: string, entries: RecentEntry[]) {
  try {
    localStorage.setItem(key, JSON.stringify(entries));
  } catch (error) {
    warn(error);
  }
}

export function getEntries(): RecentEntry[] {
  const key = currentStorageKey();
  if (key === null) {
    return [];
  }
  return rawRead(key).sort((a, b) => b.lastUsed - a.lastUsed);
}

export function addEntry(entry: RecentEntry) {
  const key = currentStorageKey();
  if (key === null) {
    return;
  }
  const normalized = normalizeRecentEntry(entry);
  if (!normalized) {
    return;
  }
  const existing = rawRead(key);
  const deduped = existing.filter((e) => e.id !== normalized.id);
  deduped.push(normalized);
  deduped.sort((a, b) => b.lastUsed - a.lastUsed);
  rawWrite(key, deduped.slice(0, MAX_ENTRIES));
}

export function clearEntries() {
  const key = currentStorageKey();
  if (key === null) {
    return;
  }
  rawWrite(key, []);
}

export function removeEntry(id: string) {
  const key = currentStorageKey();
  if (key === null) {
    return;
  }
  const existing = rawRead(key);
  const next = existing.filter((e) => e.id !== id);
  if (next.length !== existing.length) {
    rawWrite(key, next);
  }
}

export function makePlaceId(lat: number, lng: number): string {
  return `place:${lat.toFixed(4)}:${lng.toFixed(4)}`;
}

// Test-only escape hatch: resets the one-shot warn flag so tests that exercise
// the error paths can observe fresh warning behaviour across cases.
export function __resetForTests() {
  warnedOnce = false;
}
