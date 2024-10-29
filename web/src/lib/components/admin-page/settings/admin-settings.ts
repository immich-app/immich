import type { ResetOptions } from '$lib/utils/dipatch';
import type { SystemConfigDto } from '@immich/sdk';

export type SettingsResetOptions = ResetOptions & { configKeys: Array<keyof SystemConfigDto> };
export type SettingsResetEvent = (options: SettingsResetOptions) => void;
export type SettingsSaveEvent = (config: Partial<SystemConfigDto>) => void;

export type SettingsComponentProps = {
  disabled?: boolean;
  defaultConfig: SystemConfigDto;
  config: SystemConfigDto;
  savedConfig: SystemConfigDto;
  onReset: SettingsResetEvent;
  onSave: SettingsSaveEvent;
};
