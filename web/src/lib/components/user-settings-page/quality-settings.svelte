<script lang="ts">
  import { fade } from 'svelte/transition';
  import { alwaysLoadOriginalFile } from '../../stores/preferences.store';
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';

  const handleToggle = () => {
    $alwaysLoadOriginalFile = !$alwaysLoadOriginalFile;
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="ml-4 mt-4 flex flex-col gap-4">
      <div class="ml-4">
        <SettingSwitch
          title="Display original photos"
          subtitle="Prefer to display the original photo when viewing an asset rather than thumbnails when the original asset is web-compatible. This may result in slower photo display speeds."
          bind:checked={$alwaysLoadOriginalFile}
          on:toggle={handleToggle}
        />
      </div>
    </div>
  </div>
</section>
