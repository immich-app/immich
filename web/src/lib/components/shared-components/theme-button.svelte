<script lang="ts">
  import { browser } from '$app/environment';
  import { moonPath, sunPath, sunViewBox } from '$lib/assets/svg-paths';
  import { colorTheme } from '$lib/stores/preferences.store';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import Icon from '../elements/icon.svelte';

  const toggleTheme = () => {
    $colorTheme = $colorTheme === 'dark' ? 'light' : 'dark';
  };

  $: {
    if (browser) {
      if ($colorTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    }
  }
</script>

<IconButton on:click={toggleTheme} title="Toggle theme">
  {#if $colorTheme === 'light'}
    <Icon path={moonPath} viewBox={sunViewBox} class="h-6 w-6" />
  {:else}
    <Icon path={sunPath} viewBox={sunViewBox} class="h-6 w-6" />
  {/if}
</IconButton>
