import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
import { sidebarStore } from '$lib/stores/sidebar.svelte';
import { render, screen } from '@testing-library/svelte';
import { vi } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    mobileDevice: {
      isFullSidebar: false,
    },
  };
});

vi.mock('$lib/stores/mobile-device.svelte', () => ({
  mobileDevice: mocks.mobileDevice,
}));

vi.mock('$lib/stores/sidebar.svelte', () => ({
  sidebarStore: {
    isOpen: false,
    reset: vi.fn(),
  },
}));

describe('SideBarSection component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.mobileDevice.isFullSidebar = false;
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
      mocks.mobileDevice.isFullSidebar = isFullSidebar;
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
    mocks.mobileDevice.isFullSidebar = false;
    sidebarStore.isOpen = true;

    // when
    render(SideBarSection);
    const parent = screen.getByTestId('sidebar-parent');

    // then
    expect(parent.classList).toContain('sidebar:w-[16rem]'); // sets the initial width for page load
    expect(parent.classList).toContain('w-[min(100vw,16rem)]');
    expect(parent.classList).toContain('shadow-2xl');
  });

  it('should close the sidebar if it is open on initial render', () => {
    // setup
    mocks.mobileDevice.isFullSidebar = false;
    sidebarStore.isOpen = true;

    // when
    render(SideBarSection);

    // then
    expect(sidebarStore.reset).toHaveBeenCalled();
  });
});
