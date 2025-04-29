<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import ShowShortcuts from '$lib/components/shared-components/show-shortcuts.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { Button, HStack, IconButton, Text } from '@immich/ui';
  import { mdiCheckOutline, mdiInformationOutline, mdiKeyboard, mdiTrashCanOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import DuplicateAsset from '$lib/components/utilities-page/duplicates/duplicate-asset.svelte';
  import LargeAssetData from '$lib/components/utilities-page/large-assets/large-asset-data.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import DuplicatesModal from '$lib/components/shared-components/duplicates-modal.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { handlePromiseError } from '$lib/utils';
  import { navigate } from '$lib/utils/navigation';

  interface Props {
    data: PageData;
  }

  let { data = $bindable() }: Props = $props();

  let isShowKeyboardShortcut = $state(false);
  let isShowDuplicateInfo = $state(false);

  interface Shortcuts {
    general: ExplainedShortcut[];
    actions: ExplainedShortcut[];
  }
  interface ExplainedShortcut {
    key: string[];
    action: string;
    info?: string;
  }

  const duplicateShortcuts: Shortcuts = {
    general: [],
    actions: [
      { key: ['a'], action: $t('select_all_duplicates') },
      { key: ['s'], action: $t('view') },
      { key: ['d'], action: $t('unselect_all_duplicates') },
      { key: ['⇧', 'c'], action: $t('resolve_duplicates') },
      { key: ['⇧', 's'], action: $t('stack_duplicates') },
    ],
  };

  // let duplicates = $state(data.duplicates);
  // let hasDuplicates = $derived(duplicates.length > 0);

  const { isViewing: showAssetViewer, asset: viewingAsset, setAsset } = assetViewingStore;
  const getAssetIndex = (id: string) => data.assets.findIndex((asset) => asset.id === id);

  const onNext = () => {
    const index = getAssetIndex($viewingAsset.id) + 1;
    if (index >= data.assets.length) {
      return Promise.resolve(false);
    }
    setAsset(data.assets[index]);
    return Promise.resolve(true);
  };

  const onPrevious = () => {
    const index = getAssetIndex($viewingAsset.id) - 1;
    if (index < 0) {
      return Promise.resolve(false);
    }
    setAsset(data.assets[index]);
    return Promise.resolve(true);
  };

  const onRandom = () => {
    if (data.assets.length <= 0) {
      return Promise.resolve(undefined);
    }
    const index = Math.floor(Math.random() * data.assets.length);
    const asset = data.assets[index];
    setAsset(asset);
    return Promise.resolve(asset);
  };
</script>

<UserPageLayout title={data.meta.title + ` (${data.assets.length.toLocaleString($locale)})`} scrollbar={true}>
  {#snippet buttons()}
    <HStack gap={0}>
      <IconButton
        shape="round"
        variant="ghost"
        color="secondary"
        icon={mdiKeyboard}
        title={$t('show_keyboard_shortcuts')}
        onclick={() => (isShowKeyboardShortcut = !isShowKeyboardShortcut)}
        aria-label={$t('show_keyboard_shortcuts')}
      />
    </HStack>
  {/snippet}

  <div class="flex gap-2 flex-wrap">
    {#if data.assets && data.assets.length > 0}
      {#each data.assets as asset}
        <LargeAssetData {asset} onViewAsset={(asset) => setAsset(asset)} />
      {/each}
    {:else}
      <p class="text-center text-lg dark:text-white flex place-items-center place-content-center">
        {$t('no_duplicates_found')}
      </p>
    {/if}
  </div>
</UserPageLayout>

{#if $showAssetViewer}
  {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
    <Portal target="body">
      <AssetViewer
        asset={$viewingAsset}
        showNavigation={data.assets.length > 1}
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

{#if isShowKeyboardShortcut}
  <ShowShortcuts shortcuts={duplicateShortcuts} onClose={() => (isShowKeyboardShortcut = false)} />
{/if}
{#if isShowDuplicateInfo}
  <DuplicatesModal onClose={() => (isShowDuplicateInfo = false)} />
{/if}
