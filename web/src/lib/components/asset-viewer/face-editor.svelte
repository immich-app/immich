<script lang="ts">
  import { Button } from '@immich/ui';
  import { Canvas, Rect } from 'fabric';
  import { onMount } from 'svelte';
  import { photoViewerImgElement } from '$lib/stores/assets.store';

  interface Props {
    imgElement: HTMLImageElement;
    containerWidth: number;
    containerHeight: number;
  }

  let { imgElement, containerWidth, containerHeight }: Props = $props();

  let canvasEl: HTMLCanvasElement | undefined = $state();
  let canvas: Canvas | undefined = $state();
  let faceRect: Rect | undefined = $state();

  onMount(() => {
    if (!canvasEl || !imgElement) {
      return;
    }

    canvas = new Canvas(canvasEl);

    faceRect = new Rect({
      left: 100,
      top: 50,
      fill: 'transparent',
      width: 200,
      height: 100,
      objectCaching: true,
      stroke: 'rgb(66,80,175)',
      strokeWidth: 2,
    });

    canvas.add(faceRect);
    canvas.setActiveObject(faceRect);
  });

  let test1 = $state(0);
  let test2 = $state(0);
  let test3 = $state(0);

  $effect(() => {
    const { actualWidth, actualHeight } = getContainedSize(imgElement);
    const offsetArea = {
      width: (containerWidth - actualWidth) / 2,
      height: (containerHeight - actualHeight) / 2,
    };

    const imageBoundingBox = {
      top: offsetArea.height,
      left: offsetArea.width,
      width: containerWidth - offsetArea.width * 2,
      height: containerHeight - offsetArea.height * 2,
    };

    if (!canvas) {
      return;
    }

    canvas.setDimensions({
      width: containerWidth,
      height: containerHeight,
    });

    if (!faceRect) {
      return;
    }
    faceRect.set({
      top: imageBoundingBox.top,
      left: imageBoundingBox.left,
    });

    // Update controls border
    faceRect.setCoords();

    canvas.setActiveObject(faceRect);
    canvas.requestRenderAll();
  });

  const getContainedSize = (img: HTMLImageElement): { actualWidth: number; actualHeight: number } => {
    const ratio = img.naturalWidth / img.naturalHeight;
    let actualWidth = img.height * ratio;
    let actualHeight = img.height;
    if (actualWidth > img.width) {
      actualWidth = img.width;
      actualHeight = img.width / ratio;
    }
    return { actualWidth, actualHeight };
  };

  const test = () => {
    console.log(faceRect);
  };
</script>

<div class="absolute left-0 top-0 z-50">
  <canvas
    bind:this={canvasEl}
    id="face-editor"
    class="absolute top-0 left-0 bg-blue-100/10 border-2 border-green-300 z-[500]"
  ></canvas>
  <div class="absolute bottom-0 right-0 z-[600] bg-white">
    <p>Bounding box: {faceRect?.get('top')}</p>
    <Button onclick={test}>Test W: {containerWidth} - H: {containerHeight}</Button>
  </div>
</div>
