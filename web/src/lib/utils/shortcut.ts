import type { ActionReturn } from 'svelte/action';

export type Shortcut = {
  key: string;
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
};

export type ShortcutOptions<T = HTMLElement> = {
  shortcut: Shortcut;
  ignoreInputFields?: boolean;
  onShortcut: (event: KeyboardEvent & { currentTarget: T }) => unknown;
  preventDefault?: boolean;
};

export const shouldIgnoreShortcut = (event: KeyboardEvent): boolean => {
  if (event.target === event.currentTarget) {
    return false;
  }
  const type = (event.target as HTMLInputElement).type;
  return ['textarea', 'text', 'date', 'datetime-local'].includes(type);
};

export const matchesShortcut = (event: KeyboardEvent, shortcut: Shortcut) => {
  return (
    shortcut.key.toLowerCase() === event.key.toLowerCase() &&
    Boolean(shortcut.alt) === event.altKey &&
    Boolean(shortcut.ctrl) === event.ctrlKey &&
    Boolean(shortcut.shift) === event.shiftKey &&
    Boolean(shortcut.meta) === event.metaKey
  );
};

export const shortcut = <T extends HTMLElement>(
  node: T,
  option: ShortcutOptions<T>,
): ActionReturn<ShortcutOptions<T>> => {
  const { update: shortcutsUpdate, destroy } = shortcuts(node, [option]);

  return {
    update(newOption) {
      shortcutsUpdate?.([newOption]);
    },
    destroy,
  };
};

export const shortcuts = <T extends HTMLElement>(
  node: T,
  options: ShortcutOptions<T>[],
): ActionReturn<ShortcutOptions<T>[]> => {
  function onKeydown(event: KeyboardEvent) {
    const ignoreShortcut = shouldIgnoreShortcut(event);

    for (const { shortcut, onShortcut, ignoreInputFields = true, preventDefault = true } of options) {
      if (ignoreInputFields && ignoreShortcut) {
        continue;
      }

      if (matchesShortcut(event, shortcut)) {
        if (preventDefault) {
          event.preventDefault();
        }
        onShortcut(event as KeyboardEvent & { currentTarget: T });
        return;
      }
    }
  }

  node.addEventListener('keydown', onKeydown);

  return {
    update(newOptions) {
      options = newOptions;
    },
    destroy() {
      node.removeEventListener('keydown', onKeydown);
    },
  };
};
