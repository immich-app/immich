import type { AssetOcrResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const ocrBoxesArray = writable<AssetOcrResponseDto[]>([]);
