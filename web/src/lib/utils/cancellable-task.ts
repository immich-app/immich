export class CancellableTask {
  cancelToken: AbortController | null = null;
  isPreventCancel: boolean = false;
  /**
   * A promise that resolves once the bucket is loaded, and rejects if bucket is canceled.
   */
  complete!: Promise<unknown>;
  isLoaded: boolean = false;

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
        // if no-one waits on complete, and its rejected a uncaught rejection message is logged.
        // We this message with an empty reject handler, since waiting on a bucket is optional.
        void 0,
    );
  }

  isLoading() {
    return !!this.cancelToken;
  }

  async waitForCompletion() {
    if (this.isLoaded) {
      return;
    }
    // if there is a cancel token, task is currently executing, so wait on the promise. If it
    // isn't, then  the task is in new state, it hasn't been loaded, nor has it been executed.
    // in either case, we wait on the promise.
    // debugger
    await this.complete;
  }

  async execute<F extends (abortSignal: AbortSignal) => Promise<void>>(f: F, preventCancel: boolean): Promise<'DONE' | 'WAITED' | 'LOADED' | 'CANCELED' | 'ERRORED'> {
    if (this.isLoaded) {
      return 'DONE'
    }

    // if promise is pending, wait on previous request instead.
    if (this.cancelToken != null) {
      // if promise is pending, and preventCancel is requested,
      // do not allow transition from prevent cancel to allow cancel.
      if (!this.isPreventCancel && preventCancel) {
        this.isPreventCancel = preventCancel;
      }
      await this.complete;
      return 'WAITED';
    }
    this.isPreventCancel = preventCancel;
    const cancelToken = (this.cancelToken = new AbortController());

    try {
      await f(cancelToken.signal);
      this.loaded();
      return 'LOADED';
    } catch (error) {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      if ((error as any).name === 'AbortError') {
        // abort error is not treated as an error, but as a cancelation.
        return 'CANCELED';
      }
      this.errored(error);
      return 'ERRORED'
    } finally {
      this.cancelToken = null;
    }
  }

  private init() {
    this.isLoaded = false;
    // create a promise, and store its resolve/reject callbacks. The loadedSignal callback
    // will be incoked when a bucket is loaded, fulfilling the promise. The canceledSignal
    // callback will be called if the bucket is canceled before it was loaded, rejecting the
    // promise.
    this.complete = new Promise<void>((resolve, reject) => {
      this.loadedSignal = resolve;
      this.canceledSignal = reject;
    }).catch(
      () =>
        // if no-one waits on complete, and its rejected a uncaught rejection message is logged.
        // We this message with an empty reject handler, since waiting on a bucket is optional.
        void 0,
    );
  }

  cancel() {
    if (this.isLoaded) {
      return;
    }
    if (this.isPreventCancel) {
      return;
    }
    this.cancelToken?.abort();
    this.canceledSignal?.();
    this.init();
    this.canceledCallback?.();
  }

  loaded() {
    this.isLoaded = true;
    this.loadedSignal?.();
    this.loadedCallback?.();
  }

  errored(error: unknown) {
    this.cancelToken = null;
    this.canceledSignal?.();
    this.init();
    this.errorCallback?.(error);
  }
}
