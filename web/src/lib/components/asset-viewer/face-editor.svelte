<script lang="ts">
  import {Button} from '@immich/ui';
  import {Canvas, InteractiveFabricObject, Rect} from 'fabric';
  import {onMount} from 'svelte';

  interface Props {
    imgElement: HTMLImageElement;
    containerWidth: number;
    containerHeight: number;
  }

  let {imgElement, containerWidth, containerHeight}: Props = $props();

  let canvasEl: HTMLCanvasElement | undefined = $state();
  let canvas: Canvas | undefined = $state();
  let faceRect: Rect | undefined = $state();

  const configureControlStyle = () => {
    InteractiveFabricObject.ownDefaults = {
      ...InteractiveFabricObject.ownDefaults,
      cornerStyle: 'circle',
      cornerColor: 'rgb(153,166,251)',
      cornerSize: 10,
      padding: 8,
      transparentCorners: false,
      lockRotation: true,
      hasBorders: true,
    };
  };

  onMount(() => {
    if (!canvasEl || !imgElement) {
      return;
    }

    canvas = new Canvas(canvasEl);
    configureControlStyle();

    faceRect = new Rect({
      fill: 'rgba(66,80,175,0.5)',
      width: 112,
      height: 112,
      objectCaching: true,
      rx: 8,
      ry: 8,
    });

    canvas.add(faceRect);
    canvas.setActiveObject(faceRect);
  });

  $effect(() => {
    const {actualWidth, actualHeight} = getContainedSize(imgElement);
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
  });

  const getContainedSize = (img: HTMLImageElement): { actualWidth: number; actualHeight: number } => {
    const ratio = img.naturalWidth / img.naturalHeight;
    let actualWidth = img.height * ratio;
    let actualHeight = img.height;
    if (actualWidth > img.width) {
      actualWidth = img.width;
      actualHeight = img.width / ratio;
    }
    return {actualWidth, actualHeight};
  };

  const test = () => {
    console.log(`${faceRect?.height} x ${faceRect?.width} TOP: ${faceRect?.top} LEFT: ${faceRect?.left}`);
    console.log('RECT', faceRect?.aCoords);
  };

  const people = ['Person 1', 'Person 2', 'Person 3', 'Person 4', 'Person 5'];
</script>

<div class="absolute left-0 top-0">
  <canvas bind:this={canvasEl} id="face-editor" class="absolute top-0 left-0"></canvas>

  <div
    class="absolute bottom-20 right-[calc(50%-97px)] bg-gray-50 backdrop-blur-sm p-4 rounded-xl"
  >
    <div>
      <p>Create a new person or add existing one</p>
    </div>
    <div class="flex gap-2 place-items-center place-content-center mt-4">
      <Button size="small" onclick={test} class="shadow-xl font-normal">Tag person</Button>
      <Button size="small" onclick={test} color="danger">Cancel</Button>
    </div>

  </div>
</div>


































