import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // for typeorm: https://github.com/typeorm/typeorm/issues/2897#issuecomment-1894000291
    swc.vite()
  ],
  resolve: {
    alias: {
      '@api': new URL('../../../server/dist/src/test/client', import.meta.url).pathname,
      '@test': new URL('../../../server/dist/src/test', import.meta.url).pathname
    }
  },
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    globalSetup: 'test/e2e/setup.ts',
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1,
        minForks: 1
      }
    }
  }
})
