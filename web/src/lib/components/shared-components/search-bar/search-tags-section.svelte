<script lang="ts">
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { getAllTags, type TagResponseDto } from '@immich/sdk';
  import { Checkbox, Label, Text } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';
  import TagPill from '../tag-pill.svelte';

  interface Props {
    selectedTags: SvelteSet<string> | null;
  }

  let { selectedTags = $bindable() }: Props = $props();

  let allTags: TagResponseDto[] = $state([]);
  let tagMap = $derived(Object.fromEntries(allTags.map((tag) => [tag.id, tag])));
  let selectedOption = $state(undefined);

  onMount(async () => {
    allTags = await getAllTags();
  });

  const handleSelect = (option?: ComboBoxOption) => {
    if (!option || !option.id || selectedTags === null) {
      return;
    }

    selectedTags.add(option.value);
    selectedOption = undefined;
  };

  const handleRemove = (tag: string) => {
    if (selectedTags === null) {
      return;
    }

    selectedTags.delete(tag);
  };
</script>

{#if $preferences?.tags?.enabled}
  <div id="location-selection">
    <form autocomplete="off" id="create-tag-form">
      <div class="mb-4 flex flex-col">
        <Text class="py-3" fontWeight="medium">{$t('tags')}</Text>
        <Combobox
          disabled={selectedTags === null}
          hideLabel
          onSelect={handleSelect}
          label={$t('tags')}
          defaultFirstOption
          options={allTags.map((tag) => ({ id: tag.id, label: tag.value, value: tag.id }))}
          bind:selectedOption
          placeholder={$t('search_tags')}
        />
      </div>
      <div class="flex items-center gap-2">
        <Checkbox
          id="untagged-checkbox"
          size="tiny"
          checked={selectedTags === null}
          onCheckedChange={(checked) => {
            selectedTags = checked ? null : new SvelteSet();
          }}
        />
        <Label label={$t('untagged')} for="untagged-checkbox" class="text-sm font-normal" />
      </div>
    </form>

    <section class="flex flex-wrap pt-2 gap-1">
      {#each selectedTags ?? [] as tagId (tagId)}
        {@const tag = tagMap[tagId]}
        {#if tag}
          <TagPill label={tag.value} onRemove={() => handleRemove(tagId)} />
        {/if}
      {/each}
    </section>
  </div>
{/if}
