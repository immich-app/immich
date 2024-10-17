import { matchesShortcut } from '$lib/actions/shortcut';
import type { ActionReturn } from 'svelte/action';

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
export function clickOutside(node: HTMLElement, options: Options = {}): ActionReturn {
  const { onOutclick, onEscape } = options;

  const handleClick = (event: MouseEvent) => {
    const targetNode = event.target as Node | null;
    if (node.contains(targetNode)) {
      return;
    }

    onOutclick?.();
  };

  const handleKey = (event: KeyboardEvent) => {
    if (!matchesShortcut(event, { key: 'Escape' })) {
      return;
    }

    if (onEscape) {
      event.stopPropagation();
      onEscape();
    }
  };

  document.addEventListener('click', handleClick, true);
  node.addEventListener('keydown', handleKey, false);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
      node.removeEventListener('keydown', handleKey, false);
    },
  };
}
