/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { handleCancel } from './request';

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

/**
 * Send acknowledgment for a request
 */
function sendAck(client: Client, requestId: string) {
  client.postMessage({
    type: 'ack',
    requestId,
  });
}

/**
 * Handle 'cancel' request: cancel a pending request
 */
const handleCancelRequest = (client: Client, url: URL, requestId: string) => {
  sendAck(client, requestId);
  handleCancel(url);
};

export const installMessageListener = () => {
  sw.addEventListener('message', (event) => {
    if (!event.data?.requestId || !event.data?.type) {
      return;
    }

    const requestId = event.data.requestId;

    switch (event.data.type) {
      case 'cancel': {
        const url = event.data.url ? new URL(event.data.url, self.location.origin) : undefined;
        if (!url) {
          return;
        }

        const client = event.source;
        if (!client) {
          return;
        }

        handleCancelRequest(client, url, requestId);
        break;
      }
    }
  });
};
