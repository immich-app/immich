<script lang="ts">
  import { goto } from '$app/navigation';
  import empty3Url from '$lib/assets/empty-3.svg';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import RestoreAssets from '$lib/components/timeline/actions/RestoreAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { AppRoute } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { getTrashActions } from '$lib/services/trash.service';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  let timelineManager = $state<TimelineManager>() as TimelineManager;
  const options = { isTrashed: true };

  const assetInteraction = new AssetInteraction();

  if (!featureFlagsManager.value.trash) {
    handlePromiseError(goto(AppRoute.PHOTOS));
  }

  const handleEscape = () => {
    if (assetInteraction.selectionActive) {
      assetInteraction.clearMultiselect();
      return;
    }
  };

  const { Empty, RestoreAll } = $derived(getTrashActions($t));
</script>

{#if featureFlagsManager.value.trash}
  <UserPageLayout
    hideNavbar={assetInteraction.selectionActive}
    actions={assetInteraction.selectionActive ? [] : [Empty, RestoreAll]}
    title={data.meta.title}
    scrollbar={false}
  >
    <Timeline enableRouting={true} bind:timelineManager {options} {assetInteraction} onEscape={handleEscape}>
      <p class="font-medium text-gray-500/60 dark:text-gray-300/60 p-4">
        {$t('trashed_items_will_be_permanently_deleted_after', {
          values: { days: serverConfigManager.value.trashDays },
        })}
      </p>
      {#snippet empty()}
        <EmptyPlaceholder text={$t('trash_no_results_message')} src={empty3Url} class="mt-10 mx-auto" />
      {/snippet}
    </Timeline>
  </UserPageLayout>
{/if}

{#if assetInteraction.selectionActive}
  <AssetSelectControlBar
    assets={assetInteraction.selectedAssets}
    clearSelect={() => assetInteraction.clearMultiselect()}
  >
    <SelectAllAssets {timelineManager} {assetInteraction} />
    <DeleteAssets force onAssetDelete={(assetIds) => timelineManager.removeAssets(assetIds)} />
    <RestoreAssets onRestore={(assetIds) => timelineManager.removeAssets(assetIds)} />
  </AssetSelectControlBar>
{/if}
