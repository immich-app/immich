import type { AssetResponseDto } from '@api';
import { writable } from 'svelte/store';

export const archivedAsset = writable<AssetResponseDto[]>([]);
