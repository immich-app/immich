import { matchesShortcut } from '$lib/actions/shortcut';
import type { ActionReturn } from 'svelte/action';

interface Options {
  onOutclick?: () => void;
  onEscape?: () => void;
}

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
