import type { Action } from 'svelte/action';
import { shortcuts } from './shortcut';

export const listNavigation: Action<HTMLElement, HTMLElement> = (node, container: HTMLElement) => {
  const moveFocus = (direction: 'up' | 'down') => {
    const children = Array.from(container?.children);
    if (children.length === 0) {
      return;
    }

    const currentIndex = document.activeElement === null ? -1 : children.indexOf(document.activeElement);
    const directionFactor = (direction === 'up' ? -1 : 1) + (direction === 'up' && currentIndex === -1 ? 1 : 0);
    const newIndex = (currentIndex + directionFactor + children.length) % children.length;

    const element = children.at(newIndex);
    if (element instanceof HTMLElement) {
      element.focus();
    }
  };

  const { destroy } = shortcuts(node, [
    { shortcut: { key: 'ArrowUp' }, onShortcut: () => moveFocus('up'), ignoreInputFields: false },
    { shortcut: { key: 'ArrowDown' }, onShortcut: () => moveFocus('down'), ignoreInputFields: false },
  ]);

  return {
    update(newContainer) {
      container = newContainer;
    },
    destroy,
  };
};
