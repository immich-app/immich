import { shortcuts } from '$lib/actions/shortcut';
import { tick } from 'svelte';
import type { Action } from 'svelte/action';

interface Options {
  container: HTMLElement;
  activeId: string | undefined;
  selectionChanged: (node: HTMLElement | undefined, index: number | undefined) => void;
  openDropdown: (event: KeyboardEvent) => void;
  closeDropdown: () => void;
}

export const listNavigationV2: Action<HTMLElement, Options> = (node, options: Options) => {
  const getCurrentElement = () => {
    const { container, activeId } = options;
    return container.querySelector(`#${activeId}`) as HTMLElement | undefined;
  };

  const close = () => {
    const { closeDropdown, selectionChanged } = options;
    selectionChanged(undefined, undefined);
    closeDropdown();
  };

  const moveSelection = async (direction: 'up' | 'down', event: KeyboardEvent) => {
    const { selectionChanged, container, openDropdown } = options;
    openDropdown(event);

    await tick();

    const children = Array.from(container?.children) as HTMLElement[];
    if (children.length === 0) {
      return;
    }

    const currentEl = getCurrentElement();
    currentEl?.classList.remove('!bg-red-500');
    const currentIndex = currentEl ? children.indexOf(currentEl) : -1;
    const directionFactor = (direction === 'up' ? -1 : 1) + (direction === 'up' && currentIndex === -1 ? 1 : 0);
    const newIndex = (currentIndex + directionFactor + children.length) % children.length;
    children[newIndex].classList.add('!bg-red-500');

    selectionChanged(children[newIndex], newIndex);
  };

  const onEscape = (event: KeyboardEvent) => {
    event.stopPropagation();
    close();
  };

  const { destroy } = shortcuts(node, [
    { shortcut: { key: 'ArrowUp' }, onShortcut: (event) => moveSelection('up', event), ignoreInputFields: false },
    { shortcut: { key: 'ArrowDown' }, onShortcut: (event) => moveSelection('down', event), ignoreInputFields: false },
    { shortcut: { key: 'Escape' }, onShortcut: (event) => onEscape(event), ignoreInputFields: false },
  ]);

  return {
    update(newOptions) {
      if (options.container) {
        const currentEl = getCurrentElement();
        currentEl?.classList.remove('!bg-red-500');
      }
      options = newOptions;
    },
    destroy,
  };
};
