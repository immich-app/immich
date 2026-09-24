/** Keeps only the latest prepared selection while allowing one load command at a time. */
export class LatestLoadQueue {
  private generation = 0;
  private chain: Promise<void> = Promise.resolve();

  invalidate(): void {
    this.generation++;
  }

  async run<T>(prepare: () => Promise<T>, load: (prepared: T) => Promise<void>): Promise<void> {
    const generation = ++this.generation;
    const prepared = await prepare();
    if (generation !== this.generation) {
      return;
    }

    const next = this.chain
      .catch(() => {})
      .then(async () => {
        if (generation === this.generation) {
          await load(prepared);
        }
      });
    this.chain = next;
    await next;
  }
}
