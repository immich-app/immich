<script lang="ts">
  import { getAssetMediaUrl } from '$lib/utils';
  import { Icon } from '@immich/ui';
  import { mdiImageMultipleOutline } from '@mdi/js';

  interface AssetInfo {
    id: string;
    thumbhash: string | null;
  }

  interface Props {
    assets: AssetInfo[];
    gradientClass?: string;
    preload?: boolean;
  }

  let { assets, gradientClass = 'from-gray-400 to-gray-600', preload = false }: Props = $props();

  let layout = $derived(
    assets.length === 0 ? 'empty' : assets.length === 1 ? 'single' : assets.length <= 3 ? 'asymmetric' : 'grid',
  );
</script>

{#if layout === 'empty'}
  <div
    class="flex size-full items-center justify-center rounded-xl bg-gradient-to-br {gradientClass} aspect-square"
    data-testid="collage-empty"
  >
    <Icon icon={mdiImageMultipleOutline} size="4em" class="text-white/40" />
  </div>
{:else if layout === 'single'}
  <div class="aspect-square overflow-hidden rounded-xl" data-testid="collage-single">
    <img
      alt=""
      src={getAssetMediaUrl({ id: assets[0].id })}
      class="size-full object-cover"
      loading={preload ? 'eager' : 'lazy'}
      draggable="false"
    />
  </div>
{:else if layout === 'asymmetric'}
  <div
    class="grid aspect-square gap-0.5 overflow-hidden rounded-xl"
    style="grid-template-columns: 3fr 2fr;"
    data-testid="collage-asymmetric"
  >
    <img
      alt=""
      src={getAssetMediaUrl({ id: assets[0].id })}
      class="size-full object-cover"
      style="grid-row: 1 / {assets.length === 2 ? 2 : 3};"
      loading={preload ? 'eager' : 'lazy'}
      draggable="false"
    />
    <img
      alt=""
      src={getAssetMediaUrl({ id: assets[1].id })}
      class="size-full object-cover"
      loading={preload ? 'eager' : 'lazy'}
      draggable="false"
    />
    {#if assets.length >= 3}
      <img
        alt=""
        src={getAssetMediaUrl({ id: assets[2].id })}
        class="size-full object-cover"
        loading={preload ? 'eager' : 'lazy'}
        draggable="false"
      />
    {/if}
  </div>
{:else}
  <div class="grid grid-cols-2 grid-rows-2 aspect-square gap-0.5 overflow-hidden rounded-xl" data-testid="collage-grid">
    {#each assets.slice(0, 4) as asset (asset.id)}
      <img
        alt=""
        src={getAssetMediaUrl({ id: asset.id })}
        class="size-full object-cover"
        loading={preload ? 'eager' : 'lazy'}
        draggable="false"
      />
    {/each}
  </div>
{/if}
