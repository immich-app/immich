import { AssetEditAction, AssetMediaSize, MirrorAxis, type AssetResponseDto, type CropParameters } from '@immich/sdk';
import { clamp } from 'lodash-es';
import { tick } from 'svelte';
import { type EditActions, type EditToolManager } from '$lib/managers/edit/edit-manager.svelte';
import { getAssetMediaUrl } from '$lib/utils';
import { getDimensions } from '$lib/utils/asset-utils';
import { normalizeTransformEdits, splitRotation } from '$lib/utils/editor';
import { handleError } from '$lib/utils/handle-error';
import { calculateLargestInscribedRect, calculateStraightenScale } from '$lib/utils/straighten';

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

const CROP_INTERSECTION_STEPS = 8;
const CROP_RESIZE_INTERSECTION_STEPS = 16;

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
  private handleWindowMouseMove = (event: MouseEvent) => this.handleMouseMove(event);
  private loadToken = 0;

  canReset: boolean = $derived.by(() => this.checkEdits());
  hasChanges: boolean = $state(false);

  isInteracting = $state(false);
  isDragging = $state(false);
  animationFrame = $state<ReturnType<typeof requestAnimationFrame> | null>(null);
  dragAnchor = $state({ x: 0, y: 0 });
  dragStartRegion = $state({ x: 0, y: 0, width: 0, height: 0 });
  offsetX = $derived.by(() => {
    const W = this.previewImageSize.width;
    const cx = W / 2;
    const cropCenterX = this.region.x + this.region.width / 2;
    return cx - cropCenterX;
  });
  offsetY = $derived.by(() => {
    const H = this.previewImageSize.height;
    const cy = H / 2;
    const cropCenterY = this.region.y + this.region.height / 2;
    return cy - cropCenterY;
  });
  resizeSide = $state(ResizeBoundary.None);
  imgElement = $state<HTMLImageElement | null>(null);
  cropAreaEl = $state<HTMLElement | null>(null);
  cropFrame = $state<HTMLElement | null>(null);
  cropImageSize = $state<ImageDimensions>({ width: 1000, height: 1000 });
  cropImageScale = $state(1);
  cropAspectRatio = $state('free');
  // Initial edit import waits for the preview image to load; later resizes reuse the current region.
  pendingInitialEdits = $state<EditActions | null>(null);
  originalImageSize = $state<ImageDimensions>({ width: 1000, height: 1000 });
  region = $state({ x: 0, y: 0, width: 100, height: 100 });
  previewImageSize = $derived({
    width: this.cropImageSize.width * this.cropImageScale,
    height: this.cropImageSize.height * this.cropImageScale,
  });

  imageRotation = $state(0);
  straightenAngle = $state(0);
  getStraightenScaleFor(): number {
    if (this.previewImageSize.width === 0 || this.previewImageSize.height === 0) {
      return 1;
    }

    return calculateStraightenScale(this.previewImageSize, this.straightenAngle);
  }

  straightenScale = $derived.by(() => {
    return this.getStraightenScaleFor();
  });
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
      this.normalizedRotation !== 0 ||
      this.straightenAngle !== 0
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

    if (this.checkCropEdits() || this.straightenAngle !== 0) {
      // Convert from display coordinates to preview image coordinates
      let cropRegionPreview = this.getRegionInPreviewCoords(this.region);

      // Transform crop coordinates to account for mirroring
      // The preview shows the mirrored image, but crop is applied before mirror on the server
      // So we need to "unmirror" the crop coordinates
      cropRegionPreview = this.applyMirrorToCoords(cropRegionPreview, this.cropImageSize);

      // Convert from preview image coordinates to original image coordinates
      let cropRegion = this.convertRegion({
        region: cropRegionPreview,
        from: this.cropImageSize,
        to: this.originalImageSize,
      });

      if (this.straightenAngle === 0) {
        // Constrain non-straighten crops to the original image bounds to absorb rounding error.
        cropRegion = this.constrainToBounds(cropRegion, this.originalImageSize);
      }

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

    const totalRotation = this.normalizedRotation + this.straightenAngle;
    if (totalRotation !== 0) {
      edits.push({
        action: AssetEditAction.Rotate,
        parameters: {
          angle: totalRotation,
        },
      });
    }

    return edits;
  }

  async resetAllChanges() {
    this.imageRotation = 0;
    this.straightenAngle = 0;
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

    this.pendingInitialEdits = edits;
    const imgElement = this.imgElement;
    const loadToken = ++this.loadToken;
    imgElement.addEventListener(
      'load',
      () => {
        if (this.loadToken === loadToken) {
          this.onImageLoad(this.pendingInitialEdits);
        }
      },
      { passive: true },
    );
    imgElement.addEventListener('error', (error) => handleError(error, 'ErrorLoadingImage'), {
      passive: true,
    });
    imgElement.src = imageURL;

    globalThis.addEventListener('mousemove', this.handleWindowMouseMove, { passive: true });

    const transformEdits = edits.filter((e) => e.action === 'rotate' || e.action === 'mirror');
    // Normalize rotation and mirror edits into a quarter-turn rotation, straighten angle, and mirror state
    // This allows edits to be imported in any order and still produce correct state
    const normalizedTransformation = normalizeTransformEdits(transformEdits);
    const rawRotation = normalizedTransformation.rotation;

    const { quarterTurn, straightenAngle } = splitRotation(rawRotation);
    this.imageRotation = quarterTurn;
    this.straightenAngle = straightenAngle;
    this.mirrorHorizontal = normalizedTransformation.mirrorHorizontal;
    this.mirrorVertical = normalizedTransformation.mirrorVertical;

    await tick();

    this.resizeCanvas();
  }

  onDeactivate() {
    globalThis.removeEventListener('mousemove', this.handleWindowMouseMove);

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
    this.imageRotation = 0;
    this.straightenAngle = 0;
    this.mirrorHorizontal = false;
    this.mirrorVertical = false;
    this.region = { x: 0, y: 0, width: 100, height: 100 };
    this.cropImageSize = { width: 1000, height: 1000 };
    this.originalImageSize = { width: 1000, height: 1000 };
    this.cropImageScale = 1;
    this.cropAspectRatio = 'free';
    this.pendingInitialEdits = null;
    this.hasChanges = false;
  }

  mirror(axis: 'horizontal' | 'vertical') {
    this.hasChanges = true;

    if (this.imageRotation % 180 !== 0) {
      axis = axis === 'horizontal' ? 'vertical' : 'horizontal';
    }

    if (axis === 'horizontal') {
      this.mirrorHorizontal = !this.mirrorHorizontal;
      if (this.straightenAngle !== 0) {
        const W = this.previewImageSize.width;
        if (W > 0) {
          this.region.x = W - this.region.x - this.region.width;
        }
      }
    } else {
      this.mirrorVertical = !this.mirrorVertical;
      if (this.straightenAngle !== 0) {
        const H = this.previewImageSize.height;
        if (H > 0) {
          this.region.y = H - this.region.y - this.region.height;
        }
      }
    }

    this.draw();
  }

  async rotate(angle: number) {
    this.hasChanges = true;

    this.imageRotation += angle;
    await tick();
    this.onImageLoad();
  }

  ensureCropInsideImageAfterRotation() {
    if (this.straightenAngle === 0) {
      const bounds = {
        width: this.cropImageSize.width * this.cropImageScale,
        height: this.cropImageSize.height * this.cropImageScale,
      };
      this.region = this.constrainToBounds(this.region, bounds);
      return;
    }

    const W = this.cropImageSize.width * this.cropImageScale;
    const H = this.cropImageSize.height * this.cropImageScale;

    const targetX = W / 2 - this.region.width / 2;
    const targetY = H / 2 - this.region.height / 2;

    const centerRegion = { ...this.region, x: targetX, y: targetY };
    this.region = this.getIntersectingStep(centerRegion, this.region);
  }

  setStraightenAngle(angle: number) {
    this.hasChanges = true;
    this.straightenAngle = angle;

    this.resizeCanvas();

    const newCrop = this.recalculateCrop(this.cropAspectRatio);
    if (newCrop) {
      this.region = newCrop;
    }

    this.ensureCropInsideImageAfterRotation();
    this.draw();
  }

  recalculateCrop(aspectRatio: string = this.cropAspectRatio): Region {
    if (!this.cropAreaEl) {
      return this.region;
    }

    if (this.straightenAngle !== 0) {
      const scale = this.straightenScale;
      const displaySize = {
        width: this.cropImageSize.width * this.cropImageScale * scale,
        height: this.cropImageSize.height * this.cropImageScale * scale,
      };

      let targetRatio = aspectRatio;
      if (aspectRatio === 'free' || aspectRatio === 'reset') {
        targetRatio = `${this.region.width}:${this.region.height}`;
      }

      const inscribed = calculateLargestInscribedRect(displaySize, this.straightenAngle, targetRatio);
      const W = this.cropImageSize.width * this.cropImageScale;
      const H = this.cropImageSize.height * this.cropImageScale;
      return {
        x: W / 2 - inscribed.width / 2,
        y: H / 2 - inscribed.height / 2,
        width: inscribed.width,
        height: inscribed.height,
      };
    }

    const canvasW = this.previewImageSize.width;
    const canvasH = this.previewImageSize.height;

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

  getTransformedOverlayPoint(x: number, y: number, W: number, H: number, S: number): { x: number; y: number } {
    let px = x;
    let py = y;

    if (this.mirrorHorizontal) {
      px = W - px;
    }
    if (this.mirrorVertical) {
      py = H - py;
    }

    if (this.straightenAngle !== 0) {
      const angle = -this.straightenAngle;
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const cx = W / 2;
      const cy = H / 2;

      const xRel = px - cx;
      const yRel = py - cy;

      const rx = (xRel * cos - yRel * sin) / S;
      const ry = (xRel * sin + yRel * cos) / S;

      px = rx + cx;
      py = ry + cy;
    }

    return { x: px, y: py };
  }

  isCropInsideImage(crop: Region): boolean {
    const width = this.cropImageSize.width * this.cropImageScale;
    const height = this.cropImageSize.height * this.cropImageScale;
    const straightenScale = this.getStraightenScaleFor();

    const corners = [
      { x: crop.x, y: crop.y },
      { x: crop.x + crop.width, y: crop.y },
      { x: crop.x + crop.width, y: crop.y + crop.height },
      { x: crop.x, y: crop.y + crop.height },
    ];

    for (const corner of corners) {
      const pLocal = this.getTransformedOverlayPoint(corner.x, corner.y, width, height, straightenScale);
      if (pLocal.x < 0 || pLocal.x > width || pLocal.y < 0 || pLocal.y > height) {
        return false;
      }
    }

    return true;
  }

  getIntersectingStep(startRegion: Region, targetRegion: Region, steps = CROP_INTERSECTION_STEPS): Region {
    let low = 0;
    let high = 1;
    for (let i = 0; i < steps; i++) {
      const mid = (low + high) / 2;
      const testRegion = {
        x: startRegion.x + (targetRegion.x - startRegion.x) * mid,
        y: startRegion.y + (targetRegion.y - startRegion.y) * mid,
        width: startRegion.width + (targetRegion.width - startRegion.width) * mid,
        height: startRegion.height + (targetRegion.height - startRegion.height) * mid,
      };
      if (this.isCropInsideImage(testRegion)) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return {
      x: startRegion.x + (targetRegion.x - startRegion.x) * low,
      y: startRegion.y + (targetRegion.y - startRegion.y) * low,
      width: startRegion.width + (targetRegion.width - startRegion.width) * low,
      height: startRegion.height + (targetRegion.height - startRegion.height) * low,
    };
  }

  draw(crop: Region = this.region) {
    if (!this.cropFrame) {
      return;
    }

    if (this.straightenAngle === 0) {
      this.cropFrame.style.left = `${crop.x}px`;
      this.cropFrame.style.top = `${crop.y}px`;
    } else {
      const W = this.cropImageSize.width * this.cropImageScale;
      const H = this.cropImageSize.height * this.cropImageScale;

      // The crop frame selection viewport stays stationary and visually centered in the crop area
      this.cropFrame.style.left = `${W / 2 - crop.width / 2}px`;
      this.cropFrame.style.top = `${H / 2 - crop.height / 2}px`;
    }
    this.cropFrame.style.width = `${crop.width}px`;
    this.cropFrame.style.height = `${crop.height}px`;
  }

  onImageLoad(edits: EditActions | null = null) {
    const img = this.imgElement;
    if (!this.cropAreaEl || !img) {
      return;
    }
    if (!img.naturalWidth || !img.naturalHeight) {
      return;
    }

    this.cropImageSize = { width: img.naturalWidth, height: img.naturalHeight };
    const scale = this.calculateScale();
    const oldScale = this.cropImageScale;

    let nextRegion;

    if (edits === null) {
      const scaleRatio = scale / oldScale;
      const scaledRegion = {
        x: this.region.x * scaleRatio,
        y: this.region.y * scaleRatio,
        width: this.region.width * scaleRatio,
        height: this.region.height * scaleRatio,
      };

      nextRegion =
        this.straightenAngle === 0
          ? this.constrainToBounds(scaledRegion, {
              width: img.naturalWidth * scale,
              height: img.naturalHeight * scale,
            })
          : scaledRegion;
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

        if (this.mirrorHorizontal) {
          x = img.naturalWidth - x - width;
        }
        if (this.mirrorVertical) {
          y = img.naturalHeight - y - height;
        }

        nextRegion = {
          x: x * scale,
          y: y * scale,
          width: width * scale,
          height: height * scale,
        };
      } else {
        nextRegion = {
          x: 0,
          y: 0,
          width: img.naturalWidth * scale,
          height: img.naturalHeight * scale,
        };
      }
    }
    this.cropImageScale = scale;
    this.region = nextRegion;
    if (edits !== null) {
      this.pendingInitialEdits = null;
    }

    img.style.width = `${img.naturalWidth * scale}px`;
    img.style.height = `${img.naturalHeight * scale}px`;

    if (edits === null) {
      const cropFrameEl = this.cropFrame;
      cropFrameEl?.classList.add('transition');
      cropFrameEl?.addEventListener('transitionend', () => cropFrameEl?.classList.remove('transition'), {
        passive: true,
      });
    }

    this.draw();
  }

  calculateScale(): number {
    const img = this.imgElement;
    const cropArea = this.cropAreaEl;

    if (!cropArea || !img) {
      return 1;
    }

    const container = cropArea.parentElement;
    if (!container) {
      return 1;
    }

    const style = getComputedStyle(container);
    const paddingX = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
    const paddingY = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);

    const containerWidth = container.clientWidth - paddingX;
    const containerHeight = container.clientHeight - paddingY;

    const isQuarterTurn = this.normalizedRotation === 90 || this.normalizedRotation === 270;
    const fitWidth = isQuarterTurn ? img.naturalHeight : img.naturalWidth;
    const fitHeight = isQuarterTurn ? img.naturalWidth : img.naturalHeight;

    // Fit image to container while maintaining aspect ratio
    let scale = containerWidth / fitWidth;
    if (fitHeight * scale > containerHeight) {
      scale = containerHeight / fitHeight;
    }

    if (this.straightenAngle !== 0) {
      scale /= this.straightenScale;
    }

    return scale;
  }

  resizeCanvas() {
    const img = this.imgElement;
    const cropArea = this.cropAreaEl;

    if (!cropArea || !img) {
      return;
    }
    if (!img.naturalWidth || !img.naturalHeight) {
      return;
    }
    if (this.pendingInitialEdits !== null) {
      this.onImageLoad(this.pendingInitialEdits);
      return;
    }

    const scale = this.calculateScale();
    const oldScale = this.cropImageScale;

    const scaleRatio = scale / oldScale;
    const scaledRegion = {
      x: this.region.x * scaleRatio,
      y: this.region.y * scaleRatio,
      width: this.region.width * scaleRatio,
      height: this.region.height * scaleRatio,
    };

    // Constrain to scaled image bounds
    const nextRegion =
      this.straightenAngle === 0
        ? this.constrainToBounds(scaledRegion, {
            width: img.naturalWidth * scale,
            height: img.naturalHeight * scale,
          })
        : scaledRegion;

    this.cropImageScale = scale;
    this.region = nextRegion;

    img.style.width = `${img.naturalWidth * scale}px`;
    img.style.height = `${img.naturalHeight * scale}px`;

    this.draw();
  }

  handleMouseDownOn(e: MouseEvent, resizeBoundary: ResizeBoundary) {
    if (e.button !== 0) {
      return;
    }

    this.isInteracting = true;
    this.resizeSide = resizeBoundary;

    const { mouseX, mouseY } = this.getMousePosition(e);
    this.dragStartRegion = {
      x: this.region.x,
      y: this.region.y,
      width: this.region.width,
      height: this.region.height,
    };

    if (resizeBoundary === ResizeBoundary.None) {
      this.isDragging = true;
      this.dragAnchor =
        this.straightenAngle === 0
          ? { x: mouseX - this.region.x, y: mouseY - this.region.y }
          : { x: mouseX, y: mouseY };
    } else {
      this.dragAnchor = { x: mouseX, y: mouseY };
    }

    document.body.style.userSelect = 'none';
    globalThis.addEventListener('mouseup', () => this.handleMouseUp(), { passive: true, once: true });
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

    if (this.straightenAngle === 0) {
      this.region.x = clamp(mouseX - this.dragAnchor.x, 0, cropArea.clientWidth - this.region.width);
      this.region.y = clamp(mouseY - this.dragAnchor.y, 0, cropArea.clientHeight - this.region.height);
    } else {
      const deltaX = mouseX - this.dragAnchor.x;
      const deltaY = mouseY - this.dragAnchor.y;
      const newX = this.dragStartRegion.x - deltaX;
      const newY = this.dragStartRegion.y - deltaY;
      const targetRegion = { ...this.region, x: newX, y: newY };
      if (this.isCropInsideImage(targetRegion)) {
        this.region = targetRegion;
      } else {
        const horizRegion = { ...this.region, x: newX };
        this.region = this.getIntersectingStep(this.region, horizRegion);

        const vertRegion = { ...this.region, y: newY };
        this.region = this.getIntersectingStep(this.region, vertRegion);
      }
    }

    this.draw();
  }

  resizeCrop(mouseX: number, mouseY: number) {
    const canvas = this.cropAreaEl;
    if (!canvas) {
      return;
    }
    this.isInteracting = true;
    this.hasChanges = true;

    const canvasWidth = this.previewImageSize.width;
    const canvasHeight = this.previewImageSize.height;

    const deltaX = mouseX - this.dragAnchor.x;
    const deltaY = mouseY - this.dragAnchor.y;

    const startX = this.dragStartRegion.x;
    const startY = this.dragStartRegion.y;
    const startW = this.dragStartRegion.width;
    const startH = this.dragStartRegion.height;

    const minSize = 50;
    let newRegion = { ...this.region };

    const maxW = this.straightenAngle === 0 ? canvasWidth : canvasWidth * this.straightenScale;
    const maxH = this.straightenAngle === 0 ? canvasHeight : canvasHeight * this.straightenScale;
    const leftLimit = this.straightenAngle === 0 ? Math.min(maxW, startX + startW) : maxW;
    const rightLimit = this.straightenAngle === 0 ? Math.min(maxW, canvasWidth - startX) : maxW;
    const topLimit = this.straightenAngle === 0 ? Math.min(maxH, startY + startH) : maxH;
    const bottomLimit = this.straightenAngle === 0 ? Math.min(maxH, canvasHeight - startY) : maxH;

    let desiredWidth = startW;
    let desiredHeight = startH;

    switch (this.resizeSide) {
      case ResizeBoundary.Left:
      case ResizeBoundary.TopLeft:
      case ResizeBoundary.BottomLeft: {
        desiredWidth = clamp(startW - deltaX, minSize, maxW);
        break;
      }
      case ResizeBoundary.Right:
      case ResizeBoundary.TopRight:
      case ResizeBoundary.BottomRight: {
        desiredWidth = clamp(startW + deltaX, minSize, maxW);
        break;
      }
      // no default
    }

    switch (this.resizeSide) {
      case ResizeBoundary.Top:
      case ResizeBoundary.TopLeft:
      case ResizeBoundary.TopRight: {
        desiredHeight = clamp(startH - deltaY, minSize, maxH);
        break;
      }
      case ResizeBoundary.Bottom:
      case ResizeBoundary.BottomLeft:
      case ResizeBoundary.BottomRight: {
        desiredHeight = clamp(startH + deltaY, minSize, maxH);
        break;
      }
      // no default
    }

    switch (this.resizeSide) {
      case ResizeBoundary.None: {
        break;
      }
      case ResizeBoundary.Left: {
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          desiredWidth,
          startH,
          this.cropAspectRatio,
          leftLimit,
          maxH,
          minSize,
        );
        newRegion = {
          x: startX + startW - w,
          y: startY + (startH - h) / 2,
          width: w,
          height: h,
        };
        break;
      }
      case ResizeBoundary.Right: {
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          desiredWidth,
          startH,
          this.cropAspectRatio,
          rightLimit,
          maxH,
          minSize,
        );
        newRegion = {
          ...newRegion,
          x: startX,
          y: startY + (startH - h) / 2,
          width: w,
          height: h,
        };
        break;
      }
      case ResizeBoundary.Top: {
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          startW,
          desiredHeight,
          this.cropAspectRatio,
          maxW,
          topLimit,
          minSize,
        );
        newRegion = {
          x: startX + (startW - w) / 2,
          y: startY + startH - h,
          width: w,
          height: h,
        };
        break;
      }
      case ResizeBoundary.Bottom: {
        const { newWidth: w, newHeight: h } = this.adjustDimensions(
          startW,
          desiredHeight,
          this.cropAspectRatio,
          maxW,
          bottomLimit,
          minSize,
        );
        newRegion = {
          ...newRegion,
          x: startX + (startW - w) / 2,
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
          leftLimit,
          topLimit,
          minSize,
        );
        newRegion = {
          x: startX + startW - w,
          y: startY + startH - h,
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
          rightLimit,
          topLimit,
          minSize,
        );
        newRegion = {
          x: startX,
          y: startY + startH - h,
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
          leftLimit,
          bottomLimit,
          minSize,
        );
        newRegion = {
          x: startX + startW - w,
          y: startY,
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
          rightLimit,
          bottomLimit,
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
    this.region =
      this.straightenAngle === 0
        ? {
            ...newRegion,
            x: Math.max(0, Math.min(newRegion.x, canvasWidth - newRegion.width)),
            y: Math.max(0, Math.min(newRegion.y, canvasHeight - newRegion.height)),
          }
        : this.getIntersectingStep(this.dragStartRegion, newRegion, CROP_RESIZE_INTERSECTION_STEPS);

    this.draw();
  }

  resetCrop() {
    this.cropAspectRatio = 'free';
    if (this.straightenAngle === 0) {
      this.region = {
        x: 0,
        y: 0,
        width: this.cropImageSize.width * this.cropImageScale - 1,
        height: this.cropImageSize.height * this.cropImageScale - 1,
      };
    } else {
      const scale = this.straightenScale;
      const displaySize = {
        width: this.cropImageSize.width * this.cropImageScale * scale,
        height: this.cropImageSize.height * this.cropImageScale * scale,
      };
      const inscribed = calculateLargestInscribedRect(displaySize, this.straightenAngle, 'free');
      const W = this.cropImageSize.width * this.cropImageScale;
      const H = this.cropImageSize.height * this.cropImageScale;
      this.region = {
        x: W / 2 - inscribed.width / 2,
        y: H / 2 - inscribed.height / 2,
        width: inscribed.width,
        height: inscribed.height,
      };
    }
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
