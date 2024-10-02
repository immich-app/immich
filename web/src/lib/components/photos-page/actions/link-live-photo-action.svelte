<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type { OnLink, OnUnlink } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetTypeEnum, getAssetInfo, updateAsset } from '@immich/sdk';
  import { mdiLinkOff, mdiMotionPlayOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';

  export let onLink: OnLink;
  export let onUnlink: OnUnlink;
  export let menuItem = false;
  export let unlink = false;

  let loading = false;

  $: text = unlink ? $t('unlink_motion_video') : $t('link_motion_video');
  $: icon = unlink ? mdiLinkOff : mdiMotionPlayOutline;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const onClick = () => (unlink ? handleUnlink() : handleLink());

  const handleLink = async () => {
    let [still, motion] = [...getOwnedAssets()];
    if (still.type === AssetTypeEnum.Video) {
      [still, motion] = [motion, still];
    }

    try {
      loading = true;
      const stillResponse = await updateAsset({ id: still.id, updateAssetDto: { livePhotoVideoId: motion.id } });
      onLink({ still: stillResponse, motion });
      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.unable_to_link_motion_video'));
    } finally {
      loading = false;
    }
  };

  const handleUnlink = async () => {
    const [still] = [...getOwnedAssets()];

    const motionId = still?.livePhotoVideoId;
    if (!motionId) {
      return;
    }

    try {
      loading = true;
      const stillResponse = await updateAsset({ id: still.id, updateAssetDto: { livePhotoVideoId: null } });
      const motionResponse = await getAssetInfo({ id: motionId });
      onUnlink({ still: stillResponse, motion: motionResponse });
      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.unable_to_unlink_motion_video'));
    } finally {
      loading = false;
    }
  };
</script>

{#if menuItem}
  <MenuOption {text} {icon} {onClick} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title={$t('loading')} icon={mdiTimerSand} />
  {:else}
    <CircleIconButton title={text} {icon} on:click={onClick} />
  {/if}
{/if}
