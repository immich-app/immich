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
}

export type OutClickEvent = MouseEvent | KeyboardEvent | TouchEvent;

export function clickOutside(node: HTMLElement, options: Options = {}): ActionReturn<void, Attributes> {
  const { onOutclick, onEscape } = options;

  const handleClick = (event: MouseEvent | TouchEvent) => {
    const targetNode = event.target as Node | null;
    if (node.contains(targetNode)) {
      return;
    }

    if (onOutclick) {
      onOutclick();
    } else {
      node.dispatchEvent(new CustomEvent<OutClickEvent>('outclick', { detail: event }));
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
      node.dispatchEvent(new CustomEvent<OutClickEvent>('escape', { detail: event }));
    }
  };

  document.addEventListener('click', handleClick, true);
  document.addEventListener('touchstart', handleClick, true);
  node.addEventListener('keydown', handleKey, false);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('touchstart', handleClick, true);
      node.removeEventListener('keydown', handleKey, false);
    },
  };
}
