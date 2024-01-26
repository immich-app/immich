import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // for typeorm: https://github.com/typeorm/typeorm/issues/2897#issuecomment-1894000291
    swc.vite()
  ],
  resolve: {
    alias: {
      '@api': new URL('../server/e2e/client', import.meta.url).pathname,
      '@test': new URL('../server/test', import.meta.url).pathname,
      '@app/immich': new URL('../server/src/immich', import.meta.url).pathname,
      '@app/infra': new URL('../server/src/infra', import.meta.url).pathname,
      '@app/domain': new URL('../server/src/domain', import.meta.url).pathname
    }
  },
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    globalSetup: 'test/e2e/setup.ts',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
})
