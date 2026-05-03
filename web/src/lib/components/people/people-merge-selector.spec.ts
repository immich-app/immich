import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { modalManager, toastManager } from '@immich/ui';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Component } from 'svelte';
import PeopleMergeSelector from './people-merge-selector.svelte';

type TestPerson = {
  id: string;
  name: string;
};

vi.mock('$lib/components/assets/thumbnail/image-thumbnail.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/image-thumbnail.stub.svelte');
  return { default: MockComponent };
});

vi.mock('@immich/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@immich/ui')>();
  return {
    ...original,
    modalManager: { showDialog: vi.fn() },
    toastManager: { warning: vi.fn() },
  };
});

const getDisplayName = (person: TestPerson) => person.name;
const getThumbnailUrl = (person: TestPerson) => `/people/${person.id}/thumbnail`;

function renderSelector(props: Record<string, unknown>) {
  return render(TestWrapper as Component<{ component: typeof PeopleMergeSelector; componentProps: typeof props }>, {
    component: PeopleMergeSelector,
    componentProps: props,
  });
}

describe('PeopleMergeSelector', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
    Element.prototype.getAnimations = vi.fn().mockReturnValue([]);
    vi.mocked(modalManager.showDialog).mockResolvedValue(true);
  });

  it('loads merge candidates and merges selected people into the current target', async () => {
    const target = { id: 'p1', name: 'Alice' };
    const bob = { id: 'p2', name: 'Bob' };
    const carol = { id: 'p3', name: 'Carol' };
    const loadPeople = vi.fn().mockResolvedValue([target, bob, carol]);
    const mergePeople = vi.fn().mockResolvedValue(target);
    const onMerge = vi.fn();

    renderSelector({
      person: target,
      getDisplayName,
      getThumbnailUrl,
      loadPeople,
      mergePeople,
      onBack: vi.fn(),
      onMerge,
    });

    await waitFor(() => expect(loadPeople).toHaveBeenCalledWith(false, target));
    await userEvent.click(await screen.findByRole('button', { name: 'Bob' }));
    await userEvent.click(screen.getByRole('button', { name: 'merge' }));

    await waitFor(() => {
      expect(mergePeople).toHaveBeenCalledWith(target, [bob]);
    });
    expect(onMerge).toHaveBeenCalledWith(target);
  });

  it('auto-promotes a named candidate without triggering the manual swap callback', async () => {
    const unnamed = { id: 'p1', name: '' };
    const named = { id: 'p2', name: 'Alice' };
    const loadPeople = vi.fn().mockResolvedValue([unnamed, named]);
    const mergePeople = vi.fn().mockResolvedValue(named);
    const onSwapPerson = vi.fn();

    renderSelector({
      person: unnamed,
      getDisplayName,
      getThumbnailUrl,
      loadPeople,
      mergePeople,
      onBack: vi.fn(),
      onMerge: vi.fn(),
      onSwapPerson,
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Alice' }));

    expect(onSwapPerson).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'merge' }));

    await waitFor(() => {
      expect(mergePeople).toHaveBeenCalledWith(named, [unnamed]);
    });
  });

  it('calls the manual swap callback when the swap direction button is clicked', async () => {
    const target = { id: 'p1', name: 'Alice' };
    const candidate = { id: 'p2', name: 'Bob' };
    const loadPeople = vi.fn().mockResolvedValue([target, candidate]);
    const onSwapPerson = vi.fn();

    renderSelector({
      person: target,
      getDisplayName,
      getThumbnailUrl,
      loadPeople,
      mergePeople: vi.fn(),
      onBack: vi.fn(),
      onMerge: vi.fn(),
      onSwapPerson,
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Bob' }));
    await userEvent.click(screen.getByRole('button', { name: 'swap_merge_direction' }));

    expect(onSwapPerson).toHaveBeenCalledWith(candidate);
  });

  it('reloads candidates with similarity sorting when enabled', async () => {
    const target = { id: 'p1', name: 'Alice' };
    const loadPeople = vi.fn().mockResolvedValue([]);

    renderSelector({
      person: target,
      getDisplayName,
      getThumbnailUrl,
      loadPeople,
      mergePeople: vi.fn(),
      onBack: vi.fn(),
      onMerge: vi.fn(),
    });

    await waitFor(() => expect(loadPeople).toHaveBeenCalledWith(false, target));
    await userEvent.click(screen.getByRole('button', { name: 'sort_people_by_similarity' }));

    await waitFor(() => expect(loadPeople).toHaveBeenLastCalledWith(true, target));
  });

  it('warns instead of selecting more people than the merge limit', async () => {
    const target = { id: 'p1', name: 'Target' };
    const first = { id: 'p2', name: 'First' };
    const second = { id: 'p3', name: 'Second' };
    const loadPeople = vi.fn().mockResolvedValue([first, second]);

    renderSelector({
      person: target,
      getDisplayName,
      getThumbnailUrl,
      loadPeople,
      mergePeople: vi.fn(),
      onBack: vi.fn(),
      onMerge: vi.fn(),
      mergeLimit: 1,
    });

    await userEvent.click(await screen.findByRole('button', { name: 'First' }));
    await userEvent.click(screen.getByRole('button', { name: 'Second' }));

    expect(toastManager.warning).toHaveBeenCalledWith('merge_people_limit');
  });
});
