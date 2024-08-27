<script lang="ts">
  import { mdiTag } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import Button from '../elements/buttons/button.svelte';
  import Combobox from '../shared-components/combobox.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { onMount } from 'svelte';
  import { getAllTags, type TagResponseDto } from '@immich/sdk';

  export let onTag: (tagIds: string[]) => void;
  export let onCancel: () => void;

  let tags: TagResponseDto[] = [];
  let selectedTags = new Set<string>();

  onMount(async () => {
    tags = await getAllTags();
  });

  const handleSubmit = async () => {
    onTag([...selectedTags]);
    selectedTags.clear();
  };
</script>

<FullScreenModal title={$t('tag_assets')} icon={mdiTag} onClose={onCancel}>
  <form on:submit|preventDefault={handleSubmit} autocomplete="off" id="create-tag-form">
    <div class="my-4 flex flex-col gap-2">
      <Combobox
        on:select={({ detail: option }) => option && selectedTags.add(option.value)}
        label={$t('tag')}
        options={tags.map((tag) => ({ id: tag.id, label: tag.value, value: tag.id }))}
        placeholder={$t('search_tags')}
      />
    </div>
  </form>
  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={onCancel}>{$t('cancel')}</Button>
    <Button type="submit" fullwidth form="create-tag-form">{$t('tag_assets')}</Button>
  </svelte:fragment>
</FullScreenModal>
