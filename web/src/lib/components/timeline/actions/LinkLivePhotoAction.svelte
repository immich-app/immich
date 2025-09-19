<script lang="ts">
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { OnLink, OnUnlink } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { getAssetInfo, updateAsset } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiLinkOff, mdiMotionPlayOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';

  interface Props {
    onLink: OnLink;
    onUnlink: OnUnlink;
    menuItem?: boolean;
    unlink?: boolean;
  }

  let { onLink, onUnlink, menuItem = false, unlink = false }: Props = $props();

  let loading = $state(false);

  let text = $derived(unlink ? $t('unlink_motion_video') : $t('link_motion_video'));
  let icon = $derived(unlink ? mdiLinkOff : mdiMotionPlayOutline);

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const onClick = () => (unlink ? handleUnlink() : handleLink());

  const handleLink = async () => {
    let [still, motion] = [...getOwnedAssets()];
    if ((still as TimelineAsset).isVideo) {
      [still, motion] = [motion, still];
    }

    try {
      loading = true;
      const stillResponse = await updateAsset({ id: still.id, updateAssetDto: { livePhotoVideoId: motion.id } });
      onLink({ still: toTimelineAsset(stillResponse), motion: motion as TimelineAsset });
      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.unable_to_link_motion_video'));
    } finally {
      loading = false;
    }
  };

  const handleUnlink = async () => {
    const [still] = [...getOwnedAssets()];
    if (!still) {
      return;
    }
    const motionId = still.livePhotoVideoId;
    if (!motionId) {
      return;
    }
    try {
      loading = true;
      const stillResponse = await updateAsset({ id: still.id, updateAssetDto: { livePhotoVideoId: null } });
      const motionResponse = await getAssetInfo({ ...authManager.params, id: motionId });
      onUnlink({ still: toTimelineAsset(stillResponse), motion: toTimelineAsset(motionResponse) });
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
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      aria-label={$t('loading')}
      icon={mdiTimerSand}
      onclick={() => {}}
    />
  {:else}
    <IconButton shape="round" color="secondary" variant="ghost" aria-label={text} {icon} onclick={onClick} />
  {/if}
{/if}
