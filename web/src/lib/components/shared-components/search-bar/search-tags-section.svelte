<script lang="ts">
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { getAllTags, type TagResponseDto } from '@immich/sdk';
  import { Checkbox, Icon, Label } from '@immich/ui';
  import { mdiClose } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';

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
      <div class="my-4 flex flex-col gap-2">
        <div class="[&_label]:uppercase">
          <Combobox
            disabled={selectedTags === null}
            onSelect={handleSelect}
            label={$t('tags')}
            defaultFirstOption
            options={allTags.map((tag) => ({ id: tag.id, label: tag.value, value: tag.id }))}
            bind:selectedOption
            placeholder={$t('search_tags')}
          />
        </div>
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
        <Label label={$t('untagged')} for="untagged-checkbox" />
      </div>
    </form>

    <section class="flex flex-wrap pt-2 gap-1">
      {#each selectedTags ?? [] as tagId (tagId)}
        {@const tag = tagMap[tagId]}
        {#if tag}
          <div class="flex group transition-all">
            <span
              class="inline-block h-min whitespace-nowrap ps-3 pe-1 group-hover:ps-3 py-1 text-center align-baseline leading-none text-gray-100 dark:text-immich-dark-gray bg-primary roudned-s-full hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
            >
              <p class="text-sm">
                {tag.value}
              </p>
            </span>

            <button
              type="button"
              class="text-gray-100 dark:text-immich-dark-gray bg-immich-primary/95 dark:bg-immich-dark-primary/95 rounded-e-full place-items-center place-content-center pe-2 ps-1 py-1 hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
              title={$t('remove_tag')}
              onclick={() => handleRemove(tagId)}
            >
              <Icon icon={mdiClose} />
            </button>
          </div>
        {/if}
      {/each}
    </section>
  </div>
{/if}
