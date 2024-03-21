import { SystemConfigEntity, SystemConfigKey } from 'src/entities/system-config.entity';

export const systemConfigStub: Record<string, SystemConfigEntity[]> = {
  defaults: [],
  enabled: [
    { key: SystemConfigKey.OAUTH_ENABLED, value: true },
    { key: SystemConfigKey.OAUTH_AUTO_REGISTER, value: true },
    { key: SystemConfigKey.OAUTH_AUTO_LAUNCH, value: false },
    { key: SystemConfigKey.OAUTH_BUTTON_TEXT, value: 'OAuth' },
  ],
  disabled: [{ key: SystemConfigKey.PASSWORD_LOGIN_ENABLED, value: false }],
  noAutoRegister: [
    { key: SystemConfigKey.OAUTH_ENABLED, value: true },
    { key: SystemConfigKey.OAUTH_AUTO_LAUNCH, value: false },
    { key: SystemConfigKey.OAUTH_AUTO_REGISTER, value: false },
    { key: SystemConfigKey.OAUTH_BUTTON_TEXT, value: 'OAuth' },
  ],
  override: [
    { key: SystemConfigKey.OAUTH_ENABLED, value: true },
    { key: SystemConfigKey.OAUTH_AUTO_REGISTER, value: true },
    { key: SystemConfigKey.OAUTH_MOBILE_OVERRIDE_ENABLED, value: true },
    { key: SystemConfigKey.OAUTH_MOBILE_REDIRECT_URI, value: 'http://mobile-redirect' },
    { key: SystemConfigKey.OAUTH_BUTTON_TEXT, value: 'OAuth' },
  ],
  withDefaultStorageQuota: [
    { key: SystemConfigKey.OAUTH_ENABLED, value: true },
    { key: SystemConfigKey.OAUTH_AUTO_REGISTER, value: true },
    { key: SystemConfigKey.OAUTH_DEFAULT_STORAGE_QUOTA, value: 1 },
  ],
  deleteDelay30: [{ key: SystemConfigKey.USER_DELETE_DELAY, value: 30 }],
  libraryWatchEnabled: [{ key: SystemConfigKey.LIBRARY_WATCH_ENABLED, value: true }],
  libraryWatchDisabled: [{ key: SystemConfigKey.LIBRARY_WATCH_ENABLED, value: false }],
};
