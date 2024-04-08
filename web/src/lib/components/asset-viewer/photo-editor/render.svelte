<script lang="ts">
  import 'context-filter-polyfill'; // polyfill for canvas filters
  //import copyExifWithoutOrientation from './copyExifWithoutOrientation';

  import copyExif from './copy-exif';

  export let isRendering = false;
  export let assetName: string;
  export let assetBlob: Blob;
  export let angle = 0;
  export let crop = { width: 0, height: 0 };
  export let scale = 1;
  export let translate = { x: 0, y: 0 };
  export let ratio = 1; // ratio of the original image to the displayed image
  export let filter = {
    blur: 0,
    brightness: 1,
    contrast: 1,
    grayscale: 0,
    hueRotate: 0,
    invert: 0,
    opacity: 1,
    saturation: 1,
    sepia: 0,
  };
  export let flipX = false;
  export let flipY = false;

  export const start = async () => {
    isRendering = true;

    const img = new Image();
    img.src = URL.createObjectURL(assetBlob);
    await new Promise((resolve) => {
      img.addEventListener('load', resolve);
    });

    const imgWidth = img.width;
    const imgHeight = img.height;

    const d = Math.hypot(imgWidth, imgHeight);
    const dx = -imgWidth / 2;
    const dy = -imgHeight / 2;

    const translateX = translate.x * ratio;
    const translateY = translate.y * ratio;
    const canvas = createCanvas(d, d);
    const ctx = getCanvasContext(canvas);
    if (!ctx) {
      return;
    }

    drawImageOnCanvas(
      ctx,
      img,
      (dx + translateX) * scale,
      (dy + translateY) * scale,
      imgWidth,
      imgHeight,
      flipX,
      flipY,
    );

    const canvas2 = createCanvas(crop.width * ratio, crop.height * ratio);
    const cropCtx = getCanvasContext(canvas2);
    if (!cropCtx) {
      return;
    }

    cropCtx.drawImage(
      canvas,
      (d - canvas2.width) / 2,
      (d - canvas2.height) / 2,
      canvas2.width,
      canvas2.height,
      0,
      0,
      canvas2.width,
      canvas2.height,
    );

    await downloadImage(canvas2);
  };

  const createCanvas = (width: number, height: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };

  const getCanvasContext = (canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null => {
    if (!canvas) {
      return null;
    }
    const ctx = canvas.getContext('2d');
    return ctx;
  };

  const drawImageOnCanvas = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    originalWidth: number,
    originalHeight: number,
    flipX: boolean,
    flipY: boolean,
  ) => {
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);

    ctx.rotate((angle * Math.PI) / 180);
    if (flipX) {
      ctx.scale(-1, 1);
    }
    if (flipY) {
      ctx.scale(1, -1);
    }
    ctx.filter = `blur(${filter.blur * 10}px) brightness(${filter.brightness}) contrast(${filter.contrast}) grayscale(${
      filter.grayscale
    }) hue-rotate(${(filter.hueRotate - 1) * 180}deg) invert(${filter.invert}) opacity(${filter.opacity}) saturate(${
      filter.saturation
    }) sepia(${filter.sepia})`;

    const { scaledWidth, scaledHeight } = scaleImage(originalWidth, originalHeight);
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    ctx.restore();
  };

  const scaleImage = (width: number, height: number) => {
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    return { scaledWidth, scaledHeight };
  };

  const currentEdit = () => {
    return {
      angle,
      crop,
      scale,
      translate,
      ratio,
      filter,
      flipX,
      flipY,
    };
  };

  const downloadImage = async (canvas: HTMLCanvasElement) => {
    let exifBlob: Blob | null = null;

    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          }
        },
        assetBlob.type,
        1,
      );
    });

    if (!blob) {
      isRendering = false;
      // Error handling
      return;
    }

    // Copy exif data for supported image types
    // TODO: Support more image types

    switch (assetBlob.type) {
      case 'image/jpeg': {
        //exifBlob = await copyExifWithoutOrientation(assetBlob, blob);
        exifBlob = await copyExif(assetBlob, blob);
        break;
      }
      default: {
        exifBlob = blob;
        break;
      }
    }
    window.setTimeout(
      (exifBlob: Blob) => {
        const dataURL = URL.createObjectURL(exifBlob);
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = assetName;
        link.click();

        console.log('currentEdit', currentEdit());

        isRendering = false;
      },
      0,
      exifBlob,
    );
  };
</script>
