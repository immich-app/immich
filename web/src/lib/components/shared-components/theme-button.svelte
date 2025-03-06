<script lang="ts">
  import { moonPath, moonViewBox, sunPath, sunViewBox } from '$lib/assets/svg-paths';
  import CircleIconButton, { type Padding } from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { Theme } from '$lib/constants';
  import { colorTheme, handleToggleTheme } from '$lib/stores/preferences.store';
  import { t } from 'svelte-i18n';

  let icon = $derived($colorTheme.value === Theme.LIGHT ? moonPath : sunPath);
  let viewBox = $derived($colorTheme.value === Theme.LIGHT ? moonViewBox : sunViewBox);
  let isDark = $derived($colorTheme.value === Theme.DARK);

  interface Props {
    padding?: Padding;
  }

  let { padding = '3' }: Props = $props();
</script>

{#if !$colorTheme.system}
  <CircleIconButton
    title={$t('toggle_theme')}
    {icon}
    {viewBox}
    role="switch"
    aria-checked={isDark ? 'true' : 'false'}
    onclick={handleToggleTheme}
    {padding}
  />
{/if}
