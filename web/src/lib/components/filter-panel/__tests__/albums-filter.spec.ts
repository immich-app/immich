import AlbumsFilter from '$lib/components/filter-panel/albums-filter.svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

describe('AlbumsFilter', () => {
  it('should render All and Has no album buttons', () => {
    render(AlbumsFilter, { props: { selected: undefined, onToggle: vi.fn() } });

    expect(screen.getByTestId('albums-all')).toBeInTheDocument();
    expect(screen.getByTestId('albums-none')).toBeInTheDocument();
  });

  it('should highlight All when selected is undefined', () => {
    render(AlbumsFilter, { props: { selected: undefined, onToggle: vi.fn() } });

    expect(screen.getByTestId('albums-all').className).toContain('border-immich-primary');
  });

  it('should highlight Has no album when selected is true', () => {
    render(AlbumsFilter, { props: { selected: true, onToggle: vi.fn() } });

    expect(screen.getByTestId('albums-none').className).toContain('border-immich-primary');
  });

  it('should call onToggle with true when Has no album is clicked', () => {
    const onToggle = vi.fn();
    render(AlbumsFilter, { props: { selected: undefined, onToggle } });

    screen.getByTestId('albums-none').click();

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('should call onToggle with undefined when All is clicked', () => {
    const onToggle = vi.fn();
    render(AlbumsFilter, { props: { selected: true, onToggle } });

    screen.getByTestId('albums-all').click();

    expect(onToggle).toHaveBeenCalledWith(undefined);
  });
});
