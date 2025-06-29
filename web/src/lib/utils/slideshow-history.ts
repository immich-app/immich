export class SlideshowHistory {
  private history: { id: string }[] = [];
  private index = 0;

  constructor(private onChange: (asset: { id: string }) => Promise<void>) {}

  reset() {
    this.history = [];
    this.index = 0;
  }

  queue(asset: { id: string }) {
    this.history.push(asset);

    // If we were at the end of the slideshow history, move the index to the new end
    if (this.index === this.history.length - 2) {
      this.index++;
    }
  }

  async next(): Promise<boolean> {
    if (this.index === this.history.length - 1) {
      return false;
    }

    this.index++;
    await this.onChange(this.history[this.index]);
    return true;
  }

  async previous(): Promise<boolean> {
    if (this.index === 0) {
      return false;
    }

    this.index--;
    await this.onChange(this.history[this.index]);
    return true;
  }
}
