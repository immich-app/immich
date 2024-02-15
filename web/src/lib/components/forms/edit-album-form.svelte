<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { updateAlbumInfo, type AlbumResponseDto } from '@immich/sdk';
  import { mdiImageAlbum } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { handleError } from '../../utils/handle-error';
  import Button from '../elements/buttons/button.svelte';

  export let album: AlbumResponseDto;

  const dispatch = createEventDispatcher<{
    editSuccess: void;
    cancel: void;
  }>();

  const editUser = async () => {
    try {
      await updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          albumName: album.albumName,
          description: album.description,
        },
      });

      dispatch('editSuccess');
    } catch (error) {
      handleError(error, 'Unable to update user');
    }
  };
</script>

<div
  class="max-h-screen w-[500px] max-w-[95vw] overflow-y-auto rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
>
  <div
    class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
  >
    <Icon path={mdiImageAlbum} size="4em" />
    <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Edit album</h1>
  </div>

  <form on:submit|preventDefault={editUser} autocomplete="off">
    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="name">Name</label>
      <input class="immich-form-input" id="name" type="text" bind:value={album.albumName} />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="description">Description</label>
      <textarea class="immich-form-input" id="description" bind:value={album.description} />
    </div>

    <div class="mt-8 flex w-full gap-4 px-4">
      <Button color="gray" fullwidth on:click={() => dispatch('cancel')}>Cancel</Button>
      <Button type="submit" fullwidth>Confirm</Button>
    </div>
  </form>
</div>
