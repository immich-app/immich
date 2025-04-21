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

export const focusNext = (selector: (element: HTMLElement | SVGElement) => boolean, forwardDirection: boolean) => {
  const focusElements = focusable(document.body);
  const current = document.activeElement as HTMLElement;
  const index = focusElements.indexOf(current);

  if (forwardDirection) {
    let i = index + 1;
    while (i !== index) {
      const next = focusElements[i];
      if (!isTabbable(next) || !selector(next)) {
        if (i === focusElements.length - 1) {
          i = 0;
        } else {
          i++;
        }
        continue;
      }
      next.focus();
      break;
    }
  } else {
    let i = index - 1;
    while (i !== index) {
      const next = focusElements[i];
      if (!isTabbable(next) || !selector(next)) {
        if (i === 0) {
          i = focusElements.length - 1;
        } else {
          i--;
        }
        continue;
      }
      next.focus();
      break;
    }
  }
};
