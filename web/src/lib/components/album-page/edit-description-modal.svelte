<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AlbumResponseDto } from '@api';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import Button from '../elements/buttons/button.svelte';

  const dispatch = createEventDispatcher<{
    close: void;
    save: string;
  }>();
  export let album: AlbumResponseDto;

  let description = album.description;

  const handleCancel = () => dispatch('close');
  const handleSubmit = () => dispatch('save', description);
</script>

<FullScreenModal on:clickOutside={handleCancel} on:escape={handleCancel}>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Edit description</h1>
    </div>

    <form on:submit|preventDefault={handleSubmit} autocomplete="off">
      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="name">Description</label>
        <!-- svelte-ignore a11y-autofocus -->
        <textarea
          class="immich-form-input focus:outline-none"
          id="name"
          name="name"
          rows="5"
          bind:value={description}
          autofocus
        />
      </div>

      <div class="mt-8 flex w-full gap-4 px-4">
        <Button color="gray" fullwidth on:click={handleCancel}>Cancel</Button>
        <Button type="submit" fullwidth>Ok</Button>
      </div>
    </form>
  </div>
</FullScreenModal>
