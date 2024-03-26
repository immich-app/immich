import copyExif from './copy-exif';
import type { edit, ratio } from './types';

export class Render {
  private assetName: string;
  private assetBlob: Blob;
  private edit: edit;
  private imageWrapper: HTMLElement;

  constructor(assetName: string, assetBlob: Blob, edit: edit, imageWrapper: HTMLElement) {
    this.assetName = assetName;
    this.assetBlob = assetBlob;
    this.edit = edit;
    this.imageWrapper = imageWrapper;
  }

  public start = async () => {
    const img = new Image();
    img.src = URL.createObjectURL(this.assetBlob);
    await img.decode();

    const imgWidth = img.width;
    const imgHeight = img.height;

    console.log('imgWidth', imgWidth);
    console.log('imgHeight', imgHeight);

    const d = Math.hypot(imgWidth, imgHeight);
    const dx = -imgWidth / 2;
    const dy = -imgHeight / 2;

    const x = this.edit.translate.x;
    const y = this.edit.translate.y;
    const crop = this.edit.crop;
    const ratio = img.naturalWidth / this.imageWrapper.offsetWidth;

    console.log('ratio', ratio);
    console.log('crop', crop);

    const translateX = x * ratio;
    const translateY = y * ratio;
    const canvas = this.createCanvas(d, d);

    const { zoom, flipX, flipY } = this.edit;

    const ctx = this.getCanvasContext(canvas);
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }

    this.drawImageOnCanvas(
      ctx,
      img,
      (dx + translateX) * zoom,
      (dy + translateY) * zoom,
      imgWidth,
      imgHeight,
      flipX,
      flipY,
    );

    const canvas2 = this.createCanvas(crop.width * ratio, crop.height * ratio);
    console.log('canvas2', canvas2);
    const cropCtx = this.getCanvasContext(canvas2);
    if (!cropCtx) {
      throw new Error('Could not create canvas context');
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

    return await this.downloadImage(canvas2);
  };

  /**
   * Retrieves the 2D rendering context of a canvas element.
   * @param canvas - The canvas element.
   * @returns The 2D rendering context of the canvas element, or null if the canvas element is null.
   */
  private getCanvasContext = (canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null => {
    if (!canvas) {
      return null;
    }
    const ctx = canvas.getContext('2d');
    return ctx;
  };

  /**
   * Draws an image on the canvas with optional transformations.
   *
   * @param ctx - The canvas rendering context.
   * @param img - The HTMLImageElement to be drawn.
   * @param x - The x-coordinate of the top-left corner of the image.
   * @param y - The y-coordinate of the top-left corner of the image.
   * @param originalWidth - The original width of the image.
   * @param originalHeight - The original height of the image.
   * @param flipX - Whether to flip the image horizontally.
   * @param flipY - Whether to flip the image vertically.
   */
  private drawImageOnCanvas = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    originalWidth: number,
    originalHeight: number,
    flipX: boolean,
    flipY: boolean,
  ) => {
    const { angle, filter, zoom } = this.edit;

    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);

    ctx.rotate((angle * Math.PI) / 180);
    if (flipX) {
      ctx.scale(-1, 1);
    }
    if (flipY) {
      ctx.scale(1, -1);
    }
    ctx.filter = `blur(${filter.blur * 10}px) brightness(${filter.brightness}) contrast(${filter.contrast}) grayscale(${filter.grayscale
      }) hue-rotate(${(filter.hueRotate - 1) * 180}deg) invert(${filter.invert}) opacity(${filter.opacity}) saturate(${filter.saturation
      }) sepia(${filter.sepia})`;

    const { scaledWidth, scaledHeight } = this.scaleImage(originalWidth, originalHeight, zoom);
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    ctx.restore();
  };

  /**
   * Scales an image based on the provided width, height, and scale factor.
   * @param width - The original width of the image.
   * @param height - The original height of the image.
   * @param scale - The scale factor to apply to the image.
   * @returns An object containing the scaled width and height of the image.
   */
  private scaleImage = (width: number, height: number, scale: number) => {
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    return { scaledWidth, scaledHeight };
  };

  /**
   * Downloads the image from the canvas and returns the blob with EXIF data.
   * In case of a JPEG image, the EXIF data is copied from the original image.
   *
   * @param canvas The HTMLCanvasElement containing the image.
   * @returns A Promise that resolves to the blob with EXIF data.
   * @throws An error if the blob or exif blob could not be created.
   */
  private downloadImage = async (canvas: HTMLCanvasElement) => {
    console.log('downloadImage');
    let exifBlob: Blob | null = null;

    console.log(canvas);

    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          }
        },
        this.assetBlob.type,
        1,
      );
    });

    console.log('blob', blob);

    if (!blob) {
      throw new Error('Could not create blob');
    }

    // Copy exif data for supported image types
    // TODO: Support more image types

    switch (this.assetBlob.type) {
      case 'image/jpeg': {
        //exifBlob = await copyExifWithoutOrientation(assetBlob, blob);
        exifBlob = await copyExif(this.assetBlob, blob);
        break;
      }
      default: {
        exifBlob = blob;
        break;
      }
    }

    if (!exifBlob) {
      throw new Error('Could not create exif blob');
    }
    console.log('exifBlob', exifBlob);
    return exifBlob;
  };

  /**
   * Creates a canvas element with the specified width and height.
   *
   * @param width - The width of the canvas.
   * @param height - The height of the canvas.
   * @returns The created HTMLCanvasElement.
   */
  private createCanvas = (width: number, height: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    console.log('canvas', canvas);
    return canvas;
  };

  /**
   * Calculates the aspect ratio based on the given ratio and original aspect.
   * @param ratio - The desired ratio as string.
   * @param originalAspect - The original aspect ratio.
   * @returns The calculated aspect ratio.
   */
  private getRatio = (ratio: ratio, originalAspect: number) => {
    switch (ratio) {
      case 'free': {
        // free ratio selection
        return 0;
      }
      case 'square': {
        return 1;
      }
      case 'original': {
        return this.edit.angleOffset % 180 === 0 ? originalAspect : 1 / originalAspect;
      }
      case '16_9': {
        return 16 / 9;
      }
      case '9_16': {
        return 9 / 16;
      }
      case '5_4': {
        return 5 / 4;
      }
      case '4_5': {
        return 4 / 5;
      }
      case '4_3': {
        return 4 / 3;
      }
      case '3_4': {
        return 3 / 4;
      }
      case '3_2': {
        return 3 / 2;
      }
      case '2_3': {
        return 2 / 3;
      }
      default: {
        return originalAspect;
      }
    }
  };

  public getCanvas = async () => {
    const img = new Image();
    img.src = URL.createObjectURL(this.assetBlob);
    await new Promise((resolve) => {
      img.addEventListener('load', (event) => {
        resolve(event);
      });
    });

    const imgWidth = img.width;
    const imgHeight = img.height;

    const d = Math.hypot(imgWidth, imgHeight);
    const dx = -imgWidth / 2;
    const dy = -imgHeight / 2;

    const x = this.edit.translate.x;
    const y = this.edit.translate.y;
    const crop = this.edit.crop;
    const ratio = this.getRatio(this.edit.aspectRatio, imgWidth / imgHeight);

    const translateX = x * ratio;
    const translateY = y * ratio;
    const canvas = this.createCanvas(d, d);

    const { zoom, flipX, flipY } = this.edit;

    const ctx = this.getCanvasContext(canvas);
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }

    this.drawImageOnCanvas(
      ctx,
      img,
      (dx + translateX) * zoom,
      (dy + translateY) * zoom,
      imgWidth,
      imgHeight,
      flipX,
      flipY,
    );

    const canvas2 = this.createCanvas(crop.width * ratio, crop.height * ratio);
    const cropCtx = this.getCanvasContext(canvas2);
    if (!cropCtx) {
      throw new Error('Could not create canvas context');
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

    return cropCtx.canvas;
  };
}
