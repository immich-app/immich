<script lang="ts">
  import { goto } from '$app/navigation';
  import SkipLink from '$lib/components/elements/buttons/skip-link.svelte';
  import UserPageLayout, { headerId } from '$lib/components/layouts/user-page-layout.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import Breadcrumbs from '$lib/components/shared-components/tree/breadcrumbs.svelte';
  import TreeItemThumbnails from '$lib/components/shared-components/tree/tree-item-thumbnails.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import Sidebar from '$lib/components/sidebar/sidebar.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import ChangeDescription from '$lib/components/photos-page/actions/change-description-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import SetVisibilityAction from '$lib/components/photos-page/actions/set-visibility-action.svelte';
  import TagAction from '$lib/components/photos-page/actions/tag-action.svelte';
  import { AppRoute, AssetAction, QueryParameter, SettingInputFieldType } from '$lib/constants';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { joinPaths, TreeNode } from '$lib/utils/tree-utils';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import { deleteTag, getAllTags, type TagResponseDto, updateTag, upsertTags } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { mdiDotsVertical, mdiPencil, mdiPlus, mdiTag, mdiTagMultiple, mdiTrashCanOutline } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const assetInteraction = new AssetInteraction();

  const timelineManager = new TimelineManager();
  $effect(() => void timelineManager.updateOptions({ deferInit: !tag, tagId: tag?.id }));
  onDestroy(() => timelineManager.destroy());

  let tags = $derived<TagResponseDto[]>(data.tags);
  const tree = $derived(TreeNode.fromTags(tags));
  const tag = $derived(tree.traverse(data.path));

  const handleNavigation = (tag: string) => navigateToView(joinPaths(data.path, tag));

  const getLink = (path: string) => {
    const url = new URL(AppRoute.TAGS, globalThis.location.href);
    url.searchParams.set(QueryParameter.PATH, path);
    return url.href;
  };

  const navigateToView = (path: string) => goto(getLink(path));

  let isNewOpen = $state(false);
  let newTagValue = $state('');
  const handleCreate = () => {
    newTagValue = tag ? tag.value + '/' : '';
    isNewOpen = true;
  };

  let isEditOpen = $state(false);
  let newTagColor = $state('');
  const handleEdit = () => {
    newTagColor = tag?.color ?? '';
    isEditOpen = true;
  };

  const handleCancel = () => {
    isNewOpen = false;
    isEditOpen = false;
  };

  const handleSubmit = async () => {
    if (tag && isEditOpen && newTagColor) {
      await updateTag({ id: tag.id!, tagUpdateDto: { color: newTagColor } });

      notificationController.show({
        message: $t('tag_updated', { values: { tag: tag.value } }),
        type: NotificationType.Info,
      });

      tags = await getAllTags();
      isEditOpen = false;
    }

    if (isNewOpen && newTagValue) {
      const [newTag] = await upsertTags({ tagUpsertDto: { tags: [newTagValue] } });

      notificationController.show({
        message: $t('tag_created', { values: { tag: newTag.value } }),
        type: NotificationType.Info,
      });

      tags = await getAllTags();
      isNewOpen = false;
    }
  };

  const handleSetVisibility = (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    assetInteraction.clearMultiselect();
  };

  const handleRemoveAssets = (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
  };

  const handleUndoRemoveAssets = (assets: TimelineAsset[]) => {
    timelineManager.addAssets(assets);
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

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handleSubmit();
  };
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet sidebar()}
    <Sidebar>
      <SkipLink target={`#${headerId}`} text={$t('skip_to_tags')} breakpoint="md" />
      <section>
        <div class="text-xs ps-4 mb-2 dark:text-white">{$t('explorer').toUpperCase()}</div>
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
      <AssetGrid enableRouting={true} {timelineManager} {assetInteraction} removeAction={AssetAction.UNARCHIVE}>
        {#snippet empty()}
          <TreeItemThumbnails items={tag.children} icon={mdiTag} onClick={handleNavigation} />
        {/snippet}
      </AssetGrid>
    {:else}
      <TreeItemThumbnails items={tag.children} icon={mdiTag} onClick={handleNavigation} />
    {/if}
  </section>

  {#if assetInteraction.selectionActive}
    <AssetSelectControlBar
      assets={assetInteraction.selectedAssets}
      clearSelect={() => assetInteraction.clearMultiselect()}
    >
      <CreateSharedLink />
      <SelectAllAssets {timelineManager} {assetInteraction} />
      <ButtonContextMenu icon={mdiPlus} title={$t('add_to')} offset={{ x: -25, y: 50 }} direction="left">
        <AddToAlbum />
        <AddToAlbum shared />
      </ButtonContextMenu>
      {#if assetInteraction.isAllUserOwned}
        <FavoriteAction
          removeFavorite={assetInteraction.isAllFavorite}
          onFavorite={(ids, isFavorite) =>
            timelineManager.updateAssetOperation(ids, (asset) => {
              asset.isFavorite = isFavorite;
              return { remove: false };
            })}
        ></FavoriteAction>
      {/if}
      <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')} offset={{ x: -25, y: 50 }} direction="left">
        <DownloadAction menuItem filename="{tag.value}.zip" />
        {#if assetInteraction.isAllUserOwned}
          <ChangeDate menuItem />
          <ChangeDescription menuItem />
          <ChangeLocation menuItem />
          <ArchiveAction menuItem unarchive={assetInteraction.isAllArchived} />
          <SetVisibilityAction menuItem onVisibilitySet={handleSetVisibility} />
        {/if}

        {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
          <TagAction menuItem />
        {/if}

        {#if assetInteraction.isAllUserOwned}
          <DeleteAssets menuItem onAssetDelete={handleRemoveAssets} onUndoDelete={handleUndoRemoveAssets} />
        {/if}
      </ButtonContextMenu>
    </AssetSelectControlBar>
  {/if}
</UserPageLayout>

{#if isNewOpen}
  <Modal size="small" title={$t('create_tag')} icon={mdiTag} onClose={handleCancel}>
    <ModalBody>
      <div class="text-immich-primary dark:text-immich-dark-primary">
        <p class="text-sm dark:text-immich-dark-fg">
          {$t('create_tag_description')}
        </p>
      </div>

      <form {onsubmit} autocomplete="off" id="create-tag-form">
        <div class="my-4 flex flex-col gap-2">
          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label={$t('tag').toUpperCase()}
            bind:value={newTagValue}
            required={true}
            autofocus={true}
          />
        </div>
      </form>
    </ModalBody>

    <ModalFooter>
      <div class="flex w-full gap-2">
        <Button color="secondary" fullWidth shape="round" onclick={() => handleCancel()}>{$t('cancel')}</Button>
        <Button type="submit" fullWidth shape="round" form="create-tag-form">{$t('create')}</Button>
      </div>
    </ModalFooter>
  </Modal>
{/if}

{#if isEditOpen}
  <Modal title={$t('edit_tag')} icon={mdiTag} onClose={handleCancel}>
    <ModalBody>
      <form {onsubmit} autocomplete="off" id="edit-tag-form">
        <div class="my-4 flex flex-col gap-2">
          <SettingInputField
            inputType={SettingInputFieldType.COLOR}
            label={$t('color').toUpperCase()}
            bind:value={newTagColor}
          />
        </div>
      </form>
    </ModalBody>

    <ModalFooter>
      <div class="flex w-full gap-2">
        <Button color="secondary" fullWidth shape="round" onclick={() => handleCancel()}>{$t('cancel')}</Button>
        <Button type="submit" fullWidth shape="round" form="edit-tag-form">{$t('save')}</Button>
      </div>
    </ModalFooter>
  </Modal>
{/if}
