export type ShortcutCallback = (event: KeyboardEvent) => false | unknown;

export type KeyTargets = HTMLElement | Document | Window;
export type KeyDownListenerFactory = (element: KeyTargets) => (event: KeyboardEvent) => void;

export type KeyCombo = {
  key: string;
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
};
export type KeyInput = string | string[] | KeyCombo | KeyCombo[];

// OS/Browser well known keyboard shortcuts (do not bind to these keys)
const RESERVED_SHORTCUTS: Record<string, KeyCombo[]> = {
  // macOS keybindings
  mac: [
    { key: 'q', meta: true }, // Quit
    { key: 'w', meta: true }, // Close window
    { key: 'h', meta: true }, // Hide
    { key: 'm', meta: true }, // Minimize
    { key: 'Tab', meta: true }, // App switcher
    { key: ' ', meta: true }, // Spotlight
    { key: 'F3', ctrl: true }, // Mission Control
  ],
  // Windows keybindings
  win: [
    { key: 'F4', alt: true }, // Close window
    { key: 'Delete', ctrl: true, alt: true },
    { key: 'Meta' }, // Start menu
    { key: 'l', meta: true }, // Lock
    { key: 'd', meta: true }, // Desktop
    { key: 'Tab', meta: true }, // Task switcher
  ],
  // Linux keybindings
  linux: [{ key: 'F4', alt: true }, { key: 'Delete', ctrl: true, alt: true }, { key: 'Meta' }],
  // Browser-specific keybindings (cross-platform)
  browser: [
    { key: 't', ctrl: true },
    { key: 'w', ctrl: true },
    { key: 'n', ctrl: true },
    { key: 'n', ctrl: true, shift: true },
    { key: 't', ctrl: true, shift: true },
    { key: 'p', ctrl: true, shift: true },
  ],
};
const ALL_RESERVED_SHORTCUTS = [
  ...RESERVED_SHORTCUTS.mac,
  ...RESERVED_SHORTCUTS.win,
  ...RESERVED_SHORTCUTS.linux,
  ...RESERVED_SHORTCUTS.browser,
];

const attachmentFactory = (listenerFactory: KeyDownListenerFactory) => (element: KeyTargets) => {
  const listener = listenerFactory(element);
  element.addEventListener('keydown', listener as EventListener);
  return () => {
    element.removeEventListener('keydown', listener as EventListener);
  };
};

function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return 'key' in event;
}

/** Determines whether an event should be ignored. The event will be ignored if:
 *  - The element dispatching the event is not the same as the element which the event listener is attached to
 *  - The element dispatching the event is an input field
 */
export const shouldIgnoreEvent = (event: KeyboardEvent | ClipboardEvent): boolean => {
  if (event.target === event.currentTarget) {
    return false;
  }
  const type = (event.target as HTMLInputElement).type;
  return ['textarea', 'text', 'date', 'datetime-local', 'email', 'password'].includes(type);
};

function isPromise<T = unknown>(obj: unknown): obj is Promise<T> {
  return (
    obj !== null &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof (obj as { then?: unknown }).then === 'function'
  );
}

function checkForReservedShortcuts(
  shortcuts: KeyCombo[],
  handler: (event: KeyboardEvent) => void,
): (event: KeyboardEvent) => void {
  const formatCombo = (combo: KeyCombo) => {
    const parts = [];
    if (combo.ctrl) {
      parts.push('Ctrl');
    }
    if (combo.alt) {
      parts.push('Alt');
    }
    if (combo.shift) {
      parts.push('Shift');
    }
    if (combo.meta) {
      parts.push('Meta');
    }
    parts.push(combo.key);
    return parts.join('+');
  };

  for (const shortcut of shortcuts) {
    for (const reserved of ALL_RESERVED_SHORTCUTS) {
      // Check if shortcuts match (comparing all properties)
      if (
        shortcut.key.toLowerCase() === reserved.key.toLowerCase() &&
        !!shortcut.ctrl === !!reserved.ctrl &&
        !!shortcut.alt === !!reserved.alt &&
        !!shortcut.shift === !!reserved.shift &&
        !!shortcut.meta === !!reserved.meta
      ) {
        console.error(
          `[Keyboard Shortcut Warning] Attempting to register reserved shortcut: ${formatCombo(shortcut)}. ` +
            `This shortcut is reserved by the OS or browser and may not work as expected.`,
        );
        return () => void 0;
      }
    }
  }
  return handler;
}

export const keyDownListenerFactory = (
  isActiveFactory: () => () => boolean,
  options: { ignoreInputFields?: boolean },
  shortcuts: KeyCombo[],
  callback: ShortcutCallback,
) =>
  checkForReservedShortcuts(shortcuts, (event: KeyboardEvent) => {
    const isActive = isActiveFactory();
    if (!isActive() || !isKeyboardEvent(event) || ((options.ignoreInputFields ?? true) && shouldIgnoreEvent(event))) {
      return;
    }

    for (const currentShortcut of shortcuts) {
      // pressing 'shift' will cause keyEvents to use capital key - adjust shortcut key to be capital to match
      const matchingKey = currentShortcut.shift ? currentShortcut.key.toUpperCase() : currentShortcut.key;

      // On mac, pressing 'alt+<somekey>' transforms the key to a special character
      // but the code property has the physical key. If the code starts with Key/Digit
      // extract the key from the code to consistently process alt keys on all platforms.
      let baseKey = event.key;
      const code = event.code;
      if (code.startsWith('Key')) {
        baseKey = code.slice(3).toLowerCase();
      } else if (code.startsWith('Digit')) {
        baseKey = code.slice(5);
      }

      if (
        baseKey !== matchingKey ||
        !!currentShortcut.ctrl !== event.ctrlKey ||
        !!currentShortcut.alt !== event.altKey ||
        !!currentShortcut.shift !== event.shiftKey
      ) {
        continue;
      }

      const result = callback(event);
      if (isPromise(result) || result === false) {
        // An event handler must be syncronous to call preventDefault
        // if a handler is a promise then it can't rely on the automatic
        // preventDefault() behavior, and must manually do that itself.
        return;
      }
      // result must be true or void, in both cases, the event is 'handled'
      // so we should prevent the default behavior (prevent OS/browser shortcuts)
      event.preventDefault();
      return;
    }
  });

export const alwaysTrueFactory = () => () => true;

export const blurOnEnter = attachmentFactory(() =>
  keyDownListenerFactory(alwaysTrueFactory, {}, [{ key: 'Enter' }], (event: KeyboardEvent) =>
    (event.target as HTMLElement).blur(),
  ),
);

export const blurOnCtrlEnter = attachmentFactory(() =>
  keyDownListenerFactory(alwaysTrueFactory, {}, [{ key: 'Enter', ctrl: true }], (event: KeyboardEvent) =>
    (event.target as HTMLElement).blur(),
  ),
);
export const altKey = (key: string) => ({ key, alt: true });
export const ctrlKey = (key: string) => ({ key, ctrl: true });
export const shiftKey = (key: string) => ({ key, shift: true });
export const metaKey = (key: string) => ({ key, meta: true });
export const ctrlShiftKey = (key: string) => ({ key, ctrl: true, shift: true });

export const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && typeof value[0] === 'string';
};

export const normalizeKeyInput = (shortcut: KeyInput): KeyCombo[] => {
  if (typeof shortcut === 'string') {
    return [{ key: shortcut }];
  } else if (isStringArray(shortcut)) {
    return shortcut.map((key) => ({ key }));
  } else if (Array.isArray(shortcut)) {
    return shortcut;
  } else {
    return [shortcut];
  }
};

const defaultOptions = {
  ignoreInputFields: true,
};

export const onKeydown = (
  keyInput: KeyInput,
  callback: ShortcutCallback,
  options?: {
    // default is true if unspecified
    ignoreInputFields?: boolean;
  },
) =>
  attachmentFactory(() =>
    keyDownListenerFactory(alwaysTrueFactory, { ...defaultOptions, ...options }, normalizeKeyInput(keyInput), callback),
  );
