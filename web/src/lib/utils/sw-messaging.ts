const broadcast = new BroadcastChannel('immich');

let isLoadedReplyListeners: ((url: string, isUrlCached: boolean) => void)[] = [];
broadcast.addEventListener('message', (event) => {
  if (event.data.type == 'isImageUrlCachedReply') {
    for (const listener of isLoadedReplyListeners) {
      listener(event.data.url, event.data.isImageUrlCached);
    }
  }
});

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

export function isImageUrlCached(url: string | undefined | null): Promise<boolean> {
  if (!url) {
    return Promise.resolve(false);
  }
  if (!globalThis.isSecureContext) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const listener = (urlReply: string, isUrlCached: boolean) => {
      if (urlReply === url) {
        cleanup(isUrlCached);
      }
    };
    const cleanup = (isUrlCached: boolean) => {
      isLoadedReplyListeners = isLoadedReplyListeners.filter((element) => element !== listener);
      resolve(isUrlCached);
    };
    isLoadedReplyListeners.push(listener);
    broadcast.postMessage({ type: 'isImageUrlCached', url });

    setTimeout(() => cleanup(false), 5000);
  });
}
