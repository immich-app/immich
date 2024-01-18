<script lang="ts">
  import SettingSwitch from '../admin-page/settings/setting-switch.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { fade } from 'svelte/transition';
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <div class="ml-4">
          <SettingSwitch
            title="Permanent deletion warning"
            subtitle="Show a warning when permanently deleting assets"
            bind:checked={$showDeleteModal}
          />
        </div>
      </div>
    </form>
  </div>
</section>

<div class="ml-4 mb-4"></div>
