<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout, { headerId } from '$lib/components/layouts/user-page-layout.svelte';
  import Breadcrumbs from '$lib/components/shared-components/tree/breadcrumbs.svelte';
  import TreeItemThumbnails from '$lib/components/shared-components/tree/tree-item-thumbnails.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import Sidebar from '$lib/components/sidebar/sidebar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { AppRoute, AssetAction, QueryParameter } from '$lib/constants';
  import SkipLink from '$lib/elements/SkipLink.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import TagCreateModal from '$lib/modals/TagCreateModal.svelte';
  import TagEditModal from '$lib/modals/TagEditModal.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { joinPaths, TreeNode } from '$lib/utils/tree-utils';
  import { deleteTag, getAllTags, type TagResponseDto } from '@immich/sdk';
  import { Button, HStack, modalManager, Text } from '@immich/ui';
  import { mdiDotsVertical, mdiPencil, mdiPlus, mdiTag, mdiTagMultiple, mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import AddToAlbum from '$lib/components/timeline/actions/AddToAlbumAction.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import SetVisibilityAction from '$lib/components/timeline/actions/SetVisibilityAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import { preferences, user } from '$lib/stores/user.store';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const assetInteraction = new AssetInteraction();

  let tags = $derived<TagResponseDto[]>(data.tags);
  const tree = $derived(TreeNode.fromTags(tags));
  const tag = $derived(tree.traverse(data.path));

  let timelineManager = $state<TimelineManager>() as TimelineManager;
  const options = $derived({ deferInit: !tag, tagId: tag?.id });

  const handleNavigation = (tag: string) => navigateToView(joinPaths(data.path, tag));

  const getLink = (path: string) => {
    const url = new URL(AppRoute.TAGS, globalThis.location.href);
    url.searchParams.set(QueryParameter.PATH, path);
    return url.href;
  };

  const navigateToView = (path: string) => goto(getLink(path));

  const handleCreate = async () => {
    await modalManager.show(TagCreateModal, { baseTag: tag });
    tags = await getAllTags();
  };

  const handleEdit = async () => {
    if (!tag) {
      return;
    }

    await modalManager.show(TagEditModal, { tag });
    tags = await getAllTags();
  };

  const handleDelete = async () => {
    if (!tag) {
      return;
    }

    const isConfirm = await modalManager.showDialog({
      title: $t('delete_tag'),
      prompt: $t('delete_tag_confirmation_prompt', { values: { tagName: tag.value } }),
      confirmText: $t('delete'),
    });

    if (!isConfirm) {
      return;
    }

    await deleteTag({ id: tag.id! });
    tags = await getAllTags();

    // navigate to parent
    await navigateToView(tag.parent ? tag.parent.path : '');
  };

  const handleSetVisibility = (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    assetInteraction.clearMultiselect();
  };
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet sidebar()}
    <Sidebar>
      <SkipLink target={`#${headerId}`} text={$t('skip_to_tags')} breakpoint="md" />
      <section>
        <div class="uppercase text-xs ps-4 mb-2 dark:text-white">{$t('explorer')}</div>
        <div class="h-full">
          <TreeItems icons={{ default: mdiTag, active: mdiTag }} {tree} active={tag.path} {getLink} />
        </div>
      </section>
    </Sidebar>
  {/snippet}

  {#snippet buttons()}
    <HStack>
      <Button leadingIcon={mdiPlus} onclick={handleCreate} size="small" variant="ghost" color="secondary">
        <Text class="hidden md:block">{$t('create_tag')}</Text>
      </Button>

      {#if tag.path.length > 0}
        <Button leadingIcon={mdiPencil} onclick={handleEdit} size="small" variant="ghost" color="secondary">
          <Text class="hidden md:block">{$t('edit_tag')}</Text>
        </Button>
        <Button leadingIcon={mdiTrashCanOutline} onclick={handleDelete} size="small" variant="ghost" color="secondary">
          <Text class="hidden md:block">{$t('delete_tag')}</Text>
        </Button>
      {/if}
    </HStack>
  {/snippet}

  <Breadcrumbs node={tag} icon={mdiTagMultiple} title={$t('tags')} {getLink} />

  <section class="mt-2 h-[calc(100%-(--spacing(20)))] overflow-auto immich-scrollbar">
    {#if tag.hasAssets}
      <Timeline
        enableRouting={true}
        bind:timelineManager
        {options}
        {assetInteraction}
        removeAction={AssetAction.UNARCHIVE}
      >
        {#snippet empty()}
          <TreeItemThumbnails items={tag.children} icon={mdiTag} onClick={handleNavigation} />
        {/snippet}
      </Timeline>
    {:else}
      <TreeItemThumbnails items={tag.children} icon={mdiTag} onClick={handleNavigation} />
    {/if}
  </section>
</UserPageLayout>

<section>
  {#if assetInteraction.selectionActive}
    <div class="fixed top-0 start-0 w-full">
      <AssetSelectControlBar
        ownerId={$user.id}
        assets={assetInteraction.selectedAssets}
        clearSelect={() => assetInteraction.clearMultiselect()}
      >
        <CreateSharedLink />
        <SelectAllAssets {timelineManager} {assetInteraction} />
        <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
          <AddToAlbum />
          <AddToAlbum shared />
        </ButtonContextMenu>
        <FavoriteAction
          removeFavorite={assetInteraction.isAllFavorite}
          onFavorite={(ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))}
        ></FavoriteAction>
        <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
          <DownloadAction menuItem />
          <ChangeDate menuItem />
          <ChangeDescription menuItem />
          <ChangeLocation menuItem />
          <ArchiveAction
            menuItem
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
        </ButtonContextMenu>
      </AssetSelectControlBar>
    </div>
  {/if}
</section>
