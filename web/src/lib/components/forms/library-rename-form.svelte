<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import type { LibraryResponseDto } from '@api';

  export let library: Partial<LibraryResponseDto>;

  const dispatch = createEventDispatcher();
  const handleCancel = () => {
    dispatch('cancel');
  };

  const handleSubmit = () => {
    dispatch('submit', { ...library });
  };
</script>

<form on:submit|preventDefault={() => handleSubmit()} autocomplete="off" class="m-4 flex flex-col gap-2">
  <div class="flex flex-col gap-2">
    <label class="immich-form-label" for="path">Name</label>
    <input class="immich-form-input" id="name" name="name" type="text" bind:value={library.name} />
  </div>
  <div class="flex w-full justify-end gap-2 pt-2">
    <Button size="sm" color="gray" on:click={() => handleCancel()}>Cancel</Button>
    <Button size="sm" type="submit">Save</Button>
  </div>
</form>
