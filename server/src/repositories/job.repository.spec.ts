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
});
