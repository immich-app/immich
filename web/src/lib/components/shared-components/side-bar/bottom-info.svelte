<script lang="ts">
  import ServerStatus from './server-status.svelte';
  import StorageSpace from './storage-space.svelte';
  import TwoFactorInfo from './two-factor-info.svelte';
</script>

<div class="mt-auto">
  <StorageSpace />
</div>

<TwoFactorInfo />

<div class="mb-6 mt-2">
  <ServerStatus />
</div>
