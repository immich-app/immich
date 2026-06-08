<script lang="ts">
  import PurchaseInfo from './PurchaseInfo.svelte';
  import ServerStatus from './ServerStatus.svelte';
  import StorageSpace from './StorageSpace.svelte';
</script>

<div class="mt-auto">
  <StorageSpace />
</div>

<PurchaseInfo />

<div class="mt-2 mb-6">
  <ServerStatus />
</div>
