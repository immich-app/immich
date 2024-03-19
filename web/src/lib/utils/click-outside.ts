import type { ActionReturn } from 'svelte/action';
import { matchesShortcut } from './shortcut';

interface Attributes {
  /** @deprecated */
  'on:outclick'?: (e: CustomEvent) => void;
  /** @deprecated **/
  'on:escape'?: (e: CustomEvent) => void;
}

interface Options {
  onOutclick?: () => void;
  onEscape?: () => void;
  onFocusOut?: () => void;
}

export function clickOutside(node: HTMLElement, options: Options = {}): ActionReturn<void, Attributes> {
  const { onOutclick, onEscape, onFocusOut } = options;

  const handleClick = (event: MouseEvent) => {
    const targetNode = event.target as Node | null;
    if (node.contains(targetNode)) {
      return;
    }

    if (onOutclick) {
      onOutclick();
    } else {
      node.dispatchEvent(new CustomEvent('outclick'));
    }
  };

  const handleKey = (event: KeyboardEvent) => {
    if (!matchesShortcut(event, { key: 'Escape' })) {
      return;
    }

    if (onEscape) {
      event.stopPropagation();
      onEscape();
    } else {
      node.dispatchEvent(new CustomEvent('escape'));
    }
  };

  const handleFocusOut = (event: FocusEvent) => {
    if (onFocusOut && event.relatedTarget instanceof Node && !node.contains(event.relatedTarget as Node)) {
      onFocusOut();
    }
  };

  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKey, true);
  node.addEventListener('focusout', handleFocusOut);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKey, true);
      node.removeEventListener('focusout', handleFocusOut);
    },
  };
}
