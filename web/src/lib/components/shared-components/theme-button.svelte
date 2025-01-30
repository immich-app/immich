<script lang="ts">
  import { moonPath, moonViewBox, sunPath, sunViewBox } from '$lib/assets/svg-paths';
  import CircleIconButton, { type Padding } from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { Theme } from '$lib/constants';
  import { colorTheme, handleToggleTheme } from '$lib/stores/preferences.store';
  import { Button } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let icon = $derived($colorTheme.value === Theme.LIGHT ? moonPath : sunPath);
  let viewBox = $derived($colorTheme.value === Theme.LIGHT ? moonViewBox : sunViewBox);
  let isDark = $derived($colorTheme.value === Theme.DARK);

  interface Props {
    padding?: Padding;
    showText?: boolean;
  }

  let { padding = '3', showText = false }: Props = $props();
</script>

{#if !$colorTheme.system}
  {#if showText}
    <Button
      leadingIcon={icon}
      variant="outline"
      color="secondary"
      size="small"
      shape="round"
      onclick={handleToggleTheme}
      role="switch"
      aria-checked={isDark ? 'true' : 'false'}
    >
      {$t('toggle_theme')}
    </Button>
  {:else}
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
{/if}
