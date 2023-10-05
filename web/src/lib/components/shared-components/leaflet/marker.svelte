<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Marker, Icon, type LatLngExpression } from 'leaflet';
  import { getMapContext } from './map.svelte';
  import iconUrl from 'leaflet/dist/images/marker-icon.png';
  import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
  import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

  export let latlng: LatLngExpression;
  let popupHTML: string;
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

    if (popupHTML) {
      marker.bindPopup(popupHTML);
    } else {
      marker.unbindPopup();
    }
  }
</script>

<span contenteditable="true" bind:innerHTML={popupHTML} class="hide">
  <slot />
</span>
