<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { changePassword } from '@immich/sdk';
  import { Button, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let password = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let invalidateSessions = $state(false);

  const handleChangePassword = async () => {
    try {
      await changePassword({ changePasswordDto: { password, newPassword, invalidateSessions } });

      toastManager.success($t('updated_password'));

      password = '';
      newPassword = '';
      confirmPassword = '';
    } catch (error) {
      console.error('Error [user-profile] [changePassword]', error);
      handleError(error, $t('errors.unable_to_change_password'));
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
        <SettingInputField
          inputType={SettingInputFieldType.PASSWORD}
          label={$t('password')}
          bind:value={password}
          required={true}
          passwordAutocomplete="current-password"
        />

        <SettingInputField
          inputType={SettingInputFieldType.PASSWORD}
          label={$t('new_password')}
          bind:value={newPassword}
          required={true}
          passwordAutocomplete="new-password"
        />

        <SettingInputField
          inputType={SettingInputFieldType.PASSWORD}
          label={$t('confirm_password')}
          bind:value={confirmPassword}
          required={true}
          passwordAutocomplete="new-password"
        />

        <SettingSwitch
          title={$t('log_out_all_devices')}
          subtitle={$t('change_password_form_log_out_description')}
          bind:checked={invalidateSessions}
        />

        <div class="flex justify-end">
          <Button
            shape="round"
            type="submit"
            size="small"
            disabled={!(password && newPassword && newPassword === confirmPassword)}
            onclick={() => handleChangePassword()}>{$t('save')}</Button
          >
        </div>
      </div>
    </form>
  </div>
</section>
