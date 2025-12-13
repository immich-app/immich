import { focusable, isTabbable, tabbable, type CheckOptions, type TabbableOptions } from 'tabbable';

type TabbableOpts = TabbableOptions & CheckOptions;
let defaultOpts: TabbableOpts = {
  includeContainer: false,
};

export const setDefaultTabbleOptions = (options: TabbableOpts) => {
  defaultOpts = options;
};

export const getTabbable = (container: Element, includeContainer: boolean = false) =>
  tabbable(container, { ...defaultOpts, includeContainer });

export const moveFocus = (
  selector: (element: HTMLElement | SVGElement) => boolean,
  direction: 'previous' | 'next',
): void => {
  const focusableElements = focusable(document.body, { includeContainer: true });

  if (focusableElements.length === 0) {
    return;
  }

  const currentElement = document.activeElement as HTMLElement | null;
  const currentIndex = currentElement ? focusableElements.indexOf(currentElement) : -1;

  // If no element is focused, focus the first matching element or the first focusable element
  if (currentIndex === -1) {
    const firstMatchingElement = focusableElements.find((element) => selector(element));
    if (firstMatchingElement) {
      firstMatchingElement.focus();
    } else if (focusableElements[0]) {
      focusableElements[0].focus();
    }
    return;
  }

  // Calculate the step direction
  const step = direction === 'next' ? 1 : -1;
  const totalElements = focusableElements.length;

  // Search for the next focusable element that matches the selector
  let nextIndex = currentIndex;
  do {
    nextIndex = (nextIndex + step + totalElements) % totalElements;
    const candidateElement = focusableElements[nextIndex];

    if (isTabbable(candidateElement) && selector(candidateElement)) {
      candidateElement.focus();
      break;
    }
  } while (nextIndex !== currentIndex);
};
