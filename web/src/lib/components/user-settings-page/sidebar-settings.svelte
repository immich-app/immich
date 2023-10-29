<script lang="ts">
  import { fade } from 'svelte/transition';
  import { sidebarSettings } from '../../stores/preferences.store';
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="ml-4 mt-4 flex flex-col gap-4">
      <div class="ml-4">
        <SettingSwitch title="People" subtitle="Display a link to People" bind:checked={$sidebarSettings.people} />
      </div>
      <div class="ml-4">
        <SettingSwitch title="Sharing" subtitle="Display a link to Sharing" bind:checked={$sidebarSettings.sharing} />
      </div>
    </div>
  </div>
</section>
