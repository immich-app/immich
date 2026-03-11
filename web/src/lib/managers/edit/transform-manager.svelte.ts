import { type EditActions, type EditToolManager } from '$lib/managers/edit/edit-manager.svelte';
import { getAssetMediaUrl } from '$lib/utils';
import { getDimensions } from '$lib/utils/asset-utils';
import { normalizeTransformEdits } from '$lib/utils/editor';
import { handleError } from '$lib/utils/handle-error';
import { AssetEditAction, AssetMediaSize, MirrorAxis, type AssetResponseDto, type CropParameters } from '@immich/sdk';
import { clamp } from 'lodash-es';
import { tick } from 'svelte';

export type CropAspectRatio =
  | '1:1'
  | '16:9'
  | '4:3'
  | '3:2'
  | '7:5'
  | '9:16'
  | '3:4'
  | '2:3'
  | '5:7'
  | 'free'
  | 'reset';

type Region = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageDimensions = {
  width: number;
  height: number;
};

type RegionConvertParams = {
  region: Region;
  from: ImageDimensions;
  to: ImageDimensions;
};

export enum ResizeBoundary {
  None = 'none',
  TopLeft = 'top-left',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomRight = 'bottom-right',
  Left = 'left',
  Right = 'right',
  Top = 'top',
  Bottom = 'bottom',
}

class TransformManager implements EditToolManager {
  canReset: boolean = $derived.by(() => this.checkEdits());
  hasChanges: boolean = $state(false);

  isInteracting = $state(false);
  isDragging = $state(false);
  animationFrame = $state<ReturnType<typeof requestAnimationFrame> | null>(null);
  dragAnchor = $state({ x: 0, y: 0 });
  resizeSide = $state(ResizeBoundary.None);
  imgElement = $state<HTMLImageElement | null>(null);
  cropAreaEl = $state<HTMLElement | null>(null);
  overlayEl = $state<HTMLElement | null>(null);
  cropFrame = $state<HTMLElement | null>(null);
  cropImageSize = $state<ImageDimensions>({ width: 1000, height: 1000 });
  cropImageScale = $state(1);
  cropAspectRatio = $state('free');
  originalImageSize = $state<ImageDimensions>({ width: 1000, height: 1000 });
  region = $state({ x: 0, y: 0, width: 100, height: 100 });
  previewImageSize = $derived({
    width: this.cropImageSize.width * this.cropImageScale,
    height: this.cropImageSize.height * this.cropImageScale,
  });

  imageRotation = $state(0);
  mirrorHorizontal = $state(false);
  mirrorVertical = $state(false);
  normalizedRotation = $derived.by(() => {
    const newAngle = this.imageRotation % 360;
    return newAngle < 0 ? newAngle + 360 : newAngle;
  });

  edits = $derived.by(() => this.getEdits());

  setAspectRatio(aspectRatio: string) {
    this.hasChanges = true;
    this.cropAspectRatio = aspectRatio;

    if (!this.imgElement || !this.cropAreaEl) {
      return;
    }

    const newCrop = this.recalculateCrop(aspectRatio);
    if (newCrop) {
      this.animateCropChange(newCrop);
      this.region = newCrop;
    }
  }

  checkEdits() {
    return (
      Math.abs(this.previewImageSize.width - this.region.width) > 2 ||
      Math.abs(this.previewImageSize.height - this.region.height) > 2 ||
      this.mirrorHorizontal ||
      this.mirrorVertical ||
      this.normalizedRotation !== 0
    );
  }

  checkCropEdits() {
    return (
      Math.abs(this.previewImageSize.width - this.region.width) > 2 ||
      Math.abs(this.previewImageSize.height - this.region.height) > 2
    );
  }

  getEdits(): EditActions {
    const edits: EditActions = [];

    if (this.checkCropEdits()) {
      // Convert from display coordinates to loaded preview image coordinates
      let cropRegion = this.getRegionInPreviewCoords(this.region);

      // Transform crop coordinates to account for mirroring
      // The preview shows the mirrored image, but crop is applied before mirror on the server
      // So we need to "unmirror" the crop coordinates
      cropRegion = this.applyMirrorToCoords(cropRegion, this.cropImageSize);

      // Convert from preview image coordinates to original image coordinates
      cropRegion = this.convertRegion({
        region: cropRegion,
        from: this.cropImageSize,
        to: this.originalImageSize,
      });

      // Constrain to original image bounds (fixes possible rounding errors)
      cropRegion = this.constrainToBounds(cropRegion, this.originalImageSize);

      edits.push({
        action: AssetEditAction.Crop,
        parameters: cropRegion,
      });
    }

    // Mirror edits come before rotate in array so that compose applies rotate first, then mirror
    // This matches CSS where parent has rotate and child img has mirror transforms
    if (this.mirrorHorizontal) {
      edits.push({
        action: AssetEditAction.Mirror,
        parameters: {
          axis: MirrorAxis.Horizontal,
        },
      });
    }

    if (this.mirrorVertical) {
      edits.push({
        action: AssetEditAction.Mirror,
        parameters: {
          axis: MirrorAxis.Vertical,
        },
      });
    }

    if (this.normalizedRotation !== 0) {
      edits.push({
        action: AssetEditAction.Rotate,
        parameters: {
          angle: this.normalizedRotation,
        },
      });
    }

    return edits;
  }

  async resetAllChanges() {
    this.imageRotation = 0;
    this.mirrorHorizontal = false;
    this.mirrorVertical = false;
    await tick();

    this.onImageLoad([]);
  }

  async onActivate(asset: AssetResponseDto, edits: EditActions): Promise<void> {
    const originalSize = getDimensions(asset.exifInfo!);
    this.originalImageSize = { width: originalSize.width ?? 0, height: originalSize.height ?? 0 };

    this.imgElement = new Image();

    const imageURL = getAssetMediaUrl({
      id: asset.id,
      cacheKey: asset.thumbhash,
      edited: false,
      size: AssetMediaSize.Preview,
    });

    this.imgElement.src = imageURL;
    this.imgElement.addEventListener('load', () => transformManager.onImageLoad(edits), { passive: true });
    this.imgElement.addEventListener('error', (error) => handleError(error, 'ErrorLoadingImage'), {
      passive: true,
    });

    globalThis.addEventListener('mousemove', (e) => transformManager.handleMouseMove(e), { passive: true });

    const transformEdits = edits.filter((e) => e.action === 'rotate' || e.action === 'mirror');

    // Normalize rotation and mirror edits to single rotation and mirror state
    // This allows edits to be imported in any order and still produce correct state
    const normalizedTransformation = normalizeTransformEdits(transformEdits);
    this.imageRotation = normalizedTransformation.rotation;
    this.mirrorHorizontal = normalizedTransformation.mirrorHorizontal;
    this.mirrorVertical = normalizedTransformation.mirrorVertical;

    await tick();

    this.resizeCanvas();
  }

  onDeactivate() {
    globalThis.removeEventListener('mousemove', transformManager.handleMouseMove);

    this.reset();
  }

  reset() {
    this.isInteracting = false;
    this.animationFrame = null;
    this.dragAnchor = { x: 0, y: 0 };
    this.resizeSide = ResizeBoundary.None;
    this.imgElement = null;
    this.cropAreaEl = null;
    this.isDragging = false;
    this.overlayEl = null;
    this.imageRotation = 0;
    this.mirrorHorizontal = false;
    this.mirrorVertical = false;
    this.region = { x: 0, y: 0, width: 100, height: 100 };
    this.cropImageSize = { width: 1000, height: 1000 };
    this.originalImageSize = { width: 1000, height: 1000 };
    this.cropImageScale = 1;
    this.cropAspectRatio = 'free';
    this.hasChanges = false;
  }

  mirror(axis: 'horizontal' | 'vertical') {
    this.hasChanges = true;

    if (this.imageRotation % 180 !== 0) {
      axis = axis === 'horizontal' ? 'vertical' : 'horizontal';
    }

    if (axis === 'horizontal') {
      this.mirrorHorizontal = !this.mirrorHorizontal;
    } else {
      this.mirrorVertical = !this.mirrorVertical;
    }
  }

  async rotate(angle: number) {
    this.hasChanges = true;

    this.imageRotation += angle;
    await tick();
    this.onImageLoad();
  }

  recalculateCrop(aspectRatio: string = this.cropAspectRatio): Region {
    if (!this.cropAreaEl) {
      return this.region;
    }

    const canvasW = this.cropAreaEl.clientWidth;
    const canvasH = this.cropAreaEl.clientHeight;

    // Calculate new dimensions with aspect ratio
    const { newWidth: w, newHeight: h } = this.keepAspectRatio(this.region.width, this.region.height, aspectRatio);

    // Scale down if needed to fit in canvas
    let newWidth = w;
    let newHeight = h;

    if (w > canvasW) {
      newWidth = canvasW;
      newHeight = canvasW / (w / h);
    } else if (h > canvasH) {
      newHeight = canvasH;
      newWidth = canvasH * (w / h);
    }

    // Constrain position to keep crop area within canvas
    return {
      x: Math.max(0, Math.min(this.region.x, canvasW - newWidth)),
      y: Math.max(0, Math.min(this.region.y, canvasH - newHeight)),
      width: newWidth,
      height: newHeight,
    };
  }

  animateCropChange(to: Region, duration = 100) {
    if (!this.cropFrame) {
      return;
    }

    const from = this.region;
    const startTime = performance.now();
    const initialCrop = { ...from };

    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      from.x = initialCrop.x + (to.x - initialCrop.x) * progress;
      from.y = initialCrop.y + (to.y - initialCrop.y) * progress;
      from.width = initialCrop.width + (to.width - initialCrop.width) * progress;
      from.height = initialCrop.height + (to.height - initialCrop.height) * progress;

      this.draw(from);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  keepAspectRatio(newWidth: number, newHeight: number, aspectRatio: string = this.cropAspectRatio) {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);

    if (widthRatio && heightRatio) {
      const calculatedWidth = (newHeight * widthRatio) / heightRatio;
      return { newWidth: calculatedWidth, newHeight };
    }

    return { newWidth, newHeight };
  }

  adjustDimensions(
    newWidth: number,
    newHeight: number,
    aspectRatio: string,
    xLimit: number,
    yLimit: number,
    minSize: number,
  ) {
    if (aspectRatio === 'free') {
      return {
        newWidth: clamp(newWidth, minSize, xLimit),
        newHeight: clamp(newHeight, minSize, yLimit),
      };
    }

    let w = newWidth;
    let h = newHeight;

    const [ratioWidth, ratioHeight] = aspectRatio.split(':').map(Number);
    const aspectMultiplier = ratioWidth && ratioHeight ? ratioWidth / ratioHeight : w / h;

    h = w / aspectMultiplier;
    // When dragging a corner, use the biggest region that fits 'inside' the mouse location.
    if (h < newHeight) {
      h = newHeight;
      w = h * aspectMultiplier;
    }

    if (w > xLimit) {
      w = xLimit;
      h = w / aspectMultiplier;
    }
    if (h > yLimit) {
      h = yLimit;
      w = h * aspectMultiplier;
    }

    if (w < minSize) {
      w = minSize;
      h = w / aspectMultiplier;
    }
    if (h < minSize) {
      h = minSize;
      w = h * aspectMultiplier;
    }

    if (w / h !== aspectMultiplier) {
      if (w < minSize) {
        h = w / aspectMultiplier;
      }
      if (h < minSize) {
        w = h * aspectMultiplier;
      }
    }

    return { newWidth: w, newHeight: h };
  }

  draw(crop: Region = this.region) {
    if (!this.cropFrame) {
      return;
    }

    this.cropFrame.style.left = `${crop.x}px`;
    this.cropFrame.style.top = `${crop.y}px`;
    this.cropFrame.style.width = `${crop.width}px`;
    this.cropFrame.style.height = `${crop.height}px`;

    if (!this.overlayEl) {
      return;
    }

    this.overlayEl.style.clipPath = `
    polygon(
      0% 0%,
      0% 100%,
      100% 100%,
      100% 0%,
      0% 0%,
      ${crop.x}px ${crop.y}px,
      ${crop.x + crop.width}px ${crop.y}px,
      ${crop.x + crop.width}px ${crop.y + crop.height}px,
      ${crop.x}px ${crop.y + crop.height}px,
      ${crop.x}px ${crop.y}px
    )
  `;
  }

  onImageLoad(edits: EditActions | null = null) {
    const img = this.imgElement;
    if (!this.cropAreaEl || !img) {
      return;
    }

    this.cropImageSize = { width: img.width, height: img.height };
    const scale = this.calculateScale();

    if (edits === null) {
      const cropFrameEl = this.cropFrame;
      cropFrameEl?.classList.add('transition');
      this.region = this.normalizeCropArea(scale);
      cropFrameEl?.addEventListener('transitionend', () => cropFrameEl?.classList.remove('transition'), {
        passive: true,
      });
    } else {
      const cropEdit = edits.find((e) => e.action === AssetEditAction.Crop);

      if (cropEdit) {
        const params = cropEdit.parameters as CropParameters;

        // convert from original image coordinates to loaded preview image coordinates
        // eslint-disable-next-line prefer-const
        let { x, y, width, height } = this.convertRegion({
          region: params,
          from: this.originalImageSize,
          to: this.cropImageSize,
        });

        // Transform crop coordinates to account for mirroring
        // The stored coordinates are for the original image, but we display mirrored
        // So we need to mirror the crop coordinates to match the preview
        if (this.mirrorHorizontal) {
          x = img.width - x - width;
        }
        if (this.mirrorVertical) {
          y = img.height - y - height;
        }

        // Convert from absolute pixel coordinates to display coordinates
        this.region = {
          x: x * scale,
          y: y * scale,
          width: width * scale,
          height: height * scale,
        };
      } else {
        this.region = {
          x: 0,
          y: 0,
          width: img.width * scale,
          height: img.height * scale,
        };
      }
    }
    this.cropImageScale = scale;

    img.style.width = `${img.width * scale}px`;
    img.style.height = `${img.height * scale}px`;

    this.draw();
  }

  calculateScale(): number {
    const img = this.imgElement;
    const cropArea = this.cropAreaEl;

    if (!cropArea || !img) {
      return 1;
    }

    const containerWidth = cropArea.clientWidth;
    const containerHeight = cropArea.clientHeight;

    // Fit image to container while maintaining aspect ratio
    let scale = containerWidth / img.width;
    if (img.height * scale > containerHeight) {
      scale = containerHeight / img.height;
    }

    return scale;
  }

  normalizeCropArea(scale: number) {
    const img = this.imgElement;
    if (!img) {
      return this.region;
    }

    const scaleRatio = scale / this.cropImageScale;
    const scaledRegion = {
      x: this.region.x * scaleRatio,
      y: this.region.y * scaleRatio,
      width: this.region.width * scaleRatio,
      height: this.region.height * scaleRatio,
    };

    // Constrain to scaled image bounds
    return this.constrainToBounds(scaledRegion, {
      width: img.width * scale,
      height: img.height * scale,
    });
  }

  resizeCanvas() {
    const img = this.imgElement;
    const cropArea = this.cropAreaEl;

    if (!cropArea || !img) {
      return;
    }

    const scale = this.calculateScale();
    this.region = this.normalizeCropArea(scale);
    this.cropImageScale = scale;

    img.style.width = `${img.width * scale}px`;
    img.style.height = `${img.height * scale}px`;

    this.draw();
  }

  handleMouseDownOn(e: MouseEvent, resizeBoundary: ResizeBoundary) {
    if (e.button !== 0) {
      return;
    }

    this.isInteracting = true;
    this.resizeSide = resizeBoundary;
    if (resizeBoundary === ResizeBoundary.None) {
      this.isDragging = true;
      const { mouseX, mouseY } = this.getMousePosition(e);
      this.dragAnchor = { x: mouseX - this.region.x, y: mouseY - this.region.y };
    }

    document.body.style.userSelect = 'none';
    globalThis.addEventListener('mouseup', () => this.handleMouseUp(), { passive: true });
  }

  handleMouseMove(e: MouseEvent) {
    if (!this.cropAreaEl) {
      return;
    }

    const { mouseX, mouseY } = this.getMousePosition(e);

    if (this.isDragging) {
      this.moveCrop(mouseX, mouseY);
    } else if (this.resizeSide !== ResizeBoundary.None) {
      this.resizeCrop(mouseX, mouseY);
    }
  }

  handleMouseUp() {
    globalThis.removeEventListener('mouseup', this.handleMouseUp);
    document.body.style.userSelect = '';

    this.isInteracting = false;
    this.isDragging = false;
    this.resizeSide = ResizeBoundary.None;
  }

  getMousePosition(e: MouseEvent) {
    if (!this.cropAreaEl) {
      throw new Error('Crop area is undefined');
    }
    const clientRect = this.cropAreaEl.getBoundingClientRect();

    switch (this.normalizedRotation) {
      case 90: {
        return {
          mouseX: e.clientY - clientRect.top,
          mouseY: -e.clientX + clientRect.right,
        };
      }
      case 180: {
        return {
          mouseX: -e.clientX + clientRect.right,
          mouseY: -e.clientY + clientRect.bottom,
        };
      }
      case 270: {
        return {
          mouseX: -e.clientY + clientRect.bottom,
          mouseY: e.clientX - clientRect.left,
        };
      }
      // also case 0:
      default: {
        return {
          mouseX: e.clientX - clientRect.left,
          mouseY: e.clientY - clientRect.top,
        };
      }
    }
  }

  moveCrop(mouseX: number, mouseY: number) {
    const cropArea = this.cropAreaEl;
    if (!cropArea) {
      return;
    }

    this.hasChanges = true;
    this.region.x = clamp(mouseX - this.dragAnchor.x, 0, cropArea.clientWidth - this.region.width);
    this.region.y = clamp(mouseY - this.dragAnchor.y, 0, cropArea.clientHeight - this.region.height);

    this.draw();
  }

  resizeCrop(mouseX: number, mouseY: number) {
    const canvas = this.cropAreaEl;
    const currentCrop = this.region;
    if (!canvas) {
      return;
    }
    this.isInteracting = true;

    this.hasChanges = true;
    const { x, y, width, height } = currentCrop;
    const minSize = 50;
    let newRegion = { ...currentCrop };

    let desiredWidth = width;
    let desiredHeight = height;

    // Width
    switch (this.resizeSide) {
      case ResizeBoundary.Left:
      case ResizeBoundary.TopLeft:
      case ResizeBoundary.BottomLeft: {
        desiredWidth = Math.max(minSize, width + (x - Math.max(mouseX, 0)));
        break;
      }
      case ResizeBoundary.Right:
      case ResizeBoundary.TopRight:
      case ResizeBoundary.BottomRight: {
        desiredWidth = Math.max(minSize, Math.max(mouseX, 0) - x);
        break;
      }
    }

    // Height
    switch (this.resizeSide) {
      case ResizeBoundary.Top:
      case ResizeBoundary.TopLeft:
      case ResizeBoundary.TopRight: {
        desiredHeight = Math.max(minSize, height + (y - Math.max(mouseY, 0)));
        break;
      }
      case ResizeBoundary.Bottom:
      case ResizeBoundary.BottomLeft:
      case ResizeBoundary.BottomRight: {
        desiredHeight = Math.max(minSize, Math.max(mouseY, 0) - y);
        break;
      }
    }

    // Old
    switch (this.resizeSide) {
      case ResizeBoundary.Left: {
        const { newWidth: w, newHeight: h } = this.keepAspectRatio(desiredWidth, height);
        const finalWidth = clamp(w, minSize, canvas.clientWidth);
        newRegion = {
          x: Math.max(0, x + width - finalWidth),
          y,
          width: finalWidth,
          height: clamp(h, minSize, canvas.clientHeight),
        };
        break;
      }
      case ResizeBoundary.Right: {
        const { newWidth: w, newHeight: h } = this.keepAspectRatio(desiredWidth, height);
        newRegion = {
          ...newRegion,
          width: clamp(w, minSize, canvas.clientWidth - x),
          height: clamp(h, minSize, canvas.clientHeight),
        };
        break;
      }
      case ResizeBoundary.Top: {
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          desiredWidth,
          desiredHeight,
          this.cropAspectRatio,
          canvas.clientWidth,
          canvas.clientHeight,
          minSize,
        );
        newRegion = {
          x,
          y: Math.max(0, y + height - h),
          width: w,
          height: h,
        };
        break;
      }
      case ResizeBoundary.Bottom: {
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          desiredWidth,
          desiredHeight,
          this.cropAspectRatio,
          canvas.clientWidth,
          canvas.clientHeight - y,
          minSize,
        );
        newRegion = {
          ...newRegion,
          width: w,
          height: h,
        };
        break;
      }
      case ResizeBoundary.TopLeft: {
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          desiredWidth,
          desiredHeight,
          this.cropAspectRatio,
          canvas.clientWidth,
          canvas.clientHeight,
          minSize,
        );
        newRegion = {
          x: Math.max(0, x + width - w),
          y: Math.max(0, y + height - h),
          width: w,
          height: h,
        };
        break;
      }
      case ResizeBoundary.TopRight: {
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          desiredWidth,
          desiredHeight,
          this.cropAspectRatio,
          canvas.clientWidth - x,
          y + height,
          minSize,
        );
        newRegion = {
          x,
          y: Math.max(0, y + height - h),
          width: w,
          height: h,
        };
        break;
      }
      case ResizeBoundary.BottomLeft: {
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          desiredWidth,
          desiredHeight,
          this.cropAspectRatio,
          canvas.clientWidth,
          canvas.clientHeight - y,
          minSize,
        );
        newRegion = {
          x: Math.max(0, x + width - w),
          y,
          width: w,
          height: h,
        };
        break;
      }
      case ResizeBoundary.BottomRight: {
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          desiredWidth,
          desiredHeight,
          this.cropAspectRatio,
          canvas.clientWidth - x,
          canvas.clientHeight - y,
          minSize,
        );
        newRegion = {
          ...newRegion,
          width: w,
          height: h,
        };
        break;
      }
    }

    // Constrain the region to canvas bounds
    this.region = {
      ...newRegion,
      x: Math.max(0, Math.min(newRegion.x, canvas.clientWidth - newRegion.width)),
      y: Math.max(0, Math.min(newRegion.y, canvas.clientHeight - newRegion.height)),
    };

    this.draw();
  }

  resetCrop() {
    this.cropAspectRatio = 'free';
    this.region = {
      x: 0,
      y: 0,
      width: this.cropImageSize.width * this.cropImageScale - 1,
      height: this.cropImageSize.height * this.cropImageScale - 1,
    };
  }

  rotateAspectRatio() {
    const aspectRatio = this.cropAspectRatio;
    if (aspectRatio === 'free' || aspectRatio === 'reset') {
      return;
    }

    const [widthRatio, heightRatio] = aspectRatio.split(':');
    this.setAspectRatio(`${heightRatio}:${widthRatio}`);
  }

  // Coordinate conversion helpers
  convertRegion(settings: RegionConvertParams) {
    const { region, from: fromSize, to: toSize } = settings;
    const scaleX = toSize.width / fromSize.width;
    const scaleY = toSize.height / fromSize.height;

    return {
      x: Math.round(region.x * scaleX),
      y: Math.round(region.y * scaleY),
      width: Math.round(region.width * scaleX),
      height: Math.round(region.height * scaleY),
    };
  }

  getRegionInPreviewCoords(region: Region) {
    return {
      x: Math.round(region.x / this.cropImageScale),
      y: Math.round(region.y / this.cropImageScale),
      width: Math.round(region.width / this.cropImageScale),
      height: Math.round(region.height / this.cropImageScale),
    };
  }

  // Apply mirror transformation to coordinates
  applyMirrorToCoords(region: Region, imageSize: ImageDimensions): Region {
    let { x, y } = region;
    const { width, height } = region;

    if (this.mirrorHorizontal) {
      x = imageSize.width - x - width;
    }
    if (this.mirrorVertical) {
      y = imageSize.height - y - height;
    }

    return { x, y, width, height };
  }

  // Constrain region to bounds
  constrainToBounds(region: Region, bounds: ImageDimensions): Region {
    const { x, y, width, height } = region;
    return {
      x: Math.max(0, Math.min(x, bounds.width - width)),
      y: Math.max(0, Math.min(y, bounds.height - height)),
      width: Math.min(width, bounds.width - Math.max(0, x)),
      height: Math.min(height, bounds.height - Math.max(0, y)),
    };
  }
}

export const transformManager = new TransformManager();
