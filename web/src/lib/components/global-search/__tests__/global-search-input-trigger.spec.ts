import { globalSearchManager } from '$lib/managers/global-search-manager.svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GlobalSearchInputTrigger from '../global-search-input-trigger.svelte';

const { mockPage } = vi.hoisted(() => ({
  mockPage: {
    url: new URL('https://gallery.test/photos'),
    route: { id: null as string | null },
    params: {} as Record<string, string>,
  },
}));

vi.mock('$app/state', () => ({ page: mockPage }));

describe('global-search-input-trigger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalSearchManager.close();
    mockPage.url = new URL('https://gallery.test/photos');
    mockPage.route.id = null;
    mockPage.params = {};
  });

  it('opens a dropdown from an editable search field', async () => {
    const openSpy = vi.spyOn(globalSearchManager, 'open');
    const user = userEvent.setup();

    render(GlobalSearchInputTrigger);

    const input = screen.getByRole('combobox', { name: 'cmdk_placeholder' });
    await user.click(input);
    await user.type(input, 'mountain');

    expect(openSpy).toHaveBeenCalledWith('dropdown');
    expect(input).toHaveValue('mountain');
    expect(document.querySelector('[data-cmdk-dropdown-panel]')).not.toBeNull();
  });

  it('keeps the dropdown panel closed until the search field receives focus', async () => {
    const user = userEvent.setup();

    render(GlobalSearchInputTrigger);

    expect(document.querySelector('[data-cmdk-dropdown-panel]')).toBeNull();

    await user.click(screen.getByRole('combobox', { name: 'cmdk_placeholder' }));

    expect(document.querySelector('[data-cmdk-dropdown-panel]')).not.toBeNull();
    expect(globalSearchManager.presentation).toBe('dropdown');
  });

  it('shows the committed page query while the search field is closed', () => {
    mockPage.url = new URL('https://gallery.test/photos?q=mountains');

    render(GlobalSearchInputTrigger);

    expect(screen.getByRole('combobox', { name: 'cmdk_placeholder' })).toHaveValue('mountains');
    expect(document.querySelector('[data-cmdk-dropdown-panel]')).toBeNull();
  });

  it('pressing Enter after clearing the top search field clears the committed search', async () => {
    mockPage.url = new URL('https://gallery.test/photos?q=mountains');
    const activateSearchSpy = vi.spyOn(globalSearchManager, 'activateSearch').mockImplementation(() => {});
    const user = userEvent.setup();

    render(GlobalSearchInputTrigger);

    const input = screen.getByRole('combobox', { name: 'cmdk_placeholder' });
    expect(input).toHaveValue('mountains');

    await user.click(input);
    await user.clear(input);
    await user.keyboard('{Enter}');

    expect(activateSearchSpy).toHaveBeenCalledWith('');
  });

  it('closes the dropdown on outside click', async () => {
    const user = userEvent.setup();

    render(GlobalSearchInputTrigger);

    await user.click(screen.getByRole('combobox', { name: 'cmdk_placeholder' }));
    expect(document.querySelector('[data-cmdk-dropdown-panel]')).not.toBeNull();

    await user.click(document.body);

    expect(document.querySelector('[data-cmdk-dropdown-panel]')).toBeNull();
    expect(globalSearchManager.isOpen).toBe(false);
  });

  it('does not let the dropdown outside-click listener close the modal presentation', async () => {
    const user = userEvent.setup();

    render(GlobalSearchInputTrigger);

    globalSearchManager.open('modal');
    await user.click(document.body);

    expect(globalSearchManager.isOpen).toBe(true);
    expect(globalSearchManager.presentation).toBe('modal');
  });

  it('switches from dropdown to modal presentation on the keyboard launcher shortcut', async () => {
    const user = userEvent.setup();

    render(GlobalSearchInputTrigger);

    const input = screen.getByRole('combobox', { name: 'cmdk_placeholder' });
    await user.click(input);
    expect(globalSearchManager.presentation).toBe('dropdown');

    await user.keyboard('{Control>}k{/Control}');

    expect(globalSearchManager.isOpen).toBe(true);
    expect(globalSearchManager.presentation).toBe('modal');
    expect(document.querySelector('[data-cmdk-dropdown-panel]')).toBeNull();
  });

  it('renders the placeholder and hotkey hint', () => {
    render(GlobalSearchInputTrigger);

    expect(screen.getByTestId('cmdk-input-trigger')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'cmdk_placeholder' })).toBeInTheDocument();
    expect(screen.getByText(/^(⌘K|Ctrl\+K)$/)).toBeInTheDocument();
  });

  it('shows the sort dropdown on the photos page when a query is active', () => {
    mockPage.url = new URL('https://gallery.test/photos?q=mountain&sort=asc');

    render(GlobalSearchInputTrigger);

    expect(screen.getByTestId('search-sort-btn')).toHaveAttribute('aria-label', 'Oldest first');
  });

  it('shows the sort dropdown on the photos page before a query exists', () => {
    mockPage.url = new URL('https://gallery.test/photos');

    render(GlobalSearchInputTrigger);

    expect(screen.getByTestId('search-sort-btn')).toHaveAttribute('aria-label', 'Newest first');
  });

  it('shows the sort dropdown on a space detail page before a query exists', () => {
    mockPage.url = new URL('https://gallery.test/spaces/space-123');

    render(GlobalSearchInputTrigger);

    expect(screen.getByTestId('search-sort-btn')).toHaveAttribute('aria-label', 'Newest first');
  });

  it('shows relevance on searchable pages with an active query', () => {
    mockPage.url = new URL('https://gallery.test/spaces/space-123?q=mountain');

    render(GlobalSearchInputTrigger);

    expect(screen.getByTestId('search-sort-btn')).toHaveAttribute('aria-label', 'Relevance');
  });

  it('hides the sort dropdown on non-searchable pages', () => {
    mockPage.url = new URL('https://gallery.test/albums');

    render(GlobalSearchInputTrigger);

    expect(screen.queryByTestId('search-sort-btn')).not.toBeInTheDocument();
  });

  it('applies sort immediately from the top-bar trigger', async () => {
    mockPage.url = new URL('https://gallery.test/photos?q=mountain');
    const applySortSpy = vi.spyOn(globalSearchManager, 'applySearchSort').mockResolvedValue();
    const user = userEvent.setup();

    render(GlobalSearchInputTrigger);

    await user.click(screen.getByTestId('search-sort-btn'));
    await user.click(screen.getByText('Newest first'));

    expect(applySortSpy).toHaveBeenCalledWith('desc', 'mountain');
  });

  it('applies sort immediately before a query exists', async () => {
    mockPage.url = new URL('https://gallery.test/spaces/space-123');
    const applySortSpy = vi.spyOn(globalSearchManager, 'applySearchSort').mockResolvedValue();
    const user = userEvent.setup();

    render(GlobalSearchInputTrigger);

    await user.click(screen.getByTestId('search-sort-btn'));
    await user.click(screen.getByText('Oldest first'));

    expect(applySortSpy).toHaveBeenCalledWith('asc', '');
  });
});
