<script lang="ts">
  import LicenseInfo from './license-info.svelte';
  import ServerStatus from './server-status.svelte';
  import StorageSpace from './storage-space.svelte';
</script>

<div class="mt-auto">
  <StorageSpace />
</div>

<div class="mb-2">
  <LicenseInfo />
</div>

<div class="mb-6">
  <ServerStatus />
</div>
