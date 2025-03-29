import { shortcuts } from '$lib/actions/shortcut';
import { tick } from 'svelte';

interface Options {
  /**
   * Set whether the trap is active or not.
   */
  active?: boolean;
}

const selectors =
  'button:not([disabled], .hidden), [href]:not(.hidden), input:not([disabled], .hidden), select:not([disabled], .hidden), textarea:not([disabled], .hidden), [tabindex]:not([tabindex="-1"], .hidden)';

export function focusTrap(container: HTMLElement, options?: Options) {
  const triggerElement = document.activeElement;

  const withDefaults = (options?: Options) => {
    return {
      active: options?.active ?? true,
    };
  };

  const setInitialFocus = () => {
    const focusableElement = container.querySelector<HTMLElement>(selectors);
    // Use tick() to ensure focus trap works correctly inside <Portal />
    void tick().then(() => focusableElement?.focus());
  };

  if (withDefaults(options).active) {
    setInitialFocus();
  }

  const getFocusableElements = (): [HTMLElement | null, HTMLElement | null] => {
    const focusableElements = container.querySelectorAll<HTMLElement>(selectors);
    return [
      focusableElements.item(0), //
      focusableElements.item(focusableElements.length - 1),
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
        triggerElement.focus();
      }
    },
  };
}
