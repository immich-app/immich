<script lang="ts">
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { tagUntagAssets } from '$lib/utils/asset-utils';
  import {
    getAllTags,
    getAllTagsForAssets,
    upsertTags,
    type TagResponseDto,
    type TagsForAssetsResponseDto,
  } from '@immich/sdk';
  import { FormModal, modalManager } from '@immich/ui';
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
  let allowCreate: boolean = $state(true);

  onMount(async () => {
    allTags = await getAllTags();
    existingTagsForAssets = await getAllTagsForAssets({ assetIds });

    for (const tagForAsset of existingTagsForAssets) {
      selectedTags.add({
        id: tagForAsset.tagId,
        count: tagForAsset.assetIds?.length || 0,
        partial: (tagForAsset.assetIds?.length || 0) < assetIds.length,
      });
    }
  });

  const tagIsSelected = (tagId: string, excludePartials: boolean) => {
    for (const tag of selectedTags) {
      if (tag.id === tagId && (!excludePartials || !tag.partial)) {
        return true;
      }
    }
    return false;
  };

  const onSubmit = async () => {
    // Only add tags from the selected tags list that are not partials and are not in the existing tags list. This ensures only newly added tags are sent server-side.
    const tagIdsToAdd = [...selectedTags]
      .filter(
        (tag) =>
          tag.partial === false &&
          !existingTagsForAssets.some((t) => t.tagId === tag.id && t.assetIds?.length === assetIds.length),
      )
      .map((tag) => tag.id);

    // Only remove tags that were in the existing tags list, but are no longer in the selected tags list. This ensures only removed tags are sent server-side.
    const tagIdsToRemove: string[] = existingTagsForAssets
      .filter((tagForAsset) => !tagIsSelected(tagForAsset.tagId, false))
      .map((tagForAsset) => tagForAsset.tagId);

    const isConfirmed =
      assetIds.length > 40
        ? await modalManager.showDialog({
            prompt: $t('modify_tags_confirmation', { values: { count: assetIds.length } }),
          })
        : true;

    if (isConfirmed && (tagIdsToAdd.length > 0 || tagIdsToRemove.length > 0)) {
      await tagUntagAssets({
        tagIdsToAdd,
        tagIdsToRemove,
        assetIds,
        showNotification: false,
      });
      eventManager.emit('AssetsTag', assetIds);
      onClose(true);
    } else {
      onClose(false);
    }
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
  title={$t('tag_add_edit')}
  icon={mdiTag}
  {onClose}
  {onSubmit}
  submitText={$t('save') + ' ' + $t('tags')}
  onOpenAutoFocus={(event) => event.preventDefault()}
  disabled={selectedTags.size === 0 && existingTagsForAssets.length === 0}
>
  <div class="my-4 flex flex-col gap-2">
    <Combobox
      onSelect={handleSelect}
      label={$t('tag')}
      {allowCreate}
      defaultFirstOption
      options={allTags
        .filter((tag) => !tagIsSelected(tag.id, true))
        .map((tag) => ({ id: tag.id, label: tag.value, value: tag.id }))}
      placeholder={$t('search_tags')}
    />
  </div>
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
