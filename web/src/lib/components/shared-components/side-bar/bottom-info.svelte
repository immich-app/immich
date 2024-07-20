<script lang="ts">
  import LicenseInfo from './license-info.svelte';
  import ServerStatus from './server-status.svelte';
  import StorageSpace from './storage-space.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
</script>

<div class="mt-auto">
  <StorageSpace />
</div>

{#if $featureFlags.showLicensePanel}
  <LicenseInfo />
{/if}

<div class="mb-6 mt-2">
  <ServerStatus />
</div>
