<script lang="ts">
  import Button, { type Color } from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { CropAspectRatio } from '$lib/stores/asset-editor.store';

  export let size: {
    icon: string;
    name: CropAspectRatio;
    viewBox: string;
    rotate?: boolean;
  };
  export let selectedSize: CropAspectRatio;
  export let rotateHorizontal: boolean;
  export let selectType: (size: CropAspectRatio) => void;

  $: isSelected = selectedSize === size.name;
  $: buttonColor = (isSelected ? 'primary' : 'transparent-gray') as Color;

  $: rotatedTitle = (title: string, toRotate: boolean) => {
    let sides = title.split(':');
    if (toRotate) {
      sides.reverse();
    }
    return sides.join(':');
  };

  $: toRotate = (def: boolean | undefined) => {
    if (def === false) {
      return false;
    }
    return (def && !rotateHorizontal) || (!def && rotateHorizontal);
  };
</script>

<li>
  <Button color={buttonColor} class="flex-col gap-1" size="sm" rounded="lg" on:click={() => selectType(size.name)}>
    <Icon size="1.75em" path={size.icon} viewBox={size.viewBox} class={toRotate(size.rotate) ? 'rotate-90' : ''} />
    <span>{rotatedTitle(size.name, rotateHorizontal)}</span>
  </Button>
</li>
