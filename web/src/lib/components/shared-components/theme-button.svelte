<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { Theme } from '$lib/constants';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import { ThemeSwitcher } from '@immich/ui';

  const handleToggleTheme = () => {
    if (themeManager.theme.system) {
      return;
    }

    themeManager.toggleTheme();
  };
</script>

<svelte:window use:shortcut={{ shortcut: { key: 't', alt: true }, onShortcut: () => handleToggleTheme() }} />

{#if !themeManager.theme.system}
  <ThemeSwitcher
    size="medium"
    color="secondary"
    onChange={(theme) => themeManager.setTheme(theme == 'dark' ? Theme.DARK : Theme.LIGHT)}
  />
{/if}
