<script lang="ts">
  import { mdiClose, mdiTag } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import Button from '../elements/buttons/button.svelte';
  import Combobox, { type ComboBoxOption } from '../shared-components/combobox.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { onMount } from 'svelte';
  import { getAllTags, type TagResponseDto } from '@immich/sdk';
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute } from '$lib/constants';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

  export let onTag: (tagIds: string[]) => void;
  export let onCancel: () => void;

  let allTags: TagResponseDto[] = [];
  $: tagMap = Object.fromEntries(allTags.map((tag) => [tag.id, tag]));
  let selectedIds = new Set<string>();
  $: disabled = selectedIds.size === 0;

  onMount(async () => {
    allTags = await getAllTags();
  });

  const handleSubmit = () => onTag([...selectedIds]);

  const handleSelect = (option?: ComboBoxOption) => {
    if (!option) {
      return;
    }

    selectedIds.add(option.value);
    selectedIds = selectedIds;
  };

  const handleRemove = (tag: string) => {
    selectedIds.delete(tag);
    selectedIds = selectedIds;
  };
</script>

<FullScreenModal title={$t('tag_assets')} icon={mdiTag} onClose={onCancel}>
  <div class="text-sm">
    <p>
      <FormatMessage key="tag_not_found_question" let:message>
        <a href={AppRoute.TAGS} class="text-immich-primary dark:text-immich-dark-primary underline">
          {message}
        </a>
      </FormatMessage>
    </p>
  </div>
  <form on:submit|preventDefault={handleSubmit} autocomplete="off" id="create-tag-form">
    <div class="my-4 flex flex-col gap-2">
      <Combobox
        onSelect={handleSelect}
        label={$t('tag')}
        options={allTags.map((tag) => ({ id: tag.id, label: tag.value, value: tag.id }))}
        placeholder={$t('search_tags')}
      />
    </div>
  </form>

  <section class="flex flex-wrap pt-2 gap-1">
    {#each selectedIds as tagId (tagId)}
      {@const tag = tagMap[tagId]}
      {#if tag}
        <div class="flex group transition-all">
          <span
            class="inline-block h-min whitespace-nowrap pl-3 pr-1 group-hover:pl-3 py-1 text-center align-baseline leading-none text-gray-100 dark:text-immich-dark-gray bg-immich-primary dark:bg-immich-dark-primary rounded-tl-full rounded-bl-full hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
          >
            <p class="text-sm">
              {tag.value}
            </p>
          </span>

          <button
            type="button"
            class="text-gray-100 dark:text-immich-dark-gray bg-immich-primary/95 dark:bg-immich-dark-primary/95 rounded-tr-full rounded-br-full place-items-center place-content-center pr-2 pl-1 py-1 hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
            title="Remove tag"
            on:click={() => handleRemove(tagId)}
          >
            <Icon path={mdiClose} />
          </button>
        </div>
      {/if}
    {/each}
  </section>

  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={onCancel}>{$t('cancel')}</Button>
    <Button type="submit" fullwidth form="create-tag-form" {disabled}>{$t('tag_assets')}</Button>
  </svelte:fragment>
</FullScreenModal>
