<script lang="ts">
  import { doc } from 'prettier';
  import { onMount } from 'svelte';
  import 'context-filter-polyfill'; // polyfill for canvas filters

  export let editedImage;
  export let assetData: string;
  export let angle: number;
  export let crop: { width: number; height: number };
  export let scale: number;
  export let translate: { x: number; y: number };
  export let aspectRatio: number;
  export let ratio: number; // ratio of original image to displayed image
  export let filter: {
    hdr: number;
    blur: number;
    brightness: number;
    contrast: number;
    grayscale: number;
    hueRotate: number;
    invert: number;
    opacity: number;
    saturation: number;
    sepia: number;
  };

  // let canvas: HTMLCanvasElement;
  // let canvas2: HTMLCanvasElement;

  export const start = () => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = assetData;

    const imgWidth = img.width;
    const imgHeight = img.height;

    //calc rotation-wrapper-canvas
    const d = Math.sqrt(imgWidth * imgWidth + imgHeight * imgHeight);

    const dx = -imgWidth / 2;
    const dy = -imgHeight / 2;

    const translateX = translate.x * ratio;
    const translateY = translate.y * ratio;

    canvas.height = d;
    canvas.width = d;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.translate(d / 2, d / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.filter = `blur(${filter.blur * 10}px) brightness(${filter.brightness}) contrast(${filter.contrast}) grayscale(${
      filter.grayscale
    }) hue-rotate(${(filter.hueRotate - 1) * 180}deg) invert(${filter.invert}) opacity(${filter.opacity}) saturate(${
      filter.saturation
    }) sepia(${filter.sepia})`;
    ctx.drawImage(img, dx + translateX, dy + translateY, imgWidth, imgHeight);
    ctx.save();

    //crop image
    const canvas2 = document.createElement('canvas');
    // wrapper.appendChild(canvas2);

    const cropHeight = crop.height * ratio;
    const cropWidth = crop.width * ratio;

    canvas2.width = cropWidth;
    canvas2.height = cropHeight;
    const cropCtx = canvas2.getContext('2d');
    if (!cropCtx) return;
    cropCtx.drawImage(
      canvas,
      (d - cropWidth) / 2,
      (d - cropHeight) / 2,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    cropCtx.save();

    // download image
    const dataURL = canvas2.toDataURL('image/png');
    editedImage = dataURL;

    const l = document.createElement('a');
    l.href = dataURL;
    l.download = 'test.png';
    l.click();
  };
</script>

<!-- <canvas bind:this={canvas2} /> -->
<!-- <img class="absolute z-[9999]" src={assetData} alt="" /> -->
