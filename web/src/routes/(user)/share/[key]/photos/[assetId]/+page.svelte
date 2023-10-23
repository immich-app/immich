<script lang="ts">
  import AssetViewer from '$lib/components/asset-viewer/asset-viewer.svelte';
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  export let data: PageData;
</script>

{#if data.asset && data.key}
  <AssetViewer
    asset={data.asset}
    showNavigation={false}
    on:previous={() => null}
    on:next={() => null}
    on:close={() => goto(`/share/${data.key}`)}
  />
{/if}
