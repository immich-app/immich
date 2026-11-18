import StarRating from '#lib/elements/StarRating.svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, unmount } from 'vitest-browser-svelte';

describe('StarRating component', () => {
  beforeAll(async () => {
    register('en', () =>
      Promise.resolve({
        rating: 'Rating',
        rating_count: '{count, plural, one {# star} other {# stars}}',
        rating_clear: 'Clear rating',
      }),
    );
    await init({ fallbackLocale: 'en' });
    await waitLocale('en');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the onRating callback from when the user clicked after the debounce', async () => {
    vi.useFakeTimers();

    const firstOnRating = vi.fn();
    const secondOnRating = vi.fn();

    const screen = await render(StarRating, {
      rating: null,
      onRating: firstOnRating,
    });

    await screen.getByTestId('star').nth(2).click();
    await screen.rerender({ rating: null, onRating: secondOnRating });
    await vi.advanceTimersByTimeAsync(300);

    expect(firstOnRating).toHaveBeenCalledWith(3);
    expect(secondOnRating).not.toHaveBeenCalled();
  });

  it('applies a pending rating to the captured callback when unmounted before the debounce', async () => {
    vi.useFakeTimers();

    const onRating = vi.fn();

    const screen = await render(StarRating, {
      rating: null,
      onRating,
    });

    await screen.getByTestId('star').nth(2).click();
  const { component } = screen;
    unmount(component);
    await vi.advanceTimersByTimeAsync(0);

    expect(onRating).toHaveBeenCalledWith(3);
  });

  it('resets the displayed selection when the rating prop changes', async () => {
    const screen = await render(StarRating, {
      rating: 4,
      onRating: () => {},
    });

    await expect.element(screen.getByTestId('star-container')).toBeInTheDocument();
    await screen.rerender({ rating: null, onRating: () => {} });

    const stars = screen.getByTestId('star');
    await expect.element(stars.nth(3).locator('..').locator('svg')).toBeInTheDocument();
  });
});