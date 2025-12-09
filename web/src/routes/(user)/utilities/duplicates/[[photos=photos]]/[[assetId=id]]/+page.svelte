<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcuts } from '$lib/actions/shortcut';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import DuplicatesCompareControl from '$lib/components/utilities-page/duplicates/duplicates-compare-control.svelte';
  import { AppRoute } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import DuplicatesInformationModal from '$lib/modals/DuplicatesInformationModal.svelte';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { locale } from '$lib/stores/preferences.store';
  import { stackAssets } from '$lib/utils/asset-utils';
  import { suggestDuplicate } from '$lib/utils/duplicate-utils';
  import { handleError } from '$lib/utils/handle-error';
  import type { AssetResponseDto } from '@immich/sdk';
  import { deleteAssets, deleteDuplicates, updateAssets } from '@immich/sdk';
  import { Button, HStack, IconButton, modalManager, Text, toastManager } from '@immich/ui';
  import {
    mdiCheckOutline,
    mdiChevronLeft,
    mdiChevronRight,
    mdiInformationOutline,
    mdiKeyboard,
    mdiPageFirst,
    mdiPageLast,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
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

  const handleResolve = async (duplicateId: string, duplicateAssetIds: string[], trashIds: string[]) => {
    return withConfirmation(
      async () => {
        await deleteAssets({ assetBulkDeleteDto: { ids: trashIds, force: !featureFlagsManager.value.trash } });
        await updateAssets({ assetBulkUpdateDto: { ids: duplicateAssetIds, duplicateId: null } });

        duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);

        deletedNotification(trashIds.length);
        await correctDuplicatesIndexAndGo(duplicatesIndex);
      },
      trashIds.length > 0 && !featureFlagsManager.value.trash ? $t('delete_duplicates_confirmation') : undefined,
      trashIds.length > 0 && !featureFlagsManager.value.trash ? $t('permanently_delete') : undefined,
    );
  };

  const handleStack = async (duplicateId: string, assets: AssetResponseDto[]) => {
    await stackAssets(assets, false);
    const duplicateAssetIds = assets.map((asset) => asset.id);
    await updateAssets({ assetBulkUpdateDto: { ids: duplicateAssetIds, duplicateId: null } });
    duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);
    await correctDuplicatesIndexAndGo(duplicatesIndex);
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
        await goto(`${AppRoute.DUPLICATES}`);
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
        await goto(`${AppRoute.DUPLICATES}`);
      },
      $t('bulk_keep_duplicates_confirmation', { values: { count: ids.length } }),
      $t('confirm'),
    );
  };

  const handleFirst = async () => {
    await correctDuplicatesIndexAndGo(0);
  };
  const handlePrevious = async () => {
    await correctDuplicatesIndexAndGo(Math.max(duplicatesIndex - 1, 0));
  };
  const handlePreviousShortcut = async () => {
    if ($showAssetViewer) {
      return;
    }
    await handlePrevious();
  };
  const handleNext = async () => {
    await correctDuplicatesIndexAndGo(Math.min(duplicatesIndex + 1, duplicates.length - 1));
  };
  const handleNextShortcut = async () => {
    if ($showAssetViewer) {
      return;
    }
    await handleNext();
  };
  const handleLast = async () => {
    await correctDuplicatesIndexAndGo(duplicates.length - 1);
  };
  const correctDuplicatesIndexAndGo = async (index: number) => {
    page.url.searchParams.set('index', correctDuplicatesIndex(index).toString());
    await goto(`${AppRoute.DUPLICATES}?${page.url.searchParams.toString()}`);
  };
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
