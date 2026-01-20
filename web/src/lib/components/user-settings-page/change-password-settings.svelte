<script lang="ts">
  import { handleChangePassword } from '$lib/services/user.service';
  import { Button, Field, PasswordInput, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let password = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let invalidateSessions = $state(false);

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    const success = await handleChangePassword({ password, newPassword, invalidateSessions });
    if (success) {
      password = '';
      newPassword = '';
      confirmPassword = '';
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <Field label={$t('password')} required>
          <PasswordInput bind:value={password} autocomplete="current-password" />
        </Field>

        <Field label={$t('new_password')} required>
          <PasswordInput bind:value={newPassword} autocomplete="new-password" />
        </Field>

        <Field label={$t('confirm_password')} required>
          <PasswordInput bind:value={confirmPassword} autocomplete="new-password" />
        </Field>

        <Field label={$t('log_out_all_devices')} description={$t('change_password_form_log_out_description')} required>
          <Switch bind:checked={invalidateSessions} />
        </Field>

        <div class="flex justify-end">
          <Button
            shape="round"
            type="submit"
            size="small"
            disabled={!(password && newPassword && newPassword === confirmPassword)}>{$t('save')}</Button
          >
        </div>
      </div>
    </form>
  </div>
</section>
