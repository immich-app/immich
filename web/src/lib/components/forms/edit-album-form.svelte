<script lang="ts">
  import AlbumCover from '$lib/components/album-page/album-cover.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAlbumInfo, type AlbumResponseDto } from '@immich/sdk';
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiRenameOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
    onEditSuccess?: ((album: AlbumResponseDto) => unknown) | undefined;
    onCancel?: (() => unknown) | undefined;
    onClose: () => void;
  }

  let { album = $bindable(), onEditSuccess = undefined, onCancel = undefined, onClose }: Props = $props();

  let albumName = $state(album.albumName);
  let description = $state(album.description);

  let isSubmitting = $state(false);

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
      handleError(error, $t('errors.unable_to_update_album_info'));
    } finally {
      isSubmitting = false;
    }
  };

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handleUpdateAlbumInfo();
  };
</script>

<Modal icon={mdiRenameOutline} title={$t('edit_album')} size="medium" {onClose}>
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="edit-album-form">
      <div class="flex items-center">
        <div class="hidden sm:flex">
          <AlbumCover {album} class="h-[200px] w-[200px] m-4 shadow-lg" />
        </div>

        <div class="grow">
          <div class="m-4 flex flex-col gap-2">
            <label class="immich-form-label" for="name">{$t('name')}</label>
            <input class="immich-form-input" id="name" type="text" bind:value={albumName} />
          </div>

          <div class="m-4 flex flex-col gap-2">
            <label class="immich-form-label" for="description">{$t('description')}</label>
            <textarea class="immich-form-input" id="description" bind:value={description}></textarea>
          </div>
        </div>
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <div class="flex gap-2 w-full">
      <Button shape="round" color="secondary" fullWidth onclick={() => onCancel?.()}>{$t('cancel')}</Button>
      <Button shape="round" type="submit" fullWidth disabled={isSubmitting} form="edit-album-form">{$t('save')}</Button>
    </div>
  </ModalFooter>
</Modal>
