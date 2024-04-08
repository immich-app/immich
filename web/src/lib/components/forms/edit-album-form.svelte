<script lang="ts">
  import { updateAlbumInfo, type AlbumResponseDto } from '@immich/sdk';
  import { handleError } from '$lib/utils/handle-error';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import AlbumCover from '$lib/components/album-page/album-cover.svelte';

  export let album: AlbumResponseDto;
  export let onEditSuccess: ((album: AlbumResponseDto) => unknown) | undefined = undefined;
  export let onCancel: (() => unknown) | undefined = undefined;

  let albumName = album.albumName;
  let description = album.description;

  let isSubmitting = false;

  const handleUpdateAlbumInfo = async () => {
    isSubmitting = true;
    try {
      await updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          albumName,
          description,
        },
      });
      album.albumName = albumName;
      album.description = description;
      onEditSuccess?.(album);
    } catch (error) {
      handleError(error, 'Unable to update album info');
    } finally {
      isSubmitting = false;
    }
  };
</script>

<form on:submit|preventDefault={handleUpdateAlbumInfo} autocomplete="off">
  <div class="flex items-center">
    <div class="hidden sm:flex">
      <AlbumCover {album} css="h-[200px] w-[200px] m-4 shadow-lg" />
    </div>

    <div class="flex-grow">
      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="name">Name</label>
        <input class="immich-form-input" id="name" type="text" bind:value={albumName} />
      </div>

      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="description">Description</label>
        <textarea class="immich-form-input" id="description" bind:value={description} />
      </div>
    </div>
  </div>

  <div class="flex justify-center">
    <div class="mt-8 flex w-full sm:w-2/3 gap-4">
      <Button color="gray" fullwidth on:click={() => onCancel?.()}>Cancel</Button>
      <Button type="submit" fullwidth disabled={isSubmitting}>OK</Button>
    </div>
  </div>
</form>
