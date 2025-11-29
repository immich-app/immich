import {
  editManager,
  type EditActionNoIndex,
  type EditActions,
  type EditToolManager,
} from '$lib/managers/edit/edit-manager.svelte';
import { getAssetOriginalUrl } from '$lib/utils';
import { handleError } from '$lib/utils/handle-error';
import { EditActionType, type AssetResponseDto, type CropParameters, type RotateParameters } from '@immich/sdk';
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

export type CropSettings = {
  x: number;
  y: number;
  width: number;
  height: number;
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
  cropImageSize = $state([1000, 1000]);
  cropImageScale = $state(1);
  cropAspectRatio = $state('free' as CropAspectRatio);
  region = $state({ x: 0, y: 0, width: 100, height: 100 });

  imageRotation = $state(0);
  normalizedRotation = $derived.by(() => {
    const newAngle = this.imageRotation % 360;
    return newAngle < 0 ? newAngle + 360 : newAngle;
  });
  orientationChanged = $derived.by(() => this.normalizedRotation % 180 > 0);

  edits = $derived.by(() => this.getEdits());

  setAspectRatio(aspectRatio: CropAspectRatio) {
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
    const originalImgSize = this.cropImageSize.map((el) => el * this.cropImageScale);

    return (
      Math.abs(originalImgSize[0] - this.region.width) > 2 || Math.abs(originalImgSize[1] - this.region.height) > 2
    );
  }

  getEdits(): EditActionNoIndex[] {
    const edits: EditActionNoIndex[] = [];

    if (this.checkEdits()) {
      const { x, y, width, height } = this.region;

      edits.push({
        action: EditActionType.Crop,
        parameters: {
          x: Math.round(x / this.cropImageScale),
          y: Math.round(y / this.cropImageScale),
          width: Math.round(width / this.cropImageScale),
          height: Math.round(height / this.cropImageScale),
        },
      });
    }

    if (this.normalizedRotation !== 0) {
      edits.push({
        action: 'rotate' as EditActionType.Rotate,
        parameters: {
          angle: this.normalizedRotation,
        },
      });
    }

    return edits;
  }

  async resetAllChanges() {
    this.imageRotation = 0;
    await tick();

    this.onImageLoad([]);
  }

  async onActivate(asset: AssetResponseDto, edits: EditActions): Promise<void> {
    this.imgElement = new Image();
    this.imgElement.src = getAssetOriginalUrl({ id: asset.id, cacheKey: asset.thumbhash, edited: false });

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
    this.region = { x: 0, y: 0, width: 100, height: 100 };
    this.cropImageSize = [1000, 1000];
    this.cropImageScale = 1;
  }

  async rotate(angle: number) {
    this.imageRotation += angle;
    await tick();
    this.onImageLoad();
  }

  recalculateCrop(aspectRatio: CropAspectRatio = this.cropAspectRatio): CropSettings {
    if (!this.cropAreaEl) {
      return this.region;
    }

    const canvasW = this.cropAreaEl.clientWidth;
    const canvasH = this.cropAreaEl.clientHeight;

    let newWidth = this.region.width;
    let newHeight = this.region.height;

    const { newWidth: w, newHeight: h } = this.keepAspectRatio(newWidth, newHeight, aspectRatio);

    if (w > canvasW) {
      newWidth = canvasW;
      newHeight = canvasW / (w / h);
    } else if (h > canvasH) {
      newHeight = canvasH;
      newWidth = canvasH * (w / h);
    } else {
      newWidth = w;
      newHeight = h;
    }

    const newX = Math.max(0, Math.min(this.region.x, canvasW - newWidth));
    const newY = Math.max(0, Math.min(this.region.y, canvasH - newHeight));

    const newCrop = {
      width: newWidth,
      height: newHeight,
      x: newX,
      y: newY,
    };

    return newCrop;
  }

  animateCropChange(element: HTMLElement, from: CropSettings, to: CropSettings, duration = 100) {
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

  keepAspectRatio(newWidth: number, newHeight: number, aspectRatio: CropAspectRatio = this.cropAspectRatio) {
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
    aspectRatio: CropAspectRatio,
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

  draw(crop: CropSettings = this.region) {
    if (!this.cropFrame) {
      return;
    }

    this.cropFrame.style.left = `${crop.x}px`;
    this.cropFrame.style.top = `${crop.y}px`;
    this.cropFrame.style.width = `${crop.width}px`;
    this.cropFrame.style.height = `${crop.height}px`;

    this.drawOverlay(crop);
  }

  drawOverlay(crop: CropSettings) {
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

    this.cropImageSize = [img.width, img.height];
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
      const cropEdit = edits.find((e) => e.action === EditActionType.Crop);

      if (cropEdit) {
        const params = cropEdit.parameters as CropParameters;
        // Convert from absolute pixel coordinates to display coordinates
        this.region = {
          x: params.x * scale,
          y: params.y * scale,
          width: params.width * scale,
          height: params.height * scale,
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

    const containerWidth = cropArea?.clientWidth ?? 0;
    const containerHeight = cropArea?.clientHeight ?? 0;

    const imageAspectRatio = img.width / img.height;
    let scale: number;

    if (imageAspectRatio > 1) {
      scale = containerWidth / img.width;
      if (img.height * scale > containerHeight) {
        scale = containerHeight / img.height;
      }
    } else {
      scale = containerHeight / img.height;
      if (img.width * scale > containerWidth) {
        scale = containerWidth / img.width;
      }
    }

    return scale;
  }

  normalizeCropArea(scale: number) {
    const img = this.imgElement;
    const crop = { ...this.region };

    if (!img) {
      return crop;
    }

    const prevScale = this.cropImageScale;
    const scaleRatio = scale / prevScale;

    crop.x *= scaleRatio;
    crop.y *= scaleRatio;
    crop.width *= scaleRatio;
    crop.height *= scaleRatio;

    crop.width = Math.min(crop.width, img.width * scale);
    crop.height = Math.min(crop.height, img.height * scale);
    crop.x = Math.max(0, Math.min(crop.x, img.width * scale - crop.width));
    crop.y = Math.max(0, Math.min(crop.y, img.height * scale - crop.height));

    return crop;
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

  isOnCropBoundary(mouseX: number, mouseY: number) {
    const { x, y, width, height } = this.region;
    const sensitivity = 10;
    const cornerSensitivity = 15;
    const [imgWidth, imgHeight] = this.cropImageSize;

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

    const onLeftBoundary =
      mouseX >= x - sensitivity && mouseX <= x + sensitivity && mouseY >= y && mouseY <= y + height;
    const onRightBoundary =
      mouseX >= x + width - sensitivity && mouseX <= x + width + sensitivity && mouseY >= y && mouseY <= y + height;
    const onTopBoundary = mouseY >= y - sensitivity && mouseY <= y + sensitivity && mouseX >= x && mouseX <= x + width;
    const onBottomBoundary =
      mouseY >= y + height - sensitivity && mouseY <= y + height + sensitivity && mouseX >= x && mouseX <= x + width;

    const onTopLeftCorner =
      mouseX >= x - cornerSensitivity &&
      mouseX <= x + cornerSensitivity &&
      mouseY >= y - cornerSensitivity &&
      mouseY <= y + cornerSensitivity;
    const onTopRightCorner =
      mouseX >= x + width - cornerSensitivity &&
      mouseX <= x + width + cornerSensitivity &&
      mouseY >= y - cornerSensitivity &&
      mouseY <= y + cornerSensitivity;
    const onBottomLeftCorner =
      mouseX >= x - cornerSensitivity &&
      mouseX <= x + cornerSensitivity &&
      mouseY >= y + height - cornerSensitivity &&
      mouseY <= y + height + cornerSensitivity;
    const onBottomRightCorner =
      mouseX >= x + width - cornerSensitivity &&
      mouseX <= x + width + cornerSensitivity &&
      mouseY >= y + height - cornerSensitivity &&
      mouseY <= y + height + cornerSensitivity;

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

    const crop = this.region;
    const { x, y } = this.dragOffset;

    let newX = mouseX - x;
    let newY = mouseY - y;

    newX = Math.max(0, Math.min(cropArea.clientWidth - crop.width, newX));
    newY = Math.max(0, Math.min(cropArea.clientHeight - crop.height, newY));

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
    let newWidth = width;
    let newHeight = height;
    switch (resizeSideValue) {
      case 'left': {
        newWidth = width + x - mouseX;
        newHeight = height;
        if (newWidth >= minSize && mouseX >= 0) {
          const { newWidth: w, newHeight: h } = this.keepAspectRatio(newWidth, newHeight);
          this.region = {
            ...this.region,
            width: Math.max(minSize, Math.min(w, canvas.clientWidth)),
            height: Math.max(minSize, Math.min(h, canvas.clientHeight)),
            x: Math.max(0, x + width - this.region.width),
          };
        }
        break;
      }
      case 'right': {
        newWidth = mouseX - x;
        newHeight = height;
        if (newWidth >= minSize && mouseX <= canvas.clientWidth) {
          const { newWidth: w, newHeight: h } = this.keepAspectRatio(newWidth, newHeight);
          this.region = {
            ...this.region,
            width: Math.max(minSize, Math.min(w, canvas.clientWidth - x)),
            height: Math.max(minSize, Math.min(h, canvas.clientHeight)),
          };
        }
        break;
      }
      case 'top': {
        newHeight = height + y - mouseY;
        newWidth = width;
        if (newHeight >= minSize && mouseY >= 0) {
          const { newWidth: w, newHeight: h } = this.adjustDimensions(
            newWidth,
            newHeight,
            this.cropAspectRatio,
            canvas.clientWidth,
            canvas.clientHeight,
            minSize,
          );
          this.region = {
            ...this.region,
            y: Math.max(0, y + height - h),
            width: w,
            height: h,
          };
        }
        break;
      }
      case 'bottom': {
        newHeight = mouseY - y;
        newWidth = width;
        if (newHeight >= minSize && mouseY <= canvas.clientHeight) {
          const { newWidth: w, newHeight: h } = this.adjustDimensions(
            newWidth,
            newHeight,
            this.cropAspectRatio,
            canvas.clientWidth,
            canvas.clientHeight - y,
            minSize,
          );
          this.region = {
            ...this.region,
            width: w,
            height: h,
          };
        }
        break;
      }
      case 'top-left': {
        newWidth = width + x - Math.max(mouseX, 0);
        newHeight = height + y - Math.max(mouseY, 0);
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          newWidth,
          newHeight,
          this.cropAspectRatio,
          canvas.clientWidth,
          canvas.clientHeight,
          minSize,
        );
        this.region = {
          width: w,
          height: h,
          x: Math.max(0, x + width - w),
          y: Math.max(0, y + height - h),
        };

        break;
      }
      case 'top-right': {
        newWidth = Math.max(mouseX, 0) - x;
        newHeight = height + y - Math.max(mouseY, 0);
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          newWidth,
          newHeight,
          this.cropAspectRatio,
          canvas.clientWidth - x,
          y + height,
          minSize,
        );
        this.region = {
          ...this.region,
          width: w,
          height: h,
          y: Math.max(0, y + height - h),
        };
        break;
      }
      case 'bottom-left': {
        newWidth = width + x - Math.max(mouseX, 0);
        newHeight = Math.max(mouseY, 0) - y;
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          newWidth,
          newHeight,
          this.cropAspectRatio,
          canvas.clientWidth,
          canvas.clientHeight - y,
          minSize,
        );
        this.region = {
          ...this.region,
          width: w,
          height: h,
          x: Math.max(0, x + width - w),
        };
        break;
      }
      case 'bottom-right': {
        newWidth = Math.max(mouseX, 0) - x;
        newHeight = Math.max(mouseY, 0) - y;
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          newWidth,
          newHeight,
          this.cropAspectRatio,
          canvas.clientWidth - x,
          canvas.clientHeight - y,
          minSize,
        );
        this.region = {
          ...this.region,
          width: w,
          height: h,
        };
        break;
      }
    }

    this.region = {
      ...this.region,
      x: Math.max(0, Math.min(this.region.x, canvas.clientWidth - this.region.width)),
      y: Math.max(0, Math.min(this.region.y, canvas.clientHeight - this.region.height)),
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
}

export const transformManager = new TransformManager();
