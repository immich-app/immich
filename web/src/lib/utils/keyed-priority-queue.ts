export class KeyedPriorityQueue<K, T> {
  private items: { key: K; value: T; priority: number }[] = [];
  private set: Set<K> = new Set();

  clear() {
    this.items = [];
    this.set.clear();
  }

  remove(key: K) {
    const removed = this.set.delete(key);
    if (removed) {
      const idx = this.items.findIndex((i) => i.key === key);
      if (idx >= 0) {
        this.items.splice(idx, 1);
      }
    }
    return removed;
  }

  push(key: K, value: T, priority: number) {
    if (this.set.has(key)) {
      return this.length;
    }
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority > priority) {
        this.set.add(key);
        this.items.splice(i, 0, { key, value, priority });
        return this.length;
      }
    }
    this.set.add(key);
    return this.items.push({ key, value, priority });
  }

  shift() {
    let item = this.items.shift();
    while (item) {
      if (this.set.has(item.key)) {
        this.set.delete(item.key);
        return item;
      }
      item = this.items.shift();
    }
  }

  get length() {
    return this.set.size;
  }
}
