<script lang="ts">
  import { executeMutation, queryClient } from '#lib/queries/client.ts';
  import { bulkTagAssetsMutation, getAllTagsQuery, upsertTagsMutation } from '#lib/queries/tag.query.ts';
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
  const allTags = $derived(query.data ?? []);
  let tagMap = $derived(Object.fromEntries(allTags.map((tag) => [tag.id, tag])));
  let selectedIds = new SvelteSet<string>();
  let disabled = $derived(selectedIds.size === 0);
  let allowCreate: boolean = $state(true);

  const onSubmit = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    await executeMutation(bulkTagAssetsMutation, [{ tagBulkAssetsDto: { assetIds, tagIds: [...selectedIds] } }], {
      onSuccess: ({ count }) => {
        toastManager.primary($t('tagged_assets', { values: { count } }));
        onClose(true);
      },
    });
  };

  const handleSelect = async (option?: ComboBoxOption) => {
    if (!option) {
      return;
    }

    if (option.id) {
      selectedIds.add(option.value);
      return;
    }

    await executeMutation(upsertTagsMutation, [{ tagUpsertDto: { tags: [option.label] } }], {
      onSuccess: ([newTag]) => selectedIds.add(newTag.id),
    });
  };

  const handleRemove = (tag: string) => {
    selectedIds.delete(tag);
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
      forceFocus
    />
  </div>

  <section class="flex flex-wrap gap-1 pt-2">
    {#each selectedIds as tagId (tagId)}
      {const tag = $derived(tagMap[tagId])}
      {#if tag}
        <TagPill label={tag.value} onRemove={() => handleRemove(tagId)} />
      {/if}
    {/each}
  </section>
</FormModal>
