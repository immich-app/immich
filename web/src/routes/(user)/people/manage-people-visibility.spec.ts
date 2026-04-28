import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { personFactory } from '@test-data/factories/person-factory';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ManagePeopleVisibilityWrapper from './manage-people-visibility.test-wrapper.svelte';

describe('ManagePeopleVisibility component', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.clearAllMocks();
    sdkMock.updatePeople.mockResolvedValue([]);
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

  it('saves global visibility through updatePeople and maps updated hidden state back to global people', async () => {
    const onClose = vi.fn();
    const onUpdate = vi.fn();
    const loadNextPage = vi.fn();
    const people = [
      personFactory.build({ id: 'a', name: 'Alice', isHidden: false }),
      personFactory.build({ id: 'b', name: 'Bob', isHidden: true }),
      personFactory.build({ id: 'c', name: 'Charlie', isHidden: false }),
    ];
    sdkMock.updatePeople.mockResolvedValueOnce([
      { id: 'a', success: true },
      { id: 'b', success: false },
    ]);
    const { container } = render(ManagePeopleVisibilityWrapper, {
      props: {
        people,
        totalPeopleCount: 3,
        onClose,
        onUpdate,
        loadNextPage,
      },
    });
    const user = userEvent.setup();
    const personButtons = container.querySelectorAll('button[aria-pressed]');

    await user.click(personButtons[0]);
    await user.click(personButtons[1]);
    await user.click(screen.getByTestId('save-visibility'));

    await waitFor(() => {
      expect(sdkMock.updatePeople).toHaveBeenCalledWith({
        peopleUpdateDto: {
          people: [
            { id: 'a', isHidden: true },
            { id: 'b', isHidden: false },
          ],
        },
      });
    });
    expect(onUpdate).toHaveBeenCalledWith([
      { ...people[0], isHidden: true },
      { ...people[1], isHidden: false },
      people[2],
    ]);
    const updatedPeople = onUpdate.mock.calls[0][0];
    expect(updatedPeople).toBe(people);
    expect(updatedPeople[0]).toBe(people[0]);
    expect(updatedPeople[1]).toBe(people[1]);
    expect(updatedPeople[2]).toBe(people[2]);
    expect(people.map(({ isHidden }) => isHidden)).toEqual([true, false, false]);
  });
});
