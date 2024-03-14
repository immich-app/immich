import type { ActionReturn } from 'svelte/action';

export type Shortcut = {
  key: string;
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  meta?: true;
};

export type ShortcutOptions<T> = {
  shortcuts: Shortcut[];
  onShortcut: (event: KeyboardEvent & { currentTarget: T }) => void;
};

export type ShortcutList = [Shortcut, () => void][];

export const shouldIgnoreShortcut = (event: KeyboardEvent): boolean => {
  if (event.target === event.currentTarget) {
    return false;
  }
  const type = (event.target as HTMLInputElement).type;
  return ['textarea', 'text'].includes(type);
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
  options: ShortcutOptions<T>,
): ActionReturn<ShortcutOptions<T>> => {
  const { shortcuts, onShortcut } = options;

  function onKeydown(event: KeyboardEvent) {
    if (shouldIgnoreShortcut(event)) {
      return;
    }

    const shortcut = shortcuts.find((shortcut) => matchesShortcut(event, shortcut));
    if (shortcut) {
      event.preventDefault();
      onShortcut(event as KeyboardEvent & { currentTarget: T });
    }
  }

  node.addEventListener('keydown', onKeydown);

  return {
    destroy() {
      node.removeEventListener('keydown', onKeydown);
    },
  };
};

export const executeShortcuts = (event: KeyboardEvent, shortcuts: ShortcutList) => {
  if (shouldIgnoreShortcut(event)) {
    return;
  }

  for (const [shortcut, action] of shortcuts) {
    if (matchesShortcut(event, shortcut)) {
      event.preventDefault();
      action();
      return;
    }
  }
};
