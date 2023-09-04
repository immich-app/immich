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
    jest.useFakeTimers();
    const eq = new ExecutorQueue({ concurrency: 3 });

    const finished = jest.fn();
    const started = jest.fn();

    const timeoutPromiseBuilder = (delay: number, id: string) =>
      new Promise((resolve) => {
        console.log('Task is running: ', id);
        started();
        setTimeout(() => {
          console.log('Finished ' + id + ' after', delay, 'ms');
          finished();
          resolve(undefined);
        }, delay);
      });

    // The first 3 should be finished within 200ms (concurrency 3)
    eq.addTask(() => timeoutPromiseBuilder(100, 'T1'));
    eq.addTask(() => timeoutPromiseBuilder(200, 'T2'));
    eq.addTask(() => timeoutPromiseBuilder(150, 'T3'));
    // The last task will be executed after 200ms and will finish at 400ms
    eq.addTask(() => timeoutPromiseBuilder(200, 'T4'));

    expect(finished).not.toBeCalled();
    expect(started).toHaveBeenCalledTimes(3);

    jest.advanceTimersByTime(100);
    expect(finished).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(250);
    expect(finished).toHaveBeenCalledTimes(3);
    // expect(started).toHaveBeenCalledTimes(4)

    //TODO : fix The test ...

    jest.runAllTimers();
    jest.useRealTimers();
  });
});
