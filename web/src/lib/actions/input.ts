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

export const keyDownListenerFactory =
  (
    isActiveFactory: () => () => boolean,
    options: { ignoreInputFields?: boolean },
    shortcuts: KeyCombo[],
    callback: (event: KeyboardEvent) => unknown,
  ) =>
  (event: KeyboardEvent) => {
    const isActive = isActiveFactory();
    if (!isActive() || !isKeyboardEvent(event) || ((options.ignoreInputFields ?? true) && shouldIgnoreEvent(event))) {
      return;
    }

    for (const currentShortcut of shortcuts) {
      // pressing 'shift' will cause keyEvents to use capital key - adjust shortcut key to be capital to match
      const matchingKey = currentShortcut.shift ? currentShortcut.key.toUpperCase() : currentShortcut.key;

      if (
        event.key === matchingKey &&
        !!currentShortcut.ctrl === event.ctrlKey &&
        !!currentShortcut.alt === event.altKey &&
        !!currentShortcut.shift === event.shiftKey
      ) {
        callback(event);
        return;
      }
    }
  };

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
export const ctrlKey = (key: string) => ({ key, ctrl: true });
export const shiftKey = (key: string) => ({ key, shift: true });
export const metaKey = (key: string) => ({ key, meta: true });

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
  callback: (event: KeyboardEvent) => unknown,
  options?: {
    // default is true if unspecified
    ignoreInputFields?: boolean;
  },
) =>
  attachmentFactory(() =>
    keyDownListenerFactory(alwaysTrueFactory, { ...defaultOptions, ...options }, normalizeKeyInput(keyInput), callback),
  );
