<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import SkipLink from '$lib/components/elements/buttons/skip-link.svelte';
  import UserPageLayout, { headerId } from '$lib/components/layouts/user-page-layout.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
  import Breadcrumbs from '$lib/components/shared-components/tree/breadcrumbs.svelte';
  import TreeItemThumbnails from '$lib/components/shared-components/tree/tree-item-thumbnails.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import { AppRoute, AssetAction, QueryParameter, SettingInputFieldType } from '$lib/constants';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { AssetStore } from '$lib/stores/assets-store.svelte';
  import { buildTree, normalizeTreePath } from '$lib/utils/tree-utils';
  import { deleteTag, getAllTags, updateTag, upsertTags, type TagResponseDto } from '@immich/sdk';
  import { Button, HStack, Text } from '@immich/ui';
  import { mdiPencil, mdiPlus, mdiTag, mdiTagMultiple, mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import { onDestroy } from 'svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let pathSegments = $derived(data.path ? data.path.split('/') : []);
  let currentPath = $derived($page.url.searchParams.get(QueryParameter.PATH) || '');

  const assetInteraction = new AssetInteraction();

  const buildMap = (tags: TagResponseDto[]) => {
    return Object.fromEntries(tags.map((tag) => [tag.value, tag]));
  };
  const assetStore = new AssetStore();
  $effect(() => void assetStore.updateOptions({ deferInit: !tag, tagId }));
  onDestroy(() => assetStore.destroy());

  let tags = $derived<TagResponseDto[]>(data.tags);
  let tagsMap = $derived(buildMap(tags));
  let tag = $derived(currentPath ? tagsMap[currentPath] : null);
  let tagId = $derived(tag?.id);
  let tree = $derived(buildTree(tags.map((tag) => tag.value)));

  const handleNavigation = async (tag: string) => {
    await navigateToView(normalizeTreePath(`${data.path || ''}/${tag}`));
  };

  const getLink = (path: string) => {
    const url = new URL(AppRoute.TAGS, globalThis.location.href);
    if (path) {
      url.searchParams.set(QueryParameter.PATH, path);
    }
    return url.href;
  };

  const getColor = (path: string) => tagsMap[path]?.color;

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
      await updateTag({ id: tag.id, tagUpdateDto: { color: newTagColor } });

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

  const handleDelete = async () => {
    if (!tag) {
      return;
    }

    const isConfirm = await dialogController.show({
      title: $t('delete_tag'),
      prompt: $t('delete_tag_confirmation_prompt', { values: { tagName: tag.value } }),
      confirmText: $t('delete'),
      cancelText: $t('cancel'),
    });

    if (!isConfirm) {
      return;
    }

    await deleteTag({ id: tag.id });
    tags = await getAllTags();

    // navigate to parent
    const parentPath = pathSegments.slice(0, -1).join('/');
    await navigateToView(parentPath);
  };

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handleSubmit();
  };
</script>

<UserPageLayout title={data.meta.title}>
  {#snippet sidebar()}
    <SideBarSection>
      <SkipLink target={`#${headerId}`} text={$t('skip_to_tags')} breakpoint="md" />
      <section>
        <div class="text-xs ps-4 mb-2 dark:text-white">{$t('explorer').toUpperCase()}</div>
        <div class="h-full">
          <TreeItems
            icons={{ default: mdiTag, active: mdiTag }}
            items={tree}
            active={currentPath}
            {getLink}
            {getColor}
          />
        </div>
      </section>
    </SideBarSection>
  {/snippet}

  {#snippet buttons()}
    <HStack>
      <Button leadingIcon={mdiPlus} onclick={handleCreate} size="small" variant="ghost" color="secondary">
        <Text class="hidden md:block">{$t('create_tag')}</Text>
      </Button>

      {#if pathSegments.length > 0 && tag}
        <Button leadingIcon={mdiPencil} onclick={handleEdit} size="small" variant="ghost" color="secondary">
          <Text class="hidden md:block">{$t('edit_tag')}</Text>
        </Button>
        <Button leadingIcon={mdiTrashCanOutline} onclick={handleDelete} size="small" variant="ghost" color="secondary">
          <Text class="hidden md:block">{$t('delete_tag')}</Text>
        </Button>
      {/if}
    </HStack>
  {/snippet}

  <Breadcrumbs {pathSegments} icon={mdiTagMultiple} title={$t('tags')} {getLink} />

  <section class="mt-2 h-[calc(100%-theme(spacing.20))] overflow-auto immich-scrollbar">
    {#if tag}
      <AssetGrid enableRouting={true} {assetStore} {assetInteraction} removeAction={AssetAction.UNARCHIVE}>
        {#snippet empty()}
          <TreeItemThumbnails items={data.children} icon={mdiTag} onClick={handleNavigation} />
        {/snippet}
      </AssetGrid>
    {:else}
      <TreeItemThumbnails items={Object.keys(tree)} icon={mdiTag} onClick={handleNavigation} />
    {/if}
  </section>
</UserPageLayout>

{#if isNewOpen}
  <FullScreenModal title={$t('create_tag')} icon={mdiTag} onClose={handleCancel}>
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

    {#snippet stickyBottom()}
      <Button color="secondary" fullWidth shape="round" onclick={() => handleCancel()}>{$t('cancel')}</Button>
      <Button type="submit" fullWidth shape="round" form="create-tag-form">{$t('create')}</Button>
    {/snippet}
  </FullScreenModal>
{/if}

{#if isEditOpen}
  <FullScreenModal title={$t('edit_tag')} icon={mdiTag} onClose={handleCancel}>
    <form {onsubmit} autocomplete="off" id="edit-tag-form">
      <div class="my-4 flex flex-col gap-2">
        <SettingInputField
          inputType={SettingInputFieldType.COLOR}
          label={$t('color').toUpperCase()}
          bind:value={newTagColor}
        />
      </div>
    </form>

    {#snippet stickyBottom()}
      <Button color="secondary" fullWidth shape="round" onclick={() => handleCancel()}>{$t('cancel')}</Button>
      <Button type="submit" fullWidth shape="round" form="edit-tag-form">{$t('save')}</Button>
    {/snippet}
  </FullScreenModal>
{/if}
