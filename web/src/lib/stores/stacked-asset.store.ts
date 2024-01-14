import { writable } from 'svelte/store';
import type { AssetResponseDto } from '@api';

export const stackAssetsStore = writable<AssetResponseDto[]>([]);
