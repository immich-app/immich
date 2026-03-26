import FavoritesFilter from '$lib/components/filter-panel/favorites-filter.svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

describe('FavoritesFilter', () => {
  it('should render All and Favorites buttons', () => {
    render(FavoritesFilter, { props: { selected: undefined, onToggle: vi.fn() } });
    expect(screen.getByTestId('favorites-all')).toBeInTheDocument();
    expect(screen.getByTestId('favorites-only')).toBeInTheDocument();
  });

  it('should highlight All when selected is undefined', () => {
    render(FavoritesFilter, { props: { selected: undefined, onToggle: vi.fn() } });
    const allBtn = screen.getByTestId('favorites-all');
    expect(allBtn.className).toContain('border-immich-primary');
  });

  it('should highlight Favorites when selected is true', () => {
    render(FavoritesFilter, { props: { selected: true, onToggle: vi.fn() } });
    const favBtn = screen.getByTestId('favorites-only');
    expect(favBtn.className).toContain('border-immich-primary');
  });

  it('should call onToggle with true when Favorites clicked', () => {
    const onToggle = vi.fn();
    render(FavoritesFilter, { props: { selected: undefined, onToggle } });
    screen.getByTestId('favorites-only').click();
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('should call onToggle with undefined when All clicked', () => {
    const onToggle = vi.fn();
    render(FavoritesFilter, { props: { selected: true, onToggle } });
    screen.getByTestId('favorites-all').click();
    expect(onToggle).toHaveBeenCalledWith(undefined);
  });
});
