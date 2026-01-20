<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { setupVault } from '@immich/sdk';
  import { Button, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onCreated?: () => void;
  }

  let { onCreated }: Props = $props();

  let password = $state('');
  let confirmPassword = $state('');
  let isLoading = $state(false);
  let canSubmit = $derived(password.length > 0 && password === confirmPassword);

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    await createVault();
  };

  const createVault = async () => {
    isLoading = true;
    try {
      await setupVault({ vaultSetupDto: { password } });
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
    password = '';
    confirmPassword = '';
  };
</script>

<section class="my-4">
  <form autocomplete="off" onsubmit={handleSubmit}>
    <div class="ms-4 mt-4 flex flex-col gap-4">
      <p class="text-sm dark:text-immich-dark-fg">{$t('vault_setup_description')}</p>

      <SettingInputField
        inputType={SettingInputFieldType.PASSWORD}
        label={$t('vault_password')}
        bind:value={password}
        required={true}
        passwordAutocomplete="new-password"
      />

      <SettingInputField
        inputType={SettingInputFieldType.PASSWORD}
        label={$t('vault_confirm_password')}
        bind:value={confirmPassword}
        required={true}
        passwordAutocomplete="new-password"
      />

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
