import { type MaintenanceAuthDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const maintenanceAuth = writable<MaintenanceAuthDto>();
