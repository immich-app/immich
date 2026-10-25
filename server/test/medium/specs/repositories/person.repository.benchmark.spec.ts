import { type KyselyPlugin, sql } from 'kysely';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { cpus, release, totalmem } from 'node:os';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { PersonRepository } from 'src/repositories/person.repository.js';
import { BaseService } from 'src/services/base.service.js';
import { mediumFactory, newMediumService } from 'test/medium.factory.js';
import { getKyselyDB } from 'test/utils.js';

// Run from server: RUN_PERSON_BENCHMARK=1 pnpm test:medium run test/medium/specs/repositories/person.repository.benchmark.spec.ts
describe.skipIf(process.env.RUN_PERSON_BENCHMARK !== '1')('getRandomFace database benchmark', () => {
  it('compares the original and modified repositories on the same PostgreSQL fixtures', async () => {
    const baselineRef = '256eb55dbe92ac77e02794442f9487e88ffed2b1';
    const source = execFileSync('git', ['show', `${baselineRef}:server/src/repositories/person.repository.ts`], {
      encoding: 'utf8',
    });
    const { transformSync } = await import('@swc/core');
    const { code } = transformSync(source, {
      jsc: { parser: { syntax: 'typescript', decorators: true }, target: 'es2024' },
      module: { type: 'es6' },
    });
    const directory = await mkdtemp(join(process.cwd(), 'test/medium/.person-benchmark-'));
    const db = await getKyselyDB();
    try {
      const modifiedSource = await readFile(join(process.cwd(), 'src/repositories/person.repository.ts'), 'utf8');
      const database = await sql<{
        version: string;
        fsync: string;
        full_page_writes: string;
        synchronous_commit: string;
      }>`select version(), current_setting('fsync') as fsync,
        current_setting('full_page_writes') as full_page_writes,
        current_setting('synchronous_commit') as synchronous_commit`.execute(db);
      const originalPath = join(directory, 'original.mjs');
      await writeFile(originalPath, code);
      const { PersonRepository: OriginalRepository } = await import(pathToFileURL(originalPath).href);
      const original: Pick<PersonRepository, 'getRandomFace'> = new OriginalRepository(db);
      const modified = new PersonRepository(db);
      const transfer = { rows: 0, approximateJsonBytes: 0 };
      const plugin = {
        transformQuery: ({ node }) => node,
        transformResult({ result }) {
          transfer.rows = result.rows.length;
          transfer.approximateJsonBytes = Buffer.byteLength(JSON.stringify(result.rows));
          return Promise.resolve(result);
        },
      } satisfies KyselyPlugin;
      const instrumentedDb = db.withPlugin(plugin);
      const instrumentedOriginal: Pick<PersonRepository, 'getRandomFace'> = new OriginalRepository(instrumentedDb);
      const instrumentedModified = new PersonRepository(instrumentedDb);
      const { ctx } = newMediumService(BaseService, { database: db, real: [], mock: [LoggingRepository] });
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const { result: otherPerson } = await ctx.newPerson({ ownerId: user.id });
      await ctx.newAssetFace({ assetId: asset.id, personGroupId: otherPerson.personGroupId });

      const results = [];
      const warmupRounds = 3;
      const measuredRounds = 12;
      for (const eligibleFaces of [1, 1000, 10_000]) {
        const { result: person } = await ctx.newPerson({ ownerId: user.id });
        for (let offset = 0; offset < eligibleFaces; offset += 1000) {
          await db
            .insertInto('asset_face')
            .values(
              Array.from({ length: Math.min(1000, eligibleFaces - offset) }, () =>
                mediumFactory.assetFaceInsert({ assetId: asset.id, personGroupId: person.personGroupId }),
              ),
            )
            .execute();
        }
        await ctx.newAssetFace({ assetId: asset.id, personGroupId: person.personGroupId, isVisible: false });
        await ctx.newAssetFace({
          assetId: asset.id,
          personGroupId: person.personGroupId,
          deletedAt: new Date(),
        });

        const assertEligible = (face: Awaited<ReturnType<PersonRepository['getRandomFace']>>) => {
          expect(face).toMatchObject({
            assetId: asset.id,
            personGroupId: person.personGroupId,
            isVisible: true,
            deletedAt: null,
          });
        };
        const returned = [];
        for (const [version, repository, expectedRows] of [
          ['original', instrumentedOriginal, eligibleFaces],
          ['modified', instrumentedModified, 1],
        ] as const) {
          assertEligible(await repository.getRandomFace(person.personGroupId));
          expect(transfer.rows).toBe(expectedRows);
          returned.push({ version, ...transfer });
        }

        const samples: { round: number; version: string; elapsedMs: number }[] = [];
        for (let round = -warmupRounds; round < measuredRounds; round++) {
          const versions = round % 2 === 0 ? ['original', 'modified'] : ['modified', 'original'];
          for (const version of versions) {
            const repository = version === 'original' ? original : modified;
            const started = performance.now();
            const face = await repository.getRandomFace(person.personGroupId);
            const elapsedMs = performance.now() - started;
            assertEligible(face);
            if (round >= 0) {
              samples.push({ round, version, elapsedMs });
            }
          }
        }
        const medians = ['original', 'modified'].map((version) => {
          const times = samples
            .filter((sample) => sample.version === version)
            .map((sample) => sample.elapsedMs)
            .sort((a, b) => a - b);
          return { version, medianMs: (times[measuredRounds / 2 - 1] + times[measuredRounds / 2]) / 2 };
        });
        results.push({ eligibleFaces, returned, medians, samples });
      }

      const resultPath = join(process.cwd(), 'test/benchmarks/results/person-linux-db.json');
      await mkdir(dirname(resultPath), { recursive: true });
      await writeFile(
        resultPath,
        JSON.stringify(
          {
            benchmark: 'PersonRepository.getRandomFace with and without LIMIT 1',
            recordedAt: new Date().toISOString(),
            baselineRef,
            repositorySources: {
              originalSha256: createHash('sha256').update(source).digest('hex'),
              modifiedSha256: createHash('sha256').update(modifiedSource).digest('hex'),
              workingTreeDiff: execFileSync(
                'git',
                ['diff', baselineRef, '--', 'src/repositories/person.repository.ts'],
                {
                  encoding: 'utf8',
                },
              ),
            },
            source: 'server/test/medium/specs/repositories/person.repository.benchmark.spec.ts',
            command:
              'DOCKER_HOST=unix:///tmp/immich-perf-docker.sock TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock TESTCONTAINERS_HOST_OVERRIDE=192.168.1.9 RUN_PERSON_BENCHMARK=1 /home/yvm/.local/share/mise/installs/node/24.13.1/bin/corepack pnpm --config.verify-deps-before-run=false --dir server test:medium run test/medium/specs/repositories/person.repository.benchmark.spec.ts',
            platform: {
              client: {
                node: process.version,
                os: process.platform,
                kernel: release(),
                cpu: cpus()[0]?.model,
                totalMemoryBytes: totalmem(),
              },
              databaseHost: process.env.TESTCONTAINERS_HOST_OVERRIDE || 'testcontainers default',
              databaseImage: 'ghcr.io/immich-app/postgres:14-vectorchord0.4.3',
              database: database.rows[0],
            },
            method: {
              original: 'Complete repository loaded from git, transpiled with SWC and imported through Vite.',
              modified: 'Working-tree repository, same Kysely connection and fixture database as original.',
              transfer:
                'KyselyPlugin.transformResult measures actual returned rows before executeTakeFirst. JSON bytes approximate decoded payload size, not PostgreSQL wire bytes.',
              timing:
                'Full method latency without the measurement plugin or assertions; fixture creation and JSON serialization excluded.',
              warmupRounds,
              measuredRounds,
              order: 'Alternate original/modified first on successive rounds, including warmups.',
              fixtures:
                'Each group has N eligible faces plus one invisible and one deleted face; another group has a visible face. All share one asset. Database-generated timestamps and factory UUIDs vary.',
              limitations:
                'Client runs locally; PostgreSQL runs on the Linux box over LAN. Warm database, synthetic faces sharing one asset, no isolated load. Other services and deployment builds may contend for resources. Medium-test PostgreSQL disables fsync/full_page_writes/synchronous_commit. JSON bytes are not wire bytes. No timing threshold asserted.',
            },
            results,
          },
          null,
          2,
        ) + '\n',
      );
      console.table(
        results.flatMap(({ eligibleFaces, returned, medians }) =>
          returned.map((result, index) => ({ eligibleFaces, ...result, ...medians[index] })),
        ),
      );
    } finally {
      await db.destroy();
      await rm(directory, { recursive: true, force: true });
    }
  }, 120_000);
});
