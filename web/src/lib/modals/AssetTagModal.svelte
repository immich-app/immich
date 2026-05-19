<script lang="ts">
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { tagAssets, removeTag } from '$lib/utils/asset-utils';
  import {
    getAllTags,
    getAllTagsForAssets,
    upsertTags,
    type TagResponseDto,
    type TagsForAssetsResponseDto,
  } from '@immich/sdk';
  import { FormModal } from '@immich/ui';
  import { mdiTag } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';
  import Combobox, { type ComboBoxOption } from '../components/shared-components/Combobox.svelte';
  import TagPill from '../components/shared-components/TagPill.svelte';

  interface Props {
    onClose: (updated?: boolean) => void;
    assetIds: string[];
  }

  let { onClose, assetIds }: Props = $props();

  let allTags: TagResponseDto[] = $state([]);
  let existingTagsForAssets: TagsForAssetsResponseDto[] = $state([]);
  let tagMap = $derived(Object.fromEntries(allTags.map((tag) => [tag.id, tag])));
  let selectedTags = new SvelteSet<{ id: string; count: number; partial: boolean }>();
  let disabled = $derived(selectedTags.size === 0 && existingTagsForAssets.length === 0);
  let allowCreate: boolean = $state(true);

  onMount(async () => {
    allTags = await getAllTags();
    existingTagsForAssets = await getAllTagsForAssets({ assetIds });
    for (const tagForAsset of existingTagsForAssets) {
      selectedTags.add({
        id: tagForAsset.tagId,
        count: tagForAsset.assetIds.length,
        partial: tagForAsset.assetIds.length < assetIds.length,
      });
    }
  });

  const onSubmit = async () => {
    const tagIdsToAdd = [...selectedTags].filter((tag) => tag.partial === false).map((tag) => tag.id);
    if (tagIdsToAdd?.length > 0) {
      console.log('tagIdsToAdd', tagIdsToAdd);
      const updatedIds = await tagAssets({
        tagIds: tagIdsToAdd,
        assetIds,
        showNotification: false,
      });
      eventManager.emit('AssetsTag', updatedIds);
    }

    const tagIdsToRemove: string[] = existingTagsForAssets
      .filter((tagForAsset) => {
        for (const selectedTag of selectedTags) {
          if (selectedTag.id === tagForAsset.tagId) {
            return false;
          }
        }
        return true;
      })
      .map((tagForAsset) => tagForAsset.tagId);

    if (tagIdsToRemove?.length > 0) {
      console.log('tagIdsToRemove', tagIdsToRemove);
      const removedIds = await removeTag({
        tagIds: tagIdsToRemove,
        assetIds,
        showNotification: false,
      });
      eventManager.emit('AssetsUntag', removedIds);
    }

    onClose(true);
  };

  const handleSelect = async (option?: ComboBoxOption) => {
    if (!option) {
      return;
    }

    if (option.id) {
      for (const item of selectedTags) {
        if (item.id === option.id) {
          selectedTags.delete(item);
          break;
        }
      }
      selectedTags.add({ id: option.id, count: assetIds.length, partial: false });
    } else {
      const [newTag] = await upsertTags({ tagUpsertDto: { tags: [option.label] } });
      allTags.push(newTag);
      selectedTags.add({ id: newTag.id, count: assetIds.length, partial: false });
    }
  };

  const handleRemove = (tag: { id: string; count: number; partial: boolean }) => {
    for (const item of selectedTags) {
      if (item.id === tag.id) {
        selectedTags.delete(item);
        break;
      }
    }
  };
</script>

<FormModal
  size="small"
  title={$t('tag_assets')}
  icon={mdiTag}
  {onClose}
  {onSubmit}
  submitText={$t('tag_assets')}
  onOpenAutoFocus={(event) => event.preventDefault()}
  {disabled}
>
  <div class="my-4 flex flex-col gap-2">
    <Combobox
      onSelect={handleSelect}
      label={$t('tag')}
      {allowCreate}
      defaultFirstOption
      options={allTags.map((tag) => ({ id: tag.id, label: tag.value, value: tag.id }))}
      placeholder={$t('search_tags')}
    />
  </div>
  <div>{JSON.stringify([...selectedTags])}</div>
  <section class="flex flex-wrap gap-1 pt-2">
    {#each selectedTags as { id, count, partial } (id)}
      {@const tag = tagMap[id]}
      {#if tag}
        <TagPill
          label={tag.value}
          {partial}
          tooltipText={partial
            ? `${count} of the ${assetIds.length} selected assets have this tag`
            : assetIds.length > 1
              ? `All ${assetIds.length} selected assets have this tag`
              : undefined}
          onRemove={() => handleRemove({ id, count, partial })}
        />
      {/if}
    {/each}
  </section>
</FormModal>
