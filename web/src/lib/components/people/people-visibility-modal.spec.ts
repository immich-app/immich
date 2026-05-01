import { handleError } from '$lib/utils/handle-error';
import { toastManager } from '@immich/ui';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { VisibilityPerson } from './people-types';
import PeopleVisibilityModalWrapper from './people-visibility-modal.test-wrapper.svelte';

vi.mock('@immich/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@immich/ui')>();
  return {
    ...original,
    toastManager: { primary: vi.fn(), warning: vi.fn() },
  };
});

vi.mock('$lib/utils/handle-error', () => ({
  handleError: vi.fn(),
}));

vi.mock('svelte-i18n', async () => {
  const { readable } = await import('svelte/store');
  const formatMessage = (key: string, options?: { values?: Record<string, unknown> }) => {
    const count = options?.values?.count;
    return count === undefined ? key : `${key} ${count}`;
  };

  return {
    locale: readable('en-US'),
    t: readable(formatMessage),
  };
});

const makePerson = (overrides: Partial<VisibilityPerson> = {}): VisibilityPerson => ({
  id: 'person-1',
  displayName: 'John Doe',
  thumbnailUrl: '/api/people/person-1/thumbnail',
  isHidden: false,
  ...overrides,
});

describe('PeopleVisibilityModal', () => {
  const onClose = vi.fn();
  const onUpdate = vi.fn();
  const saveVisibilityChanges = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    saveVisibilityChanges.mockResolvedValue({ successCount: 1, failCount: 0 });
  });

  const renderComponent = (people: VisibilityPerson[] = [makePerson()]) =>
    render(PeopleVisibilityModalWrapper, {
      props: {
        people,
        onClose,
        onUpdate,
        saveVisibilityChanges,
      },
    });

  it('preserves local hidden overrides when people are appended', async () => {
    const people = [
      makePerson({ id: 'p1', displayName: 'Alice', isHidden: false }),
      makePerson({ id: 'p2', displayName: 'Bob', isHidden: false }),
    ];
    const { rerender } = renderComponent(people);

    await fireEvent.click(screen.getByTestId('visibility-person-p1'));
    expect(screen.getByTestId('visibility-person-p1')).toHaveAttribute('aria-pressed', 'true');

    await rerender({
      people: [...people, makePerson({ id: 'p3', displayName: 'Charlie', isHidden: false })],
      onClose,
      onUpdate,
      saveVisibilityChanges,
    });

    expect(screen.getByTestId('visibility-person-p1')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('visibility-person-p2')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('visibility-person-p3')).toHaveAttribute('aria-pressed', 'false');
  });

  it('saves only changed people and returns updated local people via onUpdate', async () => {
    const people = [
      makePerson({ id: 'p1', displayName: 'Alice', isHidden: false }),
      makePerson({ id: 'p2', displayName: 'Bob', isHidden: true }),
      makePerson({ id: 'p3', displayName: 'Charlie', isHidden: false }),
    ];
    saveVisibilityChanges.mockResolvedValueOnce({ successCount: 2, failCount: 0 });
    renderComponent(people);

    await fireEvent.click(screen.getByTestId('visibility-person-p1'));
    await fireEvent.click(screen.getByTestId('visibility-person-p2'));
    await fireEvent.click(screen.getByTestId('save-visibility'));

    await waitFor(() => expect(saveVisibilityChanges).toHaveBeenCalledTimes(1));
    expect(saveVisibilityChanges).toHaveBeenCalledWith([
      { id: 'p1', isHidden: true },
      { id: 'p2', isHidden: false },
    ]);
    expect(onUpdate).toHaveBeenCalledWith([
      { ...people[0], isHidden: true },
      { ...people[1], isHidden: false },
      people[2],
    ]);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(toastManager.primary).toHaveBeenCalledWith('visibility_changed 2');
    expect(toastManager.warning).not.toHaveBeenCalled();
  });

  it('applies local overrides and closes after partial save failures', async () => {
    const people = [
      makePerson({ id: 'p1', displayName: 'Alice', isHidden: false }),
      makePerson({ id: 'p2', displayName: 'Bob', isHidden: true }),
      makePerson({ id: 'p3', displayName: 'Charlie', isHidden: false }),
    ];
    saveVisibilityChanges.mockResolvedValueOnce({ successCount: 1, failCount: 1 });
    renderComponent(people);

    await fireEvent.click(screen.getByTestId('visibility-person-p1'));
    await fireEvent.click(screen.getByTestId('visibility-person-p2'));
    await fireEvent.click(screen.getByTestId('save-visibility'));

    await waitFor(() => expect(saveVisibilityChanges).toHaveBeenCalledTimes(1));
    expect(saveVisibilityChanges).toHaveBeenCalledWith([
      { id: 'p1', isHidden: true },
      { id: 'p2', isHidden: false },
    ]);
    expect(toastManager.warning).toHaveBeenCalledWith('errors.unable_to_change_visibility 1');
    expect(toastManager.primary).toHaveBeenCalledWith('visibility_changed 1');
    expect(onUpdate).toHaveBeenCalledWith([
      { ...people[0], isHidden: true },
      { ...people[1], isHidden: false },
      people[2],
    ]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('treats displayName as the named-person value for hide unnamed', async () => {
    const people = [
      makePerson({ id: 'named', displayName: 'Space Alias', isHidden: false }),
      makePerson({ id: 'unnamed', displayName: '', isHidden: false }),
    ];
    renderComponent(people);

    await fireEvent.click(screen.getByLabelText('hide_unnamed_people'));

    expect(screen.getByTestId('visibility-person-named')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('visibility-person-unnamed')).toHaveAttribute('aria-pressed', 'true');
  });

  it('resets local overrides without saving changes', async () => {
    renderComponent([makePerson({ id: 'p1', displayName: 'Alice', isHidden: false })]);

    await fireEvent.click(screen.getByTestId('visibility-person-p1'));
    expect(screen.getByTestId('visibility-person-p1')).toHaveAttribute('aria-pressed', 'true');

    await fireEvent.click(screen.getByLabelText('reset_people_visibility'));
    expect(screen.getByTestId('visibility-person-p1')).toHaveAttribute('aria-pressed', 'false');

    await fireEvent.click(screen.getByTestId('save-visibility'));

    expect(saveVisibilityChanges).not.toHaveBeenCalled();
    expect(onUpdate).toHaveBeenCalledWith([makePerson({ id: 'p1', displayName: 'Alice', isHidden: false })]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose from the close button and handles save errors', async () => {
    const error = new Error('save failed');
    saveVisibilityChanges.mockRejectedValue(error);
    renderComponent([makePerson({ id: 'p1', displayName: 'Alice', isHidden: false })]);

    await fireEvent.click(screen.getByTestId('close-visibility'));
    expect(onClose).toHaveBeenCalledTimes(1);

    await fireEvent.click(screen.getByTestId('visibility-person-p1'));
    await fireEvent.click(screen.getByTestId('save-visibility'));

    await waitFor(() =>
      expect(handleError).toHaveBeenCalledWith(error, expect.stringContaining('errors.unable_to_change_visibility')),
    );
  });

  it('does not assign thumbnail src for deferred offscreen visibility modal people', () => {
    class NeverIntersectingObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }
    vi.stubGlobal('IntersectionObserver', NeverIntersectingObserver);

    render(PeopleVisibilityModalWrapper, {
      props: {
        people: [
          makePerson({ id: 'p1', displayName: 'Alice', thumbnailUrl: '/api/people/p1/thumbnail' }),
          makePerson({ id: 'p2', displayName: 'Bob', thumbnailUrl: '/api/people/p2/thumbnail' }),
        ],
        onClose,
        onUpdate,
        saveVisibilityChanges,
        deferThumbnails: true,
      },
    });

    expect(screen.getByTitle('Alice')).not.toHaveAttribute('src');
    expect(screen.getByTitle('Bob')).not.toHaveAttribute('src');

    vi.unstubAllGlobals();
  });
});
