<script lang="ts">
  import PinCodeInput from '$lib/components/user-settings-page/PinCodeInput.svelte';
  import PinCodeResetModal from '$lib/modals/PinCodeResetModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { changePinCode } from '@immich/sdk';
  import { Button, Heading, modalManager, Text, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

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
      toastManager.success($t('pin_code_changed_successfully'));
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

<section class="my-4">
  <div in:fade={{ duration: 200 }}>
    <form autocomplete="off" onsubmit={handleSubmit} class="mt-6">
      <div class="flex flex-col gap-6 place-items-center place-content-center">
        <Heading>{$t('change_pin_code')}</Heading>
        <PinCodeInput label={$t('current_pin_code')} bind:value={currentPinCode} tabindexStart={1} pinLength={6} />
        <PinCodeInput label={$t('new_pin_code')} bind:value={newPinCode} tabindexStart={7} pinLength={6} />
        <PinCodeInput label={$t('confirm_new_pin_code')} bind:value={confirmPinCode} tabindexStart={13} pinLength={6} />
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
  </div>
</section>
