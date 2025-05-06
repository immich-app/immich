const selectors =
  'button:not([disabled], .hidden), [href]:not(.hidden), input:not([disabled], .hidden), select:not([disabled], .hidden), textarea:not([disabled], .hidden), [tabindex]:not([tabindex="-1"], .hidden)';

export const getFocusable = (container: ParentNode) => [...container.querySelectorAll<HTMLElement>(selectors)];
