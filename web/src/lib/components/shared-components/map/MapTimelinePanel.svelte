<script lang="ts">
  import ActionMenuItem from '$lib/components/ActionMenuItem.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import type { SelectionBBox } from '$lib/components/shared-components/map/types';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import LinkLivePhotoAction from '$lib/components/timeline/actions/LinkLivePhotoAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import SetVisibilityAction from '$lib/components/timeline/actions/SetVisibilityAction.svelte';
  import StackAction from '$lib/components/timeline/actions/StackAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { getAssetBulkActions } from '$lib/services/asset.service';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { mapSettings } from '$lib/stores/preferences.store';
  import { preferences, user } from '$lib/stores/user.store';
  import {
    updateStackedAssetInTimeline,
    updateUnstackedAssetInTimeline,
    type OnLink,
    type OnUnlink,
  } from '$lib/utils/actions';
  import { AssetVisibility } from '@immich/sdk';
  import { ActionButton, CloseButton, CommandPaletteDefaultProvider, Icon } from '@immich/ui';
  import { mdiDotsVertical, mdiImageMultiple } from '@mdi/js';
  import { ceil, floor } from 'lodash-es';
  import { t } from 'svelte-i18n';

  interface Props {
    bbox: SelectionBBox;
    selectedClusterIds: Set<string>;
    assetCount: number;
    onClose: () => void;
  }

  let { bbox, selectedClusterIds, assetCount, onClose }: Props = $props();

  const assetInteraction = new AssetInteraction();
  let timelineManager = $state<TimelineManager>() as TimelineManager;
  let selectedAssets = $derived(assetInteraction.selectedAssets);
  let isAssetStackSelected = $derived(selectedAssets.length === 1 && !!selectedAssets[0].stack);
  let isLinkActionAvailable = $derived.by(() => {
    const isLivePhoto = selectedAssets.length === 1 && !!selectedAssets[0].livePhotoVideoId;
    const isLivePhotoCandidate =
      selectedAssets.length === 2 &&
      selectedAssets.some((asset) => asset.isImage) &&
      selectedAssets.some((asset) => asset.isVideo);

    return assetInteraction.isAllUserOwned && (isLivePhoto || isLivePhotoCandidate);
  });
  const isAllUserOwned = $derived($user && selectedAssets.every((asset) => asset.ownerId === $user.id));

  const handleLink: OnLink = ({ still, motion }) => {
    timelineManager.removeAssets([motion.id]);
    timelineManager.upsertAssets([still]);
  };

  const handleUnlink: OnUnlink = ({ still, motion }) => {
    timelineManager.upsertAssets([motion]);
    timelineManager.upsertAssets([still]);
  };

  const handleSetVisibility = (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    assetInteraction.clearMultiselect();
  };

  const handleEscape = () => {
    assetInteraction.clearMultiselect();
  };

  const timelineBoundingBox = $derived(
    `${floor(bbox.west, 6)},${floor(bbox.south, 6)},${ceil(bbox.east, 6)},${ceil(bbox.north, 6)}`,
  );

  const timelineOptions = $derived({
    bbox: timelineBoundingBox,
    visibility: $mapSettings.includeArchived ? undefined : AssetVisibility.Timeline,
    isFavorite: $mapSettings.onlyFavorites || undefined,
    withPartners: $mapSettings.withPartners || undefined,
    assetFilter: selectedClusterIds,
  });

  $effect.pre(() => {
    void timelineOptions;
    assetInteraction.clearMultiselect();
  });
</script>

<aside class="h-full w-full overflow-hidden bg-immich-bg dark:bg-immich-dark-bg flex flex-col contain-content">
  <div class="flex items-center justify-between border-b border-gray-200 dark:border-immich-dark-gray pb-1 pe-1">
    <div class="flex items-center gap-2">
      <Icon icon={mdiImageMultiple} size="20" />
      <p class="text-sm font-medium text-immich-fg dark:text-immich-dark-fg">
        {$t('assets_count', { values: { count: assetCount } })}
      </p>
    </div>
    <CloseButton onclick={onClose} />
  </div>

  <div class="min-h-0 flex-1">
    <Timeline
      bind:timelineManager
      enableRouting={false}
      options={timelineOptions}
      onEscape={handleEscape}
      {assetInteraction}
      showArchiveIcon
    />
  </div>
</aside>

{#if assetInteraction.selectionActive}
  {@const Actions = getAssetBulkActions($t, assetInteraction.asControlContext())}
  <CommandPaletteDefaultProvider name={$t('assets')} actions={Object.values(Actions)} />

  <Portal target="body">
    <AssetSelectControlBar
      ownerId={$user.id}
      assets={assetInteraction.selectedAssets}
      clearSelect={() => assetInteraction.clearMultiselect()}
    >
      <CreateSharedLink />
      <SelectAllAssets {timelineManager} {assetInteraction} />
      <ActionButton action={Actions.AddToAlbum} />

      {#if isAllUserOwned}
        <FavoriteAction
          removeFavorite={assetInteraction.isAllFavorite}
          onFavorite={(ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))}
        />

        <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
          <DownloadAction menuItem />
          {#if assetInteraction.selectedAssets.length > 1 || isAssetStackSelected}
            <StackAction
              unstack={isAssetStackSelected}
              onStack={(result) => updateStackedAssetInTimeline(timelineManager, result)}
              onUnstack={(assets) => updateUnstackedAssetInTimeline(timelineManager, assets)}
            />
          {/if}
          {#if isLinkActionAvailable}
            <LinkLivePhotoAction
              menuItem
              unlink={assetInteraction.selectedAssets.length === 1}
              onLink={handleLink}
              onUnlink={handleUnlink}
            />
          {/if}
          <ChangeDate menuItem />
          <ChangeDescription menuItem />
          <ChangeLocation menuItem />
          <ArchiveAction
            menuItem
            unarchive={assetInteraction.isAllArchived}
            onArchive={(ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))}
          />
          {#if $preferences.tags.enabled}
            <TagAction menuItem />
          {/if}
          <DeleteAssets
            menuItem
            onAssetDelete={(assetIds) => timelineManager.removeAssets(assetIds)}
            onUndoDelete={(assets) => timelineManager.upsertAssets(assets)}
          />
          <SetVisibilityAction menuItem onVisibilitySet={handleSetVisibility} />
          <hr />
          <ActionMenuItem action={Actions.RegenerateThumbnailJob} />
          <ActionMenuItem action={Actions.RefreshMetadataJob} />
          <ActionMenuItem action={Actions.TranscodeVideoJob} />
        </ButtonContextMenu>
      {:else}
        <DownloadAction />
      {/if}
    </AssetSelectControlBar>
  </Portal>
{/if}
