import { shortcuts } from '$lib/actions/shortcut';
import { getTabbable } from '$lib/utils/focus-util';
import { tick } from 'svelte';

interface Options {
  /**
   * Set whether the trap is active or not.
   */
  active?: boolean;
}

export function focusTrap(container: HTMLElement, options?: Options) {
  const triggerElement = document.activeElement;

  const withDefaults = (options?: Options) => {
    return {
      active: options?.active ?? true,
    };
  };

  const setInitialFocus = async () => {
    const focusableElement = getTabbable(container, false)[0];
    if (focusableElement) {
      // Use tick() to ensure focus trap works correctly inside <Portal />
      await tick();
      focusableElement?.focus();
    }
  };

  if (withDefaults(options).active) {
    void setInitialFocus();
  }

  const getFocusableElements = () => {
    const focusableElements = getTabbable(container);
    return [
      focusableElements.at(0), //
      focusableElements.at(-1),
    ];
  };

  const { destroy: destroyShortcuts } = shortcuts(container, [
    {
      ignoreInputFields: false,
      preventDefault: false,
      shortcut: { key: 'Tab' },
      onShortcut: (event) => {
        const [firstElement, lastElement] = getFocusableElements();
        if (document.activeElement === lastElement && withDefaults(options).active) {
          event.preventDefault();
          firstElement?.focus();
        }
      },
    },
    {
      ignoreInputFields: false,
      preventDefault: false,
      shortcut: { key: 'Tab', shift: true },
      onShortcut: (event) => {
        const [firstElement, lastElement] = getFocusableElements();
        if (document.activeElement === firstElement && withDefaults(options).active) {
          event.preventDefault();
          lastElement?.focus();
        }
      },
    },
  ]);

  return {
    update(newOptions?: Options) {
      options = newOptions;
      if (withDefaults(options).active) {
        setInitialFocus();
      }
    },
    destroy() {
      destroyShortcuts?.();
      if (triggerElement instanceof HTMLElement) {
        console.log('destroy triggerElement', triggerElement.textContent);
        triggerElement.focus();
      }
    },
  };
}
