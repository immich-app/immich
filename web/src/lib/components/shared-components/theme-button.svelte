<script lang="ts">
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import { IconButton } from '@immich/ui';
  import { mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js';
  import { t } from 'svelte-i18n';

  let icon = $derived(themeManager.isDark ? mdiWhiteBalanceSunny : mdiWeatherNight);
</script>

{#if !themeManager.theme.system}
  <IconButton
    aria-label={$t('toggle_theme')}
    {icon}
    role="switch"
    aria-checked={themeManager.isDark ? 'true' : 'false'}
    onclick={() => themeManager.toggleTheme()}
    color="secondary"
    variant="ghost"
    shape="round"
  />
{/if}
