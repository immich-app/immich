<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Control, type ControlPosition } from 'leaflet';
  import { getMapContext } from './map.svelte';

  export let position: ControlPosition | undefined = undefined;
  let className: string | undefined = undefined;
  export { className as class };

  let control: Control;
  let target: HTMLDivElement;

  const map = getMapContext();

  onMount(() => {
    const ControlClass = Control.extend({
      position,
      onAdd: () => target,
    });

    control = new ControlClass().addTo(map);
  });

  onDestroy(() => {
    control.remove();
  });

  $: if (control && position) {
    control.setPosition(position);
  }
</script>

<div bind:this={target} class={className}>
  <slot />
</div>
