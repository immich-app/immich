<script lang="ts">
  import {
    registerSelectionContext,
    type RegisterSelectionContextOptions,
  } from '$lib/managers/command-context-manager.svelte';

  let { options }: { options: RegisterSelectionContextOptions } = $props();

  registerSelectionContext(options);
</script>
