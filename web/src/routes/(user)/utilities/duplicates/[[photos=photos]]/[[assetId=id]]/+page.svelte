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
  import { handleError } from '$lib/utils/handle-error';
  import type { AssetResponseDto } from '@immich/sdk';
  import { countDeDuplicateAll, countKeepAll, deDuplicateAll, deleteAssets, getAssetDuplicates, keepAll, updateAssets } from '@immich/sdk';
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

  const PAGE_SIZE = data.pageSize;

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

  let duplicatesRes = $state(data.duplicatesRes);
  let pageCache = $state<Map<number, typeof duplicatesRes>>(new Map());

  $effect(() => {
    const initialPage = Math.floor(duplicatesIndex / PAGE_SIZE) + 1;
    if (!pageCache.has(initialPage)) {
      pageCache.set(initialPage, duplicatesRes);
    }
  });

  const { isViewing: showAssetViewer } = assetViewingStore;

  const correctDuplicatesIndex = (index: number) => {
    return Math.max(0, Math.min(index, duplicatesRes.totalItems - 1));
  };

  let duplicatesIndex = $derived(
    (() => {
      const indexParam = page.url.searchParams.get('index') ?? '0';
      const parsedIndex = Number.parseInt(indexParam, 10);
      return correctDuplicatesIndex(Number.isNaN(parsedIndex) ? 0 : parsedIndex);
    })(),
  );

  let hasDuplicates = $derived(duplicatesRes.totalItems > 0);
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

  const handleResolve = async (duplicateAssetIds: string[], trashIds: string[]) => {
    return withConfirmation(
      async () => {
        await deleteAssets({ assetBulkDeleteDto: { ids: trashIds, force: !featureFlagsManager.value.trash } });
        await updateAssets({ assetBulkUpdateDto: { ids: duplicateAssetIds, duplicateId: null } });

        deletedNotification(trashIds.length);
        await correctDuplicatesIndexAndGo(duplicatesIndex);
      },
      trashIds.length > 0 && !featureFlagsManager.value.trash ? $t('delete_duplicates_confirmation') : undefined,
      trashIds.length > 0 && !featureFlagsManager.value.trash ? $t('permanently_delete') : undefined,
    );
  };

  const handleStack = async (assets: AssetResponseDto[]) => {
    await stackAssets(assets, false);
    const duplicateAssetIds = assets.map((asset) => asset.id);
    await updateAssets({ assetBulkUpdateDto: { ids: duplicateAssetIds, duplicateId: null } });
    await correctDuplicatesIndexAndGo(duplicatesIndex);
  };

  const handleDeduplicateAll = async () => {
    const count = await countDeDuplicateAll();
    let prompt, confirmText;
    if (featureFlagsManager.value.trash) {
      prompt = $t('bulk_trash_duplicates_confirmation', { values: { count } });
      confirmText = $t('confirm');
    } else {
      prompt = $t('bulk_delete_duplicates_confirmation', { values: { count } });
      confirmText = $t('permanently_delete');
    }

    return withConfirmation(
      async () => {
        await deDuplicateAll();
        deletedNotification(1);

        duplicatesRes.items = [];

        page.url.searchParams.delete('index');
        await goto(`${AppRoute.DUPLICATES}`);
      },
      prompt,
      confirmText,
    );
  };

  const handleKeepAll = async () => {
    const count = await countKeepAll();
    return withConfirmation(
      async () => {
        await keepAll();

        toastManager.success($t('resolved_all_duplicates'));
        page.url.searchParams.delete('index');
        await goto(`${AppRoute.DUPLICATES}`);
      },
      $t('bulk_keep_duplicates_confirmation', { values: { count } }),
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
    await correctDuplicatesIndexAndGo(Math.min(duplicatesIndex + 1, duplicatesRes.totalItems - 1));
  };

  const handleNextShortcut = async () => {
    if ($showAssetViewer) {
      return;
    }
    await handleNext();
  };

  const handleLast = async () => {
    await correctDuplicatesIndexAndGo(duplicatesRes.totalItems - 1);
  };

  const correctDuplicatesIndexAndGo = async (index: number) => {
    const correctedIndex = correctDuplicatesIndex(index);
    const pageNeeded = Math.floor(correctedIndex / PAGE_SIZE) + 1;
    const currentPage = Math.floor(duplicatesIndex / PAGE_SIZE) + 1;

    if (pageNeeded !== currentPage || !pageCache.has(pageNeeded)) {
      await loadDuplicates(pageNeeded);
    } else {
      duplicatesRes = pageCache.get(pageNeeded)!;
    }

    page.url.searchParams.set('index', correctedIndex.toString());
    await goto(`${AppRoute.DUPLICATES}?${page.url.searchParams.toString()}`);

    void preloadAdjacentPages(pageNeeded, correctedIndex);
  };

  const loadDuplicates = async (pageNumber: number) => {
    if (pageCache.has(pageNumber)) {
      duplicatesRes = pageCache.get(pageNumber)!;
      return;
    }

    duplicatesRes = await getAssetDuplicates({ page: pageNumber, size: PAGE_SIZE });
    pageCache.set(pageNumber, duplicatesRes);
  };

  const preloadAdjacentPages = async (currentPageNumber: number, currentIndex: number) => {
    const localIndex = currentIndex % PAGE_SIZE;
    const maxPage = Math.ceil(duplicatesRes.totalItems / PAGE_SIZE);

    if (localIndex === PAGE_SIZE - 1 && currentPageNumber < maxPage) {
      const nextPage = currentPageNumber + 1;
      if (!pageCache.has(nextPage)) {
        const res = await getAssetDuplicates({ page: nextPage, size: PAGE_SIZE });
        pageCache.set(nextPage, res);
      }
    }

    if (localIndex === 0 && currentPageNumber > 1) {
      const prevPage = currentPageNumber - 1;
      if (!pageCache.has(prevPage)) {
        const res = await getAssetDuplicates({ page: prevPage, size: PAGE_SIZE });
        pageCache.set(prevPage, res);
      }
    }
  };
</script>

<svelte:document
  use:shortcuts={[
    { shortcut: { key: 'ArrowLeft' }, onShortcut: handlePreviousShortcut },
    { shortcut: { key: 'ArrowRight' }, onShortcut: handleNextShortcut },
  ]}
/>

<UserPageLayout title={data.meta.title + ` (${duplicatesRes.totalItems.toLocaleString($locale)})`} scrollbar={true}>
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

  <div>
    {#if duplicatesRes.items.length > 0 && duplicatesRes.totalItems > 0}
      {@const localIndex = duplicatesIndex % PAGE_SIZE}
      {@const currentDuplicate = duplicatesRes.items[localIndex]}

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

      {#if currentDuplicate}
        {#key currentDuplicate.duplicateId}
          <DuplicatesCompareControl
            assets={currentDuplicate.assets}
            onResolve={(duplicateAssetIds, trashIds) => handleResolve(duplicateAssetIds, trashIds)}
            onStack={(assets) => handleStack(assets)}
          />
        {/key}
      {/if}
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
          <p>{duplicatesIndex + 1}/{duplicatesRes.totalItems.toLocaleString($locale)}</p>
          <div class="flex text-xs text-black">
            <Button
              size="small"
              trailingIcon={mdiChevronRight}
              color="primary"
              class="flex place-items-center rounded-s-full gap-2 px-2 sm:px-4"
              onclick={handleNext}
              disabled={duplicatesIndex === duplicatesRes.totalItems - 1}
            >
              {$t('next')}
            </Button>
            <Button
              size="small"
              trailingIcon={mdiPageLast}
              color="primary"
              class="flex place-items-center rounded-e-full gap-2 px-2 sm:px-4"
              onclick={handleLast}
              disabled={duplicatesIndex === duplicatesRes.totalItems - 1}
            >
              {$t('last')}
            </Button>
          </div>
        </div>
      </div>
    {:else}
      <p class="text-center text-lg dark:text-white flex place-items-center place-content-center">
        {$t('no_duplicates_found')}
      </p>
    {/if}
  </div>
</UserPageLayout>
