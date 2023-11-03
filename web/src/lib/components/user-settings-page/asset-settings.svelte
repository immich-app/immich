<script lang="ts">
  import { fade } from 'svelte/transition';
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';
  import { loopVideoSetting } from '$lib/stores/preferences.store';
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="ml-4 mt-4 flex flex-col gap-4">
      <div class="ml-4">
        <SettingSwitch
          title="Loop videos"
          subtitle="Enable automatically loop videos."
          bind:checked={$loopVideoSetting}
        />
      </div>
    </div>
  </div>
</section>
