import type { ServerInfoResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const serverInfo = writable<ServerInfoResponseDto>();
