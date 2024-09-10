<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type { OnLink } from '$lib/utils/actions';
  import { AssetTypeEnum, updateAsset } from '@immich/sdk';
  import { mdiMotionPlayOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';

  export let onLink: OnLink;
  export let menuItem = false;

  let loading = false;

  const text = $t('link_motion_video');
  const icon = mdiMotionPlayOutline;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleLink = async () => {
    let [still, motion] = [...getOwnedAssets()];
    if (still.type === AssetTypeEnum.Video) {
      [still, motion] = [motion, still];
    }

    loading = true;
    const response = await updateAsset({ id: still.id, updateAssetDto: { livePhotoVideoId: motion.id } });
    onLink(response);
    clearSelect();
    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption {text} {icon} onClick={handleLink} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title={$t('loading')} icon={mdiTimerSand} />
  {:else}
    <CircleIconButton title={text} {icon} on:click={handleLink} />
  {/if}
{/if}
