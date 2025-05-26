<script lang="ts">
  import { Theme } from '$lib/constants';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import { ThemeSwitcher } from '@immich/ui';
</script>

{#if !themeManager.theme.system}
  <ThemeSwitcher
    size="medium"
    color="secondary"
    onChange={(theme) => themeManager.setTheme(theme == 'dark' ? Theme.DARK : Theme.LIGHT)}
  />
{/if}
