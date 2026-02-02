import { canCopyImageToClipboard } from '$lib/utils/asset-utils';
import { BaseEventManager } from '$lib/utils/base-event-manager.svelte';
import { PersistedLocalStorage } from '$lib/utils/persisted';
import type { ZoomImageWheelState } from '@zoom-image/core';

const isShowDetailPanel = new PersistedLocalStorage<boolean>('asset-viewer-state', false);

export type Events = {
  Zoom: [];
  ZoomChange: [ZoomImageWheelState];
  Copy: [];
};

export class AssetViewerManager extends BaseEventManager<Events> {
  #zoomState = $state<ZoomImageWheelState>({
    currentRotation: 0,
    currentZoom: 1,
    enable: true,
    currentPositionX: 0,
    currentPositionY: 0,
  });

  imgRef = $state<HTMLImageElement | undefined>();
  isShowActivityPanel = $state(false);
  isPlayingMotionPhoto = $state(false);
  isShowEditor = $state(false);

  get isShowDetailPanel() {
    return isShowDetailPanel.current;
  }

  get zoomState() {
    return this.#zoomState;
  }

  set zoomState(state: ZoomImageWheelState) {
    this.#zoomState = state;
    this.emit('ZoomChange', state);
  }

  get zoom() {
    return this.#zoomState.currentZoom;
  }

  set zoom(zoom: number) {
    this.zoomState = { ...this.zoomState, currentZoom: zoom };
  }

  canZoomIn() {
    return this.hasListeners('Zoom') && this.zoom <= 1;
  }

  canZoomOut() {
    return this.hasListeners('Zoom') && this.zoom > 1;
  }

  canCopyImage() {
    return canCopyImageToClipboard() && !!assetViewerManager.imgRef;
  }

  private set isShowDetailPanel(value: boolean) {
    isShowDetailPanel.current = value;
  }

  onZoomChange(state: ZoomImageWheelState) {
    // bypass event emitter to avoid loop
    this.#zoomState = state;
  }

  toggleActivityPanel() {
    this.closeDetailPanel();
    this.isShowActivityPanel = !this.isShowActivityPanel;
  }

  closeActivityPanel() {
    this.isShowActivityPanel = false;
  }

  toggleDetailPanel() {
    this.closeActivityPanel();
    this.isShowDetailPanel = !this.isShowDetailPanel;
  }

  closeDetailPanel() {
    this.isShowDetailPanel = false;
  }

  openEditor() {
    this.closeActivityPanel();
    this.isShowEditor = true;
  }

  closeEditor() {
    this.isShowEditor = false;
  }
}

export const assetViewerManager = new AssetViewerManager();
