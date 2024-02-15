import type { AssetResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const stackAssetsStore = writable<AssetResponseDto[]>([]);
