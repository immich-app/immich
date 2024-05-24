<script lang="ts">
  import { dialogController } from './dialog';
  import ConfirmDialog from '$lib/components/shared-components/dialog/confirm-dialog.svelte';
  const { dialog } = dialogController;
</script>

{#if $dialog}
  <!-- <div class="absolute top-0 w-full h-full z-[9999] bg-white/50 border border-red-600">
    <button on:click={() => $dialog.confirm()}>CONFIRM</button>
    <button on:click={() => $dialog.cancel()}>CANCEL</button>
  </div> -->

  <ConfirmDialog id={Date.now.toString()} {...$dialog} />
{/if}
