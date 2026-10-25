import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { setImmediate } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { CryptoRepository } from 'src/repositories/crypto.repository.js';

// Run from server: RUN_BCRYPT_BENCHMARK=1 pnpm test run src/repositories/crypto.repository.benchmark.spec.ts --disableConsoleIntercept
// BCRYPT_BASELINE_REF can select another original revision. Both versions use real bcrypt at cost 10.
describe.skipIf(!process.env.RUN_BCRYPT_BENCHMARK)('bcrypt responsiveness benchmark', () => {
  it('should compare the original repository with the working tree', async () => {
    const { transformSync } = await import('@swc/core');
    const ref = process.env.BCRYPT_BASELINE_REF || '256eb55dbe92ac77e02794442f9487e88ffed2b1';
    const source = execFileSync('git', ['show', `${ref}:server/src/repositories/crypto.repository.ts`], {
      encoding: 'utf8',
    });
    const { code } = transformSync(source, {
      jsc: { parser: { syntax: 'typescript', decorators: true }, target: 'es2024' },
      module: { type: 'es6' },
    });
    const directory = await mkdtemp(join(process.cwd(), 'node_modules/.bcrypt-benchmark-'));
    try {
      const originalPath = join(directory, 'original.mjs');
      await writeFile(originalPath, code);
      const { CryptoRepository: OriginalRepository } = await import(pathToFileURL(originalPath).href);
      const original: Pick<CryptoRepository, 'compareBcrypt'> = new OriginalRepository();
      const modified = new CryptoRepository();
      const hash = await modified.hashBcrypt('password', 10);

      const measure = async (repository: Pick<CryptoRepository, 'compareBcrypt'>) => {
        const started = performance.now();
        let completed = 0;
        let completedAtCheckpoint = 0;
        let checkpointMs = 0;
        const checkpoint = setImmediate().then(() => {
          completedAtCheckpoint = completed;
          checkpointMs = performance.now() - started;
        });
        const comparisons = Array.from({ length: 4 }, async () => {
          const result = await repository.compareBcrypt('password', hash);
          completed++;
          return result;
        });
        expect(await Promise.all(comparisons)).toEqual([true, true, true, true]);
        const totalMs = performance.now() - started;
        await checkpoint;
        return { checkpointMs, totalMs, completedAtCheckpoint };
      };

      // Warm both implementations, then alternate their order to reduce first-run bias.
      await measure(original);
      await measure(modified);
      const results = [];
      for (let round = 0; round < 6; round++) {
        for (const version of round % 2 === 0 ? ['original', 'modified'] : ['modified', 'original']) {
          const result = await measure(version === 'original' ? original : modified);
          expect(result.completedAtCheckpoint).toBe(version === 'original' ? 4 : 0);
          results.push({ round, version, ...result });
        }
      }
      console.table(results);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);
});
