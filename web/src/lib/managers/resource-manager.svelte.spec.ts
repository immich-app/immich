import { resourceManager } from '#lib/managers/resource-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getQueueSnapshotsQuery } from '#lib/queries/queue.query.ts';
import { QueryObserver, type QueryKey } from '@tanstack/svelte-query';
import { noop } from 'lodash-es';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const isInvalidated = (queryKey: QueryKey) => queryClient.getQueryState(queryKey)?.isInvalidated ?? false;

const fromElsewhere = (...paths: string[]) => ({ paths, correlationId: 'another-device.1' });

const sendRequest = async () => {
  const impl = vi.fn<typeof fetch>(() => Promise.resolve(new Response()));
  await resourceManager.withCorrelationId(impl)('/api/albums', {
    method: 'POST',
    headers: { accept: 'application/json' },
  });
  return new Headers(impl.mock.calls[0][1]?.headers);
};

describe('resourceManager', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    resourceManager.handleDisconnect('io client disconnect');
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    queryClient.clear();
  });

  describe('handleUpdate', () => {
    it.each([
      { name: 'equal path', path: '/albums/1', queryKey: ['albums', '1'], hit: true },
      { name: 'descendant query', path: '/albums/1', queryKey: ['albums', '1', 'map-markers'], hit: true },
      { name: 'ancestor query', path: '/albums/1', queryKey: ['albums'], hit: true },
      { name: 'sibling id', path: '/albums/1', queryKey: ['albums', '2'], hit: false },
      { name: 'different root', path: '/albums/1', queryKey: ['tags'], hit: false },
      { name: 'partial segment', path: '/albums', queryKey: ['albums-foo'], hit: false },
      { name: 'params object ends the path', path: '/people', queryKey: ['people', { withHidden: true }], hit: true },
      { name: 'discriminator after params', path: '/people/1', queryKey: ['people', { size: 1 }, 'pages'], hit: true },
      { name: 'no leading string', path: '/albums', queryKey: [{ path: 'albums' }, 'albums'], hit: false },
    ])('$name: $path hit $queryKey is $hit', ({ path, queryKey, hit }) => {
      queryClient.setQueryData(queryKey, []);

      resourceManager.handleUpdate(fromElsewhere(path));
      vi.advanceTimersByTime(500);

      expect(isInvalidated(queryKey)).toBe(hit);
    });

    it('refetches an active query once for a burst of events', async () => {
      const queryFn = vi.fn(() => Promise.resolve([]));
      await queryClient.fetchQuery({ queryKey: ['albums'], queryFn });
      const unsubscribe = new QueryObserver(queryClient, { queryKey: ['albums'], queryFn }).subscribe(noop);

      resourceManager.handleUpdate(fromElsewhere('/albums/1'));
      resourceManager.handleUpdate(fromElsewhere('/albums/1', '/albums/2'));
      resourceManager.handleUpdate(fromElsewhere('/tags'));
      await vi.advanceTimersByTimeAsync(499);
      expect(queryFn).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(queryFn).toHaveBeenCalledTimes(2);
      unsubscribe();
    });
  });

  describe('withCorrelationId', () => {
    it('ignores an update caused by a request of this tab', async () => {
      queryClient.setQueryData(['albums'], []);
      const headers = await sendRequest();

      resourceManager.handleUpdate({ paths: ['/albums'], correlationId: headers.get('X-Correlation-ID') ?? '' });
      vi.advanceTimersByTime(500);

      expect(isInvalidated(['albums'])).toBe(false);
    });

    it('sends a new correlation id with each request and keeps its headers', async () => {
      const first = await sendRequest();
      const second = await sendRequest();

      expect(first.get('X-Correlation-ID')).not.toBe(second.get('X-Correlation-ID'));
      expect(first.get('accept')).toBe('application/json');
    });
  });

  describe('handleConnect', () => {
    it('invalidates nothing when the connection was not lost', () => {
      queryClient.setQueryData(['albums'], []);

      resourceManager.handleConnect();

      expect(isInvalidated(['albums'])).toBe(false);
    });

    it('invalidates every query on a reconnect', () => {
      queryClient.setQueryData(['albums'], []);
      queryClient.setQueryData([{ id: '1' }], []);
      resourceManager.handleConnect();
      resourceManager.handleDisconnect('transport close');

      resourceManager.handleConnect();

      expect(isInvalidated(['albums'])).toBe(true);
      expect(isInvalidated([{ id: '1' }])).toBe(true);
    });

    it('invalidates nothing after the client closed the connection', () => {
      queryClient.setQueryData(['albums'], []);
      resourceManager.handleConnect();
      resourceManager.handleDisconnect('io client disconnect');

      resourceManager.handleConnect();

      expect(isInvalidated(['albums'])).toBe(false);
    });

    it('keeps the queue snapshots on a reconnect', async () => {
      const options = getQueueSnapshotsQuery();
      const snapshots = [{ timestamp: 1, snapshot: [] }];
      const observer = new QueryObserver(queryClient, options);
      const unsubscribe = observer.subscribe(noop);
      queryClient.setQueryData(options.queryKey, snapshots);
      resourceManager.handleConnect();
      resourceManager.handleDisconnect('transport close');

      resourceManager.handleConnect();
      await vi.advanceTimersByTimeAsync(0);

      expect(observer.getCurrentResult().data).toEqual(snapshots);
      unsubscribe();
    });
  });
});
