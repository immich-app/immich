import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { writable, get, derived, readonly, type Writable } from 'svelte/store';

// TODO re-visit the types.
const searchParams = new Map<string, unknown>();

export class SearchParams<T extends string> {
  private key: string;
  private store$: Writable<Array<T>>;

  private constructor(key: string) {
    this.key = key;
    this.store$ = writable<Array<T>>((get(page).url.searchParams.get(this.key)?.split(',') || []) as Array<T>);
    this.store$.subscribe(this.handleUpdate);
  }

  private handleUpdate = (values: Array<T>) => {
    const newUrl = new URL(get(page).url);
    if (values.length === 0) {
      newUrl.searchParams.delete(this.key);
    } else {
      newUrl.searchParams.set(this.key, values.join(','));
    }
    goto(`?${newUrl.searchParams.toString()}`);
  };

  static get<T extends string>(key: string) {
    const params = searchParams.get(key) as SearchParams<T>;

    if (params) {
      return params;
    }

    return searchParams.set(key, new this<T>(key)).get(key) as SearchParams<T>;
  }

  set(param: string | null) {
    this.store$.set((param?.split(',') || []) as Array<T>);
  }

  getValues() {
    return readonly(this.store$);
  }

  hasValue(value: T | Array<T>) {
    if (Array.isArray(value)) {
      return derived(this.getValues(), (values) => values.some((searchValue) => value.includes(searchValue)));
    }
    return derived(this.getValues(), (values) => values.includes(value));
  }

  addValue(value: T | Array<T>) {
    this.store$.update((values) => [...values, ...(Array.isArray(value) ? value : [value])]);
  }

  removeValue(value: T | Array<T>) {
    this.store$.update((values) =>
      values.filter((searchValue) => (Array.isArray(value) ? !value.includes(searchValue) : searchValue !== value)),
    );
  }
}
