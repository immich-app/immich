<script lang="ts">
  import { fade } from 'svelte/transition';
  import { colorTheme } from '../../stores/preferences.store';
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';
  import { thumbnailsZoom } from '$lib/stores/user.store';

  export const handleToggle = () => {
    $colorTheme.system = !$colorTheme.system;
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="ml-4 mt-4 flex flex-col gap-4">
      <div class="ml-4">
        <SettingSwitch
          title="Theme selection"
          subtitle="Automatically set the theme to light or dark based on your browser's system preference"
          bind:checked={$colorTheme.system}
          on:toggle={handleToggle}
        />
      </div>
      <div class="ml-4">
        <label for="thumbnails-zoom">Thumbnails zoom</label>
        <input type="range" id="thumbnails-zoom" min="0.5" max="2" step="0.1" bind:value={$thumbnailsZoom} />
        <label for="thumbnails-zoom">{$thumbnailsZoom}</label>
      </div>
    </div>
  </div>
</section>
