import { writable } from 'svelte/store';
import type { ServerInfoResponseDto } from '@api';

export const serverInfoStore = writable<ServerInfoResponseDto>();
