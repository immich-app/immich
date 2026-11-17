<script lang="ts">
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { updateMyPreferencesMutation } from '#lib/queries/user.query.ts';
  import { Button, Field, Switch } from '@immich/ui';
  import { createMutation } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let emailNotificationsEnabled = $state(authManager.preferences.emailNotifications?.enabled ?? true);
  let albumInviteNotificationEnabled = $state(authManager.preferences.emailNotifications?.albumInvite ?? true);
  let albumUpdateNotificationEnabled = $state(authManager.preferences.emailNotifications?.albumUpdate ?? true);

  const updatePreferences = createMutation(() => updateMyPreferencesMutation());

  const handleSave = () =>
    updatePreferences.mutate([
      {
        userPreferencesUpdateDto: {
          emailNotifications: {
            enabled: emailNotificationsEnabled,
            albumInvite: emailNotificationsEnabled && albumInviteNotificationEnabled,
            albumUpdate: emailNotificationsEnabled && albumUpdateNotificationEnabled,
          },
        },
      },
    ]);

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };

  const disabled = $derived(!emailNotificationsEnabled);
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="flex flex-col gap-6 sm:ms-8">
        <Field label={$t('enable')} description={$t('notification_toggle_setting_description')}>
          <Switch bind:checked={emailNotificationsEnabled} />
        </Field>

        <Field label={$t('album_added')} description={$t('album_added_notification_setting_description')} {disabled}>
          <Switch bind:checked={albumInviteNotificationEnabled} />
        </Field>

        <Field label={$t('album_updated')} description={$t('album_updated_setting_description')} {disabled}>
          <Switch bind:checked={albumUpdateNotificationEnabled} />
        </Field>
      </div>

      <div class="mt-4 flex justify-end">
        <Button shape="round" type="submit" size="small" onclick={() => handleSave()}>{$t('save')}</Button>
      </div>
    </form>
  </div>
</section>
