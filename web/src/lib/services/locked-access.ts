import { getAuthStatus, lockAuthSession, unlockAuthSession } from '@immich/sdk';
import { browser } from '$app/environment';
import { eventManager } from '$lib/managers/event-manager.svelte';

const RELOCK_KEY = 'immich-experimental-locked-requires-pin';
const SHARED_RELOCK_KEY = `${RELOCK_KEY}-shared`;
const REQUEST_TIMEOUT = 4000;
let relockRequired = false;

// This is the only persisted experimental state: a boolean, never names, IDs or
// deadlines. It survives reloads in this tab when server revocation fails. It is
// a client fail-closed guard, not proof that server elevation was revoked.
export const isRelockRequired = () => {
  if (relockRequired) {
    return true;
  }
  if (!browser) {
    return false;
  }
  try {
    return sessionStorage.getItem(RELOCK_KEY) === 'true' || localStorage.getItem(SHARED_RELOCK_KEY) === 'true';
  } catch {
    return true;
  }
};

export const isLockedAccessAllowed = (deadline: number) =>
  !isRelockRequired() && Number.isFinite(deadline) && deadline > Date.now();

/** Boolean guards only: no names, asset IDs, deadlines, credentials or PINs. */
export function requireLockedPin() {
  relockRequired = true;
  if (browser) {
    try {
      sessionStorage.setItem(RELOCK_KEY, 'true');
      localStorage.setItem(SHARED_RELOCK_KEY, 'true');
    } catch {
      // Reading unavailable storage also denies access, including after reload.
    }
  }
}

/** Hide open same-origin tabs when another tab locks, even if the network fails. */
export function subscribeToSharedLocks() {
  if (!browser) {
    return () => {};
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === SHARED_RELOCK_KEY && event.newValue === 'true') {
      requireLockedPin();
      eventManager.emit('SessionLocked');
    }
  };
  addEventListener('storage', onStorage);
  return () => removeEventListener('storage', onStorage);
}

async function bounded<T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request(controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('Locked access confirmation timed out'));
          controller.abort();
        }, REQUEST_TIMEOUT);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

/** Clear UI synchronously, then attempt server revocation independently of unmount. */
export async function revokeLockedAccess(): Promise<boolean> {
  requireLockedPin();
  eventManager.emit('SessionLocked');
  try {
    await bounded((signal) => lockAuthSession({ signal, cache: 'no-store' }));
    return true;
  } catch {
    // The PIN-required latch remains set even if revocation succeeds or fails.
    return false;
  }
}

/** Only a confirmed PIN unlock may reset the latch (not logout or a status GET). */
export async function unlockLockedAccess(pinCode: string) {
  await unlockAuthSession({ sessionUnlockDto: { pinCode } });
  if (browser) {
    sessionStorage.removeItem(RELOCK_KEY);
    localStorage.removeItem(SHARED_RELOCK_KEY);
  }
  relockRequired = false;
}

/** Authoritative route-loader gate, independent of the experimental grouping API. */
export async function confirmLockedAccess(): Promise<number> {
  if (isRelockRequired()) {
    throw new Error('PIN unlock required');
  }
  try {
    const status = await bounded((signal) => getAuthStatus({ signal, cache: 'no-store' }));
    if (!status.isElevated || !status.pinCode || !status.pinExpiresAt) {
      throw new Error('PIN unlock required');
    }
    const deadlines = [status.pinExpiresAt, status.expiresAt]
      .filter((value): value is string => !!value)
      .map((value) => Date.parse(value));
    if (deadlines.some((deadline) => !Number.isFinite(deadline) || deadline <= Date.now())) {
      throw new Error('PIN unlock required');
    }
    const deadline = Math.min(...deadlines);
    if (!isLockedAccessAllowed(deadline)) {
      throw new Error('PIN unlock required');
    }
    return deadline;
  } catch {
    void revokeLockedAccess();
    throw new Error('PIN unlock required');
  }
}
