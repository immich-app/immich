<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import DuplicatesCompareControl from '$lib/components/utilities-page/duplicates/duplicates-compare-control.svelte';
  import type { AssetResponseDto, AlbumResponseDto } from '@immich/sdk';
  import { deleteAssets, updateAssets, getAllAlbums } from '@immich/sdk';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import { suggestDuplicateByFileSize } from '$lib/utils';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import { mdiCheckOutline, mdiTrashCanOutline, mdiKeyboard, mdiSync, mdiSyncOff } from '@mdi/js';
  import { stackAssets, addAssetsToAlbum } from '$lib/utils/asset-utils';
  import ShowShortcuts from '$lib/components/shared-components/show-shortcuts.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { locale } from '$lib/stores/preferences.store';

  interface Props {
    data: PageData;
    isShowKeyboardShortcut?: boolean;
  }

  let { data = $bindable(), isShowKeyboardShortcut = $bindable(false) }: Props = $props();
  let isSynchronizeAlbumsActive = true;

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
        if (isSynchronizeAlbumsActive) {
          await synchronizeAlbums(duplicateAssetIds);
        }
        await deleteAssets({ assetBulkDeleteDto: { ids: trashIds, force: !$featureFlags.trash } });
        await updateAssets({ assetBulkUpdateDto: { ids: duplicateAssetIds, duplicateId: null } });

        duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);

        deletedNotification(trashIds.length);
      },
      trashIds.length > 0 && !$featureFlags.trash ? $t('delete_duplicates_confirmation') : undefined,
      trashIds.length > 0 && !$featureFlags.trash ? $t('permanently_delete') : undefined,
    );
  };

  const synchronizeAlbums = async (assetIds: string[]) => {
    const allAlbums: AlbumResponseDto[] = await Promise.all(
      assetIds.map((assetId) => getAllAlbums({ assetId: assetId })),
    );
    const albumIds = [...new Set(allAlbums.flat().map((album) => album.id))];

    albumIds.forEach((albumId) => {
      addAssetsToAlbum(albumId, assetIds, false);
    });
  };

  const handleStack = async (duplicateId: string, assets: AssetResponseDto[]) => {
    await stackAssets(assets, false);
    const duplicateAssetIds = assets.map((asset) => asset.id);
    await updateAssets({ assetBulkUpdateDto: { ids: duplicateAssetIds, duplicateId: null } });
    duplicates = duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);
  };

  const handleDeduplicateAll = async () => {
    const idsToKeep = duplicates.map((group) => suggestDuplicateByFileSize(group.assets)).map((asset) => asset?.id);
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
    <div class="flex place-items-center gap-2">
      <LinkButton onclick={() => handleDeduplicateAll()} disabled={!hasDuplicates}>
        <div class="flex place-items-center gap-2 text-sm">
          <Icon path={mdiTrashCanOutline} size="18" />
          {$t('deduplicate_all')}
        </div>
      </LinkButton>
      <LinkButton onclick={() => handleKeepAll()} disabled={!hasDuplicates}>
        <div class="flex place-items-center gap-2 text-sm">
          <Icon path={mdiCheckOutline} size="18" />
          {$t('keep_all')}
        </div>
      </LinkButton>
      <CircleIconButton
        icon={mdiKeyboard}
        title={$t('show_keyboard_shortcuts')}
        onclick={() => (isShowKeyboardShortcut = !isShowKeyboardShortcut)}
      />
    <CircleIconButton
      icon={isSynchronizeAlbumsActive ? mdiSync : mdiSyncOff}
      title={$t('show_synchronise_albums')}
      on:click={() => (isSynchronizeAlbumsActive = !isSynchronizeAlbumsActive)}
    />
    </div>
  {/snippet}

  <div class="mt-4">
    {#if duplicates && duplicates.length > 0}
      <div class="mb-4 text-sm dark:text-white">
        <p>{$t('duplicates_description')}</p>
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
