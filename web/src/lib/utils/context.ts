import { getContext, setContext } from 'svelte';

export function createContext<T>(key: string | symbol = Symbol()) {
  return {
    get: () => getContext<T>(key),
    set: (context: T) => setContext<T>(key, context),
  };
}
