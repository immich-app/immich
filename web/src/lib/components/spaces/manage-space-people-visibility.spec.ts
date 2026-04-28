import { sdkMock } from '$lib/__mocks__/sdk.mock';
import type { SharedSpacePersonResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import ManageSpacePeopleVisibilityWrapper from './manage-space-people-visibility.test-wrapper.svelte';

vi.mock('@immich/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@immich/ui')>();
  return {
    ...original,
    toastManager: { primary: vi.fn(), warning: vi.fn() },
  };
});

function makePerson(overrides: Partial<SharedSpacePersonResponseDto> = {}): SharedSpacePersonResponseDto {
  return {
    id: 'person-1',
    name: 'John Doe',
    alias: null,
    assetCount: 5,
    faceCount: 10,
    isHidden: false,
    thumbnailPath: '/thumb.jpg',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    spaceId: 'space-1',
    ...overrides,
  } as SharedSpacePersonResponseDto;
}

describe('ManageSpacePeopleVisibility', () => {
  const onClose = vi.fn();
  const onUpdate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    sdkMock.updateSpacePerson.mockResolvedValue({} as SharedSpacePersonResponseDto);
  });

  function renderComponent(people: SharedSpacePersonResponseDto[] = [makePerson()]) {
    return render(ManageSpacePeopleVisibilityWrapper, {
      props: {
        people,
        spaceId: 'space-1',
        onClose,
        onUpdate,
      },
    });
  }

  it('should render all people including hidden ones', () => {
    const people = [
      makePerson({ id: 'p1', name: 'Alice', isHidden: false }),
      makePerson({ id: 'p2', name: 'Bob', isHidden: true }),
    ];
    renderComponent(people);

    expect(screen.getByTestId('visibility-person-p1')).toBeInTheDocument();
    expect(screen.getByTestId('visibility-person-p2')).toBeInTheDocument();
  });

  it('should show canonical name when alias is present', () => {
    const people = [makePerson({ id: 'p1', name: 'Alice Johnson', alias: 'Mom' })];
    renderComponent(people);

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Mom')).not.toBeInTheDocument();
  });

  it('should show hidden people with aria-pressed true', () => {
    const people = [
      makePerson({ id: 'p1', name: 'Alice', isHidden: false }),
      makePerson({ id: 'p2', name: 'Bob', isHidden: true }),
    ];
    renderComponent(people);

    expect(screen.getByTestId('visibility-person-p1')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('visibility-person-p2')).toHaveAttribute('aria-pressed', 'true');
  });

  it('should toggle hidden state on click', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice', isHidden: false })];
    renderComponent(people);

    const button = screen.getByTestId('visibility-person-p1');
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await fireEvent.click(button);

    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('should call updateSpacePerson for each changed person on save', async () => {
    const people = [
      makePerson({ id: 'p1', name: 'Alice', isHidden: false }),
      makePerson({ id: 'p2', name: 'Bob', isHidden: false }),
    ];
    renderComponent(people);

    // Toggle p1 to hidden
    await fireEvent.click(screen.getByTestId('visibility-person-p1'));

    // Click save
    await fireEvent.click(screen.getByTestId('save-visibility'));

    await waitFor(() => {
      expect(sdkMock.updateSpacePerson).toHaveBeenCalledTimes(1);
      expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'space-1',
          personId: 'p1',
          sharedSpacePersonUpdateDto: { isHidden: true },
        }),
      );
    });
  });

  it('should call onClose when close button is clicked', async () => {
    renderComponent();

    await fireEvent.click(screen.getByTestId('close-visibility'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // --- Pagination tests ---

  it('should render loading text when hasMore and loading are true', () => {
    const people = [makePerson({ id: 'p1' })];
    render(ManageSpacePeopleVisibilityWrapper, {
      props: {
        people,
        spaceId: 'space-1',
        onClose,
        onUpdate,
        hasMore: true,
        loading: true,
        onLoadMore: vi.fn(),
      },
    });

    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('should not render loading text when hasMore is false', () => {
    const people = [makePerson({ id: 'p1' })];
    render(ManageSpacePeopleVisibilityWrapper, {
      props: {
        people,
        spaceId: 'space-1',
        onClose,
        onUpdate,
        hasMore: false,
        onLoadMore: vi.fn(),
      },
    });

    expect(screen.queryByText('loading')).not.toBeInTheDocument();
  });

  it('should preserve toggle overrides when people list grows via pagination', async () => {
    const people = [
      makePerson({ id: 'p1', name: 'Alice', isHidden: false }),
      makePerson({ id: 'p2', name: 'Bob', isHidden: false }),
    ];

    const { rerender } = render(ManageSpacePeopleVisibilityWrapper, {
      props: {
        people,
        spaceId: 'space-1',
        onClose,
        onUpdate,
        hasMore: true,
        onLoadMore: vi.fn(),
      },
    });

    // Toggle p1 to hidden
    await fireEvent.click(screen.getByTestId('visibility-person-p1'));
    expect(screen.getByTestId('visibility-person-p1')).toHaveAttribute('aria-pressed', 'true');

    // Simulate loading more people (rerender with expanded list)
    const morePeople = [...people, makePerson({ id: 'p3', name: 'Charlie', isHidden: false })];
    await rerender({
      people: morePeople,
      spaceId: 'space-1',
      onClose,
      onUpdate,
      hasMore: false,
      onLoadMore: vi.fn(),
    });

    // p1 override should be preserved
    expect(screen.getByTestId('visibility-person-p1')).toHaveAttribute('aria-pressed', 'true');
    // p3 should be visible (not toggled)
    expect(screen.getByTestId('visibility-person-p3')).toHaveAttribute('aria-pressed', 'false');
  });

  it('should save only overrides for loaded people', async () => {
    const people = [makePerson({ id: 'p1', name: 'Alice', isHidden: false })];

    render(ManageSpacePeopleVisibilityWrapper, {
      props: {
        people,
        spaceId: 'space-1',
        onClose,
        onUpdate,
        hasMore: true,
        onLoadMore: vi.fn(),
      },
    });

    // Toggle p1
    await fireEvent.click(screen.getByTestId('visibility-person-p1'));

    // Save
    await fireEvent.click(screen.getByTestId('save-visibility'));

    await waitFor(() => {
      expect(sdkMock.updateSpacePerson).toHaveBeenCalledTimes(1);
      expect(sdkMock.updateSpacePerson).toHaveBeenCalledWith(expect.objectContaining({ personId: 'p1' }));
    });
  });
});
