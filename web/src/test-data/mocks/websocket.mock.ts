import { writable } from 'svelte/store';

/**
 * Reusable mock for `$lib/stores/websocket`.
 *
 * Usage in test files:
 * ```ts
 * import { websocketMock } from '@test-data/mocks/websocket.mock';
 * // vi.mock is called automatically when this module is imported
 * ```
 */
vi.mock('$lib/stores/websocket', () => ({
  websocketStore: {
    connected: writable(false),
    serverVersion: writable(undefined),
    serverRestarting: writable(undefined),
  },
  websocketEvents: {
    on: vi.fn(() => vi.fn()),
    off: vi.fn(),
  },
  openWebsocketConnection: vi.fn(),
  closeWebsocketConnection: vi.fn(),
  waitForWebsocketEvent: vi.fn(),
}));

// Re-import to get the mocked version for test assertions
import {
  closeWebsocketConnection,
  openWebsocketConnection,
  waitForWebsocketEvent,
  websocketEvents,
  websocketStore,
} from '$lib/stores/websocket';
import type { Mock } from 'vitest';

export const websocketMock = {
  websocketStore: websocketStore as {
    connected: ReturnType<typeof writable<boolean>>;
    serverVersion: ReturnType<typeof writable>;
    serverRestarting: ReturnType<typeof writable>;
  },
  websocketEvents: websocketEvents as {
    on: Mock;
    off: Mock;
  },
  openWebsocketConnection: openWebsocketConnection as unknown as Mock,
  closeWebsocketConnection: closeWebsocketConnection as unknown as Mock,
  waitForWebsocketEvent: waitForWebsocketEvent as unknown as Mock,
};
