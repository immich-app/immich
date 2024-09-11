import '@testing-library/jest-dom';
import { init } from 'svelte-i18n';

beforeAll(async () => {
  await init({ fallbackLocale: 'dev' });
});
