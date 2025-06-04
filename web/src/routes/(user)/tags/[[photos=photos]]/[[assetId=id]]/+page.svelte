<script lang="ts">
  import { goto } from '$app/navigation';
  import SkipLink from '$lib/components/elements/buttons/skip-link.svelte';
  import UserPageLayout, { headerId } from '$lib/components/layouts/user-page-layout.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import Breadcrumbs from '$lib/components/shared-components/tree/breadcrumbs.svelte';
  import TreeItemThumbnails from '$lib/components/shared-components/tree/tree-item-thumbnails.svelte';
  import TreeItems from '$lib/components/shared-components/tree/tree-items.svelte';
  import Sidebar from '$lib/components/sidebar/sidebar.svelte';
  import { AppRoute, AssetAction, QueryParameter, SettingInputFieldType } from '$lib/constants';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import { AssetStore } from '$lib/managers/timeline-manager/asset-store.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { joinPaths } from '$lib/utils/tree-utils';
  import { deleteTag, getAllTags, updateTag, upsertTags, type TagResponseDto } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter, Text } from '@immich/ui';
  import { mdiPencil, mdiPlus, mdiTag, mdiTagMultiple, mdiTrashCanOutline } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const assetInteraction = new AssetInteraction();

  const buildMap = (tags: TagResponseDto[]) => {
    return Object.fromEntries(tags.map((tag) => [tag.value, tag]));
  };
  const assetStore = new AssetStore();
  $effect(() => void assetStore.updateOptions({ deferInit: !tag, tagId }));
  onDestroy(() => assetStore.destroy());

  let tags = $derived<TagResponseDto[]>(data.tags);
  const tagsMap = $derived(buildMap(tags));
  const tag = $derived(tagsMap[data.tree.path]);
  const tagId = $derived(tag?.id);

  const handleNavigation = async (tag: string) => {
    await navigateToView(joinPaths([data.tree.path, tag]));
  };

  const getLink = (path: string) => {
    const url = new URL(AppRoute.TAGS, globalThis.location.href);
    url.searchParams.set(QueryParameter.PATH, path);
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

    const isConfirm = await modalManager.showDialog({
      title: $t('delete_tag'),
      prompt: $t('delete_tag_confirmation_prompt', { values: { tagName: tag.value } }),
      confirmText: $t('delete'),
    });

    if (!isConfirm) {
      return;
    }

    await deleteTag({ id: tag.id });
    tags = await getAllTags();

    // navigate to parent
    await navigateToView(data.tree.parent ? data.tree.parent.path : '');
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
          <TreeItems
            icons={{ default: mdiTag, active: mdiTag }}
            node={data.tree}
            active={data.tree.path}
            {getLink}
            {getColor}
          />
        </div>
      </section>
    </Sidebar>
  {/snippet}

  {#snippet buttons()}
    <HStack>
      <Button leadingIcon={mdiPlus} onclick={handleCreate} size="small" variant="ghost" color="secondary">
        <Text class="hidden md:block">{$t('create_tag')}</Text>
      </Button>

      {#if data.tree.path.length > 0 && tag}
        <Button leadingIcon={mdiPencil} onclick={handleEdit} size="small" variant="ghost" color="secondary">
          <Text class="hidden md:block">{$t('edit_tag')}</Text>
        </Button>
        <Button leadingIcon={mdiTrashCanOutline} onclick={handleDelete} size="small" variant="ghost" color="secondary">
          <Text class="hidden md:block">{$t('delete_tag')}</Text>
        </Button>
      {/if}
    </HStack>
  {/snippet}

  <Breadcrumbs node={data.tree} icon={mdiTagMultiple} title={$t('tags')} {getLink} />

  <section class="mt-2 h-[calc(100%-(--spacing(20)))] overflow-auto immich-scrollbar">
    {#if tag}
      <AssetGrid enableRouting={true} {assetStore} {assetInteraction} removeAction={AssetAction.UNARCHIVE}>
        {#snippet empty()}
          <TreeItemThumbnails items={data.tree.children} icon={mdiTag} onClick={handleNavigation} />
        {/snippet}
      </AssetGrid>
    {:else}
      <TreeItemThumbnails items={data.tree.children} icon={mdiTag} onClick={handleNavigation} />
    {/if}
  </section>
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
