import { on } from 'svelte/events';
import { browser } from '$app/env';

const isSupported = browser && 'wakeLock' in navigator;

let sentinel: WakeLockSentinel | undefined;
let acquiring = false;

export async function acquireWakeLock() {
  if (!isSupported) {
    return;
  }

  if (sentinel && !sentinel.released) {
    return;
  }
  if (acquiring) {
    return;
  }
  acquiring = true;
  try {
    sentinel = await navigator.wakeLock.request('screen');
  } catch (error) {
    console.warn('Failed to acquire wake lock:', error);
  } finally {
    acquiring = false;
  }
}

export async function releaseWakeLock() {
  if (!sentinel) {
    return;
  }

  const toReleaseSentinel = sentinel;
  // Unset first to avoid race condition after await
  sentinel = undefined;

  await toReleaseSentinel.release();
}

if (isSupported) {
  // Wake lock is cleared when user changes to a different tab,
  // so we need to reacquire the wake lock when they come back.
  on(globalThis, 'visibilitychange', () => {
    if (sentinel && document.visibilityState === 'visible') {
      void acquireWakeLock();
    }
  });
}
