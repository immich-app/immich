import type { AssetControlContext } from '$lib/types';
import { getContext, setContext } from 'svelte';

export function createContext<T>(key: string | symbol = Symbol()) {
  return {
    get: () => getContext<T>(key),
    set: (context: T) => setContext<T>(key, context),
  };
}

export const { get: getAssetControlContext, set: setAssetControlContext } = createContext<AssetControlContext>();
