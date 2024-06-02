<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { updateMyPreferences } from '@immich/sdk';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';

  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { preferences } from '$lib/stores/user.store';
  import Button from '../elements/buttons/button.svelte';

  let memoriesEnabled = $preferences?.memories?.enabled ?? false;

  const handleSave = async () => {
    try {
      const data = await updateMyPreferences({ userPreferencesUpdateDto: { memories: { enabled: memoriesEnabled } } });
      $preferences.memories.enabled = data.memories.enabled;

      notificationController.show({ message: 'Saved settings', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to update settings');
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <div class="ml-4">
          <SettingSwitch
            title="Time-based memories"
            subtitle="Photos from previous years"
            bind:checked={memoriesEnabled}
          />
        </div>
        <div class="flex justify-end">
          <Button type="submit" size="sm" on:click={() => handleSave()}>Save</Button>
        </div>
      </div>
    </form>
  </div>
</section>
