export class ServiceWorkerMessenger {
  readonly #serviceWorker: ServiceWorkerContainer;

  constructor(serviceWorker: ServiceWorkerContainer) {
    this.#serviceWorker = serviceWorker;
  }

  /**
   * Send a one-way message to the service worker.
   */
  send(type: string, data: Record<string, unknown>) {
    this.#serviceWorker.controller?.postMessage({
      type,
      ...data,
    });
  }
}
