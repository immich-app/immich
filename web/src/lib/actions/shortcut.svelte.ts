import {
  alwaysTrueFactory,
  type KeyCombo,
  keyDownListenerFactory,
  type KeyDownListenerFactory,
  type KeyInput,
  normalizeKeyInput,
} from '$lib/actions/input';
import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
import { modalManager } from '@immich/ui';
import { untrack } from 'svelte';
import { t } from 'svelte-i18n';
import type { Attachment } from 'svelte/attachments';
import { SvelteMap } from 'svelte/reactivity';
import { get } from 'svelte/store';

export enum Category {
  Application = 'app_actions',
  AssetActions = 'asset_actions',
  ViewActions = 'view_actions',
  QuickActions = 'quick_actions',
  Navigation = 'navigation',
  Selection = 'selection',
}

export const getCategoryString = (category: Category) => get(t)(category);

export const category = (category: Category, text: string, variant?: ShortcutVariant): ShortcutHelp => {
  return {
    variant,
    category,
    text,
  };
};

const explicitCategoryList = [
  Category.QuickActions,
  Category.AssetActions,
  Category.ViewActions,
  Category.Selection,
  Category.Navigation,
  Category.Application,
];

export const sortCategories = (categories: Category[]) =>
  [...categories].sort((a, b) => {
    const indexA = explicitCategoryList.indexOf(a);
    const indexB = explicitCategoryList.indexOf(b);
    return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
  });

export enum ShortcutVariant {
  SelectAll,
  DeselectAll,
  AddAlbum,
  AddSharedAlbum,
  PrevAsset,
  NextAsset,
  Delete,
  PermDelete,
  PreviousAsset,
  PreviousDay,
  NextDay,
  PreviousMonth,
  NextMonth,
  PreviousYear,
  NextYear,
  Trash,
  Search,
  SearchFilter,
  FocusNext,
  FocusPrevious,
}

type ShortcutHelp = {
  variant?: ShortcutVariant;
  category?: Category;
  text: string;
  info?: string;
};
export type KeyboardHelp = ShortcutHelp & { key: string[][] };

type InternalKeyboardHelp = KeyboardHelp & { scope: number; $InternalHelpId: string };
type KeyTargets = HTMLElement | Document | Window;

const isMacOS = /Mac(intosh|Intel)/.test(globalThis.navigator.userAgent);

// state variables
let helpArray: InternalKeyboardHelp[] = $state([]);
// eslint-disable-next-line svelte/no-unnecessary-state-wrap
let shortcutVariants = $state(new SvelteMap<ShortcutVariant, ShortcutVariant>());
let currentScope = $state(0);
let showingShortcuts = $state(false);

const activeScopeShortcuts: KeyboardHelp[] = $derived(
  helpArray.filter((helpObjectArrayObject) => helpObjectArrayObject.scope === currentScope),
);

function isLetter(c: string) {
  return c.toLowerCase() != c.toUpperCase();
}

const expandKeys = (shortcuts: KeyCombo[]) => {
  return shortcuts.map((s) => {
    const keys: string[] = [];
    const keyIsLetter = isLetter(s.key);
    if (s.shift && isMacOS) {
      keys.push('⇧');
    } else if (s.shift) {
      keys.push('Shift');
    }
    if (s.ctrl && isMacOS) {
      keys.push('⌃');
    } else if (s.ctrl) {
      keys.push('Ctrl');
    }
    if (s.alt && isMacOS) {
      keys.push('⌥');
    } else if (s.alt) {
      keys.push('Alt');
    }
    if (s.meta && isMacOS) {
      keys.push('⌘');
    } else if (s.meta) {
      keys.push('❖');
    }
    switch (s.key) {
      case ' ': {
        if (isMacOS) {
          keys.push('␣');
        } else {
          keys.push('space');
        }
        break;
      }
      case 'ArrowLeft': {
        keys.push('←');
        break;
      }
      case 'ArrowRight': {
        keys.push('→');
        break;
      }
      case 'Escape': {
        keys.push('esc');
        break;
      }
      case 'Delete': {
        if (isMacOS) {
          keys.push('⌦');
        } else {
          keys.push('del');
        }
        break;
      }
      default: {
        if (keyIsLetter && s.shift && !s.alt && !s.ctrl && !s.meta) {
          keys.splice(0);
          keys.push(s.key.toUpperCase());
        } else {
          keys.push(s.key);
        }
      }
    }
    return keys;
  });
};

function normalizeHelp(help: ShortcutHelp | string, shortcuts: KeyCombo[]): KeyboardHelp | null {
  if (!help) {
    return null;
  } else if (typeof help === 'string') {
    return {
      text: help,
      category: Category.Application,
      key: expandKeys(shortcuts),
    };
  } else {
    return { category: Category.Application, ...help, key: expandKeys(shortcuts) };
  }
}

function generateId() {
  const timestamp = Date.now().toString(36); // Current timestamp in base 36
  const random = Math.random().toString(36).slice(2, 9); // Random string from Math.random()
  return timestamp + random;
}

export const attachmentFactory =
  (help: KeyboardHelp | null, listenerFactory: KeyDownListenerFactory): Attachment<KeyTargets> =>
  (element: KeyTargets) => {
    return untrack(() => {
      const listener = listenerFactory(element);
      const internalId = generateId();
      let helpObject: InternalKeyboardHelp;
      if (help) {
        helpObject = {
          ...help,
          scope: currentScope,
          $InternalHelpId: internalId,
        };
        helpArray.push(helpObject);
      }
      element.addEventListener('keydown', listener as EventListener);
      return () => {
        if (helpObject) {
          const index = helpArray.findIndex((helpObject) => helpObject && helpObject.$InternalHelpId === internalId);
          if (index !== -1) {
            helpArray.splice(index, 1);
          }
        }
        element.removeEventListener('keydown', listener as EventListener);
      };
    });
  };

export const registerShortcutVariant = (first: ShortcutVariant, other: ShortcutVariant) => {
  return () => {
    shortcutVariants.set(first, other);
    return () => {
      shortcutVariants.delete(first);
    };
  };
};

export const shortcut = (input: KeyInput, help: ShortcutHelp | string, callback: (event: KeyboardEvent) => unknown) => {
  const normalized = normalizeKeyInput(input);
  return attachmentFactory(normalizeHelp(help, normalized), () =>
    keyDownListenerFactory(isActiveFactory, {}, normalized, callback),
  );
};

export const conditionalShortcut = (condition: () => boolean, shortcut: () => Attachment<KeyTargets>) => {
  if (condition()) {
    return shortcut();
  }
  return () => void 0;
};

const isActiveFactory = () => {
  const savedScope = currentScope;
  return () => modalManager.openCount === 0 && savedScope === currentScope;
};

const pushScope = () => untrack(() => currentScope++);
const popScope = () => untrack(() => currentScope--);

export const newShortcutScope = () => {
  pushScope();
  return () => popScope();
};

export const showShortcutsModal = async () => {
  if (showingShortcuts) {
    return;
  }
  showingShortcuts = true;
  await modalManager.show(ShortcutsModal, { shortcutVariants, shortcuts: activeScopeShortcuts });
  showingShortcuts = false;
};

export const resetModal = () => {
  // only used by ShortcutsModal - used to restore state after HMR.
  // do not use for any other reason
  showingShortcuts = false;
};

const startup = () => {
  // add the default '?' shortcut to launch the help menu
  const unregister = attachmentFactory(
    { category: Category.Application, text: 'Open Shortcuts Help', key: [['?']] },
    () => keyDownListenerFactory(alwaysTrueFactory, {}, [{ key: '?', shift: true }], showShortcutsModal),
  )(globalThis as unknown as Window);
  // put global variants here
  shortcutVariants.set(ShortcutVariant.AddAlbum, ShortcutVariant.AddSharedAlbum);
  return unregister as () => void;
};

const registerHmr = () => {
  const hot = import.meta.hot;
  if (!hot) {
    startup();
    return;
  }
  if (import.meta.hot!.data?.shortcut_state) {
    const shortcut_state = import.meta.hot!.data.shortcut_state;
    const _pairMap = new SvelteMap<ShortcutVariant, ShortcutVariant>();
    for (const element of shortcut_state.pairMap.keys()) {
      _pairMap.set(element, shortcut_state.pairMap.get(element));
    }
    if (shortcut_state) {
      helpArray = shortcut_state.helpArray;
      showingShortcuts = shortcut_state.showingShortcuts;
      currentScope = shortcut_state.currentScope;
      shortcutVariants = _pairMap;
    }
  }
  // startup() must be called after the hot-state has been restored
  const unregister = startup();
  hot.on('vite:beforeUpdate', () => {
    const shortcut_state = {
      helpArray: [...$state.snapshot(helpArray)],
      showingShortcuts,
      currentScope,
      pairMap: $state.snapshot(shortcutVariants),
    };
    unregister();
    import.meta.hot!.data.shortcut_state = shortcut_state;
  });
};
registerHmr();
