<script lang="ts">
  import { themeManager, ThemePreference, ThemeSwitcher } from '@immich/ui';
</script>

{#if themeManager.preference !== ThemePreference.System}
  <ThemeSwitcher size="medium" color="secondary" />
{/if}
