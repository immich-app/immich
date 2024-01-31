<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';

  export let size: number;

  let checked = false;

  const dispatch = createEventDispatcher<{
    confirm: void;
    cancel: void;
  }>();

  const onToggle = () => {
    checked = !checked;
  };

  const handleConfirm = () => {
    if (checked) {
      $showDeleteModal = false;
    }
    dispatch('confirm');
  };
</script>

<ConfirmDialogue
  title="Permanently Delete Asset{size > 1 ? 's' : ''}"
  confirmText="Delete"
  on:confirm={handleConfirm}
  on:cancel={() => dispatch('cancel')}
  on:escape={() => dispatch('cancel')}
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

    <div class="flex gap-2 items-center justify-center pt-4">
      <label id="confirm-label" for="confirm-input">Do not show this message again</label>
      <input
        id="confirm-input"
        aria-labelledby="confirm-input"
        class="disabled::cursor-not-allowed h-3 w-3 opacity-1"
        type="checkbox"
        bind:checked
        on:click={onToggle}
      />
    </div>
  </svelte:fragment>
</ConfirmDialogue>
