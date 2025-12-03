import { type MaintenanceAuthDto, type MaintenanceStatusResponseDto } from '@immich/sdk';
import { writable } from 'svelte/store';

export const maintenanceStore = {
  auth: writable<MaintenanceAuthDto>(),
  status: writable<MaintenanceStatusResponseDto | undefined>(),
};
