type EventMap = Record<string, unknown[]>;
type PromiseLike<T> = Promise<T> | T;

export type EventCallback<E extends EventMap, T extends keyof E> = (...args: E[T]) => PromiseLike<unknown>;
export type EventItem<E extends EventMap, T extends keyof E = keyof E> = {
  id: number;
  event: T;
  callback: EventCallback<E, T>;
};

let count = 1;
const nextId = () => count++;

const noop = () => {};

export class BaseEventManager<Events extends EventMap> {
  #callbacks: EventItem<Events>[] = [];

  on<T extends keyof Events>(event: T, callback?: EventCallback<Events, T>) {
    if (!callback) {
      return noop;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = { id: nextId(), event, callback } as EventItem<Events, any>;
    this.#callbacks.push(item);

    return () => {
      this.#callbacks = this.#callbacks.filter((current) => current.id !== item.id);
    };
  }

  emit<T extends keyof Events>(event: T, ...params: Events[T]) {
    const listeners = this.getListeners(event);
    for (const listener of listeners) {
      void listener(...params);
    }
  }

  hasListeners<T extends keyof Events>(event: T) {
    return this.#callbacks.some((item) => item.event === event);
  }

  private getListeners<T extends keyof Events>(event: T) {
    return this.#callbacks
      .filter((item) => item.event === event)
      .map((item) => item.callback as EventCallback<Events, T>);
  }
}
