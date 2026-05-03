import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import RepresentativeFaceTile from './representative-face-tile.svelte';

describe('RepresentativeFaceTile', () => {
  it('renders a selectable fixed-size face crop tile', async () => {
    const onSelect = vi.fn();
    render(RepresentativeFaceTile, {
      faceId: 'face-1',
      thumbnailUrl: '/api/people/person-1/faces/face-1/thumbnail',
      selected: false,
      disabled: false,
      onSelect,
    });

    const button = screen.getByRole('button', { name: 'select_representative_face' });
    expect(button).toHaveClass('aspect-square');
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith('face-1');
  });

  it('marks the current representative face', () => {
    render(RepresentativeFaceTile, {
      faceId: 'face-1',
      thumbnailUrl: '/thumb.jpg',
      selected: true,
      disabled: false,
      onSelect: vi.fn(),
    });

    expect(screen.getByTestId('representative-face-selected')).toBeInTheDocument();
  });

  it('does not select while disabled', async () => {
    const onSelect = vi.fn();
    render(RepresentativeFaceTile, {
      faceId: 'face-1',
      thumbnailUrl: '/thumb.jpg',
      selected: false,
      disabled: true,
      onSelect,
    });

    await userEvent.click(screen.getByRole('button', { name: 'select_representative_face' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows a stable pending state while an update is running', () => {
    render(RepresentativeFaceTile, {
      faceId: 'face-1',
      thumbnailUrl: '/thumb.jpg',
      selected: false,
      disabled: false,
      pending: true,
      onSelect: vi.fn(),
    });

    expect(screen.getByRole('button', { name: 'select_representative_face' })).toBeDisabled();
    expect(screen.getByTestId('representative-face-pending')).toHaveClass('absolute', 'inset-0');
  });

  it('keeps the tile size stable when the image fallback renders', async () => {
    const { container } = render(RepresentativeFaceTile, {
      faceId: 'face-1',
      thumbnailUrl: '/broken.jpg',
      selected: false,
      disabled: false,
      onSelect: vi.fn(),
    });

    await fireEvent.error(container.querySelector('img')!);

    expect(container.querySelector('[data-broken-asset]')).toHaveClass('size-full');
  });
});
