import { isPopoverContent } from '$lib/components/shared-components/search-bar/search-bar-utils';

describe('isPopoverContent', () => {
  const focusOutEventTo = (relatedTarget: EventTarget | null) => new FocusEvent('focusout', { relatedTarget });

  const createCalendarPopup = () => {
    const popup = document.createElement('div');
    popup.dataset.popoverContent = '';
    return popup;
  };

  it('returns true when focus moves to an element inside a calendar popup', () => {
    const popup = createCalendarPopup();
    const dayButton = document.createElement('button');
    popup.append(dayButton);

    expect(isPopoverContent(focusOutEventTo(dayButton))).toBe(true);
  });

  it('returns true when focus moves to the calendar popup itself', () => {
    const popup = createCalendarPopup();

    expect(isPopoverContent(focusOutEventTo(popup))).toBe(true);
  });

  it('returns false when focus moves to an element outside a calendar popup', () => {
    const button = document.createElement('button');

    expect(isPopoverContent(focusOutEventTo(button))).toBe(false);
  });

  it('returns false when focus does not move to another element', () => {
    expect(isPopoverContent(focusOutEventTo(null))).toBe(false);
  });
});
