<script lang="ts">
  import { tagAssets } from '$lib/utils/asset-utils';
  import { getAllTags, upsertTags, type TagResponseDto } from '@immich/sdk';
  import { Button, HStack, Icon, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiClose, mdiTag } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';
  import Combobox, { type ComboBoxOption } from '../components/shared-components/combobox.svelte';

  interface Props {
    onClose: (success?: true) => void;
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

  const handleSubmit = async () => {
    await tagAssets({ tagIds: [...selectedIds], assetIds, showNotification: false });
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

  const onsubmit = async (event: Event) => {
    event.preventDefault();
    await handleSubmit();
  };
</script>

<Modal size="small" title={$t('tag_assets')} icon={mdiTag} {onClose}>
  <ModalBody>
    <form {onsubmit} autocomplete="off" id="create-tag-form">
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
    </form>

    <section class="flex flex-wrap pt-2 gap-1">
      {#each selectedIds as tagId (tagId)}
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
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" fullWidth color="secondary" onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button type="submit" shape="round" fullWidth form="create-tag-form" {disabled}>{$t('tag_assets')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
