import { themeManager } from '$lib/managers/theme-manager.svelte';
import type { Action } from 'svelte/action';

/**
 * Ensures the 'dark' theme is used while the element is mounted, which makes
 * Safari 26 darken the browser UI. More "cinema" like UX for AssetViewer.
 */
export const forceDarkTheme: Action = (_) => {
  document.body.classList.add('dark');

  return {
    destroy() {
      if (!themeManager.isDark) {
        document.body.classList.remove('dark');
      }
    },
  };
};
