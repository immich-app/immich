import { mobileDevice } from '$lib/stores/mobile-device.svelte';

class SidebarStore {
  isOpen = $derived.by(() => mobileDevice.isFullSidebar);

  /**
   * Reset the sidebar visibility to the default, based on the current screen width.
   */
  reset() {
    this.isOpen = mobileDevice.isFullSidebar;
  }

  /**
   * Toggles the sidebar visibility, if available at the current screen width.
   */
  toggle() {
    this.isOpen = mobileDevice.isFullSidebar ? true : !this.isOpen;
  }
}

export const sidebarStore = new SidebarStore();
