import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { S3StorageBackend } from 'src/backends/s3-storage.backend';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const canRunDocker = process.env.IMMICH_TEST_DOCKER === 'true';

describe.skipIf(!canRunDocker)('S3StorageBackend integration (MinIO)', () => {
  let container: StartedTestContainer;
  let backend: S3StorageBackend;
  const bucket = 'test-bucket';

  beforeAll(async () => {
    container = await new GenericContainer('minio/minio')
      .withExposedPorts(9000)
      .withEnvironment({ MINIO_ROOT_USER: 'minioadmin', MINIO_ROOT_PASSWORD: 'minioadmin' })
      .withCommand(['server', '/data'])
      .withWaitStrategy(Wait.forHttp('/minio/health/live', 9000))
      .start();

    const endpoint = `http://${container.getHost()}:${container.getMappedPort(9000)}`;

    // Create bucket via direct S3 client
    const client = new S3Client({
      region: 'us-east-1',
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
    });
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    client.destroy();

    backend = new S3StorageBackend({
      bucket,
      region: 'us-east-1',
      endpoint,
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
      presignedUrlExpiry: 3600,
      serveMode: 'redirect',
    });
  }, 60_000);

  afterAll(async () => {
    await container?.stop();
  });

  it('should round-trip a file through put and get', async () => {
    const content = Buffer.from('hello from S3 integration test');
    await backend.put('test/round-trip.txt', content, { contentType: 'text/plain' });

    const { stream, contentType } = await backend.get('test/round-trip.txt');
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    expect(Buffer.concat(chunks).toString()).toBe('hello from S3 integration test');
    expect(contentType).toBe('text/plain');
  });

  it('should report exists correctly', async () => {
    await backend.put('test/exists.txt', Buffer.from('data'));
    expect(await backend.exists('test/exists.txt')).toBe(true);
    expect(await backend.exists('test/nope.txt')).toBe(false);
  });

  it('should delete objects', async () => {
    await backend.put('test/delete-me.txt', Buffer.from('data'));
    expect(await backend.exists('test/delete-me.txt')).toBe(true);

    await backend.delete('test/delete-me.txt');
    expect(await backend.exists('test/delete-me.txt')).toBe(false);
  });

  it('should download to temp file and cleanup', async () => {
    await backend.put('test/temp-download.txt', Buffer.from('temp content'));
    const { tempPath, cleanup } = await backend.downloadToTemp('test/temp-download.txt');

    const content = await readFile(tempPath, 'utf8');
    expect(content).toBe('temp content');

    await cleanup();
    expect(existsSync(tempPath)).toBe(false);
  });

  it('should return presigned URL in redirect mode', async () => {
    await backend.put('test/presigned.txt', Buffer.from('presigned data'));
    const strategy = await backend.getServeStrategy('test/presigned.txt', 'text/plain');
    expect(strategy.type).toBe('redirect');
    if (strategy.type === 'redirect') {
      expect(strategy.url).toContain('test/presigned.txt');
      expect(strategy.url).toContain('X-Amz');
    }
  });

  it('should stream content in proxy mode', async () => {
    // Create a second backend instance in proxy mode
    const endpoint = `http://${container.getHost()}:${container.getMappedPort(9000)}`;
    const proxyBackend = new S3StorageBackend({
      bucket,
      region: 'us-east-1',
      endpoint,
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
      presignedUrlExpiry: 3600,
      serveMode: 'proxy',
    });

    await backend.put('test/proxy.txt', Buffer.from('proxy content'));
    const strategy = await proxyBackend.getServeStrategy('test/proxy.txt', 'text/plain');
    expect(strategy.type).toBe('stream');
    if (strategy.type === 'stream') {
      const chunks: Buffer[] = [];
      for await (const chunk of strategy.stream) {
        chunks.push(Buffer.from(chunk));
      }
      expect(Buffer.concat(chunks).toString()).toBe('proxy content');
    }
  });
});
