import { eventManager } from '$lib/managers/event-manager.svelte';

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

  skipTransitions() {
    const skippedTransitions = !!this.#activeViewTransition;
    if (skippedTransitions) {
      console.log('skipped!');
    }
    this.#activeViewTransition?.skipTransition();
    this.#notifyFinished();
    return skippedTransitions;
  }

  startTransition(domUpdateComplete: Promise<void>, finishedCallback?: () => void) {
    if (this.#activeViewTransition) {
      console.error('Can not start transition - one already active');
      return;
    }

    // good time to add view-transition-name styles (if needed)
    eventManager.emit('BeforeStartViewTransition');
    // next call will create the 'old' view snapshot
    // eslint-disable-next-line tscompat/tscompat
    const transition = document.startViewTransition(async () => {
      try {
        // Good time to remove any view-transition-name styles created during
        // BeforeStartViewTransition, then trigger the actual view transition.
        eventManager.emit('StartViewTransition');
        await domUpdateComplete;
      } catch (error: unknown) {
        console.log('exception', error);
      }
    });
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
        console.log('update done');
        eventManager.emit('UpdateCallbackDone');
      })
      .catch((error: unknown) => console.log('exception in update', error));
    // Both old/new snapshots are taken - pseudo elements are created, transition is
    // about to start
    // eslint-disable-next-line tscompat/tscompat
    transition.ready
      .then(() => eventManager.emit('Ready'))
      .catch((error: unknown) => {
        this.#notifyFinished();
        console.log('exception in ready', error);
      });
    // Transition is complete
    // eslint-disable-next-line tscompat/tscompat
    transition.finished
      .then(() => {
        eventManager.emit('Finished');
        console.log('finished');
      })
      .catch((error: unknown) => console.log('exception in finished', error));
    // eslint-disable-next-line tscompat/tscompat
    void transition.finished.then(() => this.#notifyFinished());
  }
  #notifyFinished() {
    console.log('finishedCallbacks len', this.#finishedCallbacks.length);
    for (const callback of this.#finishedCallbacks) {
      callback();
    }
    this.#finishedCallbacks = [];
  }
}

export const viewTransitionManager = new ViewTransitionManager();
