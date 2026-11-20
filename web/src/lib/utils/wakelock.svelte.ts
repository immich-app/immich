import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { browser } from '$app/env';

const isSupported = browser && 'wakeLock' in navigator;

// eslint-disable-next-line svelte/prefer-svelte-reactivity
const holders = new Set<symbol>();
let sentinel: WakeLockSentinel | undefined;
let acquiring = false;

async function acquireWakeLock() {
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

  if (holders.size === 0) {
    await releaseWakeLock();
  }
}

async function releaseWakeLock() {
  if (!sentinel) {
    return;
  }

  const toReleaseSentinel = sentinel;
  // Unset first to avoid race condition after await
  sentinel = undefined;

  await toReleaseSentinel.release();
}

export function holdWakeLock() {
  const holder = Symbol();
  holders.add(holder);
  void acquireWakeLock();

  return () => {
    holders.delete(holder);
    if (holders.size === 0) {
      void releaseWakeLock();
    }
  };
}

export const applyWakeLock: Attachment<HTMLElement> = (media) => {
  let release: (() => void) | undefined;
  const onPlaying = () => (release ??= holdWakeLock());
  const onStopped = () => {
    release?.();
    release = undefined;
  };

  const offPlaying = on(media, 'playing', onPlaying);
  const offPause = on(media, 'pause', onStopped);
  const offEmptied = on(media, 'emptied', onStopped);

  return () => {
    offPlaying();
    offPause();
    offEmptied();
    onStopped();
  };
};

if (isSupported) {
  // Wake lock is cleared when user changes to a different tab,
  // so we need to reacquire the wake lock when they come back.
  on(globalThis, 'visibilitychange', () => {
    if (holders.size > 0 && document.visibilityState === 'visible') {
      void acquireWakeLock();
    }
  });
}
