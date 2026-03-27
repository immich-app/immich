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
});
