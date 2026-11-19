<script lang="ts">
  import Combobox from '#lib/components/shared-components/Combobox.svelte';
  import TagPill from '#lib/components/shared-components/TagPill.svelte';
  import { queryClient } from '#lib/queries/client.ts';
  import { getAllTagsQuery } from '#lib/queries/tag.query.ts';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  type Props = {
    label: string;
    description?: string;
    selectedTags: string[];
    type: 'ids' | 'values';
  };

  let { label, description, selectedTags = $bindable([]), type }: Props = $props();
  const query = createQuery(getAllTagsQuery, () => queryClient);
  const tags = $derived(query.data ?? []);
</script>

<Combobox
  onSelect={(option) => {
    if (!option) {
      return;
    }

    const tag = type === 'ids' ? option.value : option.label;
    if (!selectedTags.includes(tag)) {
      selectedTags = [...selectedTags, tag];
    }
  }}
  {label}
  {description}
  defaultFirstOption
  options={tags.map((tag) => ({ label: tag.value, value: tag.id }))}
  placeholder={$t('search_tags')}
/>

<section class="flex flex-wrap gap-1 pt-2">
  {#each selectedTags as tag, index (tag)}
    <TagPill
      label={type === 'values' ? tag : (tags.find((t) => t.id === tag)?.name ?? tag)}
      onRemove={() => (selectedTags = selectedTags.filter((_, i) => i !== index))}
    />
  {/each}
</section>
