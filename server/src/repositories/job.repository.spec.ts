import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_PORT = Number(process.env.REDIS_PORT || 6380);

/**
 * Synchronously blocks the Node.js event loop for the given duration.
 * This prevents BullMQ's internal lock renewal timer from firing,
 * simulating heavy CPU work (e.g. sharp image processing, V8 GC pauses).
 */
function blockEventLoop(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy-wait — the event loop cannot process any timers or I/O callbacks
  }
}

async function connectRedis(): Promise<IORedis | null> {
  try {
    const redis = new IORedis({ port: REDIS_PORT, maxRetriesPerRequest: null, lazyConnect: true });
    await redis.connect();
    return redis;
  } catch {
    return null;
  }
}

describe('BullMQ worker stall prevention', () => {
  let redis: IORedis | null;

  beforeAll(async () => {
    redis = await connectRedis();
  });

  afterAll(async () => {
    await redis?.quit();
  });

  it('should stall and fail a job when lockDuration is shorter than the event loop block', async () => {
    if (!redis) {
      return;
    }

    // THE BUG: BullMQ's default lockDuration is 30 seconds. When thumbnail
    // generation (sharp) or video transcoding (ffmpeg) blocks the Node.js event
    // loop, the automatic lock renewal timer cannot fire. After lockDuration
    // expires, the stalled checker marks the job as stalled. With maxStalledCount=1,
    // the job permanently fails. With 20 concurrent workers, ALL active jobs stall
    // simultaneously, permanently freezing the entire queue.

    const queueName = `test-stall-bug-${Date.now()}`;
    const connection = { port: REDIS_PORT, maxRetriesPerRequest: null };

    const queue = new Queue(queueName, { connection });
    const queueEvents = new QueueEvents(queueName, { connection });
    await queueEvents.waitUntilReady();

    const stalledJobIds: string[] = [];
    queueEvents.on('stalled', ({ jobId }) => stalledJobIds.push(jobId));

    const worker = new Worker(
      queueName,
      async () => {
        blockEventLoop(3000); // simulate heavy image processing
      },
      {
        connection,
        concurrency: 1,
        lockDuration: 1000, // lock expires after 1s — too short for 3s of CPU work
        stalledInterval: 1000,
        maxStalledCount: 1,
      },
    );
    await worker.waitUntilReady();

    const job = await queue.add('thumbnail', { assetId: 'large-raw-image' });

    try {
      await job.waitUntilFinished(queueEvents, 15_000);
      expect.unreachable('Job should have failed due to stalling');
    } catch {
      // expected — job stalled and was moved to failed
    }

    const state = await job.getState();
    expect(state).toBe('failed');
    expect(stalledJobIds).toContain(job.id);

    const failed = await Job.fromId(queue, job.id!);
    expect(failed?.failedReason).toContain('stalled');

    await worker.close();
    await queue.obliterate({ force: true });
    await queueEvents.close();
    await queue.close();
  }, 20_000);

  it('should complete a job when lockDuration is longer than the event loop block', async () => {
    if (!redis) {
      return;
    }

    // THE FIX: with lockDuration set to 10 minutes (600_000ms in production,
    // 10s here for test speed), the Redis lock survives the event loop block.
    // When the event loop unblocks, the worker marks the job as completed
    // because the lock is still valid.

    const queueName = `test-stall-fix-${Date.now()}`;
    const connection = { port: REDIS_PORT, maxRetriesPerRequest: null };

    const queue = new Queue(queueName, { connection });
    const queueEvents = new QueueEvents(queueName, { connection });
    await queueEvents.waitUntilReady();

    const stalledJobIds: string[] = [];
    queueEvents.on('stalled', ({ jobId }) => stalledJobIds.push(jobId));

    const worker = new Worker(
      queueName,
      async () => {
        blockEventLoop(3000); // same heavy work as above
      },
      {
        connection,
        concurrency: 1,
        lockDuration: 10_000, // lock valid for 10s — survives a 3s block
        stalledInterval: 10_000,
        maxStalledCount: 1,
      },
    );
    await worker.waitUntilReady();

    const job = await queue.add('thumbnail', { assetId: 'large-raw-image' });

    await job.waitUntilFinished(queueEvents, 15_000);

    const state = await job.getState();
    expect(state).toBe('completed');
    expect(stalledJobIds).toHaveLength(0);

    await worker.close();
    await queue.obliterate({ force: true });
    await queueEvents.close();
    await queue.close();
  }, 20_000);
});
