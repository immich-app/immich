export class SlideshowHistory {
  private slideshowHistory: string[] = [];
  private slideshowHistoryIndex = 0;

  constructor(private onNavigate: (assetId: string) => void) {}

  reset(assetId: string) {
    this.slideshowHistory = [assetId];
    this.slideshowHistoryIndex = 0;
  }

  append(assetId: string) {
    this.slideshowHistory.push(assetId);

    // If we were at the end of the slideshow history, move the index to the new end
    if (this.slideshowHistoryIndex === this.slideshowHistory.length - 2) {
      this.slideshowHistoryIndex++;
    }
  }

  navigateForward(): boolean {
    if (this.slideshowHistoryIndex === this.slideshowHistory.length - 1) {
      return false;
    }

    this.slideshowHistoryIndex++;
    this.onNavigate(this.slideshowHistory[this.slideshowHistoryIndex]);
    return true;
  }

  navigateBackward(): boolean {
    if (this.slideshowHistoryIndex === 0) {
      return false;
    }

    this.slideshowHistoryIndex--;
    this.onNavigate(this.slideshowHistory[this.slideshowHistoryIndex]);
    return true;
  }
}
