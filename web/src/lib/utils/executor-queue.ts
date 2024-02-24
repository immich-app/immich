interface Options {
  concurrency: number;
}

type Runnable = () => Promise<unknown>;

export class ExecutorQueue {
  private queue: Array<Runnable> = [];
  private running = 0;
  private _concurrency: number;

  constructor(options?: Options) {
    this._concurrency = options?.concurrency || 2;
  }

  get concurrency() {
    return this._concurrency;
  }

  set concurrency(concurrency: number) {
    if (concurrency < 1) {
      return;
    }

    this._concurrency = concurrency;

    const v = concurrency - this.running;
    if (v > 0) {
      for (let i = 0; i < v; i++) {
        this.tryRun();
      }
    }
  }

  addTask<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // Add a custom task that wrap the original one;
      this.queue.push(async () => {
        try {
          this.running++;
          const result = task();
          resolve(await result);
        } catch (error) {
          reject(error);
        } finally {
          this.taskFinished();
        }
      });
      // Then run it if possible !
      this.tryRun();
    });
  }

  private taskFinished(): void {
    this.running--;
    this.tryRun();
  }

  private tryRun() {
    if (this.running >= this.concurrency) {
      return;
    }

    const runnable = this.queue.shift();
    if (!runnable) {
      return;
    }

    runnable();
  }
}
