export class PriorityQueue<T> {
  private items: { value: T; priority: number }[] = [];

  push(value: T, priority: number) {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority > priority) {
        this.items.splice(i, 0, { value, priority });
        return this.length;
      }
    }
    return this.items.push({ value, priority });
  }

  shift() {
    return this.items.shift();
  }

  get length() {
    return this.items.length;
  }
}
