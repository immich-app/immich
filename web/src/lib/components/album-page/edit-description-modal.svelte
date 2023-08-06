<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AlbumResponseDto } from '@api';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import Button from '../elements/buttons/button.svelte';

  const dispatch = createEventDispatcher<{
    close: void;
    updated: string;
  }>();
  export let album: AlbumResponseDto;

  let description = album.description;

  const handleSave = () => {
    dispatch('updated', description);
  };
</script>

<FullScreenModal on:clickOutside={() => dispatch('close')}>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Edit description</h1>
    </div>

    <form on:submit|preventDefault={handleSave} autocomplete="off">
      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="email">Description</label>
        <!-- svelte-ignore a11y-autofocus -->
        <input class="immich-form-input" id="name" name="name" type="text" bind:value={description} autofocus />
      </div>

      <div class="mt-8 flex w-full gap-4 px-4">
        <Button color="gray" fullwidth on:click={() => dispatch('close')}>Cancel</Button>
        <Button type="submit" fullwidth>Ok</Button>
      </div>
    </form>
  </div>
</FullScreenModal>
