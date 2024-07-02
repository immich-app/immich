import * as fastq from 'fastq';
import { uniqueId } from 'lodash-es';

export type Task<T> = {
  readonly id: string;
  status: 'idle' | 'processing' | 'succeeded' | 'failed';
  data: T;
  error: unknown | undefined;
  count: number;
  // TODO: Could be useful to adding progress property.
  // TODO: Could be useful to adding start_at/end_at/duration properties.
  // TODO: Could be useful to adding result property.
};

export type QueueOptions = {
  verbose?: boolean;
  concurrency?: number;
  retry?: number;
  // TODO: Could be useful to adding timeout property for retry.
};

export type ComputedQueueOptions = Required<QueueOptions>;

export const defaultQueueOptions = {
  concurrency: 1,
  retry: 0,
  verbose: false,
};

/**
 * An in-memory queue that processes tasks in parallel with a given concurrency.
 * @see {@link https://www.npmjs.com/package/fastq}
 * @template T - The type of the worker task data.
 * @template R - The type of the worker output data.
 */
export class Queue<T, R> {
  private readonly queue: fastq.queueAsPromised<string, R>;
  private readonly store = new Map<string, Task<T>>();
  readonly options: ComputedQueueOptions;
  readonly worker: (data: T) => Promise<R>;

  /**
   * Create a new queue.
   * @param worker - The worker function that processes the task.
   * @param options - The queue options.
   */
  constructor(worker: (data: T) => Promise<R>, options?: QueueOptions) {
    this.options = { ...defaultQueueOptions, ...options };
    this.worker = worker;
    this.store = new Map<string, Task<T>>();
    this.queue = this.buildQueue();
  }

  get tasks(): Task<T>[] {
    const tasks: Task<T>[] = [];
    for (const task of this.store.values()) {
      tasks.push(task);
    }
    return tasks;
  }

  /**
   * Wait for the queue to be empty.
   * @returns Promise<void> - The returned Promise will be resolved when all tasks in the queue have been processed by a worker.
   * This promise could be ignored as it will not lead to a `unhandledRejection`.
   */
  async drained(): Promise<void> {
    await this.queue.drain();
  }

  /**
   * Add a task at the end of the queue.
   * @see {@link https://www.npmjs.com/package/fastq}
   * @param data
   * @returns Promise<void> - A Promise that will be fulfilled (rejected) when the task is completed successfully (unsuccessfully).
   * This promise could be ignored as it will not lead to a `unhandledRejection`.
   */
  async push(data: T): Promise<void> {
    const id = uniqueId();
    const task: Task<T> = { id, status: 'idle', error: undefined, count: 0, data };
    this.store.set(id, task);
    // From fastq documentation: This promise could be ignored as it will not lead to a 'unhandledRejection'.
    await this.queue.push(id);
  }

  // TODO: Support more function delegation to fastq.

  private buildQueue(): fastq.queueAsPromised<string, R> {
    return fastq.promise((id: string) => {
      const task = this.store.get(id);
      if (!task) {
        throw new Error(`Task with id ${id} not found`);
      }
      return this.work(task);
    }, this.options.concurrency);
  }

  private async work(task: Task<T>): Promise<R> {
    task.count += 1;
    task.error = undefined;
    task.status = 'processing';
    if (this.options.verbose) {
      console.log('[task] processing:', task);
    }
    try {
      const result = await this.worker(task.data);
      task.status = 'succeeded';
      if (this.options.verbose) {
        console.log('[task] succeeded:', task);
      }
      return result;
    } catch (error) {
      task.error = error;
      task.status = 'failed';
      if (this.options.verbose) {
        console.log('[task] failed:', task);
      }
      if (this.options.retry > 0 && task.count < this.options.retry) {
        if (this.options.verbose) {
          console.log('[task] retry:', task);
        }
        // From fastq documentation: This promise could be ignored as it will not lead to a 'unhandledRejection'.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        return this.queue.push(task.id);
      }
      throw error;
    }
  }
}
