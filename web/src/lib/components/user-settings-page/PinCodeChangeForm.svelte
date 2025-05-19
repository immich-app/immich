<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import PinCodeInput from '$lib/components/user-settings-page/PinCodeInput.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { changePinCode } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let currentPinCode = $state('');
  let newPinCode = $state('');
  let confirmPinCode = $state('');
  let isLoading = $state(false);
  let canSubmit = $derived(currentPinCode.length === 6 && confirmPinCode.length === 6 && newPinCode === confirmPinCode);

  interface Props {
    onChanged?: () => void;
  }

  let { onChanged }: Props = $props();

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    await handleChangePinCode();
  };

  const handleChangePinCode = async () => {
    isLoading = true;
    try {
      await changePinCode({ pinCodeChangeDto: { pinCode: currentPinCode, newPinCode } });

      resetForm();

      notificationController.show({
        message: $t('pin_code_changed_successfully'),
        type: NotificationType.Info,
      });

      onChanged?.();
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
        <p class="text-dark">{$t('change_pin_code')}</p>
        <PinCodeInput label={$t('current_pin_code')} bind:value={currentPinCode} tabindexStart={1} pinLength={6} />

        <PinCodeInput label={$t('new_pin_code')} bind:value={newPinCode} tabindexStart={7} pinLength={6} />

        <PinCodeInput label={$t('confirm_new_pin_code')} bind:value={confirmPinCode} tabindexStart={13} pinLength={6} />
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
