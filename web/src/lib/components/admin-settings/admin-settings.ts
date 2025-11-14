import type { ResetOptions } from '$lib/utils/dipatch';
import type { SystemConfigDto } from '@immich/sdk';

export type SettingsResetOptions = ResetOptions & { configKeys: Array<keyof SystemConfigDto> };
