interface Options {
  concurrency: number;
}

type Runnable = () => Promise<unknown>;

export class ExecutorQueue {

  private queue: Array<Runnable> = [];
  private running = 0;
  private concurrency: number;

  constructor(options?: Options) {
    this.concurrency = options?.concurrency || 2;
  }

  getConcurrency() {
    console.log("Get concurrency")
    return this.concurrency
  }

  setConcurrency(concurrency: number) {
    if (concurrency < 1) {
      return
    }

    this.concurrency = concurrency;

    const v = concurrency - this.running;
    if (v > 0) {
      [...new Array(this.concurrency)].forEach(() => this.tryRun())
    }
  }

  addTask<TaskResult>(task: () => PromiseLike<TaskResult>): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      // Add a custom task that wrap the original one;
      this.queue.push(async () => {
        try {
          this.running++;
          const operation = task();
          resolve(await operation);
        } catch (e) {
          reject(e);
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
