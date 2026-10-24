<script lang="ts">
  import { goto } from '$app/navigation';
  import LockedAlbums from '$lib/components/album-page/LockedAlbums.svelte';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/ButtonContextMenu.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import SetVisibilityAction from '$lib/components/timeline/actions/SetVisibilityAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { AssetAction } from '$lib/constants';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { Route } from '$lib/route';
  import { isLockedAccessAllowed, revokeLockedAccess } from '$lib/services/locked-access';
  import { getUserActions } from '$lib/services/user.service';
  import { AssetVisibility } from '@immich/sdk';
  import { mdiDotsVertical } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let timelineManager = $state<TimelineManager>() as TimelineManager;
  let folderOpen = $state(false);
  const options = { visibility: AssetVisibility.Locked };

  const handleEscape = () => {
    if (!assetMultiSelectManager.selectionActive) {
      return;
    }

    assetMultiSelectManager.clear();
    return;
  };

  const handleMoveOffLockedFolder = (assetIds: string[]) => {
    assetMultiSelectManager.clear();
    timelineManager.removeAssets(assetIds);
  };

  const { LockSession } = $derived(getUserActions($t));
  const lockAction = $derived({ ...LockSession, onAction: () => void revokeLockedAccess() });

  const clearPrivateView = () => {
    folderOpen = false;
    assetMultiSelectManager.clear();
  };

  onDestroy(() => assetMultiSelectManager.clear());

  onMount(() => {
    // No timeline (including its asset requests) mounts before the bounded route
    // loader confirms a deadline. Recheck it in case navigation was delayed.
    if (isLockedAccessAllowed(data.lockedUntil)) {
      folderOpen = true;
    } else {
      void revokeLockedAccess();
    }
  });

  const onSessionLocked = async () => {
    clearPrivateView();
    await goto(Route.photos());
  };
</script>

<OnEvents {onSessionLocked} onAuthLogout={clearPrivateView} onSessionDelete={clearPrivateView} />

<UserPageLayout
  title={data.meta.title}
  actions={[lockAction]}
  hideNavbar={assetMultiSelectManager.selectionActive}
  scrollbar={false}
>
  {#if folderOpen}
    <Timeline
      enableRouting={true}
      bind:timelineManager
      {options}
      assetInteraction={assetMultiSelectManager}
      onEscape={handleEscape}
      removeAction={AssetAction.SET_VISIBILITY_TIMELINE}
    >
      <LockedAlbums deadline={data.lockedUntil} />
      {#snippet empty()}
        <EmptyPlaceholder text={$t('no_locked_photos_message')} title={$t('nothing_here_yet')} class="mx-auto mt-10" />
      {/snippet}
    </Timeline>
  {/if}
</UserPageLayout>

<!-- Multi-selection mode app bar -->
{#if assetMultiSelectManager.selectionActive}
  <AssetSelectControlBar>
    <SelectAllAssets withText {timelineManager} assetInteraction={assetMultiSelectManager} />
    <SetVisibilityAction unlock onVisibilitySet={handleMoveOffLockedFolder} />
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
      <DownloadAction menuItem />
      <ChangeDate menuItem />
      <ChangeLocation menuItem />
      <DeleteAssets menuItem force onAssetDelete={(assetIds) => timelineManager.removeAssets(assetIds)} />
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}
