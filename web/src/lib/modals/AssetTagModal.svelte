<script lang="ts">
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { tagAssets } from '$lib/utils/asset-utils';
  import { getAllTags, upsertTags, type TagResponseDto } from '@immich/sdk';
  import { FormModal } from '@immich/ui';
  import { mdiTag } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';
  import Combobox, { type ComboBoxOption } from '../components/shared-components/combobox.svelte';
  import TagPill from '../components/shared-components/tag-pill.svelte';

  interface Props {
    onClose: (updated?: boolean) => void;
    assetIds: string[];
  }

  let { onClose, assetIds }: Props = $props();

  let allTags: TagResponseDto[] = $state([]);
  let tagMap = $derived(Object.fromEntries(allTags.map((tag) => [tag.id, tag])));
  let selectedIds = new SvelteSet<string>();
  let disabled = $derived(selectedIds.size === 0);
  let allowCreate: boolean = $state(true);

  onMount(async () => {
    allTags = await getAllTags();
  });

  const onSubmit = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    const updatedIds = await tagAssets({ tagIds: [...selectedIds], assetIds, showNotification: false });
    eventManager.emit('AssetsTag', updatedIds);
    onClose(true);
  };

  const handleSelect = async (option?: ComboBoxOption) => {
    if (!option) {
      return;
    }

    if (option.id) {
      selectedIds.add(option.value);
    } else {
      const [newTag] = await upsertTags({ tagUpsertDto: { tags: [option.label] } });
      allTags.push(newTag);
      selectedIds.add(newTag.id);
    }
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

  <section class="flex flex-wrap pt-2 gap-1">
    {#each selectedIds as tagId (tagId)}
      {@const tag = tagMap[tagId]}
      {#if tag}
        <TagPill label={tag.value} onRemove={() => handleRemove(tagId)} />
      {/if}
    {/each}
  </section>
</FormModal>
