import SideBarSection from '$lib/components/sidebar/sidebar.svelte';
import { sidebarStore } from '$lib/stores/sidebar.svelte';
import { render, screen } from '@testing-library/svelte';
import { vi } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    mediaQueryManager: {
      isFullSidebar: false,
    },
  };
});

vi.mock('$lib/stores/media-query-manager.svelte', () => ({
  mediaQueryManager: mocks.mediaQueryManager,
}));

vi.mock('$lib/stores/sidebar.svelte', () => ({
  sidebarStore: {
    isOpen: false,
    reset: vi.fn(),
  },
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.mediaQueryManager.isFullSidebar = false;
    sidebarStore.isOpen = false;
  });

  it.each`
    isFullSidebar | isSidebarOpen | expectedInert
    ${false}      | ${false}      | ${true}
    ${false}      | ${true}       | ${false}
    ${true}       | ${false}      | ${false}
    ${true}       | ${true}       | ${false}
  `(
    'inert is $expectedInert when isFullSidebar=$isFullSidebar and isSidebarOpen=$isSidebarOpen',
    ({ isFullSidebar, isSidebarOpen, expectedInert }) => {
      // setup
      mocks.mediaQueryManager.isFullSidebar = isFullSidebar;
      sidebarStore.isOpen = isSidebarOpen;

      // when
      render(SideBarSection);
      const parent = screen.getByTestId('sidebar-parent');

      // then
      expect(parent.inert).toBe(expectedInert);
    },
  );

  it('should set width when sidebar is expanded', () => {
    // setup
    mocks.mediaQueryManager.isFullSidebar = false;
    sidebarStore.isOpen = true;

    // when
    render(SideBarSection);
    const parent = screen.getByTestId('sidebar-parent');

    // then
    expect(parent.classList).toContain('sidebar:w-64'); // sets the initial width for page load
    expect(parent.classList).toContain('w-[min(100vw,16rem)]');
    expect(parent.classList).toContain('shadow-2xl');
  });

  it('should close the sidebar if it is open on initial render', () => {
    // setup
    mocks.mediaQueryManager.isFullSidebar = false;
    sidebarStore.isOpen = true;

    // when
    render(SideBarSection);

    // then
    expect(sidebarStore.reset).toHaveBeenCalled();
  });
});
