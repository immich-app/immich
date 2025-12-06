import { eventManager } from '$lib/managers/event-manager.svelte';

class ViewTransitionManager {
  startTransition(domUpdateComplete: Promise<unknown>, finishedCallback?: () => void) {
    // good time to add view-transition-name styles (if needed)
    eventManager.emit('BeforeStartViewTransition');
    // next call will create the 'old' view snapshot
    const transition = document.startViewTransition(async () => {
      try {
        // Good time to remove any view-transition-name styles created during
        // BeforeStartViewTransition, then trigger the actual view transition.
        eventManager.emit('StartViewTransition');
        await domUpdateComplete;
      } catch (e) {
        console.log('exception', e);
      }
    });
    // UpdateCallbackDone is a good time to add any view-transition-name styles
    // to the new DOM state, before the 'new' view snapshot is creatd
    transition.updateCallbackDone
      .then(() => eventManager.emit('UpdateCallbackDone'))
      .catch((e) => console.log('exception', e));
    // Both old/new snapshots are taken - pseudo elements are created, transition is
    // about to start
    transition.ready.then(() => eventManager.emit('Ready')).catch((e) => console.log('exception in ready', e));
    // Transition is complete
    transition.finished.then(() => eventManager.emit('Finished')).catch((e) => console.log('exception in finished', e));
    transition.finished.then(() => finishedCallback?.());
  }
}

export const viewTransitionManager = new ViewTransitionManager();
