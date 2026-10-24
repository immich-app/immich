<script lang="ts">
  import type { Map } from 'maplibre-gl';
  import { getContext, onMount, type Snippet } from 'svelte';

  interface Props {
    map?: Map;
    onload?: (map: Map) => void;
    children?: Snippet<[{ map: Map }]>;
    applyToClusters?: boolean;
    onclick?: (event: { feature: { properties: { cluster_id: number } } }) => void;
  }
  let { map = $bindable(), onload, children, applyToClusters, onclick }: Props = $props();
  const instance = getContext<Map>('map');

  onMount(() => {
    if (onload) {
      map = instance;
      onload(map);
    }
  });
</script>

{#if applyToClusters === undefined}
  {@render children?.({ map: instance })}
{:else if applyToClusters}
  <button type="button" onclick={() => onclick?.({ feature: { properties: { cluster_id: 1 } } })}>Select cluster</button
  >
{/if}
