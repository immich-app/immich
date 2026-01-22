<script lang="ts">
  import VaultManageForm from '$lib/components/user-settings-page/VaultManageForm.svelte';
  import VaultSetupForm from '$lib/components/user-settings-page/VaultSetupForm.svelte';
  import { getVaultStatus } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let hasVault = $state(false);
  let isUnlocked = $state(false);
  let isLoading = $state(true);

  onMount(async () => {
    await refreshStatus();
  });

  const refreshStatus = async () => {
    isLoading = true;
    try {
      const status = await getVaultStatus();
      hasVault = (status as { hasVault: boolean }).hasVault;
      isUnlocked = (status as { isUnlocked: boolean }).isUnlocked;
    } catch {
      hasVault = false;
      isUnlocked = false;
    } finally {
      isLoading = false;
    }
  };

  const handleVaultCreated = () => {
    hasVault = true;
    isUnlocked = true;
  };

  const handleVaultDeleted = () => {
    hasVault = false;
    isUnlocked = false;
  };
</script>

<section>
  {#if isLoading}
    <div class="ms-4 mt-4 flex items-center gap-2">
      <div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-immich-primary"></div>
      <span class="text-sm dark:text-immich-dark-fg">Loading...</span>
    </div>
  {:else if hasVault}
    <div in:fade={{ duration: 200 }}>
      <VaultManageForm {isUnlocked} onStatusChange={refreshStatus} onDeleted={handleVaultDeleted} />
    </div>
  {:else}
    <div in:fade={{ duration: 200 }}>
      <VaultSetupForm onCreated={handleVaultCreated} />
    </div>
  {/if}
</section>
