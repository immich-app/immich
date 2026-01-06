<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcuts } from '$lib/actions/shortcut';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import DuplicateSettingsModal from '$lib/components/utilities-page/duplicates/duplicate-settings-modal.svelte';
  import DuplicatesCompareControl from '$lib/components/utilities-page/duplicates/duplicates-compare-control.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import DuplicatesInformationModal from '$lib/modals/DuplicatesInformationModal.svelte';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import { Route } from '$lib/route';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { duplicateSettings, locale } from '$lib/stores/preferences.store';
  import { stackAssets } from '$lib/utils/asset-utils';
  import { suggestDuplicate } from '$lib/utils/duplicate-utils';
  import { handleError } from '$lib/utils/handle-error';
  import type { AssetBulkUpdateDto, AssetResponseDto } from '@immich/sdk';
  import {
    addAssetsToAlbums,
    AssetVisibility,
    bulkTagAssets,
    deleteAssets,
    deleteDuplicates,
    getAllAlbums,
    getAssetInfo,
    updateAssets,
  } from '@immich/sdk';
  import { Button, HStack, IconButton, modalManager, Text, toastManager } from '@immich/ui';
  import {
    mdiCheckOutline,
    mdiChevronLeft,
    mdiChevronRight,
    mdiCogOutline,
    mdiInformationOutline,
    mdiKeyboard,
    mdiPageFirst,
    mdiPageLast,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data = $bindable() }: Props = $props();

  interface Shortcuts {
    general: ExplainedShortcut[];
    actions: ExplainedShortcut[];
  }
  interface ExplainedShortcut {
    key: string[];
    action: string;
    info?: string;
  }

  const duplicateShortcuts: Shortcuts = {
    general: [],
    actions: [
      { key: ['a'], action: $t('select_all_duplicates') },
      { key: ['s'], action: $t('view') },
      { key: ['d'], action: $t('unselect_all_duplicates') },
      { key: ['⇧', 'c'], action: $t('resolve_duplicates') },
      { key: ['⇧', 's'], action: $t('stack_duplicates') },
    ],
  };

  const onShowSettings = async () => {
    const settings = await modalManager.show(DuplicateSettingsModal, { settings: { ...$duplicateSettings } });
    if (settings) {
      $duplicateSettings = settings;
    }
  };

  let duplicates = $state(data.duplicates);
  const { isViewing: showAssetViewer } = assetViewingStore;

  const correctDuplicatesIndex = (index: number) => {
    return Math.max(0, Math.min(index, duplicates.length - 1));
  };

  let duplicatesIndex = $derived(
    (() => {
      const indexParam = page.url.searchParams.get('index') ?? '0';
      const parsedIndex = Number.parseInt(indexParam, 10);
      return correctDuplicatesIndex(Number.isNaN(parsedIndex) ? 0 : parsedIndex);
    })(),
  );

  let hasDuplicates = $derived(duplicates.length > 0);
  const withConfirmation = async (callback: () => Promise<void>, prompt?: string, confirmText?: string) => {
    if (prompt && confirmText) {
      const isConfirmed = await modalManager.showDialog({ prompt, confirmText });
      if (!isConfirmed) {
        return;
      }
    }

    try {
      return await callback();
    } catch (error) {
      handleError(error, $t('errors.unable_to_resolve_duplicate'));
    }
  };

  const deletedNotification = (trashedCount: number) => {
    if (!trashedCount) {
      return;
    }

    const message = featureFlagsManager.value.trash
      ? $t('assets_moved_to_trash_count', { values: { count: trashedCount } })
      : $t('permanently_deleted_assets_count', { values: { count: trashedCount } });
    toastManager.success(message);
  };

  const getSyncedInfo = async (assetIds: string[]) => {
    if (assetIds.length === 0) {
      return {
        isFavorite: false,
        visibility: undefined,
        rating: 0,
        description: null,
        latitude: null,
        longitude: null,
        tagIds: [],
      };
    }

    const allAssetsInfo = await Promise.all(
      assetIds.map((assetId) => getAssetInfo({ ...authManager.params, id: assetId })),
    );
    // If any of the assets is favorite, we consider the synced info as favorite
    const isFavorite = allAssetsInfo.some((asset) => asset.isFavorite);
    // Choose the most restrictive user-visible level (Hidden is internal-only)
    const visibilityOrder = [AssetVisibility.Locked, AssetVisibility.Archive, AssetVisibility.Timeline];
    let visibility = visibilityOrder.find((level) => allAssetsInfo.some((asset) => asset.visibility === level));
    if (!visibility && allAssetsInfo.some((asset) => asset.visibility === AssetVisibility.Hidden)) {
      visibility = AssetVisibility.Hidden;
    }
    // Choose the highest rating from the exif data of the assets
    let rating = 0;
    for (const asset of allAssetsInfo) {
      const assetRating = asset.exifInfo?.rating ?? 0;
      if (assetRating > rating) {
        rating = assetRating;
      }
    }
    // Concatenate unique non-empty description lines to avoid duplicates across multi-line values
    const uniqueNonEmptyLines = (values: Array<string | null | undefined>) => {
      const unique = new SvelteSet<string>();
      const lines: string[] = [];
      for (const value of values) {
        if (!value) {
          continue;
        }
        for (const line of value.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || unique.has(trimmed)) {
            continue;
          }
          unique.add(trimmed);
          lines.push(trimmed);
        }
      }
      return lines;
    };
    const description =
      uniqueNonEmptyLines(allAssetsInfo.map((asset) => asset.exifInfo?.description)).join('\n') || null;

    // Helper: return unique numeric coordinate pair or null
    const getUniqueCoordinate = (assets: AssetResponseDto[], key: 'latitude' | 'longitude'): number | null => {
      const values = assets
        .map((asset) => asset.exifInfo?.[key])
        .filter((value): value is number => Number.isFinite(value));

      if (values.length === 0) {
        return null;
      }

      const unique = new SvelteSet(values);
      return unique.size === 1 ? Array.from(unique)[0] : null;
    };

    const latitude: number | null = getUniqueCoordinate(allAssetsInfo, 'latitude');
    const longitude: number | null = getUniqueCoordinate(allAssetsInfo, 'longitude');

    // Collect all unique tag IDs from all assets: flatten tags, extract IDs, deduplicate
    const tagIds = [
      ...new SvelteSet(
        allAssetsInfo
          .flatMap((asset) => asset.tags ?? [])
          .map((tag) => tag.id)
          .filter((id): id is string => !!id),
      ),
    ];

    return { isFavorite, visibility, rating, description, latitude, longitude, tagIds };
  };

  const handleResolve = async (duplicateId: string, duplicateAssetIds: string[], trashIds: string[]) => {
    const forceDelete = !featureFlagsManager.value.trash;
    const shouldConfirmDelete = trashIds.length > 0 && forceDelete;

    return withConfirmation(
      async () => {
        const idsToKeep = duplicateAssetIds.filter((id) => !trashIds.includes(id));

        const needsSyncedInfo =
          $duplicateSettings.synchronizeFavorites ||
          $duplicateSettings.synchronizeVisibility ||
          $duplicateSettings.synchronizeRating ||
          $duplicateSettings.synchronizeDescription ||
          $duplicateSettings.synchronizeLocation ||
          $duplicateSettings.synchronizeTags;
        const syncedInfo = needsSyncedInfo ? await getSyncedInfo(duplicateAssetIds) : null;

        let assetBulkUpdate: AssetBulkUpdateDto = {
          ids: idsToKeep,
          duplicateId: null,
        };
        if ($duplicateSettings.synchronizeFavorites && syncedInfo) {
          assetBulkUpdate.isFavorite = syncedInfo.isFavorite;
        }
        if ($duplicateSettings.synchronizeVisibility && syncedInfo) {
          assetBulkUpdate.visibility = syncedInfo.visibility;
        }
        if ($duplicateSettings.synchronizeRating && syncedInfo) {
          assetBulkUpdate.rating = syncedInfo.rating;
        }
        if ($duplicateSettings.synchronizeDescription && syncedInfo && syncedInfo.description !== null) {
          assetBulkUpdate.description = syncedInfo.description;
        }
        // If all assets have the same location, use it; otherwise don't set it (leave as-is)
        // Note: We cannot explicitly clear location via updateAssets API - it doesn't accept null
        // The keeper asset will retain its original location if coordinates differ
        if (
          $duplicateSettings.synchronizeLocation &&
          syncedInfo &&
          syncedInfo.latitude !== null &&
          syncedInfo.longitude !== null
        ) {
          assetBulkUpdate.latitude = syncedInfo.latitude;
          assetBulkUpdate.longitude = syncedInfo.longitude;
        }

        if ($duplicateSettings.synchronizeAlbums) {
          const mergedAlbumIds = new SvelteSet<string>();
          for (const sourceId of duplicateAssetIds) {
            const albums = await getAllAlbums({ assetId: sourceId });
            for (const album of albums) {
              mergedAlbumIds.add(album.id);
            }
          }

          const albumIds = [...mergedAlbumIds];
          if (albumIds.length > 0 && idsToKeep.length > 0) {
            await addAssetsToAlbums({ albumsAddAssetsDto: { albumIds, assetIds: idsToKeep } });
          }
        }

        if ($duplicateSettings.synchronizeTags && idsToKeep.length > 0 && syncedInfo && syncedInfo.tagIds.length > 0) {
          await bulkTagAssets({ tagBulkAssetsDto: { tagIds: syncedInfo.tagIds, assetIds: idsToKeep } });
        }

        await updateAssets({ assetBulkUpdateDto: assetBulkUpdate });
        await deleteAssets({ assetBulkDeleteDto: { ids: trashIds, force: forceDelete } });

        // This line ensures that once a duplicate group is resolved, it disappears from the
        // duplicates list shown to the user, maintaining consistent UI state
        duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);

        deletedNotification(trashIds.length);
        await navigateToIndex(duplicatesIndex);
      },
      shouldConfirmDelete ? $t('delete_duplicates_confirmation') : undefined,
      shouldConfirmDelete ? $t('permanently_delete') : undefined,
    );
  };

  const handleStack = async (duplicateId: string, assets: AssetResponseDto[]) => {
    await stackAssets(assets, false);
    const duplicateAssetIds = assets.map((asset) => asset.id);
    await updateAssets({ assetBulkUpdateDto: { ids: duplicateAssetIds, duplicateId: null } });
    duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);
    await navigateToIndex(duplicatesIndex);
  };

  const handleDeduplicateAll = async () => {
    const idsToKeep = duplicates.map((group) => suggestDuplicate(group.assets)).map((asset) => asset?.id);
    const idsToDelete = duplicates.flatMap((group, i) =>
      group.assets.map((asset) => asset.id).filter((asset) => asset !== idsToKeep[i]),
    );

    let prompt, confirmText;
    if (featureFlagsManager.value.trash) {
      prompt = $t('bulk_trash_duplicates_confirmation', { values: { count: idsToDelete.length } });
      confirmText = $t('confirm');
    } else {
      prompt = $t('bulk_delete_duplicates_confirmation', { values: { count: idsToDelete.length } });
      confirmText = $t('permanently_delete');
    }

    return withConfirmation(
      async () => {
        await deleteAssets({ assetBulkDeleteDto: { ids: idsToDelete, force: !featureFlagsManager.value.trash } });
        await updateAssets({
          assetBulkUpdateDto: {
            ids: [...idsToDelete, ...idsToKeep.filter((id): id is string => !!id)],
            duplicateId: null,
          },
        });

        duplicates = [];

        deletedNotification(idsToDelete.length);

        page.url.searchParams.delete('index');
        await goto(Route.duplicatesUtility());
      },
      prompt,
      confirmText,
    );
  };

  const handleKeepAll = async () => {
    const ids = duplicates.map(({ duplicateId }) => duplicateId);
    return withConfirmation(
      async () => {
        await deleteDuplicates({ bulkIdsDto: { ids } });

        duplicates = [];

        toastManager.success($t('resolved_all_duplicates'));
        page.url.searchParams.delete('index');
        await goto(Route.duplicatesUtility());
      },
      $t('bulk_keep_duplicates_confirmation', { values: { count: ids.length } }),
      $t('confirm'),
    );
  };

  const handleFirst = () => navigateToIndex(0);
  const handlePrevious = () => navigateToIndex(Math.max(duplicatesIndex - 1, 0));
  const handlePreviousShortcut = async () => {
    if ($showAssetViewer) {
      return;
    }
    await handlePrevious();
  };
  const handleNext = async () => navigateToIndex(Math.min(duplicatesIndex + 1, duplicates.length - 1));
  const handleNextShortcut = async () => {
    if ($showAssetViewer) {
      return;
    }
    await handleNext();
  };
  const handleLast = () => navigateToIndex(duplicates.length - 1);

  const navigateToIndex = async (index: number) =>
    goto(Route.duplicatesUtility({ index: correctDuplicatesIndex(index) }));
</script>

<svelte:document
  use:shortcuts={[
    { shortcut: { key: 'ArrowLeft' }, onShortcut: handlePreviousShortcut },
    { shortcut: { key: 'ArrowRight' }, onShortcut: handleNextShortcut },
  ]}
/>

<UserPageLayout title={data.meta.title + ` (${duplicates.length.toLocaleString($locale)})`} scrollbar={true}>
  {#snippet buttons()}
    <HStack gap={0}>
      <Button
        leadingIcon={mdiTrashCanOutline}
        onclick={() => handleDeduplicateAll()}
        disabled={!hasDuplicates}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('deduplicate_all')}</Text>
      </Button>
      <Button
        leadingIcon={mdiCheckOutline}
        onclick={() => handleKeepAll()}
        disabled={!hasDuplicates}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('keep_all')}</Text>
      </Button>
      <IconButton
        shape="round"
        variant="ghost"
        color="secondary"
        icon={mdiKeyboard}
        title={$t('show_keyboard_shortcuts')}
        onclick={() => modalManager.show(ShortcutsModal, { shortcuts: duplicateShortcuts })}
        aria-label={$t('show_keyboard_shortcuts')}
      />
      <IconButton
        shape="round"
        variant="ghost"
        color="secondary"
        icon={mdiCogOutline}
        title={$t('settings')}
        onclick={onShowSettings}
        aria-label={$t('settings')}
      />
    </HStack>
  {/snippet}

  <div class="">
    {#if duplicates && duplicates.length > 0}
      <div class="flex items-center mb-2">
        <div class="text-sm dark:text-white">
          <p>{$t('duplicates_description')}</p>
        </div>
        <IconButton
          shape="round"
          variant="ghost"
          color="secondary"
          icon={mdiInformationOutline}
          aria-label={$t('deduplication_info')}
          size="small"
          onclick={() => modalManager.show(DuplicatesInformationModal)}
        />
      </div>

      {#key duplicates[duplicatesIndex].duplicateId}
        <DuplicatesCompareControl
          assets={duplicates[duplicatesIndex].assets}
          onResolve={(duplicateAssetIds, trashIds) =>
            handleResolve(duplicates[duplicatesIndex].duplicateId, duplicateAssetIds, trashIds)}
          onStack={(assets) => handleStack(duplicates[duplicatesIndex].duplicateId, assets)}
        />
        <div class="max-w-5xl mx-auto mb-16">
          <div class="flex mb-4 sm:px-6 w-full place-content-center justify-between items-center place-items-center">
            <div class="flex text-xs text-black">
              <Button
                size="small"
                leadingIcon={mdiPageFirst}
                color="primary"
                class="flex place-items-center rounded-s-full gap-2 px-2 sm:px-4"
                onclick={handleFirst}
                disabled={duplicatesIndex === 0}
              >
                {$t('first')}
              </Button>
              <Button
                size="small"
                leadingIcon={mdiChevronLeft}
                color="primary"
                class="flex place-items-center rounded-e-full gap-2 px-2 sm:px-4"
                onclick={handlePrevious}
                disabled={duplicatesIndex === 0}
              >
                {$t('previous')}
              </Button>
            </div>
            <p class="border px-3 md:px-6 py-1 dark:bg-subtle rounded-lg text-xs md:text-sm">
              {duplicatesIndex + 1} / {duplicates.length.toLocaleString($locale)}
            </p>
            <div class="flex text-xs text-black">
              <Button
                size="small"
                trailingIcon={mdiChevronRight}
                color="primary"
                class="flex place-items-center rounded-s-full gap-2 px-2 sm:px-4"
                onclick={handleNext}
                disabled={duplicatesIndex === duplicates.length - 1}
              >
                {$t('next')}
              </Button>
              <Button
                size="small"
                trailingIcon={mdiPageLast}
                color="primary"
                class="flex place-items-center rounded-e-full gap-2 px-2 sm:px-4"
                onclick={handleLast}
                disabled={duplicatesIndex === duplicates.length - 1}
              >
                {$t('last')}
              </Button>
            </div>
          </div>
        </div>
      {/key}
    {:else}
      <p class="text-center text-lg dark:text-white flex place-items-center place-content-center">
        {$t('no_duplicates_found')}
      </p>
    {/if}
  </div>
</UserPageLayout>
