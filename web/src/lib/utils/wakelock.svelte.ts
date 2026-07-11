import { on } from 'svelte/events';
import { browser } from '$app/environment';

const isSupported = browser && 'wakeLock' in navigator;

let sentinel: WakeLockSentinel | null = null;
let acquiring = false;

export async function acquireWakeLock() {
  if (!isSupported) {
    return;
  }
  // eslint-disable-next-line tscompat/tscompat
  if (sentinel !== null && !sentinel.released) {
    // There is already a wake lock
    return;
  }
  if (acquiring) {
    // There is already a wake lock request in progress
    return;
  }
  acquiring = true;
  try {
    // eslint-disable-next-line tscompat/tscompat
    sentinel = await navigator.wakeLock.request('screen');
  } catch (error) {
    console.warn('Failed to acquire wake lock:', error);
  } finally {
    acquiring = false;
  }
}

export async function releaseWakeLock() {
  if (sentinel !== null) {
    const toReleaseSentinel = sentinel;
    // Set to null first to avoid race condition after await
    sentinel = null;

    // eslint-disable-next-line tscompat/tscompat
    await toReleaseSentinel.release();
  }
}

if (isSupported) {
  // Wake lock is cleared when user changes to a different tab,
  // so we need to reacquire the wake lock when they come back.
  on(globalThis, 'visibilitychange', () => {
    if (sentinel !== null && document.visibilityState === 'visible') {
      void acquireWakeLock();
    }
  });
}
