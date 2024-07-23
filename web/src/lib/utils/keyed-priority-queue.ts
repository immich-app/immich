export class KeyedPriorityQueue<K, T> {
  private items: { key: K; value: T; priority: number }[] = [];
  private set: Set<K> = new Set();
  private pendingRemove: Set<K> = new Set();

  remove(key: K) {
    const removed = this.set.delete(key);
    if (removed) {
      this.pendingRemove.add(key);
    }
    return removed;
  }

  reAdd(key: K) {
    const removed = this.pendingRemove.delete(key);
    if (removed) {
      this.set.add(key);
    }
    return removed;
  }

  push(key: K, value: T, priority: number) {
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
        this.pendingRemove.delete(item.key);
        return item;
      }
      item = this.items.shift();
    }
  }

  get length() {
    return this.set.size;
  }
}
