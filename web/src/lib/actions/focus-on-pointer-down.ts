import type { ActionReturn } from 'svelte/action';
import { isInteractiveElement } from '$lib/utils/focus-util';

/**
 * Moves focus to the node when the user interacts with it via pointer down or wheel,
 * unless the interaction targets an interactive control that owns its own focus.
 *
 * This is used by the asset viewer to reclaim keyboard navigation from other focused
 * elements (e.g. a map canvas in the info panel), without affecting controls such as
 * buttons, inputs, or native video players.
 */
export const focusOnPointerDown = (node: HTMLElement): ActionReturn => {
  const onFocus = (event: PointerEvent | WheelEvent) => {
    if (isInteractiveElement(event.target)) {
      return;
    }

    node.focus();
  };

  node.addEventListener('pointerdown', onFocus);
  node.addEventListener('wheel', onFocus);

  return {
    destroy() {
      node.removeEventListener('pointerdown', onFocus);
      node.removeEventListener('wheel', onFocus);
    },
  };
};
