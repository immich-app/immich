<script lang="ts">
  import ServerStatus from './server-status.svelte';
  import StorageSpace from './storage-space.svelte';
</script>

<div class="mt-auto">
  <StorageSpace />
</div>

<div class="mb-6 mt-2">
  <ServerStatus />
</div>
