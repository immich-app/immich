import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { personFactory } from '@test-data/factories/person-factory';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ManagePeopleVisibilityWrapper from './manage-people-visibility.test-wrapper.svelte';

describe('ManagePeopleVisibility component', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });

  it('keeps toggled hidden state when loading more people', async () => {
    const onClose = vi.fn();
    const onUpdate = vi.fn();
    const loadNextPage = vi.fn();

    const [personA, personB, personC] = [
      personFactory.build({ id: 'a', isHidden: false }),
      personFactory.build({ id: 'b', isHidden: false }),
      personFactory.build({ id: 'c', isHidden: true }),
    ];

    const { container, rerender } = render(ManagePeopleVisibilityWrapper, {
      props: {
        people: [personA, personB],
        totalPeopleCount: 3,
        onClose,
        onUpdate,
        loadNextPage,
      },
    });
    const user = userEvent.setup();

    let personButtons = container.querySelectorAll('button[aria-pressed]');
    expect(personButtons).toHaveLength(2);

    await user.click(personButtons[0]);
    expect(personButtons[0].getAttribute('aria-pressed')).toBe('true');

    await rerender({
      people: [personA, personB, personC],
      totalPeopleCount: 3,
      onClose,
      onUpdate,
      loadNextPage,
    });

    personButtons = container.querySelectorAll('button[aria-pressed]');
    expect(personButtons).toHaveLength(3);
    expect(personButtons[0].getAttribute('aria-pressed')).toBe('true');
    expect(personButtons[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('shows newly loaded hidden people as hidden', async () => {
    const onClose = vi.fn();
    const onUpdate = vi.fn();
    const loadNextPage = vi.fn();

    const [personA, personB, personC] = [
      personFactory.build({ id: 'a', isHidden: false }),
      personFactory.build({ id: 'b', isHidden: false }),
      personFactory.build({ id: 'c', isHidden: true }),
    ];

    const { container, rerender } = render(ManagePeopleVisibilityWrapper, {
      props: {
        people: [personA, personB],
        totalPeopleCount: 3,
        onClose,
        onUpdate,
        loadNextPage,
      },
    });

    await rerender({
      people: [personA, personB, personC],
      totalPeopleCount: 3,
      onClose,
      onUpdate,
      loadNextPage,
    });

    const personButtons = container.querySelectorAll('button[aria-pressed]');
    expect(personButtons).toHaveLength(3);
    expect(personButtons[2].getAttribute('aria-pressed')).toBe('true');
  });
});
