<script lang="ts">
  import { executeMutation, queryClient } from '#lib/queries/client.ts';
  import {
    getAllLibrariesQuery,
    getLibraryFoldersQuery,
    moveAssetsToLibraryMutation,
  } from '#lib/queries/library.query.ts';
  import { getServerErrorMessage } from '#lib/utils/handle-error.ts';
  import {
    Alert,
    Code,
    Field,
    FormModal,
    HelperText,
    Icon,
    IconButton,
    Input,
    LoadingSpinner,
    Select,
    Stack,
    Text,
    toastManager,
  } from '@immich/ui';
  import { mdiArrowUp, mdiFolderMoveOutline, mdiFolderOutline } from '@mdi/js';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  type Props = {
    assetIds: string[];
    ownerId: string;
    onClose: (moved?: boolean) => void;
  };

  const { assetIds, ownerId, onClose }: Props = $props();

  const librariesQuery = createQuery(getAllLibrariesQuery, () => queryClient);

  let selectedLibraryId = $state<string>();
  let browsed = $state<{ libraryId: string; path?: string }>();
  let subfolder = $state('');

  const libraries = $derived(
    (librariesQuery.data ?? []).filter((library) => library.ownerId === ownerId && library.importPaths.length > 0),
  );
  const library = $derived(libraries.find(({ id }) => id === selectedLibraryId) ?? libraries[0]);
  const hasSingleImportPath = $derived(library?.importPaths.length === 1);
  const currentPath = $derived(
    browsed && browsed.libraryId === library?.id
      ? browsed.path
      : hasSingleImportPath
        ? library?.importPaths[0]
        : undefined,
  );

  const foldersQuery = createQuery(
    () => ({ ...getLibraryFoldersQuery(library?.id ?? '', currentPath), enabled: !!library }),
    () => queryClient,
  );

  const listing = $derived(foldersQuery.data);
  const upPath = $derived.by(() => {
    if (!listing?.path) {
      return;
    }
    if (listing.parentPath) {
      return { path: listing.parentPath };
    }
    return hasSingleImportPath ? undefined : { path: undefined };
  });

  const segments = $derived(subfolder.split('/').filter((segment) => segment.trim() !== ''));
  const isSubfolderValid = $derived(segments.every((segment) => segment !== '..' && segment !== '.'));
  const destination = $derived(
    currentPath && segments.length > 0 ? [currentPath.replace(/\/+$/, ''), ...segments].join('/') : currentPath,
  );

  const browse = (path?: string) => {
    if (library) {
      browsed = { libraryId: library.id, path };
    }
  };

  const onSubmit = async () => {
    if (!library || !destination) {
      return;
    }

    await executeMutation(
      moveAssetsToLibraryMutation,
      [{ id: library.id, moveAssetsToLibraryDto: { assetIds, folder: destination } }],
      {
        onSuccess: () => {
          toastManager.primary($t('move_to_external_library_queued', { values: { count: assetIds.length } }));
          onClose(true);
        },
      },
    );
  };
</script>

<FormModal
  title={$t('move_to_external_library')}
  icon={mdiFolderMoveOutline}
  onClose={() => onClose()}
  {onSubmit}
  size="medium"
  submitText={$t('move')}
  disabled={!library || !destination || !isSubfolderValid}
>
  {#if librariesQuery.isPending}
    <div class="flex justify-center py-6"><LoadingSpinner /></div>
  {:else if libraries.length === 0}
    <Alert color="warning" title={$t('move_to_external_library_no_libraries')} size="small" />
  {:else}
    <Stack gap={4}>
      <Text size="small">{$t('move_to_external_library_description', { values: { count: assetIds.length } })}</Text>

      <Field label={$t('library')}>
        <Select
          value={library?.id}
          options={libraries.map(({ id, name }) => ({ label: name, value: id }))}
          onChange={(value) => (selectedLibraryId = value)}
        />
      </Field>

      <div class="flex flex-col gap-2">
        <Text size="small" fontWeight="medium">{$t('folder')}</Text>
        <div class="flex items-center gap-2">
          <IconButton
            icon={mdiArrowUp}
            shape="round"
            variant="ghost"
            color="secondary"
            size="small"
            aria-label={$t('go_back')}
            disabled={!upPath}
            onclick={() => upPath && browse(upPath.path)}
          />
          <Code class="truncate">{currentPath ?? $t('import_path')}</Code>
        </div>

        <ul class="flex max-h-64 flex-col overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
          {#if foldersQuery.isPending}
            <li class="flex justify-center py-4"><LoadingSpinner /></li>
          {:else if foldersQuery.isError}
            <li class="p-2">
              <Alert
                color="danger"
                size="small"
                title={getServerErrorMessage(foldersQuery.error) ?? String(foldersQuery.error)}
              />
            </li>
          {:else if listing && listing.folders.length === 0}
            <li class="px-4 py-3"><Text size="small" color="muted">{$t('no_subfolders')}</Text></li>
          {:else if listing}
            {#each listing.folders as entry (entry.path)}
              <li>
                <button
                  type="button"
                  class="flex w-full items-center gap-3 px-4 py-2 text-start hover:bg-subtle"
                  onclick={() => browse(entry.path)}
                >
                  <Icon icon={mdiFolderOutline} size="20" class="shrink-0 text-primary" />
                  <span class="truncate">{entry.name}</span>
                </button>
              </li>
            {/each}
          {/if}
        </ul>
      </div>

      <Field label={$t('new_subfolder')}>
        <Input bind:value={subfolder} placeholder="2024/07" disabled={!currentPath} />
        {#if !isSubfolderValid}
          <HelperText color="danger">{$t('invalid_subfolder')}</HelperText>
        {/if}
      </Field>

      <div>
        <Text size="small" color="muted">{$t('destination_folder')}</Text>
        {#if destination}
          <Code>{destination}</Code>
        {:else}
          <Text size="small" color="danger">{$t('move_to_external_library_select_folder')}</Text>
        {/if}
      </div>
    </Stack>
  {/if}
</FormModal>
