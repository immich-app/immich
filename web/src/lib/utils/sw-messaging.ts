import { ServiceWorkerMessenger } from './sw-messenger';

const messenger = new ServiceWorkerMessenger();
const hasServiceWorker = globalThis.isSecureContext && 'serviceWorker' in navigator;

const isValidSwContext = (url: string | undefined | null): url is string => {
  return hasServiceWorker && !!url;
};

export function cancelImageUrl(url: string | undefined | null) {
  if (!isValidSwContext(url)) {
    return;
  }
  void messenger.send('cancel', { url });
}
