<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Marker, Icon, type LatLngExpression, type Content } from 'leaflet';
  import { getMapContext } from './map.svelte';
  import iconUrl from 'leaflet/dist/images/marker-icon.png';
  import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
  import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

  export let latlng: LatLngExpression;
  export let popupContent: Content | undefined = undefined;
  let marker: Marker;

  const defaultIcon = new Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,

    // Default values from Leaflet
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  });
  const map = getMapContext();

  onMount(() => {
    marker = new Marker(latlng, {
      icon: defaultIcon,
    }).addTo(map);
  });

  onDestroy(() => {
    if (marker) marker.remove();
  });

  $: if (marker) {
    marker.setLatLng(latlng);

    if (popupContent) {
      marker.bindPopup(popupContent);
    } else {
      marker.unbindPopup();
    }
  }
</script>
