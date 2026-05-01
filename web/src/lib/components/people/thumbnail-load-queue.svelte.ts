export class ThumbnailLoadQueue {
  private readonly concurrency: number;
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(concurrency = 8) {
    this.concurrency = Math.max(1, Math.floor(concurrency));
  }

  request(start: () => void) {
    let pending = true;

    const run = () => {
      if (!pending) {
        return;
      }

      pending = false;
      this.active++;
      start();
    };

    if (this.active < this.concurrency) {
      run();
    } else {
      this.waiting.push(run);
    }

    return () => {
      if (!pending) {
        return;
      }

      pending = false;
      const index = this.waiting.indexOf(run);
      if (index !== -1) {
        this.waiting.splice(index, 1);
      }
    };
  }

  release() {
    if (this.active > 0) {
      this.active--;
    }

    this.waiting.shift()?.();
  }
}
