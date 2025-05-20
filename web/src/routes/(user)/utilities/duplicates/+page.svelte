<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import DuplicateGrid from '$lib/components/utilities-page/duplicates/duplicate-grid.svelte';
  import DuplicateThumbnail from '$lib/components/utilities-page/duplicates/duplicate-thumbnail.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import DuplicatesInformationModal from '$lib/modals/DuplicatesInformationModal.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { suggestDuplicate } from '$lib/utils/duplicate-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { deleteAssets, updateAssets } from '@immich/sdk';
  import { Button, HStack, Text } from '@immich/ui';
  import { mdiCheckOutline, mdiInformationOutline, mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data = $bindable() }: Props = $props();

  let duplicates = $state(data.duplicates);
  let hasDuplicates = $derived(duplicates.length > 0);

  let virtualGridContainer = $state<HTMLElement>();

  const DEFAULT_HEIGHT = 780;

  let virtualGridHeight = $state(DEFAULT_HEIGHT);

  $effect(() => {
    if (virtualGridContainer) {
      virtualGridHeight = virtualGridContainer.clientHeight;
    }
  });

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

<UserPageLayout title="{data.meta.title} ({duplicates.length.toLocaleString($locale)})" scrollbar={false}>
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
    </HStack>
  {/snippet}
  <div class="flex items-center mb-2">
    <div class="text-sm dark:text-white">
      <p>{$t('duplicates_description_all')}</p>
    </div>
    <CircleIconButton
      icon={mdiInformationOutline}
      title={$t('deduplication_info')}
      size="16"
      padding="2"
      onclick={async () => {
        await modalManager.show(DuplicatesInformationModal, {});
      }}
    />
  </div>
  <section
    bind:this={virtualGridContainer}
    class="mt-2 h-[calc(100%-theme(spacing.20))] overflow-auto immich-scrollbar"
  >
    <DuplicateGrid items={duplicates} itemHeight={256} itemWidth={176} containerHeight={virtualGridHeight}>
      {#snippet item(item)}
        <div class="p-1 flex items-center justify-center">
          <DuplicateThumbnail duplicate={item} />
        </div>
      {/snippet}
      {#snippet placeholder(item)}
        <div class="p-1 flex items-center justify-center">
          <DuplicateThumbnail asPlaceholder duplicate={item} />
        </div>
      {/snippet}
    </DuplicateGrid>
  </section>
</UserPageLayout>
