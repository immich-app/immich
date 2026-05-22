<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { setupPinCode } from '@immich/sdk';
  import { Button, Field, Heading, PinInput, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onCreated?: (pinCode: string) => void;
    showLabel?: boolean;
  }

  let { onCreated, showLabel = true }: Props = $props();

  let newPinCode = $state('');
  let confirmPinCode = $state('');
  let isLoading = $state(false);
  let canSubmit = $derived(confirmPinCode.length === 6 && newPinCode === confirmPinCode);

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    await createPinCode();
  };

  const createPinCode = async () => {
    isLoading = true;
    try {
      await setupPinCode({ pinCodeSetupDto: { pinCode: newPinCode } });
      toastManager.primary($t('pin_code_setup_successfully'));
      onCreated?.(newPinCode);
      resetForm();
    } catch (error) {
      handleError(error, $t('unable_to_setup_pin_code'));
    } finally {
      isLoading = false;
    }
  };

  const resetForm = () => {
    newPinCode = '';
    confirmPinCode = '';
  };
</script>

<form autocomplete="off" onsubmit={handleSubmit}>
  <div class="flex flex-col gap-6 place-items-center place-content-center">
    {#if showLabel}
      <Heading>{$t('setup_pin_code')}</Heading>
    {/if}
    <Field label={$t('new_pin_code')}>
      <PinInput bind:value={newPinCode} />
    </Field>
    <Field label={$t('confirm_new_pin_code')}>
      <PinInput bind:value={confirmPinCode} />
    </Field>
  </div>

  <div class="flex justify-end gap-2 mt-4">
    <Button shape="round" color="secondary" type="button" size="small" onclick={resetForm}>
      {$t('clear')}
    </Button>
    <Button shape="round" type="submit" size="small" loading={isLoading} disabled={!canSubmit}>
      {$t('create')}
    </Button>
  </div>
</form>
