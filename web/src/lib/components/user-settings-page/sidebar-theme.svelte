<script lang="ts">
  import { fade } from 'svelte/transition';
  import { colorTheme } from '../../stores/preferences.store';
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';
  import { browser } from '$app/environment';

  $: checked = $colorTheme === 'system';

  export const handleToggle = () => {
    if (browser) {
      if (checked) {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          $colorTheme = 'dark';
        } else {
          $colorTheme = 'light';
        }
      } else {
        $colorTheme = 'system';
      }
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="ml-4 mt-4 flex flex-col gap-4">
      <div class="ml-4">
        <SettingSwitch
          title="Theme selection"
          subtitle="Automatically set the theme to light or dark based on your browser's system preference"
          bind:checked
          on:toggle={handleToggle}
        />
      </div>
    </div>
  </div>
</section>
