<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import PincodeInput from '$lib/components/user-settings-page/PincodeInput.svelte';
  import { changePincode, createPincode, getAuthStatus } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import type { HttpError } from '@sveltejs/kit';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let hasPincode = $state(false);
  let currentPincode = $state('');
  let newPincode = $state('');
  let confirmPincode = $state('');
  let isLoading = $state(false);

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (hasPincode) {
      await handleChangePincode();
      return;
    }

    await handleCreatePincode();
  };

  onMount(async () => {
    const authStatus = await getAuthStatus();
    hasPincode = authStatus.hasPincode;
  });

  const canSubmit = $derived(
    (hasPincode ? currentPincode.length === 6 : true) &&
      newPincode.length === 6 &&
      confirmPincode.length === 6 &&
      newPincode === confirmPincode,
  );

  const handleCreatePincode = async () => {
    isLoading = true;
    try {
      await createPincode({
        createPincodeDto: {
          pincode: newPincode,
        },
      });

      resetForm();

      notificationController.show({
        message: $t('pincode_created_successfully'),
        type: NotificationType.Info,
      });
    } catch (error) {
      console.error('Error [createPincode]', error);
      notificationController.show({
        message: (error as HttpError)?.body?.message || $t('unable_to_create_pincode'),
        type: NotificationType.Error,
      });
    } finally {
      isLoading = false;
      hasPincode = true;
    }
  };

  const handleChangePincode = async () => {
    isLoading = true;
    try {
      await changePincode({
        changePincodeDto: {
          pincode: currentPincode,
          newPincode,
        },
      });

      resetForm();

      notificationController.show({
        message: $t('pincode_changed_successfully'),
        type: NotificationType.Info,
      });
    } catch (error) {
      console.error('Error [changePincode]', error);
      notificationController.show({
        message: (error as HttpError)?.body?.message || $t('unable_to_change_pincode'),
        type: NotificationType.Error,
      });
    } finally {
      isLoading = false;
    }
  };

  const resetForm = () => {
    currentPincode = '';
    newPincode = '';
    confirmPincode = '';
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 200 }}>
    <form autocomplete="off" onsubmit={onSubmit} class="mt-6">
      <div class="flex flex-col gap-6 place-items-center place-content-center">
        {#if hasPincode}
          <p class="text-dark">Change PIN code</p>
          <PincodeInput label={$t('current_pincode')} bind:value={currentPincode} tabindexStart={1} pinLength={6} />

          <PincodeInput label={$t('new_pincode')} bind:value={newPincode} tabindexStart={7} pinLength={6} />

          <PincodeInput
            label={$t('confirm_new_pincode')}
            bind:value={confirmPincode}
            tabindexStart={13}
            pinLength={6}
          />
        {:else}
          <p class="text-dark">Create new PIN code</p>
          <PincodeInput label={$t('new_pincode')} bind:value={newPincode} tabindexStart={1} pinLength={6} />

          <PincodeInput label={$t('confirm_new_pincode')} bind:value={confirmPincode} tabindexStart={7} pinLength={6} />
        {/if}
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <Button shape="round" color="secondary" type="button" size="small" onclick={resetForm}>
          {$t('clear')}
        </Button>
        <Button shape="round" type="submit" size="small" loading={isLoading} disabled={!canSubmit}>
          {hasPincode ? $t('save') : $t('create_pincode')}
        </Button>
      </div>
    </form>
  </div>
</section>
