import { Buffer } from 'node:buffer';
import { S3StorageAdapter } from 'src/repositories/storage/s3-storage.adapter';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

// End-to-end regression test for the rewritePresignedUrl bug. Brings up real
// MinIO, generates a presigned download URL, then HTTP-fetches it. The old
// post-sign URL rewrite produced SignatureDoesNotMatch when publicEndpoint
// pointed at a hostname alias; this suite would have failed loudly.

const MINIO_IMAGE = 'minio/minio:RELEASE.2025-09-07T16-13-09Z';
const MINIO_ROOT_USER = 'minio-test';
const MINIO_ROOT_PASSWORD = 'minio-test-password';
const BUCKET = 'user-media';
const PREFIX = 'users/';

let container: StartedTestContainer;
let endpoint: string;
let hostAlias: string;

beforeAll(async () => {
  container = await new GenericContainer(MINIO_IMAGE)
    .withExposedPorts(9000)
    .withEnvironment({
      MINIO_ROOT_USER,
      MINIO_ROOT_PASSWORD,
    })
    .withCommand(['server', '/data'])
    .withWaitStrategy(Wait.forHttp('/minio/health/ready', 9000))
    .start();

  const port = container.getMappedPort(9000);
  endpoint = `http://127.0.0.1:${port}`;
  // Different hostname (localhost vs 127.0.0.1) that resolves to the same MinIO.
  // Lets us prove the publicEndpoint path signs/serves correctly without needing
  // any actual CDN.
  hostAlias = `http://localhost:${port}`;

  const { CreateBucketCommand, S3Client } = await import('@aws-sdk/client-s3');
  const s3 = new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId: MINIO_ROOT_USER, secretAccessKey: MINIO_ROOT_PASSWORD },
    forcePathStyle: true,
  });
  await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
}, 60_000);

afterAll(async () => {
  await container?.stop();
});

const makeAdapter = (publicEndpoint?: string) =>
  new S3StorageAdapter({
    endpoint,
    publicEndpoint,
    region: 'us-east-1',
    bucket: BUCKET,
    accessKeyId: MINIO_ROOT_USER,
    secretAccessKey: MINIO_ROOT_PASSWORD,
    prefix: PREFIX,
    forcePathStyle: true,
  });

const putObject = async (key: string, body: Buffer) => {
  const adapter = makeAdapter();
  await adapter.write(key, body);
};

describe('S3StorageAdapter (integration: MinIO)', () => {
  it('presigned download URL with no publicEndpoint returns the object', async () => {
    const key = 'no-public/hello.bin';
    const payload = Buffer.from('hello-no-public-endpoint');
    await putObject(key, payload);

    const adapter = makeAdapter();
    const url = await adapter.getPresignedDownloadUrl(key);

    const response = await fetch(url);
    expect(response.status).toBe(200);
    const body = Buffer.from(await response.arrayBuffer());
    expect(body.equals(payload)).toBe(true);
  });

  it('presigned download URL with publicEndpoint == endpoint returns the object (regression: Fly setup)', async () => {
    const key = 'same-public/hello.bin';
    const payload = Buffer.from('hello-same-endpoint');
    await putObject(key, payload);

    const adapter = makeAdapter(endpoint);
    const url = await adapter.getPresignedDownloadUrl(key);

    // Critical invariant: bucket stays in the path.
    expect(new URL(url).pathname.startsWith(`/${BUCKET}/`)).toBe(true);

    const response = await fetch(url);
    expect(response.status).toBe(200);
    const body = Buffer.from(await response.arrayBuffer());
    expect(body.equals(payload)).toBe(true);
  });

  it('presigned download URL with publicEndpoint != endpoint returns the object (regression: post-sign rewrite would 403)', async () => {
    const key = 'alias-public/hello.bin';
    const payload = Buffer.from('hello-alias-endpoint');
    await putObject(key, payload);

    const adapter = makeAdapter(hostAlias);
    const url = await adapter.getPresignedDownloadUrl(key);

    expect(new URL(url).hostname).toBe('localhost');
    expect(new URL(url).pathname.startsWith(`/${BUCKET}/`)).toBe(true);

    const response = await fetch(url);
    expect(response.status).toBe(200);
    const body = Buffer.from(await response.arrayBuffer());
    expect(body.equals(payload)).toBe(true);
  });

  it('presigned upload URL accepts a PUT and the object is then readable', async () => {
    const key = 'upload/hello.bin';
    const payload = Buffer.from('hello-upload');
    const adapter = makeAdapter();
    const url = await adapter.getPresignedUploadUrl(key);

    const put = await fetch(url, { method: 'PUT', body: payload });
    expect(put.status).toBe(200);

    const fetched = await adapter.read(key);
    expect(fetched.equals(payload)).toBe(true);
  });
});
