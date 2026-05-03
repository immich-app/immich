import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const addEventListenerMock = vi.fn();

vi.mock('./request', () => ({
  handleCancel: vi.fn(),
  handleFetch: vi.fn(() => Promise.resolve(new Response())),
}));

const loadServiceWorker = async () => {
  vi.resetModules();
  addEventListenerMock.mockClear();
  vi.stubGlobal('addEventListener', addEventListenerMock);
  vi.stubGlobal('clients', { claim: vi.fn() });
  vi.stubGlobal('skipWaiting', vi.fn());

  await import('./index');

  return addEventListenerMock.mock.calls;
};

describe('service worker', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not register a fetch listener', async () => {
    const calls = await loadServiceWorker();

    expect(calls).not.toContainEqual(expect.arrayContaining(['fetch']));
  });

  it('does not respond to asset media requests during a thumbnail burst', async () => {
    const calls = await loadServiceWorker();
    const fetchListeners = calls
      .filter(([eventName]) => eventName === 'fetch')
      .map(([, listener]) => listener as (event: FetchEvent) => void);

    const respondWith = vi.fn();

    for (let index = 0; index < 200; index++) {
      const id = `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
      const request = new Request(`${location.origin}/api/assets/${id}/thumbnail?c=cache-${index}`);
      const event = { request, respondWith } as unknown as FetchEvent;

      for (const listener of fetchListeners) {
        listener(event);
      }
    }

    expect(respondWith).not.toHaveBeenCalled();
  });
});
