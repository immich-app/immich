<script lang="ts">
  import { browser } from '$app/environment';
  import Moon from '$lib/assets/moon.svelte';
  import Sun from '$lib/assets/sun.svelte';
  import { colorTheme } from '$lib/stores/preferences.store';
  import IconButton from '../elements/buttons/icon-button.svelte';

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
    <Moon />
  {:else}
    <Sun />
  {/if}
</IconButton>
