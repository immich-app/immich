<script lang="ts">
  import { executeMutation, queryClient } from '#lib/queries/client.ts';
  import {
    bulkTagUntagAssetsMutation,
    getAllTagsQuery,
    getTagsForAssetsQuery,
    upsertTagsMutation,
  } from '#lib/queries/tag.query.ts';
  import type { TagsForAssetsResponseDto } from '@immich/sdk';
  import { FormModal, toastManager } from '@immich/ui';
  import { mdiTag } from '@mdi/js';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';
  import Combobox, { type ComboBoxOption } from '../components/shared-components/Combobox.svelte';
  import TagPill from '../components/shared-components/TagPill.svelte';

  interface Props {
    onClose: (updated?: boolean) => void;
    assetIds: string[];
  }

  let { onClose, assetIds }: Props = $props();

  const query = createQuery(getAllTagsQuery, () => queryClient);
  const assignmentsQuery = createQuery(
    () => getTagsForAssetsQuery(assetIds),
    () => queryClient,
  );
  const allTags = $derived(query.data ?? []);
  const tagMap = $derived(Object.fromEntries(allTags.map((tag) => [tag.id, tag])));
  const selectedTags = new SvelteSet<{ id: string; count: number; partial: boolean }>();
  let existingTagsForAssets: TagsForAssetsResponseDto[] = $state([]);
  let initialized = $state(false);
  let saving = $state(false);
  let creating = $state(false);
  const ready = $derived(initialized && query.isSuccess && assignmentsQuery.isSuccess);

  $effect(() => {
    if (
      !initialized &&
      assignmentsQuery.isSuccess &&
      assignmentsQuery.isFetchedAfterMount &&
      !assignmentsQuery.isFetching
    ) {
      existingTagsForAssets = assignmentsQuery.data.map((tag) => ({ ...tag, assetIds: [...(tag.assetIds ?? [])] }));
      for (const tag of existingTagsForAssets) {
        const count = tag.assetIds?.length ?? 0;
        selectedTags.add({ id: tag.tagId, count, partial: count < assetIds.length });
      }
      initialized = true;
    }
  });

  const tagIsSelected = (tagId: string, excludePartials: boolean) =>
    [...selectedTags].some((tag) => tag.id === tagId && (!excludePartials || !tag.partial));

  const onSubmit = async () => {
    if (!ready || saving || creating) {
      return;
    }

    const tagIdsToAdd = [...selectedTags]
      .filter(
        (tag) =>
          !tag.partial &&
          existingTagsForAssets.every(
            (existing) => existing.tagId !== tag.id || existing.assetIds?.length !== assetIds.length,
          ),
      )
      .map((tag) => tag.id);
    const tagIdsToRemove = existingTagsForAssets
      .filter((tag) => !tagIsSelected(tag.tagId, false))
      .map((tag) => tag.tagId);

    if (tagIdsToAdd.length === 0 && tagIdsToRemove.length === 0) {
      onClose(false);
      return;
    }

    saving = true;
    try {
      await executeMutation(
        bulkTagUntagAssetsMutation,
        [{ tagBulkAddRemoveAssetsDto: { assetIds, tagIdsToAdd, tagIdsToRemove } }],
        {
          confirm: assetIds.length > 40 && {
            prompt: $t('modify_tags_confirmation', { values: { count: assetIds.length } }),
          },
          onSuccess: ({ addedCount, removedCount }) => {
            if (addedCount) {
              toastManager.primary($t('tagged_assets', { values: { count: addedCount } }));
            }
            if (removedCount) {
              toastManager.primary($t('removed_tagged_assets', { values: { count: removedCount } }));
            }
            onClose(true);
          },
        },
      );
    } finally {
      saving = false;
    }
  };

  const handleRemove = (id: string) => {
    for (const tag of selectedTags) {
      if (tag.id === id) {
        selectedTags.delete(tag);
        break;
      }
    }
  };

  const handleSelect = async (option?: ComboBoxOption) => {
    if (!option || !ready || saving || creating) {
      return;
    }

    if (option.id) {
      handleRemove(option.value);
      selectedTags.add({ id: option.value, count: assetIds.length, partial: false });
      return;
    }

    creating = true;
    try {
      await executeMutation(upsertTagsMutation, [{ tagUpsertDto: { tags: [option.label] } }], {
        onSuccess: ([newTag]) => {
          handleRemove(newTag.id);
          selectedTags.add({ id: newTag.id, count: assetIds.length, partial: false });
        },
      });
    } finally {
      creating = false;
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
  disabled={!ready || saving || creating || (selectedTags.size === 0 && existingTagsForAssets.length === 0)}
>
  {#if query.isError || assignmentsQuery.isError}
    <p role="alert">{$t('errors.failed_to_tag_assets')}</p>
  {/if}
  <div class="my-4 flex flex-col gap-2">
    <Combobox
      onSelect={handleSelect}
      label={$t('tag')}
      allowCreate
      disabled={!ready || saving || creating}
      defaultFirstOption
      options={allTags
        .filter((tag) => !tagIsSelected(tag.id, true))
        .map((tag) => ({ id: tag.id, label: tag.value, value: tag.id }))}
      placeholder={$t('search_tags')}
    />
  </div>
  <section class="flex flex-wrap gap-1 pt-2">
    {#each selectedTags as { id, count, partial } (id)}
      {const tag = $derived(tagMap[id])}
      {#if tag}
        <TagPill
          label={tag.value}
          {partial}
          tooltipText={partial
            ? `${count} of the ${assetIds.length} selected assets have this tag`
            : assetIds.length > 1
              ? `All ${assetIds.length} selected assets have this tag`
              : undefined}
          onRemove={() => {
            if (!saving) {
              handleRemove(id);
            }
          }}
        />
      {/if}
    {/each}
  </section>
</FormModal>
