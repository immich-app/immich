<script lang="ts">
  import Badge from '$lib/components/elements/badge.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import Combobox from '$lib/components/shared-components/combobox.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { AppRoute } from '$lib/constants';
  import { isSharedLink } from '$lib/utils';
  import { getAllTags, getAssetInfo, type AssetResponseDto, type TagResponseDto } from '@immich/sdk';
  import { mdiCameraIris, mdiPencil, mdiPlus, mdiTag, mdiTagOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { tagAssets } from '$lib/utils/asset-utils';

  export let asset: AssetResponseDto;
  export let isOwner: boolean;

  $: tags = asset.tags || [];

  let isOpen = false;
  let selectedTags = new Set<string>();
  let availableTags: TagResponseDto[] = [];

  const handleAdd = async () => {
    availableTags = await getAllTags();
    isOpen = true;
  };

  const handleCancel = () => (isOpen = false);

  const handleTag = async () => {
    const ids = await tagAssets({ tagIds: [...selectedTags], assetIds: [asset.id] });

    if (ids) {
      isOpen = false;
    }

    selectedTags.clear();
    asset = await getAssetInfo({ id: asset.id });
  };
</script>

{#if isOwner && !isSharedLink()}
  <section class="px-4 mt-4">
    <div class="flex h-10 w-full items-center justify-between text-sm">
      <h2>{$t('tags').toUpperCase()}</h2>
    </div>
    <section class="flex flex-wrap pt-2 gap-1">
      {#each tags as tag (tag.id)}
        <a href={encodeURI(`${AppRoute.TAGS}/?path=${tag.value}`)}>
          <Badge rounded="full"><span class="text-sm px-1" title={tag.value}>{tag.value}</span></Badge>
        </a>
      {/each}
      <button
        class="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 flex place-items-center place-content-center gap-1 px-2 py-1"
        title="Add tag"
        on:click={handleAdd}
      >
        <span class="text-sm px-1 flex place-items-center place-content-center gap-1"><Icon path={mdiPlus} />Add</span>
      </button>
    </section>
  </section>
{/if}

{#if isOpen}
  <FullScreenModal title={$t('tag_assets')} icon={mdiTag} onClose={handleCancel}>
    <form on:submit|preventDefault={handleTag} autocomplete="off" id="create-tag-form">
      <div class="my-4 flex flex-col gap-2">
        <Combobox
          on:select={({ detail: option }) => option && selectedTags.add(option.value)}
          label={$t('tag')}
          options={availableTags.map((tag) => ({ id: tag.id, label: tag.value, value: tag.id }))}
          placeholder={$t('search_tags')}
        />
      </div>
    </form>
    <svelte:fragment slot="sticky-bottom">
      <Button color="gray" fullwidth on:click={() => handleCancel()}>{$t('cancel')}</Button>
      <Button type="submit" fullwidth form="create-tag-form">{$t('tag_assets')}</Button>
    </svelte:fragment>
  </FullScreenModal>
{/if}
