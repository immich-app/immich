import { PersistedLocalStorage } from '$lib/utils/persisted';

const isShowDetailPanel = new PersistedLocalStorage<boolean>('asset-viewer-state', false);

export class AssetViewerManager {
  isShowActivityPanel = $state(false);
  isPlayingMotionPhoto = $state(false);

  get isShowDetailPanel() {
    return isShowDetailPanel.current;
  }

  private set isShowDetailPanel(value: boolean) {
    isShowDetailPanel.current = value;
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
}

export const assetViewerManager = new AssetViewerManager();
