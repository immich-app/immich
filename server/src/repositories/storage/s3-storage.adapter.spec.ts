import { S3StorageAdapter, S3StorageConfig } from 'src/repositories/storage/s3-storage.adapter';

// Regression coverage for the rewritePresignedUrl bug (Tigris SignatureDoesNotMatch,
// BucketName=users): the old code post-mutated SigV4-signed URLs, stripping the
// bucket from the path. These tests assert URL-level invariants that fail loudly
// if anyone reintroduces post-sign mutation.

const baseConfig = (overrides: Partial<S3StorageConfig> = {}): S3StorageConfig => ({
  endpoint: 'https://t3.storage.dev',
  region: 'auto',
  bucket: 'user-media',
  accessKeyId: 'AKIA-test',
  secretAccessKey: 'secret-test',
  prefix: 'users/',
  forcePathStyle: true,
  ...overrides,
});

const ASSET_KEY = '060c5fe5-d3ae-47df-808e-f38dca3a8af9/dbcb724b-1b36-4fd2-8bf8-ff85e68af893/original.HEIC';

describe(S3StorageAdapter.name, () => {
  describe('getPresignedDownloadUrl', () => {
    it('produces a path-style URL containing /<bucket>/<prefix><key>', async () => {
      const adapter = new S3StorageAdapter(baseConfig());
      const url = await adapter.getPresignedDownloadUrl(ASSET_KEY);
      const parsed = new URL(url);

      expect(parsed.hostname).toBe('t3.storage.dev');
      expect(parsed.pathname).toBe(`/user-media/users/${ASSET_KEY}`);
      expect(parsed.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
    });

    it('signs against publicEndpoint when set and different from endpoint', async () => {
      const adapter = new S3StorageAdapter(
        baseConfig({
          endpoint: 'https://internal.tigris.fly',
          publicEndpoint: 'https://media.example.com',
        }),
      );
      const url = await adapter.getPresignedDownloadUrl(ASSET_KEY);
      const parsed = new URL(url);

      expect(parsed.hostname).toBe('media.example.com');
      expect(parsed.pathname).toBe(`/user-media/users/${ASSET_KEY}`);
      expect(parsed.searchParams.get('X-Amz-SignedHeaders')).toContain('host');
    });

    it('uses endpoint when publicEndpoint equals endpoint (regression: was the broken Fly setup)', async () => {
      const adapter = new S3StorageAdapter(
        baseConfig({
          endpoint: 'https://t3.storage.dev',
          publicEndpoint: 'https://t3.storage.dev',
        }),
      );
      const url = await adapter.getPresignedDownloadUrl(ASSET_KEY);
      const parsed = new URL(url);

      expect(parsed.hostname).toBe('t3.storage.dev');
      // Critical: bucket MUST still be in the path. The old rewrite stripped it,
      // causing the Tigris server to see BucketName=users.
      expect(parsed.pathname).toBe(`/user-media/users/${ASSET_KEY}`);
      expect(parsed.pathname.startsWith('/user-media/')).toBe(true);
    });

    it('uses endpoint when publicEndpoint is empty string', async () => {
      const adapter = new S3StorageAdapter(baseConfig({ publicEndpoint: '' }));
      const url = await adapter.getPresignedDownloadUrl(ASSET_KEY);
      const parsed = new URL(url);

      expect(parsed.hostname).toBe('t3.storage.dev');
      expect(parsed.pathname).toBe(`/user-media/users/${ASSET_KEY}`);
    });

    it('does not double-prefix when key already starts with the configured prefix', async () => {
      const adapter = new S3StorageAdapter(baseConfig());
      const url = await adapter.getPresignedDownloadUrl(`users/${ASSET_KEY}`);
      const parsed = new URL(url);

      expect(parsed.pathname).toBe(`/user-media/users/${ASSET_KEY}`);
    });

    it('omits prefix segment when prefix is empty', async () => {
      const adapter = new S3StorageAdapter(baseConfig({ prefix: '' }));
      const url = await adapter.getPresignedDownloadUrl(ASSET_KEY);
      const parsed = new URL(url);

      expect(parsed.pathname).toBe(`/user-media/${ASSET_KEY}`);
    });

    it('honors custom expiresIn', async () => {
      const adapter = new S3StorageAdapter(baseConfig());
      const url = await adapter.getPresignedDownloadUrl(ASSET_KEY, { expiresIn: 3600 });
      const parsed = new URL(url);

      expect(parsed.searchParams.get('X-Amz-Expires')).toBe('3600');
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('produces a path-style URL containing /<bucket>/<prefix><key>', async () => {
      const adapter = new S3StorageAdapter(baseConfig());
      const url = await adapter.getPresignedUploadUrl('uploads/user-1/file.jpg');
      const parsed = new URL(url);

      expect(parsed.hostname).toBe('t3.storage.dev');
      expect(parsed.pathname).toBe('/user-media/users/uploads/user-1/file.jpg');
    });

    it('signs against publicEndpoint when set and different from endpoint', async () => {
      const adapter = new S3StorageAdapter(
        baseConfig({
          endpoint: 'https://internal.tigris.fly',
          publicEndpoint: 'https://media.example.com',
        }),
      );
      const url = await adapter.getPresignedUploadUrl('uploads/user-1/file.jpg');
      const parsed = new URL(url);

      expect(parsed.hostname).toBe('media.example.com');
      expect(parsed.pathname).toBe('/user-media/users/uploads/user-1/file.jpg');
    });
  });

  describe('signature invariant', () => {
    // The canonical SigV4 invariant: the URI used to compute the signature
    // must equal the URI in the actual HTTP request. Equivalent here to:
    // whatever pathname appears in the returned URL, that exact same pathname
    // was what the signer hashed. We can't recompute the signature without
    // the secret algorithm internals, but we can prove that the URL is not
    // post-mutated by asserting the path always starts with /<bucket>/ when
    // forcePathStyle is true. A post-sign rewrite that strips the bucket
    // (the original bug) would violate this.
    it('path always starts with /<bucket>/ for path-style configs', async () => {
      const cases: S3StorageConfig[] = [
        baseConfig(),
        baseConfig({ publicEndpoint: 'https://media.example.com' }),
        baseConfig({ publicEndpoint: 'https://t3.storage.dev' }),
        baseConfig({ publicEndpoint: '' }),
        baseConfig({ prefix: '' }),
        baseConfig({ prefix: 'tenants/abc/' }),
      ];

      for (const config of cases) {
        const adapter = new S3StorageAdapter(config);
        const url = await adapter.getPresignedDownloadUrl(ASSET_KEY);
        const parsed = new URL(url);
        expect(parsed.pathname.startsWith(`/${config.bucket}/`)).toBe(true);
      }
    });
  });
});
