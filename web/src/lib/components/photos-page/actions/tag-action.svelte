<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Combobox from '$lib/components/shared-components/combobox.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { tagAssets } from '$lib/utils/asset-utils';
  import { getAllTags, type TagResponseDto } from '@immich/sdk';
  import { mdiTag, mdiTagMultipleOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { onMount } from 'svelte';

  export let menuItem = false;

  const text = $t('tag');
  const icon = mdiTagMultipleOutline;

  let loading = false;
  let isOpen = false;
  let selectedTags = new Set<string>();
  let tags: TagResponseDto[] = [];

  onMount(async () => {
    tags = await getAllTags();
  });

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleOpen = () => (isOpen = true);
  const handleCancel = () => (isOpen = false);
  const handleTag = async () => {
    const assets = [...getOwnedAssets()];
    loading = true;
    const ids = await tagAssets({ tagIds: [...selectedTags], assetIds: assets.map((asset) => asset.id) });
    if (ids) {
      clearSelect();
    }
    loading = false;
    selectedTags.clear();
  };
</script>

{#if menuItem}
  <MenuOption {text} {icon} onClick={handleOpen} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title={$t('loading')} icon={mdiTimerSand} />
  {:else}
    <CircleIconButton title={text} {icon} on:click={handleOpen} />
  {/if}
{/if}

{#if isOpen}
  <FullScreenModal title={$t('tag_assets')} icon={mdiTag} onClose={handleCancel}>
    <form on:submit|preventDefault={handleTag} autocomplete="off" id="create-tag-form">
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
      <Button color="gray" fullwidth on:click={() => handleCancel()}>{$t('cancel')}</Button>
      <Button type="submit" fullwidth form="create-tag-form">{$t('tag_assets')}</Button>
    </svelte:fragment>
  </FullScreenModal>
{/if}
