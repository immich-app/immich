import type { ActionReturn } from 'svelte/action';
import type { KeyCombo } from './input';

interface Options {
  onOutclick?: () => void;
  onEscape?: () => void;
}

export const matchesShortcut = (event: KeyboardEvent, shortcut: KeyCombo) => {
  return (
    shortcut.key.toLowerCase() === event.key.toLowerCase() &&
    Boolean(shortcut.alt) === event.altKey &&
    Boolean(shortcut.ctrl) === event.ctrlKey &&
    Boolean(shortcut.shift) === event.shiftKey &&
    Boolean(shortcut.meta) === event.metaKey
  );
};

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

  document.addEventListener('mousedown', handleClick, false);
  node.addEventListener('keydown', handleKey, false);

  return {
    destroy() {
      document.removeEventListener('mousedown', handleClick, false);
      node.removeEventListener('keydown', handleKey, false);
    },
  };
}
