<script lang="ts">
  import { fade } from 'svelte/transition';
  import { appearanceSettings } from '../../stores/preferences.store';
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="ml-4 mt-4 flex flex-col gap-4">
      <div class="ml-4">
        <SettingSwitch title="Theme selection" subtitle="Automatically set the theme to light or dark based on your browser's system preference." bind:checked={$appearanceSettings.autoTheme} />
      </div>
    </div>
  </div>
</section>
