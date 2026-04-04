<script lang="ts">
  import PinCodeResetModal from '$lib/modals/PinCodeResetModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { changePinCode } from '@immich/sdk';
  import { Button, Field, Heading, modalManager, PinInput, Text, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let currentPinCode = $state('');
  let newPinCode = $state('');
  let confirmPinCode = $state('');
  let isLoading = $state(false);
  let canSubmit = $derived(currentPinCode.length === 6 && confirmPinCode.length === 6 && newPinCode === confirmPinCode);

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    await handleChangePinCode();
  };

  const handleChangePinCode = async () => {
    isLoading = true;
    try {
      await changePinCode({ pinCodeChangeDto: { pinCode: currentPinCode, newPinCode } });
      resetForm();
      toastManager.primary($t('pin_code_changed_successfully'));
    } catch (error) {
      handleError(error, $t('unable_to_change_pin_code'));
    } finally {
      isLoading = false;
    }
  };

  const resetForm = () => {
    currentPinCode = '';
    newPinCode = '';
    confirmPinCode = '';
  };
</script>

<form autocomplete="off" onsubmit={handleSubmit}>
  <div class="flex flex-col gap-6 place-items-center place-content-center">
    <Heading>{$t('change_pin_code')}</Heading>
    <Field label={$t('current_pin_code')}>
      <PinInput bind:value={currentPinCode} />
    </Field>
    <Field label={$t('new_pin_code')}>
      <PinInput bind:value={newPinCode} />
    </Field>
    <Field label={$t('confirm_new_pin_code')}>
      <PinInput bind:value={confirmPinCode} />
    </Field>
    <button type="button" onclick={() => modalManager.show(PinCodeResetModal, {})}>
      <Text color="muted" class="underline" size="small">{$t('forgot_pin_code_question')}</Text>
    </button>
  </div>

  <div class="flex justify-end gap-2 mt-4">
    <Button shape="round" color="secondary" type="button" size="small" onclick={resetForm}>
      {$t('clear')}
    </Button>
    <Button shape="round" type="submit" size="small" loading={isLoading} disabled={!canSubmit}>
      {$t('save')}
    </Button>
  </div>
</form>
