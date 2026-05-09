import { ModuleRef } from '@nestjs/core';
import { setTimeout } from 'node:timers/promises';
import { JobName, QueueName } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { JobCounts } from 'src/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:timers/promises', () => ({
  setTimeout: vi.fn().mockResolvedValue(void 0),
}));

const setTimeoutMock = vi.mocked(setTimeout);

const emptyCounts = (): JobCounts => ({
  active: 0,
  completed: 0,
  failed: 0,
  delayed: 0,
  waiting: 0,
  paused: 0,
});

const setup = (counts: JobCounts[] = []) => {
  const queue = {
    add: vi.fn().mockResolvedValue({}),
    addBulk: vi.fn().mockResolvedValue([]),
    clean: vi.fn().mockResolvedValue([]),
    drain: vi.fn().mockResolvedValue(void 0),
    getJob: vi.fn().mockResolvedValue(void 0),
    getJobCounts: vi.fn().mockResolvedValue(emptyCounts()),
    getJobs: vi.fn().mockResolvedValue([]),
    isPaused: vi.fn().mockResolvedValue(false),
  };

  for (const value of counts) {
    queue.getJobCounts.mockResolvedValueOnce(value);
  }

  const moduleRef = { get: vi.fn().mockReturnValue(queue) } as unknown as ModuleRef;
  const logger = {
    setContext: vi.fn(),
    error: vi.fn(),
    verbose: vi.fn(),
    warn: vi.fn(),
  } as unknown as LoggingRepository;

  const sut = new JobRepository(moduleRef, {} as ConfigRepository, {} as EventRepository, logger);

  return { sut, queue, logger };
};

const setHandlers = (sut: JobRepository, jobs: JobName[]) => {
  (sut as unknown as { handlers: Record<JobName, { queueName: QueueName }> }).handlers = Object.fromEntries(
    jobs.map((name) => [name, { queueName: QueueName.BackgroundTask }]),
  ) as Record<JobName, { queueName: QueueName }>;
};

describe(JobRepository.name, () => {
  beforeEach(() => {
    setTimeoutMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return immediately when queues have no active waiting delayed or paused jobs', async () => {
    const { sut, queue } = setup([emptyCounts()]);

    await sut.waitForQueueCompletion(QueueName.FaceDetection);

    expect(queue.getJobCounts).toHaveBeenCalledTimes(1);
    expect(setTimeoutMock).not.toHaveBeenCalled();
  });

  it('should wait while a queue has waiting jobs', async () => {
    const { sut, queue } = setup([{ ...emptyCounts(), waiting: 1 }, emptyCounts()]);

    await sut.waitForQueueCompletion(QueueName.FaceDetection);

    expect(queue.getJobCounts).toHaveBeenCalledTimes(2);
    expect(setTimeoutMock).toHaveBeenCalledTimes(1);
    expect(setTimeoutMock).toHaveBeenCalledWith(1000);
  });

  it('should wait while a queue has delayed jobs', async () => {
    const { sut, queue } = setup([{ ...emptyCounts(), delayed: 1 }, emptyCounts()]);

    await sut.waitForQueueCompletion(QueueName.FacialRecognition);

    expect(queue.getJobCounts).toHaveBeenCalledTimes(2);
    expect(setTimeoutMock).toHaveBeenCalledTimes(1);
    expect(setTimeoutMock).toHaveBeenCalledWith(1000);
  });

  it('should wait and warn while a paused queue has paused jobs', async () => {
    const { sut, queue, logger } = setup([{ ...emptyCounts(), paused: 1 }, emptyCounts()]);
    queue.isPaused.mockResolvedValueOnce(true);

    await sut.waitForQueueCompletion(QueueName.FaceDetection);

    expect(queue.getJobCounts).toHaveBeenCalledTimes(2);
    expect(setTimeoutMock).toHaveBeenCalledTimes(1);
    expect(setTimeoutMock).toHaveBeenCalledWith(1000);
    expect(logger.warn).toHaveBeenCalledWith(
      `Waiting for ${QueueName.FaceDetection} queue to finish (0 active, 0 waiting, 0 delayed, 1 paused); queue is paused`,
    );
  });

  it('drains delayed jobs when requested', async () => {
    const { sut, queue } = setup();

    await sut.empty(QueueName.FacialRecognition, true);

    expect(queue.drain).toHaveBeenCalledWith(true);
  });

  it('keeps the manual empty default drain behavior', async () => {
    const { sut, queue } = setup();

    await sut.empty(QueueName.FacialRecognition);

    expect(queue.drain).toHaveBeenCalledWith(false);
  });

  it('does not clean active completed or failed jobs when draining delayed jobs', async () => {
    const { sut, queue } = setup();

    await sut.empty(QueueName.FacialRecognition, true);

    expect(queue.drain).toHaveBeenCalledWith(true);
    expect(queue.clean).not.toHaveBeenCalled();
  });

  it('returns queue counts and oldest job ages', async () => {
    const { sut, queue } = setup();
    const now = new Date('2026-04-25T12:00:00Z').getTime();
    queue.getJobCounts.mockResolvedValue({
      active: 1,
      completed: 2,
      failed: 3,
      delayed: 4,
      waiting: 5,
      paused: 6,
    });
    queue.getJobs.mockResolvedValue([{ timestamp: now - 120_000 }]);

    const result = await sut.getTelemetryMetrics(now);

    expect(result.counts).toEqual(
      expect.arrayContaining([
        { queue: QueueName.ThumbnailGeneration, status: 'active', count: 1 },
        { queue: QueueName.ThumbnailGeneration, status: 'completed', count: 2 },
        { queue: QueueName.ThumbnailGeneration, status: 'failed', count: 3 },
        { queue: QueueName.ThumbnailGeneration, status: 'delayed', count: 4 },
        { queue: QueueName.ThumbnailGeneration, status: 'waiting', count: 5 },
        { queue: QueueName.ThumbnailGeneration, status: 'paused', count: 6 },
      ]),
    );
    expect(result.oldestJobAges).toEqual(
      expect.arrayContaining([
        { queue: QueueName.ThumbnailGeneration, status: 'waiting', ageSeconds: 120 },
        { queue: QueueName.ThumbnailGeneration, status: 'delayed', ageSeconds: 120 },
        { queue: QueueName.ThumbnailGeneration, status: 'failed', ageSeconds: 120 },
      ]),
    );
    expect(queue.getJobs).toHaveBeenCalledWith('waiting', 0, 0, true);
    expect(queue.getJobs).toHaveBeenCalledWith('delayed', 0, 0, true);
    expect(queue.getJobs).toHaveBeenCalledWith('failed', 0, 0, true);
  });

  it('uses stable job ids for root backfills and unique ids for cursor chunks', async () => {
    const { sut, queue } = setup();
    setHandlers(sut, [JobName.FaceIdentityBackfill, JobName.SharedSpacePersonMetadataBackfill]);

    await sut.queueAll([
      { name: JobName.FaceIdentityBackfill, data: {} },
      { name: JobName.FaceIdentityBackfill, data: {} },
      { name: JobName.FaceIdentityBackfill, data: { continuationId: 'continuation-1' } },
      { name: JobName.FaceIdentityBackfill, data: { continuationId: 'continuation-2' } },
      { name: JobName.FaceIdentityBackfill, data: { stage: 'person', cursor: 'person-cursor' } },
      { name: JobName.FaceIdentityBackfill, data: { stage: 'space-person', cursor: 'space-cursor' } },
      { name: JobName.SharedSpacePersonMetadataBackfill, data: {} },
      { name: JobName.SharedSpacePersonMetadataBackfill, data: {} },
      { name: JobName.SharedSpacePersonMetadataBackfill, data: { identityId: 'identity-1' } },
      { name: JobName.SharedSpacePersonMetadataBackfill, data: { identityId: 'identity-1' } },
      {
        name: JobName.SharedSpacePersonMetadataBackfill,
        data: { identityId: 'identity-1', cursor: 'cursor-1', limit: 1000 },
      },
      {
        name: JobName.SharedSpacePersonMetadataBackfill,
        data: { identityId: 'identity-1', cursor: 'cursor-2', limit: 1000 },
      },
    ]);

    expect(queue.addBulk).not.toHaveBeenCalled();
    for (const call of queue.add.mock.calls) {
      const options = call[2];
      expect(options?.jobId).not.toContain(':');
    }
    expect(queue.add).toHaveBeenCalledWith(
      JobName.FaceIdentityBackfill,
      {},
      {
        jobId: 'face-identity-backfill/root',
        removeOnFail: true,
      },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.FaceIdentityBackfill,
      {},
      {
        jobId: 'face-identity-backfill/root',
        removeOnFail: true,
      },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.FaceIdentityBackfill,
      { continuationId: 'continuation-1' },
      { jobId: 'face-identity-backfill/continuation/continuation-1', removeOnFail: true },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.FaceIdentityBackfill,
      { continuationId: 'continuation-2' },
      { jobId: 'face-identity-backfill/continuation/continuation-2', removeOnFail: true },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.FaceIdentityBackfill,
      { stage: 'person', cursor: 'person-cursor' },
      { jobId: 'face-identity-backfill/person/person-cursor', removeOnFail: true },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.FaceIdentityBackfill,
      { stage: 'space-person', cursor: 'space-cursor' },
      { jobId: 'face-identity-backfill/space-person/space-cursor', removeOnFail: true },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpacePersonMetadataBackfill,
      {},
      { jobId: 'shared-space-person-metadata-backfill/all', removeOnFail: true },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpacePersonMetadataBackfill,
      {},
      { jobId: 'shared-space-person-metadata-backfill/all', removeOnFail: true },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpacePersonMetadataBackfill,
      { identityId: 'identity-1' },
      { jobId: 'shared-space-person-metadata-backfill/identity/identity-1', removeOnFail: true },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpacePersonMetadataBackfill,
      { identityId: 'identity-1' },
      { jobId: 'shared-space-person-metadata-backfill/identity/identity-1', removeOnFail: true },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpacePersonMetadataBackfill,
      { identityId: 'identity-1', cursor: 'cursor-1', limit: 1000 },
      { jobId: 'shared-space-person-metadata-backfill/identity/identity-1/cursor-1', removeOnFail: true },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpacePersonMetadataBackfill,
      { identityId: 'identity-1', cursor: 'cursor-2', limit: 1000 },
      { jobId: 'shared-space-person-metadata-backfill/identity/identity-1/cursor-2', removeOnFail: true },
    );
  });

  it('removes a failed stable facial-recognition coordinator before requeueing it', async () => {
    const { sut, queue } = setup();
    const failedJob = {
      getState: vi.fn().mockResolvedValue('failed'),
      remove: vi.fn().mockResolvedValue(void 0),
    };
    queue.getJob.mockResolvedValue(failedJob);
    setHandlers(sut, [JobName.FacialRecognitionQueueAll]);

    await sut.queue({ name: JobName.FacialRecognitionQueueAll, data: { force: true } });

    expect(queue.getJob).toHaveBeenCalledWith(JobName.FacialRecognitionQueueAll);
    expect(failedJob.getState).toHaveBeenCalled();
    expect(failedJob.remove).toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledWith(
      JobName.FacialRecognitionQueueAll,
      { force: true },
      {
        jobId: JobName.FacialRecognitionQueueAll,
        removeOnComplete: true,
      },
    );
  });

  it.each(['active', 'waiting', 'delayed', 'paused'] as const)(
    'does not remove a %s stable facial-recognition coordinator when queueing non-force work',
    async (state) => {
      const { sut, queue } = setup();
      const existingJob = {
        data: { force: true },
        getState: vi.fn().mockResolvedValue(state),
        remove: vi.fn().mockResolvedValue(void 0),
        updateData: vi.fn().mockResolvedValue(void 0),
      };
      queue.getJob.mockResolvedValue(existingJob);
      setHandlers(sut, [JobName.FacialRecognitionQueueAll]);

      await sut.queue({ name: JobName.FacialRecognitionQueueAll, data: { force: false } });

      expect(queue.getJob).toHaveBeenCalledWith(JobName.FacialRecognitionQueueAll);
      expect(existingJob.getState).toHaveBeenCalled();
      expect(existingJob.remove).not.toHaveBeenCalled();
      expect(existingJob.updateData).not.toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalledWith(
        JobName.FacialRecognitionQueueAll,
        { force: false },
        {
          jobId: JobName.FacialRecognitionQueueAll,
          removeOnComplete: true,
        },
      );
    },
  );

  it.each(['waiting', 'delayed', 'paused'] as const)(
    'replaces a pending %s non-force facial-recognition coordinator when force is requested',
    async (state) => {
      const { sut, queue } = setup();
      const existingJob = {
        data: { force: false, nightly: true },
        getState: vi.fn().mockResolvedValue(state),
        remove: vi.fn().mockResolvedValue(void 0),
        updateData: vi.fn().mockResolvedValue(void 0),
      };
      queue.getJob.mockResolvedValue(existingJob);
      setHandlers(sut, [JobName.FacialRecognitionQueueAll]);

      await sut.queue({ name: JobName.FacialRecognitionQueueAll, data: { force: true } });

      expect(queue.getJob).toHaveBeenCalledWith(JobName.FacialRecognitionQueueAll);
      expect(existingJob.getState).toHaveBeenCalled();
      expect(existingJob.remove).toHaveBeenCalled();
      expect(existingJob.updateData).not.toHaveBeenCalled();
      expect(queue.drain).toHaveBeenCalledWith(true);
      expect(queue.add).toHaveBeenCalledWith(
        JobName.FacialRecognitionQueueAll,
        { force: true },
        {
          jobId: JobName.FacialRecognitionQueueAll,
          removeOnComplete: true,
        },
      );
    },
  );

  it('drains pending facial-recognition work before queueing a new force coordinator', async () => {
    const { sut, queue } = setup();
    setHandlers(sut, [JobName.FacialRecognitionQueueAll]);

    await sut.queue({ name: JobName.FacialRecognitionQueueAll, data: { force: true } });

    expect(queue.getJob).toHaveBeenCalledWith(JobName.FacialRecognitionQueueAll);
    expect(queue.drain).toHaveBeenCalledWith(true);
    expect(queue.add).toHaveBeenCalledWith(
      JobName.FacialRecognitionQueueAll,
      { force: true },
      {
        jobId: JobName.FacialRecognitionQueueAll,
        removeOnComplete: true,
      },
    );
    expect(queue.drain.mock.invocationCallOrder[0]).toBeLessThan(queue.add.mock.invocationCallOrder[0]);
  });

  it('queues a force follow-up coordinator when a non-force coordinator is active', async () => {
    const { sut, queue } = setup();
    const existingJob = {
      data: { force: false },
      getState: vi.fn().mockResolvedValue('active'),
      remove: vi.fn().mockResolvedValue(void 0),
      updateData: vi.fn().mockResolvedValue(void 0),
    };
    queue.getJob.mockResolvedValue(existingJob);
    setHandlers(sut, [JobName.FacialRecognitionQueueAll]);

    await sut.queue({ name: JobName.FacialRecognitionQueueAll, data: { force: true } });

    expect(queue.getJob).toHaveBeenCalledWith(JobName.FacialRecognitionQueueAll);
    expect(existingJob.getState).toHaveBeenCalled();
    expect(existingJob.remove).not.toHaveBeenCalled();
    expect(existingJob.updateData).not.toHaveBeenCalled();
    expect(queue.drain).toHaveBeenCalledWith(true);
    expect(queue.add).toHaveBeenCalledWith(
      JobName.FacialRecognitionQueueAll,
      { force: true },
      {
        jobId: 'FacialRecognitionQueueAll/force',
        removeOnComplete: true,
      },
    );
  });

  it('does not queue another coordinator when force recognition is already active', async () => {
    const { sut, queue } = setup();
    const existingJob = {
      data: { force: true },
      getState: vi.fn().mockResolvedValue('active'),
      remove: vi.fn().mockResolvedValue(void 0),
      updateData: vi.fn().mockResolvedValue(void 0),
    };
    queue.getJob.mockResolvedValue(existingJob);
    setHandlers(sut, [JobName.FacialRecognitionQueueAll]);

    await sut.queue({ name: JobName.FacialRecognitionQueueAll, data: { force: true } });

    expect(queue.getJob).toHaveBeenCalledWith(JobName.FacialRecognitionQueueAll);
    expect(existingJob.getState).toHaveBeenCalled();
    expect(existingJob.remove).not.toHaveBeenCalled();
    expect(existingJob.updateData).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('does not queue another coordinator when the force follow-up coordinator is already active', async () => {
    const { sut, queue } = setup();
    const activeForceFollowUp = {
      data: { force: true },
      getState: vi.fn().mockResolvedValue('active'),
      remove: vi.fn().mockResolvedValue(void 0),
    };
    queue.getJob.mockImplementation((jobId: string) =>
      Promise.resolve(jobId === 'FacialRecognitionQueueAll/force' ? activeForceFollowUp : void 0),
    );
    setHandlers(sut, [JobName.FacialRecognitionQueueAll]);

    await sut.queue({ name: JobName.FacialRecognitionQueueAll, data: { force: true } });

    expect(queue.getJob).toHaveBeenCalledWith(JobName.FacialRecognitionQueueAll);
    expect(queue.getJob).toHaveBeenCalledWith('FacialRecognitionQueueAll/force');
    expect(activeForceFollowUp.getState).toHaveBeenCalled();
    expect(activeForceFollowUp.remove).not.toHaveBeenCalled();
    expect(queue.drain).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('does not remove failed stable shared-space jobs while queueing duplicates', async () => {
    const { sut, queue } = setup();
    const failedJob = {
      getState: vi.fn().mockResolvedValue('failed'),
      remove: vi.fn().mockResolvedValue(void 0),
    };
    queue.getJob.mockResolvedValue(failedJob);
    setHandlers(sut, [JobName.SharedSpaceFaceMatchPage]);

    await sut.queue({ name: JobName.SharedSpaceFaceMatchPage, data: { spaceId: 'space-1' } });

    expect(queue.getJob).not.toHaveBeenCalled();
    expect(failedJob.remove).not.toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpaceFaceMatchPage,
      { spaceId: 'space-1' },
      {
        jobId: 'shared-space-face-match-page/space-1/start',
        removeOnComplete: true,
      },
    );
  });

  it('uses stable visible-failure job ids for shared-space face pipeline jobs', async () => {
    const { sut, queue } = setup();
    setHandlers(sut, [
      JobName.SharedSpaceFaceMatch,
      JobName.SharedSpaceFaceMatchAll,
      JobName.SharedSpaceFaceMatchPage,
      JobName.SharedSpacePersonDedup,
      JobName.SharedSpaceIdentityReconciliation,
    ]);

    await sut.queueAll([
      { name: JobName.SharedSpaceFaceMatch, data: { spaceId: 'space-1', assetId: 'asset-1' } },
      { name: JobName.SharedSpaceFaceMatch, data: { spaceId: 'space-1', assetId: 'asset-1' } },
      { name: JobName.SharedSpaceFaceMatch, data: { spaceId: 'space-2', assetId: 'asset-1' } },
      { name: JobName.SharedSpaceFaceMatchAll, data: { spaceId: 'space-1' } },
      { name: JobName.SharedSpaceFaceMatchPage, data: { spaceId: 'space-1' } },
      { name: JobName.SharedSpaceFaceMatchPage, data: { spaceId: 'space-1', afterAssetId: 'asset-9' } },
      { name: JobName.SharedSpacePersonDedup, data: { spaceId: 'space-1' } },
      { name: JobName.SharedSpaceIdentityReconciliation, data: { spaceId: 'space-1' } },
    ]);

    expect(queue.addBulk).not.toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpaceFaceMatch,
      { spaceId: 'space-1', assetId: 'asset-1' },
      {
        jobId: 'shared-space-face-match/space-1/asset-1',
        removeOnComplete: true,
      },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpaceFaceMatch,
      { spaceId: 'space-2', assetId: 'asset-1' },
      {
        jobId: 'shared-space-face-match/space-2/asset-1',
        removeOnComplete: true,
      },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpaceFaceMatchAll,
      { spaceId: 'space-1' },
      {
        jobId: 'shared-space-face-match-all/space-1',
        removeOnComplete: true,
      },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpaceFaceMatchPage,
      { spaceId: 'space-1' },
      {
        jobId: 'shared-space-face-match-page/space-1/start',
        removeOnComplete: true,
      },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpaceFaceMatchPage,
      { spaceId: 'space-1', afterAssetId: 'asset-9' },
      {
        jobId: 'shared-space-face-match-page/space-1/after/asset-9',
        removeOnComplete: true,
      },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpacePersonDedup,
      { spaceId: 'space-1' },
      {
        jobId: 'space-dedup-space-1',
        removeOnComplete: true,
      },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpaceIdentityReconciliation,
      { spaceId: 'space-1' },
      {
        jobId: 'space-identity-reconcile-space-1-all-members-all-people',
        removeOnComplete: true,
      },
    );
    for (const call of queue.add.mock.calls) {
      expect(call[2]).not.toHaveProperty('removeOnFail', true);
    }
  });

  it('uses distinct stable job ids for identity-backfill shared-space face matches', async () => {
    const { sut, queue } = setup();
    setHandlers(sut, [JobName.SharedSpaceFaceMatch]);

    await sut.queueAll([
      { name: JobName.SharedSpaceFaceMatch, data: { spaceId: 'space-1', assetId: 'asset-1' } },
      {
        name: JobName.SharedSpaceFaceMatch,
        data: { spaceId: 'space-1', assetId: 'asset-1', source: 'identity-backfill' },
      },
    ]);

    expect(queue.addBulk).not.toHaveBeenCalled();
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpaceFaceMatch,
      { spaceId: 'space-1', assetId: 'asset-1' },
      {
        jobId: 'shared-space-face-match/space-1/asset-1',
        removeOnComplete: true,
      },
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobName.SharedSpaceFaceMatch,
      { spaceId: 'space-1', assetId: 'asset-1', source: 'identity-backfill' },
      {
        jobId: 'shared-space-face-match/identity-backfill/space-1/asset-1',
        removeOnComplete: true,
      },
    );
  });
});
