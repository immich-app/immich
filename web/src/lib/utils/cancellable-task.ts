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
    this.complete = new Promise<void>((resolve, reject) => {
      this.loadedSignal = resolve;
      this.canceledSignal = reject;
    }).catch(
      () =>
        // if no-one waits on complete its rejected a uncaught rejection message is logged.
        // prevent this message with an empty reject handler, since waiting on a bucket is optional.
        void 0,
    );
  }

  get loading() {
    return !!this.cancelToken;
  }

  async waitUntilCompletion() {
    if (this.executed) {
      return 'DONE';
    }
    // if there is a cancel token, task is currently executing, so wait on the promise. If it
    // isn't, then  the task is in new state, it hasn't been loaded, nor has it been executed.
    // in either case, we wait on the promise.
    await this.complete;
    return 'WAITED';
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
        // abort error is not treated as an error, but as a cancelation.
        return 'CANCELED';
      }
      this.#transitionToErrored(error);
      return 'ERRORED';
    } finally {
      this.cancelToken = null;
    }
  }

  private init() {
    this.cancelToken = null;
    this.executed = false;
    // create a promise, and store its resolve/reject callbacks. The loadedSignal callback
    // will be incoked when a bucket is loaded, fulfilling the promise. The canceledSignal
    // callback will be called if the bucket is canceled before it was loaded, rejecting the
    // promise.
    this.complete = new Promise<void>((resolve, reject) => {
      this.loadedSignal = resolve;
      this.canceledSignal = reject;
    }).catch(
      () =>
        // if no-one waits on complete its rejected a uncaught rejection message is logged.
        // prevent this message with an empty reject handler, since waiting on a bucket is optional.
        void 0,
    );
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
