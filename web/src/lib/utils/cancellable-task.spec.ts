import { CancellableTask } from '#lib/utils/cancellable-task.ts';

const abortable = (started: () => void) => async (signal: AbortSignal) => {
  started();
  await new Promise<void>((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });
};

describe('CancellableTask', () => {
  it('cancel aborts the running task and rejects complete', async () => {
    const task = new CancellableTask();
    const started = Promise.withResolvers<void>();
    const complete = task.complete;

    const result = task.execute(abortable(started.resolve), true);
    await started.promise;
    task.cancel();

    expect(await result).toBe('CANCELED');
    await expect(complete).rejects.toBeUndefined();
  });

  it('reset allows the task to run again', async () => {
    const task = new CancellableTask();
    const taskFn = vi.fn(async () => {});

    await task.execute(taskFn, true);
    await task.reset();
    const result = await task.execute(taskFn, true);

    expect(result).toBe('LOADED');
    expect(taskFn).toHaveBeenCalledTimes(2);
  });

  it('a failing task rejects complete and returns ERRORED', async () => {
    const task = new CancellableTask();
    const complete = task.complete;

    const result = await task.execute(() => Promise.reject(new Error('Failed')), true);

    expect(result).toBe('ERRORED');
    await expect(complete).rejects.toBeUndefined();
  });
});
