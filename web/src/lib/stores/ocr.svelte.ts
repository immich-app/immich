class OcrManager {
  showOverlay = $state(false);

  clear() {
    this.showOverlay = false;
  }

  toggleOcrBoundingBox() {
    this.showOverlay = !this.showOverlay;
  }
}

export const ocrManager = new OcrManager();
