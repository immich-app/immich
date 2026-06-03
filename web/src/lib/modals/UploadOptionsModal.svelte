<script lang="ts">
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { uploadManager } from '$lib/managers/upload-manager.svelte';
  import { fileUploadHandler, openDirectoryPicker, openFilePicker } from '$lib/utils/file-uploader';
  import { createAlbum, getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { Checkbox, Field, FormModal, Input, Label, Select, Stack, Text, type SelectOption } from '@immich/ui';
  import { mdiTrayArrowUp } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: () => void;
  };

  type UploadSource = 'files' | 'folder';
  type AlbumMode = 'none' | 'selected' | 'new' | 'folder';

  let { onClose }: Props = $props();

  let uploadSource = $state<UploadSource>('files');
  let includeSubfolders = $state(false);
  let albumMode = $state<AlbumMode>('none');
  let albums: AlbumResponseDto[] = $state([]);
  let selectedAlbumId = $state('');
  let newAlbumName = $state('');

  const albumOptions = $derived<SelectOption<string>[]>([
    { label: $t('select_album'), value: '' },
    ...albums.map((album) => ({ label: album.albumName || $t('create_album_page_untitled'), value: album.id })),
  ]);

  const disabled = $derived(
    (albumMode === 'selected' && !selectedAlbumId) || (albumMode === 'new' && newAlbumName.trim().length === 0),
  );

  onMount(async () => {
    const [ownedAlbums, sharedAlbums] = await Promise.all([
      getAllAlbums({ isOwned: true }),
      getAllAlbums({ isShared: true }),
    ]);
    albums = [...ownedAlbums, ...sharedAlbums].sort((a, b) => a.albumName.localeCompare(b.albumName));
  });

  const sourceOptions: Array<{ value: UploadSource; label: string; description: string }> = [
    {
      value: 'files',
      label: $t('upload_files'),
      description: $t('upload_files_description'),
    },
    {
      value: 'folder',
      label: $t('upload_selected_folder'),
      description: $t('upload_selected_folder_description'),
    },
  ];

  const albumModeOptions: Array<{ value: AlbumMode; label: string; description: string; disabled?: boolean }> = [
    {
      value: 'none',
      label: $t('upload_without_album'),
      description: $t('upload_without_album_description'),
    },
    {
      value: 'selected',
      label: $t('upload_to_album'),
      description: $t('upload_to_album_description'),
    },
    {
      value: 'new',
      label: $t('upload_to_new_album'),
      description: $t('upload_to_new_album_description'),
    },
    {
      value: 'folder',
      label: $t('upload_folder_name_album'),
      description: $t('upload_folder_name_album_description'),
    },
  ];

  const onSubmit = async () => {
    const extensions = uploadManager.getExtensions();
    const files = await selectFiles(extensions);

    if (files.length === 0) {
      return;
    }

    let albumId = albumMode === 'selected' ? selectedAlbumId : undefined;
    if (albumMode === 'new') {
      const album = await createAlbum({ createAlbumDto: { albumName: newAlbumName.trim() } });
      eventManager.emit('AlbumCreate', album);
      albumId = album.id;
    }

    onClose();
    await fileUploadHandler({ files, albumId, albumNameFromFolder: albumMode === 'folder' });
  };

  const selectFiles = async (extensions: string[]) => {
    switch (uploadSource) {
      case 'files': {
        return openFilePicker({ multiple: true, extensions });
      }

      case 'folder': {
        return openDirectoryPicker({ extensions, recursive: includeSubfolders });
      }
    }
  };
</script>

<FormModal
  icon={mdiTrayArrowUp}
  title={$t('upload_options')}
  submitText={$t('upload')}
  size="medium"
  {disabled}
  {onClose}
  {onSubmit}
>
  <Stack gap={6} class="p-2">
    <div>
      <Text size="medium" fontWeight="semi-bold">{$t('upload_source')}</Text>
      <div class="mt-3 grid gap-2">
        {#each sourceOptions as option (option.value)}
          <label
            class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <input
              class="mt-1"
              type="radio"
              name="upload-source"
              checked={uploadSource === option.value}
              onchange={() => (uploadSource = option.value)}
            />
            <span>
              <Text size="small" fontWeight="medium">{option.label}</Text>
              <Text size="tiny" color="secondary">{option.description}</Text>
            </span>
          </label>
        {/each}
      </div>

      {#if uploadSource !== 'files'}
        <div class="mt-3 flex items-center gap-2">
          <Checkbox id="include-subfolders" bind:checked={includeSubfolders} color="secondary" />
          <Label label={$t('upload_include_subfolders')} for="include-subfolders" />
        </div>
      {/if}
    </div>

    <div>
      <Text size="medium" fontWeight="semi-bold">{$t('album')}</Text>
      <div class="mt-3 grid gap-2">
        {#each albumModeOptions as option (option.value)}
          <label
            class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-100 dark:hover:bg-gray-800 {option.disabled
              ? 'pointer-events-none opacity-50'
              : ''}"
          >
            <input
              class="mt-1"
              type="radio"
              name="album-mode"
              disabled={option.disabled}
              checked={albumMode === option.value}
              onchange={() => (albumMode = option.value)}
            />
            <span>
              <Text size="small" fontWeight="medium">{option.label}</Text>
              <Text size="tiny" color="secondary">{option.description}</Text>
            </span>
          </label>
        {/each}
      </div>
    </div>

    {#if albumMode === 'selected'}
      <Field label={$t('album')}>
        <Select value={selectedAlbumId} options={albumOptions} onChange={(value) => (selectedAlbumId = value)} />
      </Field>
    {:else if albumMode === 'new'}
      <Field label={$t('album_name')}>
        <Input bind:value={newAlbumName} />
      </Field>
    {/if}
  </Stack>
</FormModal>
