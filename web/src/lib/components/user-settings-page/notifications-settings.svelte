<script lang="ts">
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { updateMyPreferences } from '@immich/sdk';
  import { Button, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let emailNotificationsEnabled = $state($preferences?.emailNotifications?.enabled ?? true);
  let albumInviteNotificationEnabled = $state($preferences?.emailNotifications?.albumInvite ?? true);
  let albumUpdateNotificationEnabled = $state($preferences?.emailNotifications?.albumUpdate ?? true);

  const handleSave = async () => {
    try {
      const data = await updateMyPreferences({
        userPreferencesUpdateDto: {
          emailNotifications: {
            enabled: emailNotificationsEnabled,
            albumInvite: emailNotificationsEnabled && albumInviteNotificationEnabled,
            albumUpdate: emailNotificationsEnabled && albumUpdateNotificationEnabled,
          },
        },
      });

      $preferences.emailNotifications.enabled = data.emailNotifications.enabled;
      $preferences.emailNotifications.albumInvite = data.emailNotifications.albumInvite;
      $preferences.emailNotifications.albumUpdate = data.emailNotifications.albumUpdate;

      toastManager.success($t('saved_settings'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_settings'));
    }
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <div class="ms-4">
          <SettingSwitch
            title={$t('notification_toggle_setting_description')}
            bind:checked={emailNotificationsEnabled}
          />
        </div>
        <div class="ms-4">
          <SettingSwitch
            title={$t('album_added')}
            subtitle={$t('album_added_notification_setting_description')}
            bind:checked={albumInviteNotificationEnabled}
            disabled={!emailNotificationsEnabled}
          />
        </div>
        <div class="ms-4">
          <SettingSwitch
            title={$t('album_updated')}
            subtitle={$t('album_updated_setting_description')}
            bind:checked={albumUpdateNotificationEnabled}
            disabled={!emailNotificationsEnabled}
          />
        </div>

        <div class="flex justify-end">
          <Button shape="round" type="submit" size="small" onclick={() => handleSave()}>{$t('save')}</Button>
        </div>
      </div>
    </form>
  </div>
</section>
