import { BaseEventManager } from '$lib/utils/base-event-manager.svelte';
import { tick } from 'svelte';

type TransitionEvents = {
  PrepareOldSnapshot: [string[]];
  PrepareNewSnapshot: [string[]];
  Finished: [string[]];
};

interface TransitionRequest {
  types?: string[];
  prepareOldSnapshot?: () => void;
  performUpdate: (signal: AbortSignal) => Promise<void>;
  prepareNewSnapshot?: () => void;
  onFinished?: () => void;
}

export class ViewTransitionManager extends BaseEventManager<TransitionEvents> {
  #activeViewTransition: ViewTransition | null = null;
  #activeOnFinished: (() => void) | undefined = undefined;

  isSupported() {
    return 'startViewTransition' in document;
  }

  skipTransitions() {
    const skipped = !!this.#activeViewTransition;
    this.#activeViewTransition?.skipTransition();
    this.#activeViewTransition = null;
    const onFinished = this.#activeOnFinished;
    this.#activeOnFinished = undefined;
    onFinished?.();
    return skipped;
  }

  async startTransition({
    types,
    prepareOldSnapshot,
    performUpdate,
    prepareNewSnapshot,
    onFinished,
  }: TransitionRequest) {
    if (this.#activeViewTransition) {
      this.skipTransitions();
    }

    const resolvedTypes = types ?? [];

    if (!this.isSupported()) {
      await performUpdate(AbortSignal.timeout(10_000));
      onFinished?.();
      return;
    }

    this.emit('PrepareOldSnapshot', resolvedTypes);
    prepareOldSnapshot?.();
    await tick();

    const abortController = new AbortController();
    const update = async () => {
      await performUpdate(abortController.signal);
      this.emit('PrepareNewSnapshot', resolvedTypes);
      prepareNewSnapshot?.();
      await tick();
    };

    let transition: ViewTransition;
    try {
      // eslint-disable-next-line tscompat/tscompat
      transition = document.startViewTransition({ update, types });
    } catch {
      // Fallback: browsers supporting VT Level 1 but not Level 2 (object form with types) will throw
      // eslint-disable-next-line tscompat/tscompat
      transition = document.startViewTransition(update);
    }

    this.#activeViewTransition = transition;
    this.#activeOnFinished = onFinished;

    // eslint-disable-next-line tscompat/tscompat
    void transition.ready.catch((error: unknown) => {
      abortController.abort(error);
    });

    // eslint-disable-next-line tscompat/tscompat
    void transition.finished
      .catch(() => {})
      .finally(() => {
        if (this.#activeViewTransition === transition) {
          this.#activeViewTransition = null;
          this.#activeOnFinished = undefined;
          this.emit('Finished', resolvedTypes);
          onFinished?.();
        }
      });

    // eslint-disable-next-line tscompat/tscompat
    await transition.updateCallbackDone;
  }
}

export const viewTransitionManager = new ViewTransitionManager();
