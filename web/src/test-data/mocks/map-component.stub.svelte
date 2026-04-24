<script lang="ts">
  interface Props {
    mapMarkers?: Array<{ id: string }>;
    [key: string]: unknown;
  }

  let { mapMarkers = [], ...rest }: Props = $props();
</script>

<div
  {...rest}
  data-testid="map-stub"
  data-marker-count={String(mapMarkers.length)}
  data-marker-ids={mapMarkers.map((marker) => marker.id).join(',')}
></div>
