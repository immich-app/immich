import { ExecutorQueue } from '#lib/utils/executor-queue.ts';

describe('ExecutorQueue', () => {
  it('runs every task and returns its result', async () => {
    const eq = new ExecutorQueue({ concurrency: 1 });
    const n1 = await eq.addTask(() => Promise.resolve(10));
    expect(n1).toBe(10);
    const n2 = await eq.addTask(() => Promise.resolve(11));
    expect(n2).toBe(11);
    const n3 = await eq.addTask(() => Promise.resolve(12));
    expect(n3).toBe(12);
  });

  it('starts the next task only when a running one finishes', async () => {
    vi.useFakeTimers();
    const eq = new ExecutorQueue({ concurrency: 3 });
    const started = vi.fn();
    const finished = vi.fn();
    const timed = (delay: number) =>
      new Promise<void>((resolve) => {
        started();
        setTimeout(() => {
          finished();
          resolve();
        }, delay);
      });

    void eq.addTask(() => timed(100));
    void eq.addTask(() => timed(200));
    void eq.addTask(() => timed(150));
    void eq.addTask(() => timed(200));

    expect(started).toHaveBeenCalledTimes(3);
    expect(finished).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(finished).toHaveBeenCalledTimes(1);
    expect(started).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(250);
    expect(finished).toHaveBeenCalledTimes(4);
    vi.useRealTimers();
  });
});
