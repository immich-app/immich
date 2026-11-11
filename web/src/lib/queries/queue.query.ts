import { asMutation, queryClient } from '#lib/queries/client.ts';
import type { QueueSnapshot } from '#lib/types.ts';
import {
  QueueCommand,
  QueueName,
  emptyQueue,
  getQueues,
  runQueueCommandLegacy,
  updateQueue,
  type QueueResponseDto,
} from '@immich/sdk';
import { mutationOptions, queryOptions, type MutationMeta } from '@tanstack/svelte-query';

export const queuesQueryKey = ['queues'];
const queueSnapshotsQueryKey = ['queue-snapshots'];

const findOrFail = (queues: QueueResponseDto[], name: QueueName) => {
  const queue = queues.find((queue) => queue.name === name);
  if (!queue) {
    throw new Error(`Queue ${name} not found`);
  }
  return queue;
};

export const getQueuesQuery = () =>
  queryOptions({
    queryKey: queuesQueryKey,
    queryFn: async ({ signal }) => {
      const queues = await getQueues({ signal });
      queryClient.setQueryData<QueueSnapshot[]>(queueSnapshotsQueryKey, (snapshots = []) =>
        [...snapshots, { timestamp: Date.now(), snapshot: queues }].slice(-30),
      );
      return queues;
    },
    refetchInterval: 3000,
  });

export const getQueueSnapshotsQuery = () =>
  queryOptions({
    queryKey: queueSnapshotsQueryKey,
    queryFn: () => [] as QueueSnapshot[],
    initialData: [],
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const getQueueQuery = (name: QueueName) =>
  queryOptions({
    ...getQueuesQuery(),
    select: (queues) => findOrFail(queues, name),
  });

const invalidateQueues = () => queryClient.invalidateQueries({ queryKey: queuesQueryKey });

export const updateQueueMutation = () =>
  asMutation(updateQueue, {
    onSuccess: (queue) =>
      queryClient.setQueryData<QueueResponseDto[]>(queuesQueryKey, (queues) =>
        queues?.map((item) => (item.name === queue.name ? queue : item)),
      ),
  });

export const emptyQueueMutation = (meta?: MutationMeta) =>
  asMutation(emptyQueue, { onSuccess: invalidateQueues, meta });

export const runQueueCommandLegacyMutation = () => asMutation(runQueueCommandLegacy, { onSuccess: invalidateQueues });

export const scanAllLibrariesMutation = () =>
  mutationOptions({
    mutationFn: () =>
      runQueueCommandLegacy({ name: QueueName.Library, queueCommandDto: { command: QueueCommand.Start } }),
    meta: {
      success: { toast: { color: 'info', description: 'admin.refreshing_all_libraries' } },
      error: { toast: 'errors.unable_to_scan_libraries' },
    },
  });
