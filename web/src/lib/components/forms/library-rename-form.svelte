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

<form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
  <div class="mt-8 flex w-full gap-4 px-4">
    <Button color="gray" fullwidth on:click={() => handleCancel()}>Cancel</Button>
    <Button type="submit" fullwidth>Save</Button>
  </div>

  <div class="m-4 flex flex-col gap-2">
    <label class="immich-form-label" for="path">Name</label>
    <input class="immich-form-input" id="name" name="name" type="text" bind:value={library.name} />
  </div>
  <div class="flex justify-end" />
</form>
