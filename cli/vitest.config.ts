import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'cli:unit',
    globals: true,
  },
});
