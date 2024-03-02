import { ExecutorQueue } from '$lib/utils/executor-queue';

describe('Executor Queue test', function () {
  it('should run all promises', async function () {
    const eq = new ExecutorQueue({ concurrency: 1 });
    const n1 = await eq.addTask(() => Promise.resolve(10));
    expect(n1).toBe(10);
    const n2 = await eq.addTask(() => Promise.resolve(11));
    expect(n2).toBe(11);
    const n3 = await eq.addTask(() => Promise.resolve(12));
    expect(n3).toBe(12);
  });

  it('should respect concurrency parameter', function () {
    vi.useFakeTimers();
    const eq = new ExecutorQueue({ concurrency: 3 });

    const finished = vi.fn();
    const started = vi.fn();

    const timeoutPromiseBuilder = (delay: number, id: string) =>
      new Promise((resolve) => {
        started();
        setTimeout(() => {
          finished();
          resolve(id);
        }, delay);
      });

    // The first 3 should be finished within 200ms (concurrency 3)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    eq.addTask(() => timeoutPromiseBuilder(100, 'T1'));
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    eq.addTask(() => timeoutPromiseBuilder(200, 'T2'));
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    eq.addTask(() => timeoutPromiseBuilder(150, 'T3'));
    // The last task will be executed after 200ms and will finish at 400ms
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    eq.addTask(() => timeoutPromiseBuilder(200, 'T4'));

    expect(finished).not.toBeCalled();
    expect(started).toHaveBeenCalledTimes(3);

    vi.advanceTimersByTime(100);
    expect(finished).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(250);
    expect(finished).toHaveBeenCalledTimes(3);
    // expect(started).toHaveBeenCalledTimes(4)

    //TODO : fix The test ...

    vi.runAllTimers();
    vi.useRealTimers();
  });
});
