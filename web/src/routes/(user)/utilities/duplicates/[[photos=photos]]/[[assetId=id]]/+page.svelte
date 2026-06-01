<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcuts } from '$lib/actions/shortcut';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LinkToDocs from '$lib/components/LinkToDocs.svelte';
  import DuplicatesCompareControl from '$lib/components/utilities-page/duplicates/duplicates-compare-control.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import { Route } from '$lib/route';
  import { locale } from '$lib/stores/preferences.store';
  import { getStackableDuplicateGroups, stackDuplicateGroups } from '$lib/utils/duplicate-utils';
  import { handleError } from '$lib/utils/handle-error';
  import type { AssetResponseDto } from '@immich/sdk';
  import { createStack, deleteDuplicates, resolveDuplicates, updateAssets } from '@immich/sdk';
  import { Button, HStack, IconButton, modalManager, Text, toastManager } from '@immich/ui';
  import {
    mdiCheckOutline,
    mdiChevronLeft,
    mdiChevronRight,
    mdiImageMultipleOutline,
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
  let stackableDuplicateGroups = $derived(getStackableDuplicateGroups(duplicates));
  let stackAllProgress = $state({ completedCount: 0, failedCount: 0, succeededCount: 0, totalCount: 0 });
  let isStackingAll = $state(false);
  let stackAllProgressPercent = $derived(
    stackAllProgress.totalCount === 0
      ? 0
      : Math.floor((stackAllProgress.completedCount / stackAllProgress.totalCount) * 100),
  );

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
  let hasStackableDuplicateGroups = $derived(stackableDuplicateGroups.length > 0);
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
    toastManager.primary(message);
  };

  const handleResolve = async (duplicateId: string, duplicateAssetIds: string[], trashIds: string[]) => {
    const forceDelete = !featureFlagsManager.value.trash;
    const shouldConfirmDelete = trashIds.length > 0 && forceDelete;

    return withConfirmation(
      async () => {
        const keepAssetIds = duplicateAssetIds.filter((id) => !trashIds.includes(id));

        const response = await resolveDuplicates({
          duplicateResolveDto: {
            groups: [{ duplicateId, keepAssetIds, trashAssetIds: trashIds }],
          },
        });

        const { success, error, errorMessage } = response[0];
        if (!success) {
          throw new Error(errorMessage || error);
        }

        duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);

        deletedNotification(trashIds.length);
        await navigateToIndex(duplicatesIndex);
      },
      shouldConfirmDelete ? $t('delete_duplicates_confirmation') : undefined,
      shouldConfirmDelete ? $t('permanently_delete') : undefined,
    );
  };

  const handleStack = async (duplicateId: string, assets: AssetResponseDto[]) => {
    const assetIds = assets.map((asset) => asset.id);
    await createStack({ stackCreateDto: { assetIds } });
    await updateAssets({ assetBulkUpdateDto: { ids: assetIds, duplicateId: null } });
    duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);
    await navigateToIndex(duplicatesIndex);
  };

  const handleStackAll = async () => {
    const groupsToStack = stackableDuplicateGroups;
    if (groupsToStack.length === 0 || isStackingAll) {
      return;
    }

    return withConfirmation(
      async () => {
        isStackingAll = true;
        stackAllProgress = { completedCount: 0, failedCount: 0, succeededCount: 0, totalCount: groupsToStack.length };

        try {
          const { succeededDuplicateIds, failedDuplicateIds } = await stackDuplicateGroups(groupsToStack, {
            createStack: (assetIds) => createStack({ stackCreateDto: { assetIds } }),
            updateAssets: (assetIds) => updateAssets({ assetBulkUpdateDto: { ids: assetIds, duplicateId: null } }),
            onError: (_duplicateId, error) =>
              handleError(error, $t('errors.failed_to_stack_assets'), { notify: false }),
            onProgress: (progress) => (stackAllProgress = progress),
          });

          const succeededCount = succeededDuplicateIds.length;
          const failedCount = failedDuplicateIds.length;

          if (succeededCount > 0) {
            const succeededDuplicateIdSet = new Set(succeededDuplicateIds);
            duplicates = duplicates.filter((duplicate) => !succeededDuplicateIdSet.has(duplicate.duplicateId));
          }

          if (failedCount > 0) {
            if (succeededCount > 0) {
              toastManager.warning($t('stacked_duplicate_groups_partial', { values: { succeededCount, failedCount } }));
              await navigateToIndex(duplicatesIndex);
              return;
            }

            toastManager.danger($t('failed_to_stack_duplicate_groups_count', { values: { count: failedCount } }));
            return;
          }

          toastManager.primary($t('stacked_duplicate_groups_count', { values: { count: succeededCount } }));
          page.url.searchParams.delete('index');
          await goto(Route.duplicatesUtility());
        } finally {
          isStackingAll = false;
        }
      },
      $t('bulk_stack_duplicates_confirmation', { values: { count: groupsToStack.length } }),
      $t('confirm'),
    );
  };

  const handleDeduplicateAll = async () => {
    // Use server-provided suggestedKeepAssetIds from each group
    const idsToDelete = duplicates.flatMap((group) => {
      const keepIds = new Set(group.suggestedKeepAssetIds);
      return group.assets.map((asset) => asset.id).filter((id) => !keepIds.has(id));
    });

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
        // Resolve all groups in a single batch request
        const response = await resolveDuplicates({
          duplicateResolveDto: {
            groups: duplicates.map((group) => {
              const keepIds = new Set(group.suggestedKeepAssetIds);
              return {
                duplicateId: group.duplicateId,
                keepAssetIds: group.suggestedKeepAssetIds,
                trashAssetIds: group.assets.map((asset) => asset.id).filter((id) => !keepIds.has(id)),
              };
            }),
          },
        });

        // Count failures and show appropriate message
        const failedCount = response.filter(({ success }) => !success).length;
        if (failedCount > 0) {
          toastManager.danger($t('errors.unable_to_resolve_duplicate'));
        }

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

        toastManager.primary($t('resolved_all_duplicates'));
        page.url.searchParams.delete('index');
        await goto(Route.duplicatesUtility());
      },
      $t('bulk_keep_duplicates_confirmation', { values: { count: ids.length } }),
      $t('confirm'),
    );
  };

  const handleFirst = () => navigateToIndex(0);
  const handlePrevious = () => navigateToIndex(Math.max(duplicatesIndex - 1, 0));
  const handleNext = async () => navigateToIndex(Math.min(duplicatesIndex + 1, duplicates.length - 1));
  const handleLast = () => navigateToIndex(duplicates.length - 1);

  const navigateToIndex = async (index: number) =>
    goto(Route.duplicatesUtility({ index: correctDuplicatesIndex(index) }));
</script>

<svelte:document
  use:shortcuts={assetViewerManager.isViewing
    ? []
    : [
        { shortcut: { key: 'ArrowLeft' }, onShortcut: handlePrevious },
        { shortcut: { key: 'ArrowRight' }, onShortcut: handleNext },
      ]}
/>

<UserPageLayout title={data.meta.title + ` (${duplicates.length.toLocaleString($locale)})`} scrollbar={true}>
  {#snippet buttons()}
    <HStack gap={0}>
      <Button
        leadingIcon={mdiTrashCanOutline}
        onclick={() => handleDeduplicateAll()}
        disabled={!hasDuplicates || isStackingAll}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('deduplicate_all')}</Text>
      </Button>
      <Button
        leadingIcon={mdiImageMultipleOutline}
        onclick={() => handleStackAll()}
        loading={isStackingAll}
        disabled={!hasStackableDuplicateGroups || isStackingAll}
        size="small"
        variant="ghost"
        color="secondary"
      >
        <Text class="hidden md:block">{$t('stack_all_duplicates')}</Text>
      </Button>
      <Button
        leadingIcon={mdiCheckOutline}
        onclick={() => handleKeepAll()}
        disabled={!hasDuplicates || isStackingAll}
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
    {#if duplicates && duplicates.length > 0}
      <Text size="small" color="muted" class="mb-4">
        <p>{$t('duplicates_description')} <LinkToDocs href="https://docs.immich.app/features/duplicates-utility" /></p>
      </Text>

      {#if isStackingAll}
        <div class="mx-auto mb-4 max-w-5xl px-4 sm:px-6" aria-live="polite">
          <div class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-immich-dark-gray">
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Text size="small" fontWeight="medium">{$t('stacking_duplicate_groups')}</Text>
              <Text size="small" color="muted">
                {$t('stack_duplicate_groups_progress', {
                  values: {
                    completedCount: stackAllProgress.completedCount,
                    failedCount: stackAllProgress.failedCount,
                    succeededCount: stackAllProgress.succeededCount,
                    totalCount: stackAllProgress.totalCount,
                  },
                })}
              </Text>
            </div>
            <div
              class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax={stackAllProgress.totalCount}
              aria-valuenow={stackAllProgress.completedCount}
            >
              <div class="h-full rounded-full bg-primary transition-all" style:width={`${stackAllProgressPercent}%`}></div>
            </div>
          </div>
        </div>
      {/if}

      {#key duplicates[duplicatesIndex].duplicateId}
        <DuplicatesCompareControl
          assets={duplicates[duplicatesIndex].assets}
          suggestedKeepAssetIds={duplicates[duplicatesIndex].suggestedKeepAssetIds}
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
