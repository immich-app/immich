import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.futo.immich',
  appName: 'Immich',
  webDir: 'build',

  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['http://192.168.10.242:2283/api/*'],
  },
};

export default config;
