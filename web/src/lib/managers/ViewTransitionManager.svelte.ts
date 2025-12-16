import { eventManager } from '$lib/managers/event-manager.svelte';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function traceTransitionEvents(msg: string, error?: unknown) {
  // console.log(msg, error);
}
class ViewTransitionManager {
  #activeViewTransition = $state<ViewTransition | null>(null);
  #finishedCallbacks: (() => void)[] = [];

  #splitViewerNavTransitionNames = true;

  constructor() {
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue('--immich-split-viewer-nav').trim();
    this.#splitViewerNavTransitionNames = value === 'enabled';
  }

  getTransitionName = (kind: 'old' | 'new', name: string | null | undefined) => {
    if (name === 'previous' || name === 'next') {
      return this.#splitViewerNavTransitionNames ? name + '-' + kind : name;
    } else if (name) {
      return name;
    }
    return null;
  };

  get activeViewTransition() {
    return this.#activeViewTransition;
  }

  isSupported() {
    return 'startViewTransition' in document;
  }

  skipTransitions() {
    const skippedTransitions = !!this.#activeViewTransition;
    this.#activeViewTransition?.skipTransition();
    this.#notifyFinished();
    return skippedTransitions;
  }

  startTransition(domUpdateComplete: Promise<unknown>, types?: string[], finishedCallback?: () => unknown) {
    if (!this.isSupported()) {
      throw new Error('View transition API not available');
    }
    if (this.#activeViewTransition) {
      traceTransitionEvents('Can not start transition - one already active');
      return;
    }

    // good time to add view-transition-name styles (if needed)
    traceTransitionEvents('emit BeforeStartViewTransition');
    eventManager.emit('BeforeStartViewTransition');

    // next call will create the 'old' view snapshot
    let transition: ViewTransition;
    try {
      // eslint-disable-next-line tscompat/tscompat
      transition = document.startViewTransition({
        update: async () => {
          // Good time to remove any view-transition-name styles created during
          // BeforeStartViewTransition, then trigger the actual view transition.
          traceTransitionEvents('emit StartViewTransition');
          eventManager.emit('StartViewTransition');

          await domUpdateComplete;
          traceTransitionEvents('awaited domUpdateComplete');
        },
        types,
      });
    } catch {
      // eslint-disable-next-line tscompat/tscompat
      transition = document.startViewTransition(async () => {
        // Good time to remove any view-transition-name styles created during
        // BeforeStartViewTransition, then trigger the actual view transition.
        traceTransitionEvents('emit StartViewTransition');
        eventManager.emit('StartViewTransition');
        await domUpdateComplete;
        traceTransitionEvents('awaited domUpdateComplete');
      });
    }
    this.#activeViewTransition = transition;
    this.#finishedCallbacks.push(() => {
      this.#activeViewTransition = null;
    });
    if (finishedCallback) {
      this.#finishedCallbacks.push(finishedCallback);
    }
    // UpdateCallbackDone is a good time to add any view-transition-name styles
    // to the new DOM state, before the 'new' view snapshot is creatd
    // eslint-disable-next-line tscompat/tscompat
    transition.updateCallbackDone
      .then(() => {
        traceTransitionEvents('emit UpdateCallbackDone');
        eventManager.emit('UpdateCallbackDone');
      })
      .catch((error: unknown) => traceTransitionEvents('error in UpdateCallbackDone', error));
    // Both old/new snapshots are taken - pseudo elements are created, transition is
    // about to start
    // eslint-disable-next-line tscompat/tscompat
    transition.ready
      .then(() => eventManager.emit('Ready'))
      .catch((error: unknown) => {
        this.#notifyFinished();
        traceTransitionEvents('error in Ready', error);
      });
    // Transition is complete
    // eslint-disable-next-line tscompat/tscompat
    transition.finished
      .then(() => {
        traceTransitionEvents('emit Finished');
        eventManager.emit('Finished');
      })
      .catch((error: unknown) => traceTransitionEvents('error in Finished', error));
    // eslint-disable-next-line tscompat/tscompat
    void transition.finished.then(() => this.#notifyFinished());
  }

  #notifyFinished() {
    for (const callback of this.#finishedCallbacks) {
      callback();
    }
    this.#finishedCallbacks = [];
  }
}

export const viewTransitionManager = new ViewTransitionManager();
