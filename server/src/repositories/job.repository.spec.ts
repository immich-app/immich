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

const setup = (counts: JobCounts[]) => {
  const queue = {
    getJobCounts: vi.fn().mockResolvedValue(emptyCounts()),
    isPaused: vi.fn().mockResolvedValue(false),
  };

  for (const value of counts) {
    queue.getJobCounts.mockResolvedValueOnce(value);
  }

  const moduleRef = { get: vi.fn().mockReturnValue(queue) } as unknown as ModuleRef;
  const logger = {
    setContext: vi.fn(),
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
});
