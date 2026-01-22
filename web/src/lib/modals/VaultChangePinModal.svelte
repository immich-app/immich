<script lang="ts">
  import PinCodeInput from '$lib/components/user-settings-page/PinCodeInput.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { changeVaultPin } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter, Stack, toastManager } from '@immich/ui';
  import { mdiKeyChange } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (success?: true) => void;
  };

  let { onClose }: Props = $props();

  let currentPin = $state('');
  let newPin = $state('');
  let confirmPin = $state('');
  let isLoading = $state(false);

  let canSubmit = $derived(currentPin.length === 6 && newPin.length === 6 && newPin === confirmPin);

  const handleChangePin = async () => {
    isLoading = true;
    try {
      await changeVaultPin({ vaultChangePinDto: { currentPin, newPin } });
      toastManager.success($t('vault_pin_changed'));
      onClose(true);
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_vault_pin'));
    } finally {
      isLoading = false;
    }
  };

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handleChangePin();
  };
</script>

<Modal title={$t('vault_change_pin')} icon={mdiKeyChange} size="small" {onClose}>
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="change-vault-pin-form">
      <Stack gap={4}>
        <PinCodeInput label={$t('vault_current_pin')} bind:value={currentPin} type="password" />

        <PinCodeInput label={$t('vault_new_pin')} bind:value={newPin} type="password" />

        <PinCodeInput label={$t('vault_confirm_pin')} bind:value={confirmPin} type="password" />
      </Stack>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button fullWidth shape="round" color="secondary" onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button
        type="submit"
        form="change-vault-pin-form"
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
