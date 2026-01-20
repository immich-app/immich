<script lang="ts">
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import VaultChangePasswordModal from '$lib/modals/VaultChangePasswordModal.svelte';
  import VaultDeleteModal from '$lib/modals/VaultDeleteModal.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { lockVault, unlockVault, migrateAssets } from '@immich/sdk';
  import { Button, modalManager, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    isUnlocked: boolean;
    onStatusChange?: () => void;
    onDeleted?: () => void;
  }

  let { isUnlocked, onStatusChange, onDeleted }: Props = $props();

  let password = $state('');
  let isLoading = $state(false);

  const handleUnlock = async (event: Event) => {
    event.preventDefault();
    isLoading = true;
    try {
      await unlockVault({ vaultUnlockDto: { password } });
      toastManager.success($t('vault_unlock_success'));
      password = '';
      onStatusChange?.();
    } catch (error) {
      handleError(error, $t('errors.unable_to_unlock_vault'));
    } finally {
      isLoading = false;
    }
  };

  const handleLock = async () => {
    isLoading = true;
    try {
      await lockVault();
      toastManager.success($t('vault_lock_success'));
      onStatusChange?.();
    } catch (error) {
      handleError(error, $t('errors.unable_to_lock_vault'));
    } finally {
      isLoading = false;
    }
  };

  const handleChangePassword = async () => {
    const success = await modalManager.show(VaultChangePasswordModal, {});
    if (success) {
      onStatusChange?.();
    }
  };

  const handleEncryptAssets = async () => {
    isLoading = true;
    try {
      const result = (await migrateAssets()) as { queuedCount: number };
      toastManager.success($t('vault_migration_queued', { values: { count: result.queuedCount } }));
    } catch (error) {
      handleError(error, $t('errors.unable_to_encrypt_assets'));
    } finally {
      isLoading = false;
    }
  };

  const handleDelete = async () => {
    const success = await modalManager.show(VaultDeleteModal, {});
    if (success) {
      onDeleted?.();
    }
  };
</script>

<section class="my-4">
  <div class="ms-4 mt-4 flex flex-col gap-4">
    {#if isUnlocked}
      <div class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-full bg-green-500"></span>
        <span class="text-sm dark:text-immich-dark-fg">{$t('vault_unlocked')}</span>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400">{$t('vault_auto_lock_info')}</p>

      <div class="flex flex-wrap gap-2">
        <Button shape="round" size="small" onclick={handleLock} loading={isLoading}>
          {$t('vault_lock')}
        </Button>
        <Button shape="round" size="small" color="secondary" onclick={handleChangePassword}>
          {$t('vault_change_password')}
        </Button>
        <Button shape="round" size="small" color="secondary" onclick={handleEncryptAssets} loading={isLoading}>
          {$t('vault_encrypt_assets')}
        </Button>
      </div>

      <div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button shape="round" size="small" color="danger" onclick={handleDelete}>
          {$t('vault_delete')}
        </Button>
      </div>
    {:else}
      <div class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-full bg-yellow-500"></span>
        <span class="text-sm dark:text-immich-dark-fg">{$t('vault_locked')}</span>
      </div>

      <form autocomplete="off" onsubmit={handleUnlock}>
        <div class="flex flex-col gap-4">
          <SettingInputField
            inputType={SettingInputFieldType.PASSWORD}
            label={$t('vault_password')}
            bind:value={password}
            required={true}
            passwordAutocomplete="current-password"
          />

          <div class="flex justify-end">
            <Button shape="round" type="submit" size="small" loading={isLoading} disabled={!password}>
              {$t('vault_unlock')}
            </Button>
          </div>
        </div>
      </form>
    {/if}
  </div>
</section>
