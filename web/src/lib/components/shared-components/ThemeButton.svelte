<script lang="ts">
  import { ThemePreference, ThemeSwitcher, themeManager } from '@immich/ui';
</script>

{#if themeManager.preference !== ThemePreference.System}
  <ThemeSwitcher size="medium" color="secondary" />
{/if}
