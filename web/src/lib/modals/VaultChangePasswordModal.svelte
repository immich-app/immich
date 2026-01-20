<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { changeVaultPassword } from '@immich/sdk';
  import {
    Button,
    Field,
    HStack,
    Modal,
    ModalBody,
    ModalFooter,
    PasswordInput,
    Stack,
    toastManager,
  } from '@immich/ui';
  import { mdiKeyChange } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (success?: true) => void;
  };

  let { onClose }: Props = $props();

  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let isLoading = $state(false);

  let canSubmit = $derived(
    currentPassword.length > 0 && newPassword.length > 0 && newPassword === confirmPassword,
  );

  const handleChangePassword = async () => {
    isLoading = true;
    try {
      await changeVaultPassword({ vaultChangePasswordDto: { currentPassword, newPassword } });
      toastManager.success($t('vault_password_changed'));
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_vault_password'));
    } finally {
      isLoading = false;
    }
  };

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handleChangePassword();
  };
</script>

<Modal title={$t('vault_change_password')} icon={mdiKeyChange} size="small" {onClose}>
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="change-vault-password-form">
      <Stack gap={4}>
        <Field label={$t('vault_current_password')} required>
          <PasswordInput bind:value={currentPassword} autocomplete="current-password" />
        </Field>

        <Field label={$t('vault_new_password')} required>
          <PasswordInput bind:value={newPassword} autocomplete="new-password" />
        </Field>

        <Field label={$t('vault_confirm_password')} required>
          <PasswordInput bind:value={confirmPassword} autocomplete="new-password" />
        </Field>
      </Stack>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button fullWidth shape="round" color="secondary" onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button
        type="submit"
        form="change-vault-password-form"
        fullWidth
        shape="round"
        disabled={!canSubmit}
        loading={isLoading}
      >
        {$t('save')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
