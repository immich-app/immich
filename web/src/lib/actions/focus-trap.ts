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

  // Create sentinel nodes
  const startSentinel = document.createElement('div');
  startSentinel.setAttribute('tabindex', '0');
  startSentinel.dataset.focusTrap = 'start';

  const backupSentinel = document.createElement('div');
  backupSentinel.setAttribute('tabindex', '-1');
  backupSentinel.dataset.focusTrap = 'backup';

  const endSentinel = document.createElement('div');
  endSentinel.setAttribute('tabindex', '0');
  endSentinel.dataset.focusTrap = 'end';

  // Insert sentinel nodes into the container
  container.insertBefore(startSentinel, container.firstChild);
  container.insertBefore(backupSentinel, startSentinel.nextSibling);
  container.append(endSentinel);

  const withDefaults = (options?: Options) => {
    return {
      active: options?.active ?? true,
    };
  };

  const setInitialFocus = async () => {
    // Use tick() to ensure focus trap works correctly inside <Portal />
    await tick();

    // Get focusable elements, excluding our sentinel nodes
    const allTabbable = getTabbable(container, false);
    const focusableElement = allTabbable.find((el) => !Object.hasOwn(el.dataset, 'focusTrap'));

    if (focusableElement) {
      focusableElement.focus();
    } else {
      backupSentinel.setAttribute('tabindex', '-1');
      // No focusable elements found, use backup sentinel as fallback
      backupSentinel.focus();
    }
  };

  if (withDefaults(options).active) {
    void setInitialFocus();
  }

  const getFocusableElements = () => {
    // Get all tabbable elements except our sentinel nodes
    const allTabbable = getTabbable(container);
    const focusableElements = allTabbable.filter((el) => !Object.hasOwn(el.dataset, 'focusTrap'));

    return [
      focusableElements.at(0), //
      focusableElements.at(-1),
    ];
  };

  // Add focus event listeners to sentinel nodes
  const handleStartFocus = () => {
    if (withDefaults(options).active) {
      const [, lastElement] = getFocusableElements();
      // If no elements, stay on backup sentinel
      if (lastElement) {
        lastElement.focus();
      } else {
        backupSentinel.focus();
      }
    }
  };

  const handleBackupFocus = () => {
    // Backup sentinel keeps focus when there are no other focusable elements
    if (withDefaults(options).active) {
      const [firstElement] = getFocusableElements();
      // Only move focus if there are actual focusable elements
      if (firstElement) {
        firstElement.focus();
      }
      // Otherwise, focus stays on backup sentinel
    }
  };

  const handleEndFocus = () => {
    if (withDefaults(options).active) {
      const [firstElement] = getFocusableElements();
      // If no elements, move to backup sentinel
      if (firstElement) {
        firstElement.focus();
      } else {
        backupSentinel.focus();
      }
    }
  };

  startSentinel.addEventListener('focus', handleStartFocus);
  backupSentinel.addEventListener('focus', handleBackupFocus);
  endSentinel.addEventListener('focus', handleEndFocus);

  return {
    update(newOptions?: Options) {
      options = newOptions;
      if (withDefaults(options).active) {
        void setInitialFocus();
      }
    },
    destroy() {
      // Remove event listeners
      startSentinel.removeEventListener('focus', handleStartFocus);
      backupSentinel.removeEventListener('focus', handleBackupFocus);
      endSentinel.removeEventListener('focus', handleEndFocus);

      // Remove sentinel nodes from DOM
      startSentinel.remove();
      backupSentinel.remove();
      endSentinel.remove();

      if (triggerElement instanceof HTMLElement) {
        triggerElement.focus();
      }
    },
  };
}
