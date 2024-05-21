import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.futo.immich',
  appName: 'Immich',
  webDir: 'build',

  server: {
    url: 'http://192.168.10.242:2283',
    // hostname: '192.168.10.242',
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['http://192.168.10.242:2283/api/*', 'http://localhost/*', 'https://localhost/*'],
  },
  plugins: {},
};

export default config;
