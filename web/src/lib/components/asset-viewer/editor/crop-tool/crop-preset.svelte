<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import type { CropAspectRatio } from '$lib/stores/asset-editor.store';
  import { Button, type Color } from '@immich/ui';

  interface Props {
    size: {
      icon: string;
      name: CropAspectRatio;
      viewBox: string;
      rotate?: boolean;
    };
    selectedSize: CropAspectRatio;
    rotateHorizontal: boolean;
    selectType: (size: CropAspectRatio) => void;
  }

  let { size, selectedSize, rotateHorizontal, selectType }: Props = $props();

  let isSelected = $derived(selectedSize === size.name);
  let buttonColor = $derived<Color>(isSelected ? 'primary' : 'secondary');

  let rotatedTitle = $derived((title: string, toRotate: boolean) => {
    let sides = title.split(':');
    if (toRotate) {
      sides.reverse();
    }
    return sides.join(':');
  });

  let toRotate = $derived((def: boolean | undefined) => {
    if (def === false) {
      return false;
    }
    return (def && !rotateHorizontal) || (!def && rotateHorizontal);
  });
</script>

<li>
  <Button shape="round" color={buttonColor} class="flex-col gap-1" size="small" onclick={() => selectType(size.name)}>
    <Icon size="1.75em" path={size.icon} viewBox={size.viewBox} class={toRotate(size.rotate) ? 'rotate-90' : ''} />
    <span>{rotatedTitle(size.name, rotateHorizontal)}</span>
  </Button>
</li>
