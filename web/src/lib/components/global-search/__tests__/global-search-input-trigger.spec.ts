import { globalSearchManager } from '$lib/managers/global-search-manager.svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import GlobalSearchInputTrigger from '../global-search-input-trigger.svelte';

describe('global-search-input-trigger', () => {
  it('opens cmdk on click and keyboard activation', async () => {
    const openSpy = vi.spyOn(globalSearchManager, 'open').mockImplementation(() => {});
    const user = userEvent.setup();

    render(GlobalSearchInputTrigger);

    const button = screen.getByRole('button');
    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');

    expect(openSpy).toHaveBeenCalledTimes(2);
  });

  it('renders the placeholder and hotkey hint', () => {
    render(GlobalSearchInputTrigger);

    expect(screen.getByTestId('cmdk-input-trigger')).toBeInTheDocument();
    expect(screen.getByText('cmdk_placeholder')).toBeInTheDocument();
    expect(screen.getByText(/^(⌘K|Ctrl\+K)$/)).toBeInTheDocument();
  });
});
