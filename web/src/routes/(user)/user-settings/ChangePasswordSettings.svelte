<script lang="ts">
  import { changePasswordMutation } from '#lib/queries/auth.query.ts';
  import { Button, Field, PasswordInput, Switch } from '@immich/ui';
  import { createMutation } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const changePassword = createMutation(changePasswordMutation);

  let password = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let invalidateSessions = $state(false);

  const onsubmit = (event: Event) => {
    event.preventDefault();
    changePassword.mutate([{ changePasswordDto: { password, newPassword, invalidateSessions } }], {
      onSuccess: () => {
        password = '';
        newPassword = '';
        confirmPassword = '';
      },
    });
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit}>
      <div class="flex flex-col gap-4 sm:ms-8">
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
