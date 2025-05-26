<script lang="ts">
  import { moonPath, moonViewBox, sunPath, sunViewBox } from '$lib/assets/svg-paths';
  import CircleIconButton, { type Padding } from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import { t } from 'svelte-i18n';

  let icon = $derived(themeManager.isDark ? sunPath : moonPath);
  let viewBox = $derived(themeManager.isDark ? sunViewBox : moonViewBox);

  interface Props {
    padding?: Padding;
  }

  let { padding = '3' }: Props = $props();
</script>

{#if !themeManager.theme.system}
  <CircleIconButton
    title={$t('toggle_theme')}
    {icon}
    {viewBox}
    role="switch"
    aria-checked={themeManager.isDark ? 'true' : 'false'}
    onclick={() => themeManager.toggleTheme()}
    {padding}
  />
{/if}
