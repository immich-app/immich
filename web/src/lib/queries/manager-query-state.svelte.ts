import { QueryObserver, type QueryKey, type QueryObserverOptions } from '@tanstack/svelte-query';
import { cloneDeep } from 'lodash-es';
import { queryClient } from '$lib/queries/client';

type Options<T, K extends QueryKey> = QueryObserverOptions<T, Error, T, T, K>;

export class ManagerQueryState<T, K extends QueryKey = QueryKey> {
  #data = $state<T>();
  #options: Options<T, K>;

  constructor(options: Options<T, K>) {
    this.#options = { ...options, enabled: false };

    const observer = new QueryObserver(queryClient, this.#options);
    observer.subscribe(({ data }) => (this.#data = data));
  }

  get data() {
    if (!this.#data) {
      throw new Error(`${this.#options.queryKey.join('/')} must be loaded first`);
    }

    return this.#data;
  }

  load() {
    return queryClient.query({ ...this.#options, staleTime: 'static' });
  }

  clone() {
    return cloneDeep(this.data);
  }
}
