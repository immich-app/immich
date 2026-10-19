import type { ActionReturn } from 'svelte/action';
import { matchesShortcut } from '$lib/actions/shortcut';

interface Options {
  onOutclick?: () => void;
  onEscape?: () => void;
}

/**
 * Calls a function when a click occurs outside of the element, or when the escape key is pressed.
 * @param node
 * @param options Object containing onOutclick and onEscape functions
 * @returns
 */
export function clickOutside(node: HTMLElement, options: Options = {}): ActionReturn<Options> {
  const handleClick = (event: MouseEvent) => {
    const { onOutclick } = options;
    const targetNode = event.target as Node | null;
    if (node.contains(targetNode)) {
      return;
    }

    onOutclick?.();
  };

  const handleKey = (event: KeyboardEvent) => {
    const { onEscape } = options;
    if (!matchesShortcut(event, { key: 'Escape' })) {
      return;
    }

    if (onEscape) {
      event.stopPropagation();
      onEscape();
    }
  };

  document.addEventListener('mousedown', handleClick, { capture: false });
  node.addEventListener('keydown', handleKey, { capture: false });

  return {
    update(newOptions: Options) {
      options = newOptions;
    },
    destroy() {
      document.removeEventListener('mousedown', handleClick, false);
      node.removeEventListener('keydown', handleKey, false);
    },
  };
}
