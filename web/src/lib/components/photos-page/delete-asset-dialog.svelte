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
  title="Supprimer Définitivement l'Actif{size > 1 ? 's' : ''}"
  confirmText="Supprimer"
  on:confirm={handleConfirm}
  on:cancel={() => dispatch('cancel')}
  on:escape={() => dispatch('cancel')}
>
  <svelte:fragment slot="prompt">
    <p>
      Êtes-vous sûr de vouloir supprimer définitivement
      {#if size > 1}
        ces <b>{size}</b> actifs ? Cela les supprimera également de leurs albums.
      {:else}
        cet actif ? Cela le supprimera également de ses albums.
      {/if}
    </p>
    <p><b>Vous ne pouvez pas annuler cette action !</b></p>

    <div class="flex gap-2 items-center justify-center pt-4">
      <label id="confirm-label" for="confirm-input">Ne plus afficher ce message</label>
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
