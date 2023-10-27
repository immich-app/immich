import { writable } from 'svelte/store';
import type { AssetResponseDto } from '../../api/open-api';

export const stackAssetsStore = writable<AssetResponseDto[]>([]);
