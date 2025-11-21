<script lang="ts">
  import AlbumCover from '$lib/components/album-page/album-cover.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllEvents, updateAlbumInfo, type AlbumResponseDto, type EventResponseDto } from '@immich/sdk';
  import { Button, Field, HStack, Input, Modal, ModalBody, ModalFooter, Textarea } from '@immich/ui';
  import { mdiRenameOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    album: AlbumResponseDto;
    onClose: (album?: AlbumResponseDto) => void;
  };

  let { album = $bindable(), onClose }: Props = $props();

  let albumName = $state(album.albumName);
  let description = $state(album.description);
  let eventId = $state(album.eventId);
  let isSubmitting = $state(false);
  let events = $state<EventResponseDto[]>([]);

  onMount(async () => {
    try {
      events = await getAllEvents();
    } catch (error) {
      handleError(error, $t('errors.unable_to_load_events'));
    }
  });

  const handleSubmit = async (event: Event) => {
    event.preventDefault();

    isSubmitting = true;

    try {
      await updateAlbumInfo({
        id: album.id,
        updateAlbumDto: { albumName, description, eventId: eventId || undefined },
      });
      album.albumName = albumName;
      album.description = description;
      album.eventId = eventId;
      onClose(album);
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_album_info'));
    } finally {
      isSubmitting = false;
    }
  };
</script>

<Modal icon={mdiRenameOutline} title={$t('edit_album')} size="medium" {onClose}>
  <ModalBody>
    <form onsubmit={handleSubmit} autocomplete="off" id="edit-album-form">
      <div class="flex items-center gap-8 m-4">
        <AlbumCover {album} class="h-50 w-50 shadow-lg hidden sm:flex" />

        <div class="grow flex flex-col gap-4">
          <Field label={$t('name')}>
            <Input bind:value={albumName} />
          </Field>

          <Field label={$t('event')}>
            <Select
              bind:value={eventId}
              options={[
                { value: '', label: 'None' },
                ...events.map((event) => ({ value: event.id, label: event.eventName })),
              ]}
            />
          </Field>

          <Field label={$t('description')}>
            <Textarea bind:value={description} />
          </Field>
        </div>
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" type="submit" fullWidth disabled={isSubmitting} form="edit-album-form">{$t('save')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
