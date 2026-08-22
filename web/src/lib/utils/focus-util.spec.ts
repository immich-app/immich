import { restoreFocusTo } from '$lib/utils/focus-util';

describe('restoreFocusTo', () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    element = document.createElement('div');
    element.tabIndex = -1;
    document.body.append(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('focuses the element when focus is on body', () => {
    document.body.tabIndex = -1;
    document.body.focus();

    restoreFocusTo(element);

    expect(document.activeElement).toBe(element);
  });

  it('does not steal focus from a descendant', () => {
    const child = document.createElement('div');
    child.tabIndex = 0;
    element.append(child);
    child.focus();

    restoreFocusTo(element);

    expect(document.activeElement).toBe(child);
  });

  it('does nothing when the element is missing', () => {
    expect(() => restoreFocusTo(undefined)).not.toThrow();
    expect(() => restoreFocusTo(null)).not.toThrow();
  });
});
