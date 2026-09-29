<script lang="ts">
  import { ImmichBackupsSidebarItem } from '@futo-org/backups-orchestrator-ui';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import PurchaseInfo from './PurchaseInfo.svelte';
  import ServerStatus from './ServerStatus.svelte';
  import StorageSpace from './StorageSpace.svelte';
  import { Route } from '$lib/route';
  import { hideBackupsReminder } from '$lib/stores/preferences.store';
</script>

<div class="ms-4 mt-auto overflow-hidden rounded-lg">
  <StorageSpace />

  {#if authManager.user.isAdmin && !$hideBackupsReminder}
    <ImmichBackupsSidebarItem href={Route.backups()} />
  {/if}
</div>

<PurchaseInfo />

<div class="mt-2 mb-6">
  <ServerStatus />
</div>
