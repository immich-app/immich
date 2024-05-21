import type { ServerStorageResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const serverInfo = writable<ServerStorageResponseDto>();
