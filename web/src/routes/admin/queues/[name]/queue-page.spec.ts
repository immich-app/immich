import { JobName, QueueName, type QueueJobResponseDto, type QueueResponseDto } from '@immich/sdk';
import { render, screen } from '@testing-library/svelte';
import { vi } from 'vitest';
import QueuePage from './+page.svelte';

vi.mock('$lib/components/layouts/AdminPageLayout.svelte', async () => {
  return await import('@test-data/mocks/UserPageLayout.mock.svelte');
});

vi.mock('./QueueGraph.svelte', () => ({
  default: vi.fn(),
}));

vi.mock('$lib/managers/queue-manager.svelte', () => ({
  queueManager: {
    queues: [],
    listen: vi.fn(),
  },
}));

const queue: QueueResponseDto = {
  name: QueueName.MetadataExtraction,
  isPaused: false,
  statistics: {
    active: 0,
    completed: 0,
    failed: 1,
    delayed: 0,
    waiting: 0,
    paused: 0,
  },
};

const failedJob: QueueJobResponseDto = {
  id: 'job-1',
  name: JobName.AssetExtractMetadata,
  data: { id: 'asset-1' },
  timestamp: 1_700_000_000_000,
  failedReason: 'metadata failed',
  attemptsMade: 1,
  processedOn: 1_700_000_001_000,
  finishedOn: 1_700_000_002_000,
};

describe('Queue detail page', () => {
  it('renders failed queue jobs', () => {
    render(QueuePage, {
      data: {
        queue,
        failedJobs: [failedJob],
        meta: { title: 'Queue details' },
      },
    });

    expect(screen.getByText('admin.jobs_failed_details')).toBeInTheDocument();
    expect(screen.getByText(JobName.AssetExtractMetadata)).toBeInTheDocument();
    expect(screen.getByText(/job-1/)).toBeInTheDocument();
    expect(screen.getByText(/metadata failed/)).toBeInTheDocument();
    expect(screen.getByText(/admin.job_attempts: 1/)).toBeInTheDocument();
  });
  it('renders failed queue jobs when optional failure details are missing', () => {
    render(QueuePage, {
      data: {
        queue,
        failedJobs: [
          {
            name: JobName.AssetExtractMetadata,
            data: {},
            timestamp: 1_700_000_000_000,
            attemptsMade: 1,
          },
        ],
        meta: { title: 'Queue details' },
      },
    });

    expect(screen.getByText('admin.jobs_failed_details')).toBeInTheDocument();
    expect(screen.getByText(JobName.AssetExtractMetadata)).toBeInTheDocument();
    expect(screen.queryByText(/admin.job_failed_reason/)).not.toBeInTheDocument();
    expect(screen.queryByText(/admin.job_processed/)).not.toBeInTheDocument();
    expect(screen.queryByText(/admin.job_finished/)).not.toBeInTheDocument();
  });
  it('does not render failed queue jobs when there are no failed jobs', () => {
    render(QueuePage, {
      data: {
        queue: {
          ...queue,
          statistics: {
            ...queue.statistics,
            failed: 0,
          },
        },
        failedJobs: [],
        meta: { title: 'Queue details' },
      },
    });

    expect(screen.queryByText('admin.jobs_failed_details')).not.toBeInTheDocument();
  });
});
