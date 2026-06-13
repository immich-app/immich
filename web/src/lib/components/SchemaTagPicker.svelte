<script lang="ts">
  import Combobox from '$lib/components/shared-components/Combobox.svelte';
  import TagPill from '$lib/components/shared-components/TagPill.svelte';
  import { getAllTags, type TagResponseDto } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let { tagIds = $bindable([]) }: { tagIds: string[] } = $props();
  let tags: TagResponseDto[] = $state([]);

  onMount(async () => {
    tags = await getAllTags();
  });
</script>

<Combobox
  onSelect={(option) => {
    if (option && !tagIds.includes(option.value)) {
      tagIds.push(option.value);
    }
  }}
  label={$t('tags')}
  defaultFirstOption
  options={tags.map((tag) => ({ label: tag.value, value: tag.id }))}
  placeholder={$t('search_tags')}
/>

<section class="flex flex-wrap gap-1 pt-2">
  {#each tagIds as id, index (id)}
    <TagPill label={tags.find((t) => t.id === id)?.name ?? id} onRemove={() => tagIds.splice(index, 1)} />
  {/each}
</section>
