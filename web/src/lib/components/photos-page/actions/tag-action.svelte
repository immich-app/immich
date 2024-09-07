<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { tagAssets } from '$lib/utils/asset-utils';
  import { mdiTagMultipleOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import TagAssetForm from '$lib/components/forms/tag-asset-form.svelte';

  export let menuItem = false;

  const text = $t('tag');
  const icon = mdiTagMultipleOutline;

  let loading = false;
  let isOpen = false;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleOpen = () => (isOpen = true);
  const handleCancel = () => (isOpen = false);
  const handleTag = async (tagIds: string[]) => {
    const assets = [...getOwnedAssets()];
    loading = true;
    const ids = await tagAssets({ tagIds, assetIds: assets.map((asset) => asset.id) });
    if (ids) {
      clearSelect();
    }
    loading = false;
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
  <TagAssetForm onTag={(tagIds) => handleTag(tagIds)} onCancel={handleCancel} />
{/if}
