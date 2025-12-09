import { eventManager } from '$lib/managers/event-manager.svelte';

class ViewTransitionManager {
  #activeViewTransition = $state<ViewTransition | null>(null);

  get activeViewTransition() {
    return this.#activeViewTransition;
  }

  startTransition(domUpdateComplete: Promise<void>, finishedCallback?: () => void) {
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
    // UpdateCallbackDone is a good time to add any view-transition-name styles
    // to the new DOM state, before the 'new' view snapshot is creatd
    // eslint-disable-next-line tscompat/tscompat
    transition.updateCallbackDone
      .then(() => eventManager.emit('UpdateCallbackDone'))
      .catch((error: unknown) => console.log('exception', error));
    // Both old/new snapshots are taken - pseudo elements are created, transition is
    // about to start
    // eslint-disable-next-line tscompat/tscompat
    transition.ready
      .then(() => eventManager.emit('Ready'))
      .catch((error: unknown) => console.log('exception in ready', error));
    // Transition is complete
    // eslint-disable-next-line tscompat/tscompat
    transition.finished
      .then(() => eventManager.emit('Finished'))
      .catch((error: unknown) => console.log('exception in finished', error));
    // eslint-disable-next-line tscompat/tscompat
    void transition.finished.then(() => {
      finishedCallback?.();
      this.#activeViewTransition = null;
    });
  }
}

export const viewTransitionManager = new ViewTransitionManager();
