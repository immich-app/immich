import { ModuleRef } from '@nestjs/core';
import { Queue } from 'bullmq';
import { QueueCleanType, QueueName } from 'src/enum.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { EventRepository } from 'src/repositories/event.repository.js';
import { JobRepository } from 'src/repositories/job.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { getMocks } from 'test/utils.js';

const newFailedQueue = (count: number) => {
  const failed = Array.from({ length: count }, (_, index) => `job-${index}`);
  const clean = vitest.fn<Queue['clean']>((grace, limit, type) => {
    expect(grace).toBe(0);
    expect(type).toBe('failed');
    return Promise.resolve(failed.splice(0, limit > 0 ? limit : failed.length));
  });
  return { failed, clean };
};

const newJobRepository = (queue: Pick<Queue, 'clean'>) => {
  const moduleRef = { get: () => queue } as unknown as ModuleRef;
  const { config, event, logger } = getMocks();
  return new JobRepository(
    moduleRef,
    config as unknown as ConfigRepository,
    event as unknown as EventRepository,
    logger as unknown as LoggingRepository,
  );
};

describe(JobRepository.name, () => {
  describe('clear', () => {
    it('should remove every failed job when there are more than a thousand', async () => {
      const queue = newFailedQueue(2500);
      const sut = newJobRepository(queue);

      await expect(sut.clear(QueueName.ThumbnailGeneration, QueueCleanType.Failed)).resolves.toBe(2500);

      expect(queue.failed).toHaveLength(0);
    });
  });
});
