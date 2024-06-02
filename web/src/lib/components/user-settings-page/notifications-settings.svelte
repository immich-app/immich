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

  let emailNotificationsEnabled = $preferences?.emailNotifications?.enabled ?? true;
  let albumInviteNotificationEnabled = $preferences?.emailNotifications?.albumInvite ?? true;
  let albumUpdateNotificationEnabled = $preferences?.emailNotifications?.albumUpdate ?? true;

  const handleSave = async () => {
    try {
      const data = await updateMyPreferences({
        userPreferencesUpdateDto: {
          emailNotifications: {
            enabled: emailNotificationsEnabled,
            albumInvite: emailNotificationsEnabled ? albumInviteNotificationEnabled : false,
            albumUpdate: emailNotificationsEnabled ? albumUpdateNotificationEnabled : false,
          },
        },
      });

      $preferences.emailNotifications.enabled = data.emailNotifications.enabled;
      $preferences.emailNotifications.albumInvite = data.emailNotifications.albumInvite;
      $preferences.emailNotifications.albumUpdate = data.emailNotifications.albumUpdate;

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
            title="Enable"
            subtitle="Toggle email notifications"
            bind:checked={emailNotificationsEnabled}
          />
        </div>
        <div class="ml-4">
          <SettingSwitch
            title="Album Added"
            subtitle="Receive an email notification when you are added to a shared album"
            bind:checked={albumInviteNotificationEnabled}
            disabled={!emailNotificationsEnabled}
          />
        </div>
        <div class="ml-4">
          <SettingSwitch
            title="Album Updated"
            subtitle="Receive an email notification when a shared album has new assets"
            bind:checked={albumUpdateNotificationEnabled}
            disabled={!emailNotificationsEnabled}
          />
        </div>

        <div class="flex justify-end">
          <Button type="submit" size="sm" on:click={() => handleSave()}>Save</Button>
        </div>
      </div>
    </form>
  </div>
</section>
