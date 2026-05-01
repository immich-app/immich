import { ModuleRef } from '@nestjs/core';
import { setTimeout } from 'node:timers/promises';
import { QueueName } from 'src/enum';
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
});
