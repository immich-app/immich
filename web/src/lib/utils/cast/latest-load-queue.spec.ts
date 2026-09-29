import { LatestLoadQueue } from '$lib/utils/cast/latest-load-queue';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe('LatestLoadQueue', () => {
  it('ignores a selection whose preparation finishes after a newer selection', async () => {
    const queue = new LatestLoadQueue();
    const firstPreparation = deferred<string>();
    const load = vi.fn((_: string) => Promise.resolve());

    const first = queue.run(() => firstPreparation.promise, load);
    const second = queue.run(() => Promise.resolve('second'), load);
    await second;
    firstPreparation.resolve('first');
    await first;

    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith('second');
  });

  it('sends only the newest waiting selection after an outstanding command', async () => {
    const queue = new LatestLoadQueue();
    const firstLoad = deferred<void>();
    const firstStarted = deferred<void>();
    const started: string[] = [];
    const load = (source: string) => {
      started.push(source);
      if (source === 'first') {
        firstStarted.resolve(undefined);
      }
      return source === 'first' ? firstLoad.promise : Promise.resolve();
    };

    const first = queue.run(() => Promise.resolve('first'), load);
    await firstStarted.promise;
    const second = queue.run(() => Promise.resolve('second'), load);
    const third = queue.run(() => Promise.resolve('third'), load);
    firstLoad.resolve(undefined);
    await Promise.all([first, second, third]);

    expect(started).toEqual(['first', 'third']);
  });

  it('allows retry after a failed command', async () => {
    const queue = new LatestLoadQueue();
    const load = vi.fn().mockRejectedValueOnce(new Error('receiver unavailable')).mockResolvedValue(undefined);

    await expect(queue.run(() => Promise.resolve('photo'), load)).rejects.toThrow('receiver unavailable');
    await expect(queue.run(() => Promise.resolve('photo'), load)).resolves.toBeUndefined();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
