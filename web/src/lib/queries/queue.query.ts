import { asMutation, queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import type { QueueSnapshot } from '#lib/types.ts';
import {
  ManualJobName,
  QueueCommand,
  QueueName,
  createJob,
  emptyQueue,
  getQueues,
  getQueuesLegacy,
  runQueueCommandLegacy,
  updateQueue,
  type QueueResponseDto,
} from '@immich/sdk';
import {
  mutationOptions,
  queryOptions,
  skipToken,
  type MutationFilters,
  type MutationMeta,
} from '@tanstack/svelte-query';

const findOrFail = (queues: QueueResponseDto[], name: QueueName) => {
  const queue = queues.find((queue) => queue.name === name);
  if (!queue) {
    throw new Error(`Queue ${name} not found`);
  }
  return queue;
};

export const getQueuesQuery = () =>
  queryOptions({
    queryKey: QueryKeys.queues(),
    queryFn: async ({ signal }) => {
      const queues = await getQueues({ signal });
      queryClient.setQueryData(getQueueSnapshotsQuery().queryKey, (snapshots = []) =>
        [...snapshots, { timestamp: Date.now(), snapshot: queues }].slice(-30),
      );
      return queues;
    },
    refetchInterval: 3000,
  });

export const getQueueSnapshotsQuery = () =>
  queryOptions({
    queryKey: QueryKeys.queueSnapshots(),
    queryFn: skipToken,
    initialData: [] as QueueSnapshot[],
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const getQueuesLegacyQuery = () =>
  queryOptions({
    queryKey: QueryKeys.jobs(),
    queryFn: ({ signal }) => getQueuesLegacy({ signal }),
    refetchInterval: 2000,
  });

export const getQueueQuery = (name: QueueName) =>
  queryOptions({
    ...getQueuesQuery(),
    select: (queues) => findOrFail(queues, name),
  });

const invalidateQueues = () => queryClient.invalidateQueries({ queryKey: QueryKeys.queues() });

export const updateQueueMutation = () =>
  asMutation(updateQueue, {
    onSuccess: (queue) =>
      queryClient.setQueryData(getQueuesQuery().queryKey, (queues) =>
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

const createJobMutationKey = ['jobs', 'create'];

export const isCreatingJob = (name: ManualJobName): MutationFilters => ({
  mutationKey: createJobMutationKey,
  predicate: ({ state }) => {
    const [{ jobCreateDto }] = state.variables as Parameters<typeof createJob>;
    return jobCreateDto.name === name;
  },
});

export const createJobMutation = (meta?: MutationMeta) =>
  asMutation(createJob, {
    mutationKey: createJobMutationKey,
    meta: meta ?? { success: { toast: 'admin.job_created' }, error: { toast: 'errors.unable_to_submit_job' } },
  });
