import { browser } from '$app/environment';
import { createSubscriber } from 'svelte/reactivity';

type PersistedBaseOptions<T> = {
  read: (key: string) => T | undefined;
  write: (key: string, value: T) => void;
};

class PersistedBase<T> {
  #value: T;
  #subscribe: () => void;
  #update = () => {};

  #write: (value: T) => void;

  get current() {
    this.#subscribe();
    return this.#value as T;
  }

  set current(value: T) {
    this.#write(value);
    this.#update();
    this.#value = value;
  }

  constructor(key: string, defaultValue: T, options: PersistedBaseOptions<T>) {
    const value = options.read(key);

    this.#value = value === undefined ? defaultValue : value;
    this.#write = (value: T) => options.write(key, value);

    this.#subscribe = createSubscriber((update) => {
      this.#update = update;

      return () => {
        this.#update = () => {};
      };
    });
  }
}

type PersistedLocalStorageOptions<T> = {
  serializer?: {
    stringify(value: T): string;
    parse(text: string): T;
  };
  valid?: (value: T | unknown) => value is T;
};

export class PersistedLocalStorage<T> extends PersistedBase<T> {
  constructor(key: string, defaultValue: T, options: PersistedLocalStorageOptions<T> = {}) {
    const valid = options.valid || (() => true);
    const serializer = options.serializer || JSON;

    super(key, defaultValue, {
      read: (key: string) => {
        if (!browser) {
          return;
        }

        const item = localStorage.getItem(key) ?? undefined;
        if (item === undefined) {
          return;
        }

        const parsed = serializer.parse(item);
        if (!valid(parsed)) {
          return;
        }

        return parsed;
      },
      write: (key: string, value: T) => {
        if (browser) {
          localStorage.setItem(key, serializer.stringify(value));
        }
      },
    });
  }
}
