import TestWrapper from '$lib/components/TestWrapper.svelte';
import SearchBar from '$lib/elements/SearchBar.svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';

type SearchBarWrapperProps = {
  component: typeof SearchBar;
  componentProps: Record<string, unknown>;
};

function renderSearchBar(props: Record<string, unknown>) {
  return render(TestWrapper as Component<SearchBarWrapperProps>, {
    component: SearchBar,
    componentProps: props,
  });
}

describe('SearchBar', () => {
  it('calls onBlurSearch when focus leaves the search bar', async () => {
    const onBlurSearch = vi.fn();
    const outsideButton = document.createElement('button');
    document.body.append(outsideButton);

    renderSearchBar({
      name: 'beach',
      placeholder: 'Search',
      showLoadingSpinner: false,
      onBlurSearch,
    });

    await fireEvent.blur(screen.getByPlaceholderText('Search'), { relatedTarget: outsideButton });

    expect(onBlurSearch).toHaveBeenCalledTimes(1);
    outsideButton.remove();
  });

  it('does not call onBlurSearch when focus moves to an internal control', async () => {
    const onBlurSearch = vi.fn();

    renderSearchBar({
      name: 'beach',
      placeholder: 'Search',
      showLoadingSpinner: false,
      onBlurSearch,
    });

    const input = screen.getByPlaceholderText('Search');
    const clearButton = screen.getByRole('button', { name: /clear/i });

    await fireEvent.blur(input, { relatedTarget: clearButton });

    expect(onBlurSearch).not.toHaveBeenCalled();
  });

  it('does not fail when onBlurSearch is omitted', async () => {
    renderSearchBar({
      name: 'beach',
      placeholder: 'Search',
      showLoadingSpinner: false,
    });

    await fireEvent.blur(screen.getByPlaceholderText('Search'));
  });
});
