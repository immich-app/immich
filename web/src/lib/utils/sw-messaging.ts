const broadcast = new BroadcastChannel('immich');

export function cancelImageUrl(url: string) {
  broadcast.postMessage({ type: 'cancel', url });
}
export function preloadImageUrl(url: string) {
  broadcast.postMessage({ type: 'preload', url });
}
