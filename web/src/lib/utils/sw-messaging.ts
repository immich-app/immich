const broadcast = new BroadcastChannel('immich');

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
