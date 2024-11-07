<script lang="ts">
  import { moonPath, moonViewBox, sunPath, sunViewBox } from '$lib/assets/svg-paths';
  import CircleIconButton, { type Padding } from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { Theme } from '$lib/constants';
  import { colorTheme, handleToggleTheme } from '$lib/stores/preferences.store';
  import { t } from 'svelte-i18n';

  // svelte-ignore reactive_declaration_non_reactive_property
  $: icon = $colorTheme.value === Theme.LIGHT ? moonPath : sunPath;
  // svelte-ignore reactive_declaration_non_reactive_property
  $: viewBox = $colorTheme.value === Theme.LIGHT ? moonViewBox : sunViewBox;
  // svelte-ignore reactive_declaration_non_reactive_property
  $: isDark = $colorTheme.value === Theme.DARK;

  export let padding: Padding = '3';
</script>

{#if !$colorTheme.system}
  <CircleIconButton
    title={$t('toggle_theme')}
    {icon}
    {viewBox}
    role="switch"
    aria-checked={isDark ? 'true' : 'false'}
    on:click={handleToggleTheme}
    {padding}
  />
{/if}
