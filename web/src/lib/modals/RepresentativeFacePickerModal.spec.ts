import type { PersonFacePageResponseDto, PersonFaceResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import RepresentativeFacePickerModal from './RepresentativeFacePickerModal.svelte';

vi.mock('@immich/ui', async (importOriginal: () => Promise<typeof import('@immich/ui')>) => {
  const actual = await importOriginal();
  return {
    ...actual,
    toastManager: {
      danger: vi.fn(),
      primary: vi.fn(),
    },
  };
});

const makeFace = (overrides: Partial<PersonFaceResponseDto> = {}): PersonFaceResponseDto => ({
  id: 'face-1',
  assetId: 'asset-1',
  imageWidth: 100,
  imageHeight: 100,
  boundingBoxX1: 0,
  boundingBoxY1: 0,
  boundingBoxX2: 50,
  boundingBoxY2: 50,
  isRepresentative: true,
  ...overrides,
});

const makePage = (overrides: Partial<PersonFacePageResponseDto> = {}): PersonFacePageResponseDto => ({
  faces: [
    makeFace(),
    makeFace({
      id: 'face-2',
      assetId: 'asset-2',
      boundingBoxX1: 10,
      boundingBoxY1: 10,
      boundingBoxX2: 60,
      boundingBoxY2: 60,
      isRepresentative: false,
    }),
  ],
  hasNextPage: false,
  ...overrides,
});

const getThumbnailUrl = (face: PersonFaceResponseDto) => `/thumbnail/${face.id}`;

describe('RepresentativeFacePickerModal', () => {
  it('shows a stable skeleton grid while loading', () => {
    render(RepresentativeFacePickerModal, {
      title: 'select_representative_face',
      loadFaces: vi.fn(() => new Promise<PersonFacePageResponseDto>(() => {})),
      updateFace: vi.fn(),
      getThumbnailUrl,
      onClose: vi.fn(),
    });

    expect(screen.getAllByTestId('representative-face-skeleton')).toHaveLength(18);
  });

  it('loads faces and updates the exact selected face', async () => {
    const loadFaces = vi.fn().mockResolvedValue(makePage());
    const updateFace = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(RepresentativeFacePickerModal, {
      title: 'select_representative_face',
      loadFaces,
      updateFace,
      getThumbnailUrl,
      onClose,
    });

    await waitFor(() => expect(loadFaces).toHaveBeenCalledWith({ page: 1, size: 50 }));
    await screen.findAllByRole('button', { name: 'select_representative_face' });
    expect(screen.getByTestId('representative-face-grid')).toHaveClass('grid-cols-[repeat(auto-fill,88px)]');
    await userEvent.click(screen.getAllByRole('button', { name: 'select_representative_face' })[1]);

    expect(updateFace).toHaveBeenCalledWith('face-2');
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it('shows load more when another page exists', async () => {
    const loadFaces = vi
      .fn()
      .mockResolvedValueOnce(makePage({ hasNextPage: true }))
      .mockResolvedValueOnce(makePage({ faces: [makeFace({ id: 'face-3' })], hasNextPage: false }));

    render(RepresentativeFacePickerModal, {
      title: 'select_representative_face',
      loadFaces,
      updateFace: vi.fn(),
      getThumbnailUrl,
      onClose: vi.fn(),
    });

    await userEvent.click(await screen.findByRole('button', { name: 'load_more' }));

    expect(loadFaces).toHaveBeenCalledWith({ page: 2, size: 50 });
  });

  it('shows reset only when a reset callback is provided', async () => {
    render(RepresentativeFacePickerModal, {
      title: 'select_representative_face',
      loadFaces: vi.fn().mockResolvedValue(makePage()),
      updateFace: vi.fn(),
      resetFace: vi.fn(),
      getThumbnailUrl,
      onClose: vi.fn(),
    });

    expect(await screen.findByRole('button', { name: 'use_inherited_thumbnail' })).toBeInTheDocument();
  });

  it('shows an empty state when no faces are selectable', async () => {
    render(RepresentativeFacePickerModal, {
      title: 'select_representative_face',
      loadFaces: vi.fn().mockResolvedValue({ faces: [], hasNextPage: false }),
      updateFace: vi.fn(),
      getThumbnailUrl,
      onClose: vi.fn(),
    });

    expect(await screen.findByText('no_faces_found')).toBeInTheDocument();
  });

  it('shows an error state when the initial face load fails', async () => {
    render(RepresentativeFacePickerModal, {
      title: 'select_representative_face',
      loadFaces: vi.fn().mockRejectedValue(new Error('network failed')),
      updateFace: vi.fn(),
      getThumbnailUrl,
      onClose: vi.fn(),
    });

    expect(await screen.findByText('errors.unable_to_load_faces')).toBeInTheDocument();
  });

  it('disables all picker actions while an update is pending', async () => {
    let resolveUpdate!: () => void;
    const updateFace = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    const onClose = vi.fn();

    render(RepresentativeFacePickerModal, {
      title: 'select_representative_face',
      loadFaces: vi.fn().mockResolvedValue(makePage()),
      updateFace,
      resetFace: vi.fn(),
      getThumbnailUrl,
      onClose,
    });

    const faceButtons = await screen.findAllByRole('button', { name: 'select_representative_face' });
    await userEvent.click(faceButtons[1]);

    expect(screen.getByRole('button', { name: 'use_inherited_thumbnail' })).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: 'select_representative_face' })) {
      expect(button).toBeDisabled();
    }

    resolveUpdate();
    await waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
  });

  it('renders read-only when updates are not allowed', async () => {
    render(RepresentativeFacePickerModal, {
      title: 'select_representative_face',
      loadFaces: vi.fn().mockResolvedValue(makePage()),
      updateFace: vi.fn(),
      resetFace: vi.fn(),
      getThumbnailUrl,
      onClose: vi.fn(),
      canUpdate: false,
    });

    for (const button of await screen.findAllByRole('button', { name: 'select_representative_face' })) {
      expect(button).toBeDisabled();
    }
    expect(screen.queryByRole('button', { name: 'use_inherited_thumbnail' })).not.toBeInTheDocument();
  });
});
