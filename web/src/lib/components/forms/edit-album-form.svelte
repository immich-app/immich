<script lang="ts">
  import { updateAlbumInfo, type AlbumResponseDto } from '@immich/sdk';
  import { handleError } from '$lib/utils/handle-error';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import AlbumCover from '$lib/components/album-page/album-cover.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { t } from 'svelte-i18n';

  export let album: AlbumResponseDto;
  export let onEditSuccess: ((album: AlbumResponseDto) => unknown) | undefined = undefined;
  export let onCancel: (() => unknown) | undefined = undefined;
  export let onClose: () => void;

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

<FullScreenModal title={$t('edit_album')} width="wide" {onClose}>
  <form on:submit|preventDefault={handleUpdateAlbumInfo} autocomplete="off" id="edit-album-form">
    <div class="flex items-center">
      <div class="hidden sm:flex">
        <AlbumCover {album} css="h-[200px] w-[200px] m-4 shadow-lg" />
      </div>

      <div class="flex-grow">
        <div class="m-4 flex flex-col gap-2">
          <label class="immich-form-label" for="name">{$t('name')}</label>
          <input class="immich-form-input" id="name" type="text" bind:value={albumName} />
        </div>

        <div class="m-4 flex flex-col gap-2">
          <label class="immich-form-label" for="description">{$t('description')}</label>
          <textarea class="immich-form-input" id="description" bind:value={description} />
        </div>
      </div>
    </div>
  </form>
  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={() => onCancel?.()}>{$t('cancel')}</Button>
    <Button type="submit" fullwidth disabled={isSubmitting} form="edit-album-form">{$t('ok')}</Button>
  </svelte:fragment>
</FullScreenModal>
