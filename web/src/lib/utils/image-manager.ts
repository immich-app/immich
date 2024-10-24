enum Status {
  LOADING,
  CANCELED,
  COMPLETE,
}
enum Result {
  PENDING,
  SUCCESS,
  ERROR,
}
type InnerState = { result: Result; status: Status; image: HTMLImageElement | null; cleanup: (() => void) | null };

class State {
  private innerState: InnerState;
  private cancelSignal: () => void;

  loadedPromise: Promise<State>;

  constructor(loadedPromise: Promise<State>, cancelSignal: () => void, innerState: InnerState) {
    this.loadedPromise = loadedPromise;
    this.cancelSignal = cancelSignal;
    this.innerState = innerState;
  }

  get status() {
    return this.innerState.status;
  }

  get result() {
    return this.innerState.result;
  }

  cancel() {
    this.innerState.cleanup!();
    this.innerState.status = Status.CANCELED;
    this.innerState.result = Result.PENDING;
    this.cancelSignal();
  }
}
class ImageManager {
  states = new Map<string, State>();

  private imageLoader(imageUrl: string): State {
    const innerState: InnerState = {
      result: Result.PENDING,
      status: Status.LOADING,
      image: new Image(),
      cleanup: null,
    };
    let completeSignal: (state: State | PromiseLike<State>) => void;
    let cancelSignal: () => void | undefined;

    const promise = new Promise<State>((resolve, reject) => {
      completeSignal = resolve;
      cancelSignal = reject;
    });
    // supress warnings when no one is waiting on this promise
    promise.catch(() => void 0);

    innerState.cleanup = () => {
      if (innerState.image) {
        innerState.image.removeEventListener('load', loadListener);
        innerState.image.removeEventListener('error', errorListener);
        innerState.image.removeAttribute('src');
        innerState.image = null;
      }
    };

    const loadListener = () => {
      innerState.result = Result.SUCCESS;
      innerState.status = Status.COMPLETE;

      innerState.cleanup!();
      completeSignal(state);
    };
    const errorListener = () => {
      innerState.result = Result.ERROR;
      innerState.status = Status.COMPLETE;

      innerState.cleanup!();
      completeSignal(state);
    };
    innerState.image!.addEventListener('load', loadListener);
    innerState.image!.addEventListener('error', errorListener);
    // trigger the load
    innerState.image!.src = imageUrl;
    const state = new State(promise, cancelSignal!, innerState);
    return state;
  }

  /**
   * Loads an image offscreen. If the URL was previously requested and is LOADING or COMPLETED
   * a new request will not be performed. If a URL had been previously rquested but is CANCELED,
   * then a new request will be performed. When the promise resolves it will be save to add
   * the requested URL as a src in an <img> tag or other elements.
   */
  loadImage(imageURL: string): Promise<State> {
    let state = this.states.get(imageURL);
    if (state && state.status !== Status.CANCELED) {
      return state.loadedPromise;
    }
    state = this.imageLoader(imageURL);
    this.states.set(imageURL, state);
    return state.loadedPromise;
  }

  /**
   * Loads a series of images offscreen, performing cancelLoadImage() on any other LOADING images not
   * present in the specified URL array. When the promise resolves it will be save to add
   * the requested URL as a src in an <img> tag or other elements.
   */
  exclusiveLoadImages(imageURLs: string[]): Promise<State>[] {
    const preloads = imageURLs.map((id) => this.loadImage(id));
    const set = new Set(this.states.keys());
    for (const id of imageURLs) {
      set.delete(id);
    }
    for (const id of set) {
      this.cancelPreload(id);
    }
    return preloads;
  }

  /**
   * Will cancel a previously requested LOADING image.
   */
  cancelPreload(assetId: string) {
    const state = this.states.get(assetId);
    if (state?.status === Status.LOADING) {
      state.cancel();
    }
  }
}

export const imageManager = new ImageManager();
