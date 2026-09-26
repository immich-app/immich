import { getQueueToken } from '@nestjs/bullmq';
import { JobName, QueueJobStatus, QueueName } from 'src/enum';
import { JobRepository } from 'src/repositories/job.repository';
import { describe, expect, it, vi } from 'vitest';

describe(JobRepository.name, () => {
  it('should include failed job details when searching jobs', async () => {
    const getJobs = vi.fn().mockResolvedValue([
      {
        id: 'job-1',
        name: JobName.AssetExtractMetadata,
        data: { id: 'asset-1' },
        timestamp: 1_700_000_000_000,
        failedReason: 'metadata failed',
        attemptsMade: 1,
        processedOn: 1_700_000_001_000,
        finishedOn: 1_700_000_002_000,
      },
    ]);

    const moduleRef = {
      get: vi.fn().mockImplementation((token) => {
        if (token === getQueueToken(QueueName.MetadataExtraction)) {
          return { getJobs };
        }
      }),
    };

    const sut = new JobRepository(
      moduleRef as never,
      undefined as never,
      undefined as never,
      { setContext: vi.fn() } as never,
    );

    await expect(sut.searchJobs(QueueName.MetadataExtraction, { status: [QueueJobStatus.Failed] })).resolves.toEqual([
      {
        id: 'job-1',
        name: JobName.AssetExtractMetadata,
        data: { id: 'asset-1' },
        timestamp: 1_700_000_000_000,
        failedReason: 'metadata failed',
        attemptsMade: 1,
        processedOn: 1_700_000_001_000,
        finishedOn: 1_700_000_002_000,
      },
    ]);

    expect(getJobs).toHaveBeenCalledWith([QueueJobStatus.Failed], 0, 1000);
  });
});
