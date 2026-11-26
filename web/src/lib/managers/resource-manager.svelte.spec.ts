import { resourceManager } from '#lib/managers/resource-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getQueueSnapshotsQuery } from '#lib/queries/queue.query.ts';
import { QueryObserver, type QueryKey } from '@tanstack/svelte-query';
import { noop } from 'lodash-es';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const isInvalidated = (queryKey: QueryKey) => queryClient.getQueryState(queryKey)?.isInvalidated ?? false;

const fromElsewhere = ({ changed = [], deleted = [] }: { changed?: string[]; deleted?: string[] }) => ({
  changed,
  deleted,
  correlationId: 'another-device.1',
});

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

  describe('handleEvent changed', () => {
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

      resourceManager.handleEvent(fromElsewhere({ changed: [path] }));
      vi.advanceTimersByTime(500);

      expect(isInvalidated(queryKey)).toBe(hit);
    });

    it('refetches an active query once for a burst of events', async () => {
      const queryFn = vi.fn(() => Promise.resolve([]));
      await queryClient.fetchQuery({ queryKey: ['albums'], queryFn });
      const unsubscribe = new QueryObserver(queryClient, { queryKey: ['albums'], queryFn }).subscribe(noop);

      resourceManager.handleEvent(fromElsewhere({ changed: ['/albums/1'] }));
      resourceManager.handleEvent(fromElsewhere({ changed: ['/albums/1', '/albums/2'] }));
      resourceManager.handleEvent(fromElsewhere({ changed: ['/tags'] }));
      await vi.advanceTimersByTimeAsync(499);
      expect(queryFn).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);

      expect(queryFn).toHaveBeenCalledTimes(2);
      unsubscribe();
    });
  });

  describe('handleEvent deleted', () => {
    it.each([
      { name: 'equal path', queryKey: ['albums', '1'], removed: true, invalidated: false },
      { name: 'descendant', queryKey: ['albums', '1', 'map-markers'], removed: true, invalidated: false },
      { name: 'ancestor', queryKey: ['albums'], removed: false, invalidated: true },
      { name: 'ancestor with params', queryKey: ['albums', { assetId: '2' }], removed: false, invalidated: true },
      { name: 'sibling id', queryKey: ['albums', '2'], removed: false, invalidated: false },
      { name: 'different root', queryKey: ['tags', '1'], removed: false, invalidated: false },
    ])('$name: /albums/1 removes $queryKey is $removed', ({ queryKey, removed, invalidated }) => {
      queryClient.setQueryData(queryKey, []);

      resourceManager.handleEvent(fromElsewhere({ deleted: ['/albums/1'] }));

      expect(queryClient.getQueryData(queryKey) === undefined).toBe(removed);
      expect(isInvalidated(queryKey)).toBe(invalidated);
    });

    it('drops pending updates at or below a deleted path', async () => {
      const queryFn = vi.fn(() => Promise.resolve([]));
      await queryClient.fetchQuery({ queryKey: ['albums'], queryFn });
      const unsubscribe = new QueryObserver(queryClient, { queryKey: ['albums'], queryFn }).subscribe(noop);
      queryClient.setQueryData(['tags'], []);
      resourceManager.handleEvent(fromElsewhere({ changed: ['/albums/1/assets', '/tags'] }));

      resourceManager.handleEvent(fromElsewhere({ deleted: ['/albums/1'] }));
      await vi.advanceTimersByTimeAsync(500);

      expect(queryFn).toHaveBeenCalledTimes(2);
      expect(isInvalidated(['tags'])).toBe(true);
      unsubscribe();
    });

    it('keeps the queries of a delete caused by this tab', async () => {
      queryClient.setQueryData(['albums', '1'], []);
      const onDelete = vi.fn();
      const unsubscribe = resourceManager.onDelete('/albums/1', onDelete);
      const headers = await sendRequest();

      resourceManager.handleEvent({
        changed: [],
        deleted: ['/albums/1'],
        correlationId: headers.get('X-Correlation-ID') ?? '',
      });

      expect(queryClient.getQueryData(['albums', '1'])).toEqual([]);
      expect(onDelete).not.toHaveBeenCalled();
      unsubscribe();
    });

    it('does not refetch a removed query that is still observed', async () => {
      const queryFn = vi.fn(() => Promise.resolve({ id: '1' }));
      await queryClient.fetchQuery({ queryKey: ['albums', '1'], queryFn });
      const observer = new QueryObserver(queryClient, { queryKey: ['albums', '1'], queryFn });
      const unsubscribe = observer.subscribe(noop);

      resourceManager.handleEvent(fromElsewhere({ deleted: ['/albums/1'] }));
      resourceManager.handleEvent(fromElsewhere({ changed: ['/albums'] }));
      await vi.advanceTimersByTimeAsync(500);

      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(observer.getCurrentResult()).toMatchObject({ data: { id: '1' }, status: 'success' });
      unsubscribe();
    });
  });

  describe('handleEvent', () => {
    it('removes deleted paths at once and invalidates changed paths after the batch', () => {
      queryClient.setQueryData(['albums', '1'], []);
      queryClient.setQueryData(['tags'], []);

      resourceManager.handleEvent(fromElsewhere({ changed: ['/tags'], deleted: ['/albums/1'] }));
      expect(isInvalidated(['tags'])).toBe(false);
      vi.advanceTimersByTime(500);

      expect(queryClient.getQueryData(['albums', '1'])).toBeUndefined();
      expect(isInvalidated(['tags'])).toBe(true);
    });

    it('keeps changed paths below a path deleted by the same event', async () => {
      const queryFn = vi.fn(() => Promise.resolve([]));
      await queryClient.fetchQuery({ queryKey: ['albums'], queryFn });
      const unsubscribe = new QueryObserver(queryClient, { queryKey: ['albums'], queryFn }).subscribe(noop);

      resourceManager.handleEvent(fromElsewhere({ changed: ['/albums/1/assets'], deleted: ['/albums/1'] }));
      await vi.advanceTimersByTimeAsync(500);

      expect(queryFn).toHaveBeenCalledTimes(3);
      unsubscribe();
    });
  });

  describe('onDelete', () => {
    it('calls the listener before removing the queries', () => {
      queryClient.setQueryData(['albums', '1'], []);
      const onDelete = vi.fn(() => queryClient.getQueryData(['albums', '1']));
      const unsubscribe = resourceManager.onDelete('/albums/1', onDelete);

      resourceManager.handleEvent(fromElsewhere({ deleted: ['/albums/1'] }));

      expect(onDelete).toHaveReturnedWith([]);
      unsubscribe();
    });

    it.each([
      { name: 'equal path', path: '/albums/1', deleted: '/albums/1', called: true },
      { name: 'ancestor deleted', path: '/albums/1/assets', deleted: '/albums/1', called: true },
      { name: 'descendant deleted', path: '/albums', deleted: '/albums/1', called: false },
      { name: 'sibling deleted', path: '/albums/1', deleted: '/albums/2', called: false },
    ])('$name: $deleted calls listener of $path is $called', ({ path, deleted, called }) => {
      const onDelete = vi.fn();
      const unsubscribe = resourceManager.onDelete(path, onDelete);

      resourceManager.handleEvent(fromElsewhere({ deleted: [deleted] }));

      expect(onDelete).toHaveBeenCalledTimes(called ? 1 : 0);
      unsubscribe();
    });

    it('does not call a listener after it unsubscribed', () => {
      const onDelete = vi.fn();
      const unsubscribe = resourceManager.onDelete('/albums/1', onDelete);
      unsubscribe();

      resourceManager.handleEvent(fromElsewhere({ deleted: ['/albums/1'] }));

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe('withCorrelationId', () => {
    it('ignores an update caused by a request of this tab', async () => {
      queryClient.setQueryData(['albums'], []);
      const headers = await sendRequest();

      resourceManager.handleEvent({
        changed: ['/albums'],
        deleted: [],
        correlationId: headers.get('X-Correlation-ID') ?? '',
      });
      vi.advanceTimersByTime(500);

      expect(isInvalidated(['albums'])).toBe(false);
    });

    it('applies an update that has no correlation id', () => {
      queryClient.setQueryData(['albums'], []);

      resourceManager.handleEvent({ changed: ['/albums'], deleted: [] });
      vi.advanceTimersByTime(500);

      expect(isInvalidated(['albums'])).toBe(true);
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
