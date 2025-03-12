<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import DuplicatesModal from '$lib/components/shared-components/duplicates-modal.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import ShowShortcuts from '$lib/components/shared-components/show-shortcuts.svelte';
  import DuplicatesCompareControl from '$lib/components/utilities-page/duplicates/duplicates-compare-control.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { stackAssets } from '$lib/utils/asset-utils';
  import { suggestDuplicate } from '$lib/utils/duplicate-utils';
  import { handleError } from '$lib/utils/handle-error';
  import type { AssetResponseDto } from '@immich/sdk';
  import { deleteAssets, updateAssets } from '@immich/sdk';
  import { Button, HStack, IconButton, Text } from '@immich/ui';
  import { mdiCheckOutline, mdiInformationOutline, mdiKeyboard, mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
    isShowKeyboardShortcut?: boolean;
    isShowDuplicateInfo?: boolean;
  }

  let {
    data = $bindable(),
    isShowKeyboardShortcut = $bindable(false),
    isShowDuplicateInfo = $bindable(false),
  }: Props = $props();

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
  let hasDuplicates = $derived(duplicates.length > 0);
  const withConfirmation = async (callback: () => Promise<void>, prompt?: string, confirmText?: string) => {
    if (prompt && confirmText) {
      const isConfirmed = await dialogController.show({ prompt, confirmText });
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

    notificationController.show({
      message: $featureFlags.trash
        ? $t('assets_moved_to_trash_count', { values: { count: trashedCount } })
        : $t('permanently_deleted_assets_count', { values: { count: trashedCount } }),
      type: NotificationType.Info,
    });
  };

  const handleResolve = async (duplicateId: string, duplicateAssetIds: string[], trashIds: string[]) => {
    return withConfirmation(
      async () => {
        await deleteAssets({ assetBulkDeleteDto: { ids: trashIds, force: !$featureFlags.trash } });
        await updateAssets({ assetBulkUpdateDto: { ids: duplicateAssetIds, duplicateId: null } });

        duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);

        deletedNotification(trashIds.length);
      },
      trashIds.length > 0 && !$featureFlags.trash ? $t('delete_duplicates_confirmation') : undefined,
      trashIds.length > 0 && !$featureFlags.trash ? $t('permanently_delete') : undefined,
    );
  };

  const handleStack = async (duplicateId: string, assets: AssetResponseDto[]) => {
    await stackAssets(assets, false);
    const duplicateAssetIds = assets.map((asset) => asset.id);
    await updateAssets({ assetBulkUpdateDto: { ids: duplicateAssetIds, duplicateId: null } });
    duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);
  };

  const handleDeduplicateAll = async () => {
    const idsToKeep = duplicates.map((group) => suggestDuplicate(group.assets)).map((asset) => asset?.id);
    const idsToDelete = duplicates.flatMap((group, i) =>
      group.assets.map((asset) => asset.id).filter((asset) => asset !== idsToKeep[i]),
    );

    let prompt, confirmText;
    if ($featureFlags.trash) {
      prompt = $t('bulk_trash_duplicates_confirmation', { values: { count: idsToDelete.length } });
      confirmText = $t('confirm');
    } else {
      prompt = $t('bulk_delete_duplicates_confirmation', { values: { count: idsToDelete.length } });
      confirmText = $t('permanently_delete');
    }

    return withConfirmation(
      async () => {
        await deleteAssets({ assetBulkDeleteDto: { ids: idsToDelete, force: !$featureFlags.trash } });
        await updateAssets({
          assetBulkUpdateDto: {
            ids: [...idsToDelete, ...idsToKeep.filter((id): id is string => !!id)],
            duplicateId: null,
          },
        });

        duplicates = [];

        deletedNotification(idsToDelete.length);
      },
      prompt,
      confirmText,
    );
  };

  const handleKeepAll = async () => {
    const ids = duplicates.flatMap((group) => group.assets.map((asset) => asset.id));
    return withConfirmation(
      async () => {
        await updateAssets({ assetBulkUpdateDto: { ids, duplicateId: null } });

        duplicates = [];

        notificationController.show({
          message: $t('resolved_all_duplicates'),
          type: NotificationType.Info,
        });
      },
      $t('bulk_keep_duplicates_confirmation', { values: { count: ids.length } }),
      $t('confirm'),
    );
  };
</script>

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
        onclick={() => (isShowKeyboardShortcut = !isShowKeyboardShortcut)}
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
        <CircleIconButton
          icon={mdiInformationOutline}
          title={$t('deduplication_info')}
          size="16"
          padding="2"
          onclick={() => (isShowDuplicateInfo = true)}
        />
      </div>

      {#key duplicates[0].duplicateId}
        <DuplicatesCompareControl
          assets={duplicates[0].assets}
          onResolve={(duplicateAssetIds, trashIds) =>
            handleResolve(duplicates[0].duplicateId, duplicateAssetIds, trashIds)}
          onStack={(assets) => handleStack(duplicates[0].duplicateId, assets)}
        />
      {/key}
    {:else}
      <p class="text-center text-lg dark:text-white flex place-items-center place-content-center">
        {$t('no_duplicates_found')}
      </p>
    {/if}
  </div>
</UserPageLayout>

{#if isShowKeyboardShortcut}
  <ShowShortcuts shortcuts={duplicateShortcuts} onClose={() => (isShowKeyboardShortcut = false)} />
{/if}
{#if isShowDuplicateInfo}
  <DuplicatesModal onClose={() => (isShowDuplicateInfo = false)} />
{/if}
