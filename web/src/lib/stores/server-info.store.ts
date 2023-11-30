import { writable } from 'svelte/store';
import type { ServerInfoResponseDto } from '../../api/open-api';

export const serverInfoStore = writable<ServerInfoResponseDto>();
