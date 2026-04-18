export class AsyncSemaphore {
  private current = 0;
  private limit: number;
  private waitQueue: Array<() => void> = [];

  constructor(limit: number) {
    this.limit = limit;
  }

  setLimit(limit: number): void {
    this.limit = limit;
    this.drain();
  }

  async acquire(): Promise<void> {
    if (this.current < this.limit) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.current--;
    this.drain();
  }

  private drain(): void {
    while (this.waitQueue.length > 0 && this.current < this.limit) {
      this.current++;
      const next = this.waitQueue.shift()!;
      next();
    }
  }
}
