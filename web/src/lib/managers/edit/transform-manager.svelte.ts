import { editManager, type EditActions, type EditToolManager } from '$lib/managers/edit/edit-manager.svelte';
import { getAssetThumbnailUrl } from '$lib/utils';
import { getDimensions } from '$lib/utils/asset-utils';
import { handleError } from '$lib/utils/handle-error';
import {
  AssetEditAction,
  AssetMediaSize,
  MirrorAxis,
  type AssetResponseDto,
  type CropParameters,
  type MirrorParameters,
  type RotateParameters,
} from '@immich/sdk';
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

class TransformManager implements EditToolManager {
  hasChanges: boolean = $derived.by(() => this.checkEdits());

  darkenLevel = $state(0.65);
  isInteracting = $state(false);
  isDragging = $state(false);
  animationFrame = $state<ReturnType<typeof requestAnimationFrame> | null>(null);
  canvasCursor = $state('default');
  dragOffset = $state({ x: 0, y: 0 });
  resizeSide = $state('');
  imgElement = $state<HTMLImageElement | null>(null);
  cropAreaEl = $state<HTMLElement | null>(null);
  overlayEl = $state<HTMLElement | null>(null);
  cropFrame = $state<HTMLElement | null>(null);
  cropImageSize = $state<ImageDimensions>({ width: 1000, height: 1000 });
  cropImageScale = $state(1);
  cropAspectRatio = $state('free');
  originalImageSize = $state<ImageDimensions>({ width: 1000, height: 1000 });
  region = $state({ x: 0, y: 0, width: 100, height: 100 });
  preveiwImgSize = $derived({
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
  orientationChanged = $derived.by(() => this.normalizedRotation % 180 > 0);

  edits = $derived.by(() => this.getEdits());

  setAspectRatio(aspectRatio: string) {
    this.cropAspectRatio = aspectRatio;

    if (!this.imgElement || !this.cropAreaEl) {
      return;
    }

    const newCrop = transformManager.recalculateCrop(aspectRatio);
    if (newCrop) {
      transformManager.animateCropChange(this.cropAreaEl, this.region, newCrop);
      this.region = newCrop;
    }
  }

  checkEdits() {
    return (
      Math.abs(this.preveiwImgSize.width - this.region.width) > 2 ||
      Math.abs(this.preveiwImgSize.height - this.region.height) > 2 ||
      this.mirrorHorizontal ||
      this.mirrorVertical ||
      this.normalizedRotation !== 0
    );
  }

  checkCropEdits() {
    return (
      Math.abs(this.preveiwImgSize.width - this.region.width) > 2 ||
      Math.abs(this.preveiwImgSize.height - this.region.height) > 2
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

    const imageURL = getAssetThumbnailUrl({
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

    // set the rotation before loading the image
    const rotateEdit = edits.find((e) => e.action === 'rotate');
    if (rotateEdit) {
      this.imageRotation = (rotateEdit.parameters as RotateParameters).angle;
    }

    // set mirror state from edits
    const mirrorEdits = edits.filter((e) => e.action === 'mirror');
    for (const mirrorEdit of mirrorEdits) {
      const axis = (mirrorEdit.parameters as MirrorParameters).axis;
      if (axis === MirrorAxis.Horizontal) {
        this.mirrorHorizontal = true;
      } else if (axis === MirrorAxis.Vertical) {
        this.mirrorVertical = true;
      }
    }

    await tick();

    this.resizeCanvas();
  }

  onDeactivate() {
    globalThis.removeEventListener('mousemove', transformManager.handleMouseMove);

    this.reset();
  }

  reset() {
    this.darkenLevel = 0.65;
    this.isInteracting = false;
    this.animationFrame = null;
    this.canvasCursor = 'default';
    this.dragOffset = { x: 0, y: 0 };
    this.resizeSide = '';
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
  }

  mirror(axis: 'horizontal' | 'vertical') {
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

  animateCropChange(element: HTMLElement, from: Region, to: Region, duration = 100) {
    const cropFrame = element.querySelector('.crop-frame') as HTMLElement;
    if (!cropFrame) {
      return;
    }

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

  // Calculate constrained dimensions based on aspect ratio and limits
  getConstrainedDimensions(
    desiredWidth: number,
    desiredHeight: number,
    maxWidth: number,
    maxHeight: number,
    minSize = 50,
  ) {
    const { newWidth, newHeight } = this.adjustDimensions(
      desiredWidth,
      desiredHeight,
      this.cropAspectRatio,
      maxWidth,
      maxHeight,
      minSize,
    );
    return {
      width: Math.max(minSize, Math.min(newWidth, maxWidth)),
      height: Math.max(minSize, Math.min(newHeight, maxHeight)),
    };
  }

  adjustDimensions(
    newWidth: number,
    newHeight: number,
    aspectRatio: string,
    xLimit: number,
    yLimit: number,
    minSize: number,
  ) {
    let w = newWidth;
    let h = newHeight;

    let aspectMultiplier: number;

    if (aspectRatio === 'free') {
      aspectMultiplier = newWidth / newHeight;
    } else {
      const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
      aspectMultiplier = widthRatio && heightRatio ? widthRatio / heightRatio : newWidth / newHeight;
    }

    if (aspectRatio !== 'free') {
      h = w / aspectMultiplier;
    }

    if (w > xLimit) {
      w = xLimit;
      if (aspectRatio !== 'free') {
        h = w / aspectMultiplier;
      }
    }
    if (h > yLimit) {
      h = yLimit;
      if (aspectRatio !== 'free') {
        w = h * aspectMultiplier;
      }
    }

    if (w < minSize) {
      w = minSize;
      if (aspectRatio !== 'free') {
        h = w / aspectMultiplier;
      }
    }
    if (h < minSize) {
      h = minSize;
      if (aspectRatio !== 'free') {
        w = h * aspectMultiplier;
      }
    }

    if (aspectRatio !== 'free' && w / h !== aspectMultiplier) {
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

    this.drawOverlay(crop);
  }

  drawOverlay(crop: Region) {
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
      cropFrameEl?.classList.add('transition');
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
      return { ...this.region };
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

  handleMouseDown(e: MouseEvent) {
    const canvas = this.cropAreaEl;
    if (!canvas) {
      return;
    }

    const { mouseX, mouseY } = this.getMousePosition(e);

    const {
      onLeftBoundary,
      onRightBoundary,
      onTopBoundary,
      onBottomBoundary,
      onTopLeftCorner,
      onTopRightCorner,
      onBottomLeftCorner,
      onBottomRightCorner,
    } = this.isOnCropBoundary(mouseX, mouseY);

    if (
      onTopLeftCorner ||
      onTopRightCorner ||
      onBottomLeftCorner ||
      onBottomRightCorner ||
      onLeftBoundary ||
      onRightBoundary ||
      onTopBoundary ||
      onBottomBoundary
    ) {
      this.setResizeSide(mouseX, mouseY);
    } else if (this.isInCropArea(mouseX, mouseY)) {
      this.startDragging(mouseX, mouseY);
    }

    document.body.style.userSelect = 'none';
    globalThis.addEventListener('mouseup', () => this.handleMouseUp(), { passive: true });
  }

  handleMouseMove(e: MouseEvent) {
    const canvas = this.cropAreaEl;
    if (!canvas) {
      return;
    }

    const resizeSideValue = this.resizeSide;
    const { mouseX, mouseY } = this.getMousePosition(e);

    if (this.isDragging) {
      this.moveCrop(mouseX, mouseY);
    } else if (resizeSideValue) {
      this.resizeCrop(mouseX, mouseY);
    } else {
      this.updateCursor(mouseX, mouseY);
    }
  }

  handleMouseUp() {
    globalThis.removeEventListener('mouseup', this.handleMouseUp);
    document.body.style.userSelect = '';

    this.isInteracting = false;
    this.isDragging = false;
    this.resizeSide = '';
    this.fadeOverlay(true); // Darken the background
  }

  getMousePosition(e: MouseEvent) {
    let offsetX = e.clientX;
    let offsetY = e.clientY;
    const clienRect = this.cropAreaEl?.getBoundingClientRect();
    const rotateDeg = this.normalizedRotation;

    if (rotateDeg == 90) {
      offsetX = e.clientY - (clienRect?.top ?? 0);
      offsetY = window.innerWidth - e.clientX - (window.innerWidth - (clienRect?.right ?? 0));
    } else if (rotateDeg == 180) {
      offsetX = window.innerWidth - e.clientX - (window.innerWidth - (clienRect?.right ?? 0));
      offsetY = window.innerHeight - e.clientY - (window.innerHeight - (clienRect?.bottom ?? 0));
    } else if (rotateDeg == 270) {
      offsetX = window.innerHeight - e.clientY - (window.innerHeight - (clienRect?.bottom ?? 0));
      offsetY = e.clientX - (clienRect?.left ?? 0);
    } else if (rotateDeg == 0) {
      offsetX -= clienRect?.left ?? 0;
      offsetY -= clienRect?.top ?? 0;
    }
    return { mouseX: offsetX, mouseY: offsetY };
  }

  // Boundary detection helpers
  private isInRange(value: number, target: number, sensitivity: number): boolean {
    return value >= target - sensitivity && value <= target + sensitivity;
  }

  private isWithinBounds(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  isOnCropBoundary(mouseX: number, mouseY: number) {
    const { x, y, width, height } = this.region;
    const sensitivity = 10;
    const cornerSensitivity = 15;
    const { width: imgWidth, height: imgHeight } = this.cropImageSize;

    const outOfBound = mouseX > imgWidth || mouseY > imgHeight || mouseX < 0 || mouseY < 0;
    if (outOfBound) {
      return {
        onLeftBoundary: false,
        onRightBoundary: false,
        onTopBoundary: false,
        onBottomBoundary: false,
        onTopLeftCorner: false,
        onTopRightCorner: false,
        onBottomLeftCorner: false,
        onBottomRightCorner: false,
      };
    }

    const onLeftBoundary = this.isInRange(mouseX, x, sensitivity) && this.isWithinBounds(mouseY, y, y + height);
    const onRightBoundary =
      this.isInRange(mouseX, x + width, sensitivity) && this.isWithinBounds(mouseY, y, y + height);
    const onTopBoundary = this.isInRange(mouseY, y, sensitivity) && this.isWithinBounds(mouseX, x, x + width);
    const onBottomBoundary =
      this.isInRange(mouseY, y + height, sensitivity) && this.isWithinBounds(mouseX, x, x + width);

    const onTopLeftCorner =
      this.isInRange(mouseX, x, cornerSensitivity) && this.isInRange(mouseY, y, cornerSensitivity);
    const onTopRightCorner =
      this.isInRange(mouseX, x + width, cornerSensitivity) && this.isInRange(mouseY, y, cornerSensitivity);
    const onBottomLeftCorner =
      this.isInRange(mouseX, x, cornerSensitivity) && this.isInRange(mouseY, y + height, cornerSensitivity);
    const onBottomRightCorner =
      this.isInRange(mouseX, x + width, cornerSensitivity) && this.isInRange(mouseY, y + height, cornerSensitivity);

    return {
      onLeftBoundary,
      onRightBoundary,
      onTopBoundary,
      onBottomBoundary,
      onTopLeftCorner,
      onTopRightCorner,
      onBottomLeftCorner,
      onBottomRightCorner,
    };
  }

  isInCropArea(mouseX: number, mouseY: number) {
    const { x, y, width, height } = this.region;
    return mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height;
  }

  setResizeSide(mouseX: number, mouseY: number) {
    const {
      onLeftBoundary,
      onRightBoundary,
      onTopBoundary,
      onBottomBoundary,
      onTopLeftCorner,
      onTopRightCorner,
      onBottomLeftCorner,
      onBottomRightCorner,
    } = this.isOnCropBoundary(mouseX, mouseY);

    if (onTopLeftCorner) {
      this.resizeSide = 'top-left';
    } else if (onTopRightCorner) {
      this.resizeSide = 'top-right';
    } else if (onBottomLeftCorner) {
      this.resizeSide = 'bottom-left';
    } else if (onBottomRightCorner) {
      this.resizeSide = 'bottom-right';
    } else if (onLeftBoundary) {
      this.resizeSide = 'left';
    } else if (onRightBoundary) {
      this.resizeSide = 'right';
    } else if (onTopBoundary) {
      this.resizeSide = 'top';
    } else if (onBottomBoundary) {
      this.resizeSide = 'bottom';
    }
  }

  startDragging(mouseX: number, mouseY: number) {
    this.isDragging = true;
    const crop = this.region;
    this.isInteracting = true;
    this.dragOffset = { x: mouseX - crop.x, y: mouseY - crop.y };
    this.fadeOverlay(false);
  }

  moveCrop(mouseX: number, mouseY: number) {
    const cropArea = this.cropAreaEl;
    if (!cropArea) {
      return;
    }

    const newX = Math.max(0, Math.min(mouseX - this.dragOffset.x, cropArea.clientWidth - this.region.width));
    const newY = Math.max(0, Math.min(mouseY - this.dragOffset.y, cropArea.clientHeight - this.region.height));

    this.region = {
      ...this.region,
      x: newX,
      y: newY,
    };

    this.draw();
  }

  resizeCrop(mouseX: number, mouseY: number) {
    const canvas = this.cropAreaEl;
    const crop = this.region;
    const resizeSideValue = this.resizeSide;
    if (!canvas || !resizeSideValue) {
      return;
    }
    this.fadeOverlay(false);

    const { x, y, width, height } = crop;
    const minSize = 50;
    let newRegion = { ...crop };

    switch (resizeSideValue) {
      case 'left': {
        const desiredWidth = width + (x - mouseX);
        if (desiredWidth >= minSize && mouseX >= 0) {
          const { newWidth: w, newHeight: h } = this.keepAspectRatio(desiredWidth, height);
          const finalWidth = Math.max(minSize, Math.min(w, canvas.clientWidth));
          const finalHeight = Math.max(minSize, Math.min(h, canvas.clientHeight));
          newRegion = {
            x: Math.max(0, x + width - finalWidth),
            y,
            width: finalWidth,
            height: finalHeight,
          };
        }
        break;
      }
      case 'right': {
        const desiredWidth = mouseX - x;
        if (desiredWidth >= minSize && mouseX <= canvas.clientWidth) {
          const { newWidth: w, newHeight: h } = this.keepAspectRatio(desiredWidth, height);
          newRegion = {
            ...newRegion,
            width: Math.max(minSize, Math.min(w, canvas.clientWidth - x)),
            height: Math.max(minSize, Math.min(h, canvas.clientHeight)),
          };
        }
        break;
      }
      case 'top': {
        const desiredHeight = height + (y - mouseY);
        if (desiredHeight >= minSize && mouseY >= 0) {
          const { newWidth: w, newHeight: h } = this.adjustDimensions(
            width,
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
        }
        break;
      }
      case 'bottom': {
        const desiredHeight = mouseY - y;
        if (desiredHeight >= minSize && mouseY <= canvas.clientHeight) {
          const { newWidth: w, newHeight: h } = this.adjustDimensions(
            width,
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
        }
        break;
      }
      case 'top-left': {
        const desiredWidth = width + (x - Math.max(mouseX, 0));
        const desiredHeight = height + (y - Math.max(mouseY, 0));
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
      case 'top-right': {
        const desiredWidth = Math.max(mouseX, 0) - x;
        const desiredHeight = height + (y - Math.max(mouseY, 0));
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
      case 'bottom-left': {
        const desiredWidth = width + (x - Math.max(mouseX, 0));
        const desiredHeight = Math.max(mouseY, 0) - y;
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
      case 'bottom-right': {
        const desiredWidth = Math.max(mouseX, 0) - x;
        const desiredHeight = Math.max(mouseY, 0) - y;
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

  updateCursor(mouseX: number, mouseY: number) {
    if (!this.cropAreaEl) {
      return;
    }

    let {
      onLeftBoundary,
      onRightBoundary,
      onTopBoundary,
      onBottomBoundary,
      onTopLeftCorner,
      onTopRightCorner,
      onBottomLeftCorner,
      onBottomRightCorner,
    } = this.isOnCropBoundary(mouseX, mouseY);

    if (this.normalizedRotation == 90) {
      [onTopBoundary, onRightBoundary, onBottomBoundary, onLeftBoundary] = [
        onLeftBoundary,
        onTopBoundary,
        onRightBoundary,
        onBottomBoundary,
      ];

      [onTopLeftCorner, onTopRightCorner, onBottomRightCorner, onBottomLeftCorner] = [
        onBottomLeftCorner,
        onTopLeftCorner,
        onTopRightCorner,
        onBottomRightCorner,
      ];
    } else if (this.normalizedRotation == 180) {
      [onTopBoundary, onBottomBoundary] = [onBottomBoundary, onTopBoundary];
      [onLeftBoundary, onRightBoundary] = [onRightBoundary, onLeftBoundary];

      [onTopLeftCorner, onBottomRightCorner] = [onBottomRightCorner, onTopLeftCorner];
      [onTopRightCorner, onBottomLeftCorner] = [onBottomLeftCorner, onTopRightCorner];
    } else if (this.normalizedRotation == 270) {
      [onTopBoundary, onRightBoundary, onBottomBoundary, onLeftBoundary] = [
        onRightBoundary,
        onBottomBoundary,
        onLeftBoundary,
        onTopBoundary,
      ];

      [onTopLeftCorner, onTopRightCorner, onBottomRightCorner, onBottomLeftCorner] = [
        onTopRightCorner,
        onBottomRightCorner,
        onBottomLeftCorner,
        onTopLeftCorner,
      ];
    }

    let cursorName = '';
    if (onTopLeftCorner || onBottomRightCorner) {
      cursorName = 'nwse-resize';
    } else if (onTopRightCorner || onBottomLeftCorner) {
      cursorName = 'nesw-resize';
    } else if (onLeftBoundary || onRightBoundary) {
      cursorName = 'ew-resize';
    } else if (onTopBoundary || onBottomBoundary) {
      cursorName = 'ns-resize';
    } else if (this.isInCropArea(mouseX, mouseY)) {
      cursorName = 'move';
    } else {
      cursorName = 'default';
    }

    if (this.canvasCursor != cursorName && this.cropAreaEl && !editManager.isShowingConfirmDialog) {
      this.canvasCursor = cursorName;
      document.body.style.cursor = cursorName;
      this.cropAreaEl.style.cursor = cursorName;
    }
  }

  fadeOverlay(toDark: boolean) {
    const overlay = this.overlayEl;
    const cropFrame = document.querySelector('.crop-frame');

    if (toDark) {
      overlay?.classList.remove('light');
      cropFrame?.classList.remove('resizing');
    } else {
      overlay?.classList.add('light');
      cropFrame?.classList.add('resizing');
    }

    this.isInteracting = !toDark;
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
