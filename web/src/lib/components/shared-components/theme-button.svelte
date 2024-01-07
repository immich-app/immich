<script lang="ts">
  import { moonPath, moonViewBox, sunPath, sunViewBox } from '$lib/assets/svg-paths';
  import { Theme } from '$lib/constants';
  import { colorTheme, handleToggleTheme } from '$lib/stores/preferences.store';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import Icon from '../elements/icon.svelte';
</script>

{#if !$colorTheme.system}
  <IconButton on:click={handleToggleTheme} title="Toggle theme">
    {#if $colorTheme.value === Theme.LIGHT}
      <Icon path={moonPath} viewBox={sunViewBox} class="h-6 w-6" />
    {:else}
      <Icon path={sunPath} viewBox={moonViewBox} class="h-6 w-6" />
    {/if}
  </IconButton>
{/if}
