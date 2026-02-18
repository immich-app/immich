import { ServiceWorkerMessenger } from './sw-messenger';

const hasServiceWorker = globalThis.isSecureContext && 'serviceWorker' in navigator;
// eslint-disable-next-line compat/compat
const messenger = hasServiceWorker ? new ServiceWorkerMessenger(navigator.serviceWorker) : undefined;

export function cancelImageUrl(url: string | undefined | null) {
  if (!url || !messenger) {
    return;
  }
  messenger.send('cancel', { url });
}
