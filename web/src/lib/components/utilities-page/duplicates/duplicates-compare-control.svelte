<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import DuplicateAsset from '$lib/components/utilities-page/duplicates/duplicate-asset.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { handlePromiseError } from '$lib/utils';
  import { suggestDuplicate } from '$lib/utils/duplicate-utils';
  import { navigate } from '$lib/utils/navigation';
  import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiCheck, mdiImageMultipleOutline, mdiTrashCanOutline } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteSet } from 'svelte/reactivity';

  interface Props {
    assets: AssetResponseDto[];
    onResolve: (duplicateAssetIds: string[], trashIds: string[]) => void;
    onStack: (assets: AssetResponseDto[]) => void;
  }

  let { assets, onResolve, onStack }: Props = $props();
  const { isViewing: showAssetViewer, asset: viewingAsset, setAsset } = assetViewingStore;
  const getAssetIndex = (id: string) => assets.findIndex((asset) => asset.id === id);

  // eslint-disable-next-line svelte/no-unnecessary-state-wrap
  let selectedAssetIds = $state(new SvelteSet<string>());
  let trashCount = $derived(assets.length - selectedAssetIds.size);

  onMount(() => {
    const suggestedAsset = suggestDuplicate(assets);

    if (!suggestedAsset) {
      selectedAssetIds = new SvelteSet(assets[0].id);
      return;
    }

    selectedAssetIds.add(suggestedAsset.id);
  });

  onDestroy(() => {
    assetViewingStore.showAssetViewer(false);
  });

  const onNext = async () => {
    const index = getAssetIndex($viewingAsset.id) + 1;
    if (index >= assets.length) {
      return false;
    }
    await onViewAsset(assets[index]);
    return true;
  };

  const onPrevious = async () => {
    const index = getAssetIndex($viewingAsset.id) - 1;
    if (index < 0) {
      return false;
    }
    await onViewAsset(assets[index]);
    return true;
  };

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
    setAsset(asset);
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

<div class="pt-4 rounded-3xl border dark:border-2 border-gray-300 dark:border-gray-700 max-w-216 mx-auto mb-4">
  <div class="flex flex-wrap gap-y-6 mb-4 px-6 w-full place-content-end justify-between">
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
          color="primary"
          class="flex place-items-center rounded-s-full gap-2"
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

  <div class="flex flex-wrap gap-1 mb-4 place-items-center place-content-center px-4 pt-4">
    {#each assets as asset (asset.id)}
      <DuplicateAsset {asset} {onSelectAsset} isSelected={selectedAssetIds.has(asset.id)} {onViewAsset} />
    {/each}
  </div>
</div>

{#if $showAssetViewer}
  {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
    <Portal target="body">
      <AssetViewer
        asset={$viewingAsset}
        showNavigation={assets.length > 1}
        {onNext}
        {onPrevious}
        {onRandom}
        onClose={() => {
          assetViewingStore.showAssetViewer(false);
          handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
        }}
      />
    </Portal>
  {/await}
{/if}
