import type { ResetOptions } from '$lib/utils/dipatch';
import type { SystemConfigDto } from '@immich/sdk';

export type SettingsEventType = {
  reset: ResetOptions & { configKeys: Array<keyof SystemConfigDto> };
  save: Partial<SystemConfigDto>;
};
