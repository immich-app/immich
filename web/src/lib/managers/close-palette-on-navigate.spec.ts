import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/managers/global-search-manager.svelte', () => ({
  globalSearchManager: {
    isOpen: false,
    close: vi.fn(),
    consumeKeepOpenOnNextNavigate: vi.fn(() => false),
  },
}));

import { globalSearchManager } from '$lib/managers/global-search-manager.svelte';
import { closePaletteOnNavigate } from './close-palette-on-navigate';

describe('closePaletteOnNavigate', () => {
  beforeEach(() => {
    vi.mocked(globalSearchManager.close).mockReset();
    vi.mocked(globalSearchManager.consumeKeepOpenOnNextNavigate).mockReset();
    vi.mocked(globalSearchManager.consumeKeepOpenOnNextNavigate).mockReturnValue(false);
    globalSearchManager.isOpen = false;
  });

  it('no-ops when palette is closed', () => {
    closePaletteOnNavigate();
    expect(globalSearchManager.close).not.toHaveBeenCalled();
    expect(globalSearchManager.consumeKeepOpenOnNextNavigate).not.toHaveBeenCalled();
  });

  it('calls close when palette is open', () => {
    globalSearchManager.isOpen = true;
    closePaletteOnNavigate();
    expect(globalSearchManager.close).toHaveBeenCalledOnce();
  });

  it('keeps the palette open for the one immediate search-state navigate it initiated', () => {
    globalSearchManager.isOpen = true;
    vi.mocked(globalSearchManager.consumeKeepOpenOnNextNavigate).mockReturnValueOnce(true);

    closePaletteOnNavigate();

    expect(globalSearchManager.close).not.toHaveBeenCalled();
  });

  it('calls close on consecutive replaceState-style firings when still open', () => {
    // afterNavigate fires unconditionally, including for same-URL replaceState.
    // This is the drift guard: it must always call close() if isOpen is true.
    globalSearchManager.isOpen = true;
    closePaletteOnNavigate();
    closePaletteOnNavigate();
    expect(globalSearchManager.close).toHaveBeenCalledTimes(2);
  });
});
