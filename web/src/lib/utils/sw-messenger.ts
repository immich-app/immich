export class ServiceWorkerMessenger {
  constructor() {}

  #sendInternal(type: string, data: Record<string, unknown>) {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not enabled in this environment ');
    }

    // eslint-disable-next-line compat/compat
    navigator.serviceWorker.controller?.postMessage({
      type,
      ...data,
    });
  }

  /**
   * Send a one-way message to the service worker.
   */
  send(type: string, data: Record<string, unknown>) {
    return this.#sendInternal(type, data);
  }
}
