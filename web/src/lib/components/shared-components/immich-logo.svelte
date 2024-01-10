<script lang="ts">
  import immichLogoUrl from '$lib/assets/rfstudio_noir.svg';
  import immichLogoWhiteUrl from '$lib/assets/rfstudio_blanc.svg'; // Le chemin du nouveau SVG blanc
  import { colorTheme } from '$lib/stores/preferences.store'; // Importez le store du thème

  export let draggable = false;
</script>

{#if $colorTheme.value === 'dark'}
  <img src={immichLogoWhiteUrl} alt="RF STUDIO Logo" {draggable} {...$$restProps} />
{:else}
  <img src={immichLogoUrl} alt="RF STUDIO Logo" {draggable} {...$$restProps} />
{/if}
