import { AsyncSemaphore } from 'src/utils/semaphore';

describe(AsyncSemaphore.name, () => {
  it('should acquire immediately when under limit', async () => {
    const semaphore = new AsyncSemaphore(2);
    await semaphore.acquire();
    await semaphore.acquire();
  });

  it('should block when at limit and unblock on release', async () => {
    const semaphore = new AsyncSemaphore(1);
    await semaphore.acquire();

    let resolved = false;
    const blocked = semaphore.acquire().then(() => {
      resolved = true;
    });

    // give microtasks a chance to run
    await Promise.resolve();
    expect(resolved).toBe(false);

    semaphore.release();
    await blocked;
    expect(resolved).toBe(true);
  });

  it('should process waiters in FIFO order', async () => {
    const semaphore = new AsyncSemaphore(1);
    await semaphore.acquire();

    const order: number[] = [];
    const p1 = semaphore.acquire().then(() => order.push(1));
    const p2 = semaphore.acquire().then(() => order.push(2));

    semaphore.release();
    await p1;
    semaphore.release();
    await p2;

    expect(order).toEqual([1, 2]);
  });

  it('should drain waiters when setLimit increases', async () => {
    const semaphore = new AsyncSemaphore(1);
    await semaphore.acquire();

    let resolved1 = false;
    let resolved2 = false;
    const p1 = semaphore.acquire().then(() => {
      resolved1 = true;
    });
    const p2 = semaphore.acquire().then(() => {
      resolved2 = true;
    });

    await Promise.resolve();
    expect(resolved1).toBe(false);
    expect(resolved2).toBe(false);

    semaphore.setLimit(3);
    await Promise.all([p1, p2]);
    expect(resolved1).toBe(true);
    expect(resolved2).toBe(true);
  });

  it('should block new acquires when setLimit decreases below current usage', async () => {
    const semaphore = new AsyncSemaphore(3);
    await semaphore.acquire();
    await semaphore.acquire();

    semaphore.setLimit(1);

    let resolved = false;
    const blocked = semaphore.acquire().then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    semaphore.release();
    await Promise.resolve();
    expect(resolved).toBe(false);

    semaphore.release();
    await blocked;
    expect(resolved).toBe(true);
  });

  it('should handle release correctly after multiple acquire/release cycles', async () => {
    const semaphore = new AsyncSemaphore(2);

    await semaphore.acquire();
    await semaphore.acquire();
    semaphore.release();
    semaphore.release();

    await semaphore.acquire();
    await semaphore.acquire();
    semaphore.release();
    semaphore.release();
  });
});
