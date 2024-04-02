<script lang="ts">
  import { updateAlbumInfo, type AlbumResponseDto } from '@immich/sdk';
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
