type EventsBase = Record<string, unknown[]>;
type PromiseLike<T> = Promise<T> | T;

export type EventMap<E extends EventsBase> = { [K in keyof E]?: EventCallback<E, K> };
export type EventCallback<E extends EventsBase, T extends keyof E> = (...args: E[T]) => PromiseLike<unknown>;
export type EventItem<E extends EventsBase, T extends keyof E = keyof E> = {
  id: number;
  event: T;
  callback: EventCallback<E, T>;
};

let count = 1;
const nextId = () => count++;

const noop = () => {};

export class BaseEventManager<Events extends EventsBase> {
  #callbacks: EventItem<Events>[] = $state.raw([]);

  on(subscriptions: EventMap<Events>): () => void {
    const cleanups = Object.entries(subscriptions).map(([event, callback]) =>
      this.#onEvent(event as keyof Events, callback as EventCallback<Events, keyof Events>),
    );

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }

  #onEvent<T extends keyof Events>(event: T, callback?: EventCallback<Events, T>) {
    if (!callback) {
      return noop;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = { id: nextId(), event, callback } as EventItem<Events, any>;
    this.#callbacks = [...this.#callbacks, item];

    return () => {
      this.#callbacks = this.#callbacks.filter((current) => current.id !== item.id);
    };
  }

  private once<T extends keyof Events>(event: T, callback: EventCallback<Events, T>) {
    const unsubscribe = this.#onEvent(event, (...args: Events[T]) => {
      unsubscribe();
      return callback(...args);
    });
    return unsubscribe;
  }

  untilNext<T extends keyof Events>(
    event: T,
    { timeoutMs = 10_000, signal }: { timeoutMs?: number; signal?: AbortSignal } = {},
  ): Promise<Events[T] extends [] ? void : Events[T][0]> {
    type Result = Events[T] extends [] ? void : Events[T][0];
    return new Promise<Result>((resolve, reject) => {
      let settled = false;
      const settle = () => {
        if (settled) {
          return false;
        }
        settled = true;
        unsubscribe();
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        return true;
      };
      const unsubscribe = this.once(event, (...args: Events[T]) => {
        if (settle()) {
          resolve(args[0] as Result);
        }
      });
      const timer = setTimeout(() => {
        if (settle()) {
          reject(new Error(`untilNext('${String(event)}') timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);
      const onAbort = () => {
        if (settle()) {
          resolve(undefined as Result);
        }
      };
      signal?.addEventListener('abort', onAbort, { once: true });
    });
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
