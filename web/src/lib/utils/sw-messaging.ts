const broadcast = new BroadcastChannel('immich');

let serviceWorkerEnabled = false;
let replyListeners: ((url: string, isUrlCached: boolean) => void)[] = [];
broadcast.addEventListener('message', (event) => {
  if (event.data.type === 'isImageUrlCachedReply') {
    for (const listener of replyListeners) {
      listener(event.data.url, event.data.isImageUrlCached);
    }
  } else if (event.data.type === 'isServiceWorkerEnabledReply') {
    serviceWorkerEnabled = true;
  }
});
broadcast.postMessage({ type: 'isServiceWorkerEnabled' });

export function isServiceWorkerEnabled() {
  return serviceWorkerEnabled;
}

export function cancelImageUrl(url: string | undefined | null) {
  if (!url) {
    return;
  }
  broadcast.postMessage({ type: 'cancel', url });
}

export function preloadImageUrl(url: string | undefined | null) {
  if (!url) {
    return;
  }
  broadcast.postMessage({ type: 'preload', url });
}

export function isImageUrlCached(url: string) {
  if (!globalThis.isSecureContext || !serviceWorkerEnabled) {
    return Promise.resolve(false);
  }
  return new Promise<boolean>((resolve) => {
    const listener = (urlReply: string, isUrlCached: boolean) => {
      if (urlReply === url) {
        cleanup(isUrlCached);
      }
    };
    const cleanup = (isUrlCached: boolean) => {
      replyListeners = replyListeners.filter((element) => element !== listener);
      resolve(isUrlCached);
    };
    replyListeners.push(listener);
    broadcast.postMessage({ type: 'isImageUrlCached', url });
    setTimeout(() => cleanup(false), 5000);
  });
}
