<script lang="ts">
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import { getAllTags, type TagResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiClose } from '@mdi/js';
  import { preferences } from '$lib/stores/user.store';

  interface Props {
    selectedTags: SvelteSet<string>;
  }

  let { selectedTags = $bindable() }: Props = $props();

  let allTags: TagResponseDto[] = $state([]);
  let tagMap = $derived(Object.fromEntries(allTags.map((tag) => [tag.id, tag])));
  let selectedOption = $state(undefined);

  onMount(async () => {
    allTags = await getAllTags();
  });

  const handleSelect = (option?: ComboBoxOption) => {
    if (!option || !option.id) {
      return;
    }

    selectedTags.add(option.value);
    selectedOption = undefined;
  };

  const handleRemove = (tag: string) => {
    selectedTags.delete(tag);
  };
</script>

{#if $preferences?.tags?.enabled}
  <div id="location-selection">
    <form autocomplete="off" id="create-tag-form">
      <div class="my-4 flex flex-col gap-2">
        <Combobox
          onSelect={handleSelect}
          label={$t('tags').toUpperCase()}
          defaultFirstOption
          options={allTags.map((tag) => ({ id: tag.id, label: tag.value, value: tag.id }))}
          bind:selectedOption
          placeholder={$t('search_tags')}
        />
      </div>
    </form>

    <section class="flex flex-wrap pt-2 gap-1">
      {#each selectedTags as tagId (tagId)}
        {@const tag = tagMap[tagId]}
        {#if tag}
          <div class="flex group transition-all">
            <span
              class="inline-block h-min whitespace-nowrap ps-3 pe-1 group-hover:ps-3 py-1 text-center align-baseline leading-none text-gray-100 dark:text-immich-dark-gray bg-immich-primary dark:bg-immich-dark-primary roudned-s-full hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
            >
              <p class="text-sm">
                {tag.value}
              </p>
            </span>

            <button
              type="button"
              class="text-gray-100 dark:text-immich-dark-gray bg-immich-primary/95 dark:bg-immich-dark-primary/95 rounded-e-full place-items-center place-content-center pe-2 ps-1 py-1 hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
              title="Remove tag"
              onclick={() => handleRemove(tagId)}
            >
              <Icon path={mdiClose} />
            </button>
          </div>
        {/if}
      {/each}
    </section>
  </div>
{/if}
