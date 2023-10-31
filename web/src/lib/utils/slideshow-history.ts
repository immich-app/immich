export class SlideshowHistory {
  private history: string[] = [];
  private index = 0;

  constructor(private onChange: (assetId: string) => void) {}

  reset() {
    this.history = [];
    this.index = 0;
  }

  queue(assetId: string) {
    this.history.push(assetId);

    // If we were at the end of the slideshow history, move the index to the new end
    if (this.index === this.history.length - 2) {
      this.index++;
    }
  }

  next(): boolean {
    if (this.index === this.history.length - 1) {
      return false;
    }

    this.index++;
    this.onChange(this.history[this.index]);
    return true;
  }

  previous(): boolean {
    if (this.index === 0) {
      return false;
    }

    this.index--;
    this.onChange(this.history[this.index]);
    return true;
  }
}
