<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import Checkbox from '$lib/components/elements/checkbox.svelte';

  export let size: number;

  let checked = false;

  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
  }>();

  const handleConfirm = () => {
    if (checked) {
      $showDeleteModal = false;
    }
    dispatch('confirm');
  };
</script>

<ConfirmDialogue
  id="permanently-delete-asset-modal"
  title="Permanently delete asset{size > 1 ? 's' : ''}"
  confirmText="Delete"
  onConfirm={handleConfirm}
  onClose={() => dispatch('cancel')}
>
  <svelte:fragment slot="prompt">
    <p>
      Are you sure you want to permanently delete
      {#if size > 1}
        these <b>{size}</b> assets? This will also remove them from their album(s).
      {:else}
        this asset? This will also remove it from its album(s).
      {/if}
    </p>
    <p><b>You cannot undo this action!</b></p>

    <div class="pt-4 flex justify-center items-center">
      <Checkbox id="confirm-deletion-input" label="Do not show this message again" bind:checked />
    </div>
  </svelte:fragment>
</ConfirmDialogue>
