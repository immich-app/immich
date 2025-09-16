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
  import { mdiPencil, mdiPlus, mdiTag, mdiTagMultiple, mdiTrashCanOutline } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

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
      <Timeline enableRouting={true} {timelineManager} {assetInteraction} removeAction={AssetAction.UNARCHIVE}>
        {#snippet empty()}
          <TreeItemThumbnails items={tag.children} icon={mdiTag} onClick={handleNavigation} />
        {/snippet}
      </Timeline>
    {:else}
      <TreeItemThumbnails items={tag.children} icon={mdiTag} onClick={handleNavigation} />
    {/if}
  </section>
</UserPageLayout>
