import { mediaQueryManager } from '$lib/stores/media-query-manager.svelte';

class SidebarStore {
  isOpen = $derived.by(() => mediaQueryManager.isFullSidebar);

  /**
   * Reset the sidebar visibility to the default, based on the current screen width.
   */
  reset() {
    this.isOpen = mediaQueryManager.isFullSidebar;
  }

  /**
   * Toggles the sidebar visibility, if available at the current screen width.
   */
  toggle() {
    this.isOpen = mediaQueryManager.isFullSidebar ? true : !this.isOpen;
  }
}

export const sidebarStore = new SidebarStore();
