import { shortcuts } from '$lib/actions/shortcut';

const selectors =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusTrap(container: HTMLElement) {
  const triggerElement = document.activeElement;

  const focusableElement = container.querySelector<HTMLElement>(selectors);
  focusableElement?.focus();

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
        if (document.activeElement === lastElement) {
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
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      },
    },
  ]);

  return {
    destroy() {
      destroyShortcuts?.();
      if (triggerElement instanceof HTMLElement) {
        triggerElement.focus();
      }
    },
  };
}
