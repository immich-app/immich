import type { EditActionTypes, EditToolManager } from '$lib/managers/edit/edit-manager.svelte';
import { getAssetOriginalUrl } from '$lib/utils';
import { animateCropChange, handleMouseMove, onImageLoad, recalculateCrop } from '$lib/utils/crop-utils';
import { handleError } from '$lib/utils/handle-error';
import type { AssetResponseDto } from '@immich/sdk';

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

class CropManager implements EditToolManager {
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

  imageRotation = $state(0);
  normalizedRotation = $derived.by(() => {
    const newAngle = this.imageRotation % 360;
    return newAngle < 0 ? newAngle + 360 : newAngle;
  });
  orientationChanged = $derived.by(() => this.normalizedRotation % 180 > 0);

  region = $state({ x: 0, y: 0, width: 100, height: 100 });
  settings = $state({
    aspectRatio: 'free' as CropAspectRatio,
  });

  setAspectRatio(aspectRatio: CropAspectRatio) {
    this.settings.aspectRatio = aspectRatio;

    if (!this.imgElement || !this.cropAreaEl) {
      return;
    }

    const newCrop = recalculateCrop(this.region, this.cropAreaEl, aspectRatio);
    if (newCrop) {
      animateCropChange(this.cropAreaEl, this.region, newCrop);
      this.region = newCrop;
    }
  }

  checkEdits() {
    const originalImgSize = this.cropImageSize.map((el) => el * this.cropImageScale);

    return (
      Math.abs(originalImgSize[0] - this.region.width) > 2 || Math.abs(originalImgSize[1] - this.region.height) > 2
    );
  }

  getEdits(): EditActionTypes[] {
    // TODO return crop edits
    return [];
  }

  onActivate(asset: AssetResponseDto) {
    // TODO
    this.imgElement = new Image();
    this.imgElement.src = getAssetOriginalUrl({ id: asset.id, cacheKey: asset.thumbhash });

    this.imgElement.addEventListener('load', () => onImageLoad(true), { passive: true });
    this.imgElement.addEventListener('error', (error) => handleError(error, 'ErrorLoadingImage'), {
      passive: true,
    });

    globalThis.addEventListener('mousemove', handleMouseMove, { passive: true });
  }

  onDeactivate() {
    globalThis.removeEventListener('mousemove', handleMouseMove);

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
  }
}

export const cropManager = new CropManager();
