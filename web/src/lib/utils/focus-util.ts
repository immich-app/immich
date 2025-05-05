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
  const focusElements = focusable(document.body, { includeContainer: true });
  const current = document.activeElement as HTMLElement;
  const index = focusElements.indexOf(current);
  if (index === -1) {
    for (const element of focusElements) {
      if (selector(element)) {
        element.focus();
        return;
      }
    }
    focusElements[0].focus();
    return;
  }
  const totalElements = focusElements.length;
  let i = index;
  do {
    i = (i + (forwardDirection ? 1 : -1) + totalElements) % totalElements;
    const next = focusElements[i];
    if (isTabbable(next) && selector(next)) {
      next.focus();
      break;
    }
  } while (i !== index);
};
