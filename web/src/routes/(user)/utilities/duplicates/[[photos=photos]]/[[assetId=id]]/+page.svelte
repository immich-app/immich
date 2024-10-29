<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import DuplicatesCompareControl from '$lib/components/utilities-page/duplicates/duplicates-compare-control.svelte';
  import type { AssetResponseDto } from '@immich/sdk';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteAssets, updateAssets } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import { suggestDuplicateByFileSize } from '$lib/utils';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import { mdiCheckOutline, mdiTrashCanOutline } from '@mdi/js';
  import { stackAssets } from '$lib/utils/asset-utils';
  import ShowShortcuts from '$lib/components/shared-components/show-shortcuts.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { mdiKeyboard } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { locale } from '$lib/stores/preferences.store';

  export let data: PageData;
  export let isShowKeyboardShortcut = false;

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

  $: hasDuplicates = data.duplicates.length > 0;

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

        data.duplicates = data.duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);

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
    data.duplicates = data.duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);
  };

  const handleDeduplicateAll = async () => {
    const idsToKeep = data.duplicates
      .map((group) => suggestDuplicateByFileSize(group.assets))
      .map((asset) => asset?.id);
    const idsToDelete = data.duplicates.flatMap((group, i) =>
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

        data.duplicates = [];

        deletedNotification(idsToDelete.length);
      },
      prompt,
      confirmText,
    );
  };

  const handleKeepAll = async () => {
    const ids = data.duplicates.flatMap((group) => group.assets.map((asset) => asset.id));
    return withConfirmation(
      async () => {
        await updateAssets({ assetBulkUpdateDto: { ids, duplicateId: null } });

        data.duplicates = [];

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

<UserPageLayout title={data.meta.title + ` (${data.duplicates.length.toLocaleString($locale)})`} scrollbar={true}>
  <div class="flex place-items-center gap-2" slot="buttons">
    <LinkButton on:click={() => handleDeduplicateAll()} disabled={!hasDuplicates}>
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiTrashCanOutline} size="18" />
        {$t('deduplicate_all')}
      </div>
    </LinkButton>
    <LinkButton on:click={() => handleKeepAll()} disabled={!hasDuplicates}>
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiCheckOutline} size="18" />
        {$t('keep_all')}
      </div>
    </LinkButton>
    <CircleIconButton
      icon={mdiKeyboard}
      title={$t('show_keyboard_shortcuts')}
      on:click={() => (isShowKeyboardShortcut = !isShowKeyboardShortcut)}
    />
  </div>

  <div class="mt-4">
    {#if data.duplicates && data.duplicates.length > 0}
      <div class="mb-4 text-sm dark:text-white">
        <p>{$t('duplicates_description')}</p>
      </div>
      {#key data.duplicates[0].duplicateId}
        <DuplicatesCompareControl
          assets={data.duplicates[0].assets}
          onResolve={(duplicateAssetIds, trashIds) =>
            handleResolve(data.duplicates[0].duplicateId, duplicateAssetIds, trashIds)}
          onStack={(assets) => handleStack(data.duplicates[0].duplicateId, assets)}
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
