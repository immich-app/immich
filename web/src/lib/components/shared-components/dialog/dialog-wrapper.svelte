<script lang="ts">
  import { dialogController } from './dialog';
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  const { dialog } = dialogController;
</script>

{#if $dialog}
  <ConfirmDialog {...$dialog} />
{/if}
