import { init } from 'svelte-i18n';

beforeAll(async () => {
  await init({ fallbackLocale: 'dev' });
});

vi.mock('$app/env', () => ({ browser: true, dev: true, building: false, version: 'test' }));
vi.mock('$app/navigation', () => import('#test/unit/mocks/app-navigation.ts'));
vi.mock('$app/state', () => import('#test/unit/mocks/app-state.svelte.ts'));

vi.mock('$app/env/public', () => ({
  PUBLIC_IMMICH_BUY_HOST: 'https://buy.immich.app',
  PUBLIC_IMMICH_PAY_HOST: 'https://pay.futo.org',
}));

vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_IMMICH_HOSTNAME: '',
  },
}));
