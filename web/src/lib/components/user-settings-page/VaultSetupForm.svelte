<script lang="ts">
  import PinCodeInput from '$lib/components/user-settings-page/PinCodeInput.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { setupVault } from '@immich/sdk';
  import { Button, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onCreated?: () => void;
  }

  let { onCreated }: Props = $props();

  let pin = $state('');
  let confirmPin = $state('');
  let isLoading = $state(false);
  let canSubmit = $derived(pin.length === 6 && pin === confirmPin);

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    await createVault();
  };

  const createVault = async () => {
    isLoading = true;
    try {
      await setupVault({ vaultSetupDto: { pin } });
      toastManager.success($t('vault_setup_success'));
      onCreated?.();
      resetForm();
    } catch (error) {
      handleError(error, $t('errors.unable_to_setup_vault'));
    } finally {
      isLoading = false;
    }
  };

  const resetForm = () => {
    pin = '';
    confirmPin = '';
  };
</script>

<section class="my-4">
  <form autocomplete="off" onsubmit={handleSubmit}>
    <div class="ms-4 mt-4 flex flex-col gap-4">
      <p class="text-sm dark:text-immich-dark-fg">{$t('vault_setup_description')}</p>

      <PinCodeInput label={$t('vault_pin')} bind:value={pin} type="password" />

      <PinCodeInput label={$t('vault_confirm_pin')} bind:value={confirmPin} type="password" />

      <div class="flex justify-end gap-2">
        <Button shape="round" color="secondary" type="button" size="small" onclick={resetForm}>
          {$t('clear')}
        </Button>
        <Button shape="round" type="submit" size="small" loading={isLoading} disabled={!canSubmit}>
          {$t('vault_setup')}
        </Button>
      </div>
    </div>
  </form>
</section>
