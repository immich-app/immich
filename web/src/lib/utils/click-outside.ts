import type { ActionReturn } from 'svelte/action';

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

export function clickOutside(node: HTMLElement, options: Options = {}): ActionReturn<void, Attributes> {
  const { onOutclick, onEscape } = options;

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
    if (event.key !== 'Escape') {
      return;
    }

    if (onEscape) {
      event.stopPropagation();
      onEscape();
    } else {
      node.dispatchEvent(new CustomEvent('escape'));
    }
  };

  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKey, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKey, true);
    },
  };
}
