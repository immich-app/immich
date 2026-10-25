import { HttpException } from '@nestjs/common';
import express, { type ErrorRequestHandler } from 'express';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { cpus, hostname, release, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import request from 'supertest';
import { CacheControl } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { ImmichFileResponse, sendFile } from 'src/utils/file.js';

const onError: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  res
    .header('Content-Type', 'application/json')
    .status(error instanceof HttpException ? error.getStatus() : 500)
    .json({ message: 'Not Found' });
};

const expectNotFound = (response: request.Response) => {
  expect(response.status).toBe(404);
  expect(response.body).toEqual({ message: 'Not Found' });
  expect(response.headers['content-type']).toContain('application/json');
  for (const header of ['cache-control', 'last-modified', 'accept-ranges', 'content-disposition', 'content-range']) {
    expect(response.headers[header]).toBeUndefined();
  }
  // Express generates a strong ETag for the JSON body; sendFile's file ETags are weak.
  expect(response.headers.etag).toMatch(/^"/);
};

describe('sendFile', () => {
  const logger = LoggingRepository.create();
  const content = '0123456789';
  let directory: string;
  let path: string;

  const createApp = (handler = sendFile, filename = path) => {
    const app = express();
    app.set('etag', 'strong');
    app.get('/', (req, res, next) => {
      void handler(
        res,
        next,
        () =>
          new ImmichFileResponse({
            path: filename,
            contentType: 'image/jpeg',
            cacheControl: CacheControl.PrivateWithCache,
            fileName: 'test image.jpg',
          }),
        logger,
      );
    });
    app.use(onError);
    return app;
  };

  beforeAll(async () => {
    directory = await fs.mkdtemp(join(tmpdir(), 'immich-send-file-'));
    path = join(directory, 'image.jpg');
    await fs.writeFile(path, content);
    await fs.writeFile(join(directory, 'denied.jpg'), content, { mode: 0o000 });
    vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await fs.rm(directory, { recursive: true, force: true });
  });

  it('serves the file with media and cache headers without a preflight access check', async () => {
    const access = vi.spyOn(fs, 'access');
    syncBuiltinESMExports();
    try {
      const response = await request(createApp()).get('/').expect(200);
      expect(response.body).toEqual(Buffer.from(content));
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['content-length']).toBe('10');
      expect(response.headers['cache-control']).toContain('private, max-age=86400, no-transform');
      expect(response.headers['content-disposition']).toBe("inline; filename*=UTF-8''test%20image.jpg");
      expect(access).not.toHaveBeenCalled();
    } finally {
      access.mockRestore();
      syncBuiltinESMExports();
    }
  });

  it('preserves conditional requests and byte range responses', async () => {
    const app = createApp();
    const initial = await request(app).get('/').expect(200);
    const cached = await request(app).get('/').set('If-None-Match', initial.headers.etag).expect(304);
    expect(cached.text).toBe('');
    const partial = await request(app).get('/').set('Range', 'bytes=2-5').expect(206);
    expect(partial.body).toEqual(Buffer.from('2345'));
    expect(partial.headers['content-range']).toBe('bytes 2-5/10');
  });

  it('preserves the existing not-found mapping for unsatisfiable ranges', async () => {
    expectNotFound(await request(createApp()).get('/').set('Range', 'bytes=20-30'));
  });

  it('returns an uncached JSON error for a missing file and serves it once restored', async () => {
    const missingPath = join(directory, 'missing.jpg');
    const app = createApp(sendFile, missingPath);
    expectNotFound(await request(app).get('/'));
    await fs.writeFile(missingPath, content);
    try {
      const restored = await request(app).get('/').expect(200);
      expect(restored.body).toEqual(Buffer.from(content));
      expect(restored.headers['cache-control']).toContain('private, max-age=86400');
    } finally {
      await fs.unlink(missingPath);
    }
  });

  it('preserves HEAD responses without a body', async () => {
    const response = await request(createApp()).head('/').expect(200);
    expect(response.headers['content-length']).toBe('10');
    expect(response.text).toBeUndefined();
  });

  it.skipIf(process.getuid?.() === 0)(
    'maps an unreadable file to not found without exposing its contents',
    async () => {
      const deniedPath = join(directory, 'denied.jpg');
      const app = createApp(sendFile, deniedPath);
      expectNotFound(await request(app).get('/'));
      expectNotFound(await request(app).get('/').set('Range', 'bytes=2-5'));
      await fs.chmod(deniedPath, 0o600);
      try {
        const restored = await request(app).get('/').expect(200);
        expect(restored.body).toEqual(Buffer.from(content));
        expect(restored.headers['cache-control']).toContain('private, max-age=86400');
      } finally {
        await fs.chmod(deniedPath, 0o000);
      }
    },
  );

  // Run with FILE_BENCHMARK_REF=<original commit> pnpm test run src/utils/file.spec.ts
  it.skipIf(!process.env.FILE_BENCHMARK_REF)(
    'benchmarks the original and current helper over real HTTP',
    async () => {
      const baselinePath = join(import.meta.dirname, `.file-benchmark-${process.pid}.ts`);
      const original = execFileSync('git', ['show', `${process.env.FILE_BENCHMARK_REF}:server/src/utils/file.ts`], {
        encoding: 'utf8',
      });
      await fs.writeFile(baselinePath, original);
      const benchmarkFile = join(directory, 'benchmark.jpg');
      await fs.writeFile(benchmarkFile, Buffer.alloc(32 * 1024));
      try {
        const baseline = await vi.importActual<typeof import('./file.js')>(baselinePath);
        const results: { name: string; scenario: string; requests: number; accessCalls: number; ms: number }[] = [];
        const variants = [
          ['original', baseline.sendFile],
          ['current', sendFile],
        ] as const;
        for (let round = 0; round < 5; round++) {
          for (const [name, handler] of round % 2 === 0 ? variants : variants.toReversed()) {
            const app = createApp(handler, benchmarkFile);
            const initial = await request(app).get('/').expect(200);
            await request(createApp(handler, join(directory, 'missing.jpg')))
              .get('/')
              .expect(404);
            await request(app).get('/').set('Range', 'bytes=65536-70000').expect(404);
            if (process.getuid?.() !== 0) {
              await request(createApp(handler, join(directory, 'denied.jpg')))
                .get('/')
                .expect(404);
            }
            for (const [scenario, headers, status] of [
              ['thumbnail', {}, 200],
              ['cached', { 'If-None-Match': initial.headers.etag }, 304],
              ['range', { Range: 'bytes=0-8191' }, 206],
            ] as const) {
              for (let index = 0; index < 50; index++) {
                await request(app).get('/').set(headers).expect(status);
              }
              const access = vi.spyOn(fs, 'access');
              syncBuiltinESMExports();
              const count = 200;
              const started = performance.now();
              try {
                for (let index = 0; index < count; index++) {
                  await request(app).get('/').set(headers).expect(status);
                }
                results.push({
                  name,
                  scenario,
                  requests: count,
                  accessCalls: access.mock.calls.length,
                  ms: performance.now() - started,
                });
                expect(access).toHaveBeenCalledTimes(name === 'original' ? count : 0);
              } finally {
                access.mockRestore();
                syncBuiltinESMExports();
              }
            }
          }
        }
        const summary = variants.flatMap(([name]) =>
          ['thumbnail', 'cached', 'range'].map((scenario) => {
            const samples = results.filter((result) => result.name === name && result.scenario === scenario);
            const timings = samples.map((sample) => sample.ms).sort((a, b) => a - b);
            return {
              name,
              scenario,
              requests: samples.reduce((total, sample) => total + sample.requests, 0),
              accessCalls: samples.reduce((total, sample) => total + sample.accessCalls, 0),
              medianMsPer200Requests: timings[2],
            };
          }),
        );
        const report = {
          generatedAt: new Date().toISOString(),
          baselineRef: process.env.FILE_BENCHMARK_REF,
          command: `FILE_BENCHMARK_REF=${process.env.FILE_BENCHMARK_REF} corepack pnpm --config.verify-deps-before-run=false test run src/utils/file.spec.ts`,
          workingDirectory: 'server',
          platform: {
            hostname: hostname(),
            os: process.platform,
            release: release(),
            arch: process.arch,
            node: process.version,
            cpu: cpus()[0]?.model,
            logicalCpus: cpus().length,
          },
          method: {
            implementation:
              'Original helper loaded from git; current helper imported from source; both call real Express sendFile over loopback HTTP using supertest.',
            rounds: 5,
            order: 'Alternating original/current each round',
            warmupRequestsPerSample: 50,
            measuredRequestsPerSample: 200,
            fileBytes: 32 * 1024,
            rangeBytes: 8192,
            concurrency: 1,
            storage: 'Temporary file on local filesystem; page cache not cleared',
            network: 'Loopback; no latency or bandwidth shaping; supertest opens a server per request',
            accessCount: 'Spy delegates to real fs.promises.access; builtin named exports synchronized',
          },
          summary,
          samples: results,
        };
        const reportPath = join(import.meta.dirname, '../../test/benchmarks/results/media-local.json');
        await fs.mkdir(dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
        process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
      } finally {
        await fs.rm(baselinePath, { force: true });
      }
    },
    60_000,
  );
});
