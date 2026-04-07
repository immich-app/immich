export class CancellableTask {
  cancelToken: AbortController | null = null;
  cancellable: boolean = true;
  /**
   * A promise that resolves once the bucket is loaded, and rejects if bucket is canceled.
   */
  complete!: Promise<unknown>;
  executed: boolean = false;

  private loadedSignal: (() => void) | undefined;
  private canceledSignal: (() => void) | undefined;

  constructor(
    private loadedCallback?: () => void,
    private canceledCallback?: () => void,
    private errorCallback?: (error: unknown) => void,
  ) {
    this.init();
  }

  get loading() {
    return !!this.cancelToken;
  }

  async waitUntilCompletion() {
    if (this.executed) {
      return 'DONE';
    }
    // The `complete` promise resolves when executed, rejects when canceled/errored.
    try {
      const complete = this.complete;
      await complete;
      return 'WAITED';
    } catch {
      // ignore
    }
    return 'CANCELED';
  }

  async waitUntilExecution() {
    // Keep retrying until the task completes successfully (not canceled)
    for (;;) {
      try {
        if (this.executed) {
          return 'DONE';
        }
        await this.complete;
        return 'WAITED';
      } catch {
        continue;
      }
    }
  }

  async execute<F extends (abortSignal: AbortSignal) => Promise<void>>(f: F, cancellable: boolean) {
    if (this.executed) {
      return 'DONE';
    }

    // if promise is pending, wait on previous request instead.
    if (this.cancelToken) {
      // if promise is pending, and preventCancel is requested,
      // do not allow transition from prevent cancel to allow cancel.
      if (this.cancellable && !cancellable) {
        this.cancellable = cancellable;
      }
      await this.complete;
      return 'WAITED';
    }
    this.cancellable = cancellable;
    const cancelToken = (this.cancelToken = new AbortController());

    try {
      await f(cancelToken.signal);
      if (cancelToken.signal.aborted) {
        return 'CANCELED';
      }
      this.#transitionToExecuted();
      return 'LOADED';
    } catch (error) {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      if ((error as any).name === 'AbortError') {
        // abort error is not treated as an error, but as a cancellation.
        return 'CANCELED';
      }
      this.#transitionToErrored(error);
      return 'ERRORED';
    } finally {
      this.cancelToken = null;
    }
  }

  private init() {
    this.complete = new Promise<void>((resolve, reject) => {
      this.cancelToken = null;
      this.executed = false;
      this.loadedSignal = resolve;
      this.canceledSignal = reject;
    });
    // Suppress unhandled rejection warning
    this.complete.catch(() => {});
  }

  // will reset this job back to the initial state (isLoaded=false, no errors, etc)
  async reset() {
    this.#transitionToCancelled();
    if (this.cancelToken) {
      await this.waitUntilCompletion();
    }
    this.init();
  }

  cancel() {
    this.#transitionToCancelled();
  }

  #transitionToCancelled() {
    if (this.executed) {
      return;
    }
    if (!this.cancellable) {
      return;
    }
    this.cancelToken?.abort();
    this.canceledSignal?.();
    this.init();
    this.canceledCallback?.();
  }

  #transitionToExecuted() {
    this.executed = true;
    this.loadedSignal?.();
    this.loadedCallback?.();
  }

  #transitionToErrored(error: unknown) {
    this.cancelToken = null;
    this.canceledSignal?.();
    this.init();
    this.errorCallback?.(error);
  }
}
