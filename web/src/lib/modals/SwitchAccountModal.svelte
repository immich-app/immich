<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { getSavedAccounts, removeSavedAccount, type SavedAccount } from '$lib/stores/saved-accounts.store';
  import { user } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { Button, Icon, IconButton, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiAccountPlus, mdiAlertCircleOutline, mdiCheck, mdiClose, mdiLoading, mdiRefresh } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let accounts: SavedAccount[] = $state([]);
  let loading = $state(true);
  let switchingAccountId: string | null = $state(null);
  let error = $state('');

  onMount(async () => {
    await loadAccounts();
  });

  const loadAccounts = async () => {
    loading = true;
    error = '';
    try {
      accounts = await getSavedAccounts();
    } catch (error_) {
      console.error('Failed to load saved accounts:', error_);
      error = $t('switch_account_failed');
    } finally {
      loading = false;
    }
  };

  const handleSwitchAccount = async (account: SavedAccount) => {
    if (account.id === $user?.id) {
      onClose();
      return;
    }

    switchingAccountId = account.id;
    error = '';

    try {
      const success = await authManager.switchToAccount(account.id);

      if (success) {
        onClose();
      } else {
        await loadAccounts();
        error = $t('session_expired');
      }
    } catch (error_) {
      handleError(error_, $t('switch_account_failed'));
    } finally {
      switchingAccountId = null;
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    try {
      await removeSavedAccount(accountId);
      await loadAccounts();
    } catch (error_) {
      handleError(error_, $t('remove_account_failed'));
    }
  };

  const handleReauthenticate = async (account: SavedAccount) => {
    onClose();
    await goto(`${AppRoute.AUTH_LOGIN}?reauth=${account.id}`);
  };

  const handleAddAccount = async () => {
    onClose();
    await goto(`${AppRoute.AUTH_LOGIN}?addAccount=true`);
  };

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase() || '?';
  };

  const hasAccounts = $derived(accounts.length > 0);
</script>

<Modal title={$t('switch_account')} {onClose} size="small">
  <ModalBody>
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <Icon icon={mdiLoading} size="2em" class="animate-spin text-primary" />
      </div>
    {:else if error && !hasAccounts}
      <div class="flex flex-col items-center justify-center py-8 text-center">
        <Icon icon={mdiAlertCircleOutline} size="2em" class="text-red-500 mb-2" />
        <p class="text-sm text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    {:else if !hasAccounts}
      <div class="flex flex-col items-center justify-center py-8 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">{$t('no_saved_accounts')}</p>
      </div>
    {:else}
      <div class="immich-scrollbar max-h-[400px] overflow-y-auto">
        {#each accounts as account (account.id)}
          {@const isCurrent = account.id === $user?.id}
          {@const isSwitching = switchingAccountId === account.id}

          <div
            class="group flex items-center gap-3 px-3 py-3 rounded-xl transition-colors
              {isCurrent ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
          >
            <!-- Avatar -->
            <button
              type="button"
              onclick={() => handleSwitchAccount(account)}
              disabled={isSwitching || account.isExpired}
              class="flex items-center gap-3 flex-1 min-w-0 text-start disabled:cursor-not-allowed"
            >
              <div
                class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-medium flex-shrink-0"
              >
                {#if isSwitching}
                  <Icon icon={mdiLoading} size="1.2em" class="animate-spin" />
                {:else}
                  {getInitial(account.name)}
                {/if}
              </div>

              <!-- Account Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {account.name}
                  </p>
                  {#if isCurrent}
                    <span class="flex items-center gap-1 text-xs text-primary font-medium">
                      <Icon icon={mdiCheck} size="0.9em" />
                      {$t('current')}
                    </span>
                  {/if}
                  {#if account.isExpired}
                    <span class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <Icon icon={mdiAlertCircleOutline} size="0.9em" />
                      {$t('session_expired')}
                    </span>
                  {/if}
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {account.email}
                </p>
              </div>
            </button>

            <!-- Actions -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {#if account.isExpired}
                <IconButton
                  icon={mdiRefresh}
                  size="small"
                  color="primary"
                  aria-label={$t('re_authenticate')}
                  onclick={() => handleReauthenticate(account)}
                />
              {/if}
              {#if !isCurrent}
                <IconButton
                  icon={mdiClose}
                  size="small"
                  color="secondary"
                  aria-label={$t('remove_account')}
                  onclick={() => handleRemoveAccount(account.id)}
                />
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if error}
        <div
          class="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-sm text-red-700 dark:text-red-300 text-center"
        >
          {error}
        </div>
      {/if}
    {/if}
  </ModalBody>

  <ModalFooter>
    <Button shape="round" fullWidth color="secondary" leadingIcon={mdiAccountPlus} onclick={handleAddAccount}>
      {$t('add_account')}
    </Button>
  </ModalFooter>
</Modal>
