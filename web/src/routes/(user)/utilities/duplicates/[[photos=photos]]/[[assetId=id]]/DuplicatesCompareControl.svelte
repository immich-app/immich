<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import DuplicateAsset from './DuplicateAsset.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { getNextAsset, getPreviousAsset } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiCheck, mdiImageMultipleOutline, mdiTrashCanOutline } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';

  interface Props {
    assets: AssetResponseDto[];
    suggestedKeepAssetIds: string[];
    onResolve: (duplicateAssetIds: string[], trashIds: string[]) => void;
    onStack: (assets: AssetResponseDto[]) => void;
  }

  let { assets, suggestedKeepAssetIds, onResolve, onStack }: Props = $props();
  // eslint-disable-next-line svelte/no-unnecessary-state-wrap
  let selectedAssetIds = $state(new SvelteSet<string>());
  let trashCount = $derived(assets.length - selectedAssetIds.size);

  onMount(() => {
    if (suggestedKeepAssetIds.length > 0) {
      for (const id of suggestedKeepAssetIds) {
        selectedAssetIds.add(id);
      }
      return;
    }

    if (assets.length > 0) {
      selectedAssetIds.add(assets[0].id);
    }
  });

  onDestroy(() => {
    assetViewerManager.showAssetViewer(false);
  });

  const onRandom = async () => {
    if (assets.length <= 0) {
      return;
    }
    const index = Math.floor(Math.random() * assets.length);
    const asset = assets[index];
    await onViewAsset(asset);
    return { id: asset.id };
  };

  const onSelectAsset = (asset: AssetResponseDto) => {
    if (selectedAssetIds.has(asset.id)) {
      selectedAssetIds.delete(asset.id);
    } else {
      selectedAssetIds.add(asset.id);
    }
  };

  const onSelectNone = () => {
    selectedAssetIds.clear();
  };

  const onSelectAll = () => {
    selectedAssetIds = new SvelteSet(assets.map((asset) => asset.id));
  };

  const onViewAsset = async ({ id }: AssetResponseDto) => {
    const asset = await getAssetInfo({ ...authManager.params, id });
    assetViewerManager.setAsset(asset);
    await navigate({ targetRoute: 'current', assetId: asset.id });
  };

  const handleResolve = () => {
    const trashIds = assets.map((asset) => asset.id).filter((id) => !selectedAssetIds.has(id));
    const duplicateAssetIds = assets.map((asset) => asset.id);
    onResolve(duplicateAssetIds, trashIds);
  };

  const handleStack = () => {
    onStack(assets);
  };

  const assetCursor = $derived({
    current: assetViewerManager.asset!,
    nextAsset: getNextAsset(assets, assetViewerManager.asset),
    previousAsset: getPreviousAsset(assets, assetViewerManager.asset),
  });
</script>

<svelte:document
  use:shortcuts={[
    { shortcut: { key: 'a' }, onShortcut: onSelectAll },
    {
      shortcut: { key: 's' },
      onShortcut: () => onViewAsset(assets[0]),
    },
    { shortcut: { key: 'd' }, onShortcut: onSelectNone },
    { shortcut: { key: 'c', shift: true }, onShortcut: handleResolve },
    { shortcut: { key: 's', shift: true }, onShortcut: handleStack },
  ]}
/>

<div class="px-0.2 mx-auto mb-4 max-w-5xl rounded-3xl border border-gray-300 py-6 dark:border-2 dark:border-gray-700">
  <div class="mb-4 flex w-full flex-wrap place-content-end justify-between gap-y-6 px-6">
    <!-- MARK ALL BUTTONS -->
    <div class="flex text-xs text-black">
      <Button class="rounded-s-full" size="small" color="primary" leadingIcon={mdiCheck} onclick={onSelectAll}
        >{$t('select_keep_all')}</Button
      >
      <Button
        class="rounded-e-full"
        size="small"
        color="secondary"
        leadingIcon={mdiTrashCanOutline}
        onclick={onSelectNone}>{$t('select_trash_all')}</Button
      >
    </div>

    <!-- CONFIRM BUTTONS -->
    <div class="flex text-xs text-black">
      {#if trashCount === 0}
        <Button
          size="small"
          leadingIcon={mdiCheck}
          color="success"
          class="flex place-items-center gap-2 rounded-s-full"
          onclick={handleResolve}
        >
          {$t('keep_all')}
        </Button>
      {:else}
        <Button
          size="small"
          color="danger"
          leadingIcon={mdiTrashCanOutline}
          class="rounded-s-full"
          onclick={handleResolve}
        >
          {trashCount === assets.length ? $t('trash_all') : $t('trash_count', { values: { count: trashCount } })}
        </Button>
      {/if}
      <Button
        size="small"
        color="primary"
        leadingIcon={mdiImageMultipleOutline}
        class="rounded-e-full"
        onclick={handleStack}
        disabled={selectedAssetIds.size !== 1}
      >
        {$t('stack')}
      </Button>
    </div>
  </div>

  <div class="overflow-x-auto p-2">
    <div class="mx-auto flex w-fit min-w-full flex-nowrap place-items-start justify-center gap-1">
      {#each assets as asset (asset.id)}
        <DuplicateAsset {assets} {asset} {onSelectAsset} isSelected={selectedAssetIds.has(asset.id)} {onViewAsset} />
      {/each}
    </div>
  </div>
</div>

{#if assetViewerManager.isViewing}
  {#await import('$lib/components/asset-viewer/AssetViewer.svelte') then { default: AssetViewer }}
    <Portal target="body">
      <AssetViewer
        cursor={assetCursor}
        showNavigation={assets.length > 1}
        {onRandom}
        onClose={() => {
          assetViewerManager.showAssetViewer(false);
          handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
        }}
      />
    </Portal>
  {/await}
{/if}
