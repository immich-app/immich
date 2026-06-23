import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['misc/**/*.spec.js'],
  },
});
