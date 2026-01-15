import { ServiceWorkerMessenger } from './sw-messenger';

const messenger = new ServiceWorkerMessenger();

let isServiceWorkerEnabled = true;

messenger.onAckTimeout(() => {
  if (!isServiceWorkerEnabled) {
    return;
  }
  console.error('[ServiceWorker] No communication detected. Auto-disabled service worker.');
  isServiceWorkerEnabled = false;
});

const isValidSwContext = (url: string | undefined | null): url is string => {
  return globalThis.isSecureContext && isServiceWorkerEnabled && !!url;
};

export function cancelImageUrl(url: string | undefined | null) {
  if (!isValidSwContext(url)) {
    return;
  }
  void messenger.send('cancel', { url });
}
