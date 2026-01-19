<script lang="ts">
  import PurchaseInfo from './purchase-info.svelte';
  import ServerStatus from './server-status.svelte';
  import StorageSpace from './storage-space.svelte';
</script>

<div class="mt-auto flex flex-col gap-2 mb-4">
  <StorageSpace />
  <PurchaseInfo />
  <ServerStatus />
</div>
