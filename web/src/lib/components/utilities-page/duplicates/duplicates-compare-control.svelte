<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import DuplicateAsset from '$lib/components/utilities-page/duplicates/duplicate-asset.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { suggestDuplicateByFileSize } from '$lib/utils';
  import { shortcuts } from '$lib/actions/shortcut';
  import { type AssetResponseDto } from '@immich/sdk';
  import { mdiCheck, mdiTrashCanOutline } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  export let assets: AssetResponseDto[];
  export let onResolve: (duplicateAssetIds: string[], trashIds: string[]) => void;

  const { isViewing: showAssetViewer, asset: viewingAsset, setAsset } = assetViewingStore;
  const getAssetIndex = (id: string) => assets.findIndex((asset) => asset.id === id);

  let selectedAssetIds = new Set<string>();
  $: trashCount = assets.length - selectedAssetIds.size;

  onMount(() => {
    const suggestedAsset = suggestDuplicateByFileSize(assets);

    if (!suggestedAsset) {
      selectedAssetIds = new Set(assets[0].id);
      return;
    }

    selectedAssetIds.add(suggestedAsset.id);
    selectedAssetIds = selectedAssetIds;
  });

  onDestroy(() => {
    assetViewingStore.showAssetViewer(false);
  });

  const onSelectAsset = (asset: AssetResponseDto) => {
    if (selectedAssetIds.has(asset.id)) {
      selectedAssetIds.delete(asset.id);
    } else {
      selectedAssetIds.add(asset.id);
    }

    selectedAssetIds = selectedAssetIds;
  };

  const onSelectNone = () => {
    selectedAssetIds.clear();
    selectedAssetIds = selectedAssetIds;
  };

  const onSelectAll = () => {
    selectedAssetIds = new Set(assets.map((asset) => asset.id));
  };

  const handleResolve = () => {
    const trashIds = assets.map((asset) => asset.id).filter((id) => !selectedAssetIds.has(id));
    const duplicateAssetIds = assets.map((asset) => asset.id);
    onResolve(duplicateAssetIds, trashIds);
  };
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'k', shift: true }, onShortcut: onSelectAll },
    { shortcut: { key: 't', shift: true }, onShortcut: onSelectNone },
    { shortcut: { key: 'c', shift: true }, onShortcut: handleResolve },
  ]}
/>

<div class="pt-4 rounded-3xl border dark:border-2 border-gray-300 dark:border-gray-700 max-w-[54rem] mx-auto mb-16">
  <div class="flex flex-wrap gap-1 place-items-center place-content-center px-4 pt-4">
    {#each assets as asset (asset.id)}
      <DuplicateAsset
        {asset}
        {onSelectAsset}
        isSelected={selectedAssetIds.has(asset.id)}
        onViewAsset={(asset) => setAsset(asset)}
      />
    {/each}
  </div>

  <div class="flex flex-wrap gap-y-6 mt-10 mb-4 px-6 w-full place-content-end justify-between">
    <!-- MARK ALL BUTTONS -->
    <div class="flex text-xs text-black">
      <button
        type="button"
        class="px-4 py-3 flex place-items-center gap-2 rounded-tl-full rounded-bl-full dark:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/90 bg-immich-primary/25 hover:bg-immich-primary/50"
        on:click={onSelectAll}><Icon path={mdiCheck} size="20" />{$t('select_keep_all')}</button
      >
      <button
        type="button"
        class="px-4 py-3 flex place-items-center gap-2 rounded-tr-full rounded-br-full dark:bg-immich-dark-primary/50 hover:dark:bg-immich-dark-primary/70 bg-immich-primary hover:bg-immich-primary/80 text-white"
        on:click={onSelectNone}><Icon path={mdiTrashCanOutline} size="20" />{$t('select_trash_all')}</button
      >
    </div>

    <!-- CONFIRM BUTTONS -->
    {#if trashCount === 0}
      <Button size="sm" color="primary" class="flex place-items-center gap-2" on:click={handleResolve}>
        <Icon path={mdiCheck} size="20" />{$t('keep_all')}
      </Button>
    {:else}
      <Button size="sm" color="red" class="flex place-items-center gap-2 py-3" on:click={handleResolve}>
        <Icon path={mdiTrashCanOutline} size="20" />{trashCount === assets.length
          ? $t('trash_all')
          : $t('trash_count', { values: { count: trashCount } })}
      </Button>
    {/if}
  </div>
</div>

{#if $showAssetViewer}
  {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
    <Portal target="body">
      <AssetViewer
        asset={$viewingAsset}
        showNavigation={assets.length > 1}
        on:next={() => {
          const index = getAssetIndex($viewingAsset.id) + 1;
          setAsset(assets[index % assets.length]);
        }}
        on:previous={() => {
          const index = getAssetIndex($viewingAsset.id) - 1 + assets.length;
          setAsset(assets[index % assets.length]);
        }}
        on:close={() => assetViewingStore.showAssetViewer(false)}
      />
    </Portal>
  {/await}
{/if}
