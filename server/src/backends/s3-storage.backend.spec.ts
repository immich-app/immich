import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock AWS SDK before importing the backend
vi.mock('@aws-sdk/client-s3', () => {
  const mockSend = vi.fn();
  return {
    S3Client: vi.fn(() => ({ send: mockSend, destroy: vi.fn() })),
    PutObjectCommand: vi.fn((input: any) => ({ input, _type: 'PutObjectCommand' })),
    GetObjectCommand: vi.fn((input: any) => ({ input, _type: 'GetObjectCommand' })),
    HeadObjectCommand: vi.fn((input: any) => ({ input, _type: 'HeadObjectCommand' })),
    DeleteObjectCommand: vi.fn((input: any) => ({ input, _type: 'DeleteObjectCommand' })),
    ListObjectsV2Command: vi.fn((input: any) => ({ input, _type: 'ListObjectsV2Command' })),
    DeleteObjectsCommand: vi.fn((input: any) => ({ input, _type: 'DeleteObjectsCommand' })),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://bucket.s3.amazonaws.com/key?X-Amz-Signature=abc123'),
}));

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: vi.fn().mockImplementation(() => ({
    done: vi.fn().mockResolvedValue({}),
  })),
}));

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3StorageBackend } from 'src/backends/s3-storage.backend';
import { CacheControl } from 'src/enum';

describe('S3StorageBackend', () => {
  let backend: S3StorageBackend;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    backend = new S3StorageBackend({
      bucket: 'test-bucket',
      region: 'us-east-1',
      presignedUrlExpiry: 3600,
      serveMode: 'redirect' as const,
    });
    const client = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    mockSend = client?.send;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('put', () => {
    it('should upload buffer using Upload (multipart-capable)', async () => {
      const { Upload } = await import('@aws-sdk/lib-storage');
      await backend.put('upload/user1/ab/cd/file.jpg', Buffer.from('data'), {
        contentType: 'image/jpeg',
      });
      expect(Upload).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'upload/user1/ab/cd/file.jpg',
            ContentType: 'image/jpeg',
          }),
        }),
      );
    });
  });

  describe('get', () => {
    it('should return stream from S3 GetObject', async () => {
      const bodyStream = Readable.from([Buffer.from('s3 content')]);
      mockSend.mockResolvedValueOnce({
        Body: bodyStream,
        ContentType: 'image/jpeg',
        ContentLength: 10,
      });

      const result = await backend.get('thumbs/user1/ab/cd/thumb.webp');
      expect(result.contentType).toBe('image/jpeg');
      expect(result.length).toBe(10);

      const chunks: Buffer[] = [];
      for await (const chunk of result.stream) {
        chunks.push(Buffer.from(chunk));
      }
      expect(Buffer.concat(chunks).toString()).toBe('s3 content');
    });
  });

  describe('exists', () => {
    it('should return true when HeadObject succeeds', async () => {
      mockSend.mockResolvedValueOnce({});
      expect(await backend.exists('some/key.jpg')).toBe(true);
    });

    it('should return false when HeadObject throws NotFound', async () => {
      mockSend.mockRejectedValueOnce({ name: 'NotFound' });
      expect(await backend.exists('missing/key.jpg')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should send DeleteObjectCommand', async () => {
      mockSend.mockResolvedValueOnce({});
      await backend.delete('old/key.jpg');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'old/key.jpg',
          }),
        }),
      );
    });
  });

  describe('getServeStrategy', () => {
    it('should return redirect with presigned URL when serveMode is redirect', async () => {
      const strategy = await backend.getServeStrategy('thumbs/user1/ab/cd/thumb.webp', {
        contentType: 'image/webp',
        cacheControl: CacheControl.PrivateWithCache,
      });
      expect(strategy.type).toBe('redirect');
      if (strategy.type === 'redirect') {
        expect(strategy.url).toContain('X-Amz-Signature');
      }
      expect(getSignedUrl).toHaveBeenCalled();
    });

    it('should include response override metadata in redirect presigned URLs', async () => {
      const strategy = await backend.getServeStrategy('upload/user1/photo.jpg', {
        contentType: 'image/jpeg',
        cacheControl: CacheControl.PrivateWithCache,
        fileName: 'Vacation Photo.jpg',
        disposition: 'attachment',
      });

      expect(strategy.type).toBe('redirect');
      expect(GetObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'upload/user1/photo.jpg',
          ResponseContentType: 'image/jpeg',
          ResponseContentDisposition: `attachment; filename*=UTF-8''Vacation%20Photo.jpg`,
        }),
      );
    });

    it('should sign a high-cardinality redirect burst without opening S3 read streams', async () => {
      const strategies = await Promise.all(
        Array.from({ length: 200 }, (_, index) =>
          backend.getServeStrategy(`thumbs/user1/aa/bb/thumb-${index}.webp`, {
            contentType: 'image/webp',
            cacheControl: CacheControl.PrivateWithCache,
            fileName: `thumb-${index}.webp`,
            disposition: 'inline',
          }),
        ),
      );

      expect(strategies).toHaveLength(200);
      expect(strategies.every((strategy) => strategy.type === 'redirect')).toBe(true);
      expect(mockSend).not.toHaveBeenCalled();
      expect(getSignedUrl).toHaveBeenCalledTimes(200);
    });

    it('should return stream when serveMode is proxy', async () => {
      const proxyBackend = new S3StorageBackend({
        bucket: 'test-bucket',
        region: 'us-east-1',
        presignedUrlExpiry: 3600,
        serveMode: 'proxy' as const,
      });

      const bodyStream = Readable.from([Buffer.from('proxied')]);
      // Need to get the new client's send mock
      const allClients = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results;
      const proxyClient = allClients.at(-1)?.value;
      proxyClient.send.mockResolvedValueOnce({
        Body: bodyStream,
        ContentLength: 7,
      });

      const strategy = await proxyBackend.getServeStrategy('key.jpg', {
        contentType: 'image/jpeg',
        cacheControl: CacheControl.PrivateWithCache,
      });
      expect(strategy.type).toBe('stream');
    });

    it('should limit concurrent proxied S3 reads', async () => {
      const proxyBackend = new S3StorageBackend({
        bucket: 'test-bucket',
        region: 'us-east-1',
        presignedUrlExpiry: 3600,
        serveMode: 'proxy' as const,
        proxyReadConcurrency: 1,
      });
      const proxyClient = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
      let firstResolve!: (value: unknown) => void;
      proxyClient.send
        .mockReturnValueOnce(
          new Promise((resolve) => {
            firstResolve = resolve;
          }),
        )
        .mockResolvedValueOnce({ Body: Readable.from([Buffer.from('second')]), ContentLength: 6 });

      const first = proxyBackend.getServeStrategy('first.jpg', {
        contentType: 'image/jpeg',
        cacheControl: CacheControl.PrivateWithCache,
      });
      const second = proxyBackend.getServeStrategy('second.jpg', {
        contentType: 'image/jpeg',
        cacheControl: CacheControl.PrivateWithCache,
      });
      await Promise.resolve();

      expect(proxyClient.send).toHaveBeenCalledTimes(1);
      firstResolve({ Body: Readable.from([Buffer.from('first')]), ContentLength: 5 });
      const firstStrategy = await first;
      expect(proxyClient.send).toHaveBeenCalledTimes(1);
      if (firstStrategy.type === 'stream') {
        firstStrategy.stream.destroy();
      }
      await second;

      expect(proxyClient.send).toHaveBeenCalledTimes(2);
      await expect(second).resolves.toMatchObject({ type: 'stream' });
    });

    it('should release a proxy read slot when the stream ends', async () => {
      const proxyBackend = new S3StorageBackend({
        bucket: 'test-bucket',
        region: 'us-east-1',
        presignedUrlExpiry: 3600,
        serveMode: 'proxy' as const,
        proxyReadConcurrency: 1,
      });
      const proxyClient = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
      proxyClient.send
        .mockResolvedValueOnce({ Body: Readable.from([Buffer.from('first')]), ContentLength: 5 })
        .mockResolvedValueOnce({ Body: Readable.from([Buffer.from('second')]), ContentLength: 6 });

      const first = await proxyBackend.getServeStrategy('first.jpg', {
        contentType: 'image/jpeg',
        cacheControl: CacheControl.PrivateWithCache,
      });
      const secondPromise = proxyBackend.getServeStrategy('second.jpg', {
        contentType: 'image/jpeg',
        cacheControl: CacheControl.PrivateWithCache,
      });
      expect(proxyClient.send).toHaveBeenCalledTimes(1);
      if (first.type === 'stream') {
        for await (const _chunk of first.stream) {
          // drain stream
        }
      }
      const second = await secondPromise;

      expect(second.type).toBe('stream');
      expect(proxyClient.send).toHaveBeenCalledTimes(2);
    });

    it('should release a proxy read slot when stream creation fails', async () => {
      const proxyBackend = new S3StorageBackend({
        bucket: 'test-bucket',
        region: 'us-east-1',
        presignedUrlExpiry: 3600,
        serveMode: 'proxy' as const,
        proxyReadConcurrency: 1,
      });
      const proxyClient = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
      proxyClient.send.mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce({
        Body: Readable.from([Buffer.from('second')]),
        ContentLength: 6,
      });

      await expect(
        proxyBackend.getServeStrategy('first.jpg', {
          contentType: 'image/jpeg',
          cacheControl: CacheControl.PrivateWithCache,
        }),
      ).rejects.toThrow('denied');
      const second = await proxyBackend.getServeStrategy('second.jpg', {
        contentType: 'image/jpeg',
        cacheControl: CacheControl.PrivateWithCache,
      });

      expect(second.type).toBe('stream');
      expect(proxyClient.send).toHaveBeenCalledTimes(2);
    });

    it('should release a proxy read slot when the stream errors', async () => {
      const proxyBackend = new S3StorageBackend({
        bucket: 'test-bucket',
        region: 'us-east-1',
        presignedUrlExpiry: 3600,
        serveMode: 'proxy' as const,
        proxyReadConcurrency: 1,
      });
      const proxyClient = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results.at(-1)?.value;
      const erroringStream = new Readable({
        read() {
          this.destroy(new Error('stream failed'));
        },
      });
      proxyClient.send
        .mockResolvedValueOnce({ Body: erroringStream, ContentLength: 5 })
        .mockResolvedValueOnce({ Body: Readable.from([Buffer.from('second')]), ContentLength: 6 });

      const first = await proxyBackend.getServeStrategy('first.jpg', {
        contentType: 'image/jpeg',
        cacheControl: CacheControl.PrivateWithCache,
      });
      const secondPromise = proxyBackend.getServeStrategy('second.jpg', {
        contentType: 'image/jpeg',
        cacheControl: CacheControl.PrivateWithCache,
      });
      if (first.type === 'stream') {
        await expect(
          (async () => {
            for await (const _chunk of first.stream) {
              // drain stream
            }
          })(),
        ).rejects.toThrow('stream failed');
      }
      const second = await secondPromise;

      expect(second.type).toBe('stream');
      expect(proxyClient.send).toHaveBeenCalledTimes(2);
    });

    it('should not acquire proxy read slots in redirect mode', async () => {
      const strategy = await backend.getServeStrategy('thumbs/user1/ab/cd/thumb.webp', {
        contentType: 'image/webp',
        cacheControl: CacheControl.PrivateWithCache,
      });

      expect(strategy.type).toBe('redirect');
      expect(mockSend).not.toHaveBeenCalled();
      expect(getSignedUrl).toHaveBeenCalled();
    });
  });

  describe('downloadToTemp', () => {
    it('should download to a temp file and provide cleanup', async () => {
      const bodyStream = Readable.from([Buffer.from('temp file content')]);
      mockSend.mockResolvedValueOnce({ Body: bodyStream });

      const { tempPath, cleanup } = await backend.downloadToTemp('key.jpg');

      expect(tempPath).toContain('immich-');
      expect(tempPath.endsWith('.tmp')).toBe(true);

      const content = await readFile(tempPath, 'utf8');
      expect(content).toBe('temp file content');

      await cleanup();
      expect(existsSync(tempPath)).toBe(false);
    });
  });

  describe('deletePrefix', () => {
    it('should not send DeleteObjectsCommand when the prefix matches nothing', async () => {
      mockSend.mockResolvedValueOnce({ Contents: [], IsTruncated: false });

      await backend.deletePrefix('upload/ghost/');

      const listInputs = mockSend.mock.calls
        .filter(([cmd]) => cmd._type === 'ListObjectsV2Command')
        .map(([cmd]) => cmd.input);
      const deleteInputs = mockSend.mock.calls.filter(([cmd]) => cmd._type === 'DeleteObjectsCommand');
      expect(listInputs).toEqual([expect.objectContaining({ Bucket: 'test-bucket', Prefix: 'upload/ghost/' })]);
      expect(deleteInputs).toEqual([]);
    });

    it('should list then delete in a single batch for one page of results', async () => {
      mockSend
        .mockResolvedValueOnce({
          Contents: [{ Key: 'upload/u/aa/1.jpg' }, { Key: 'upload/u/aa/2.jpg' }, { Key: 'upload/u/bb/3.jpg' }],
          IsTruncated: false,
        })
        .mockResolvedValueOnce({ Deleted: [{}, {}, {}] });

      await backend.deletePrefix('upload/u/');

      const listCalls = mockSend.mock.calls.filter(([cmd]) => cmd._type === 'ListObjectsV2Command');
      const deleteInputs = mockSend.mock.calls
        .filter(([cmd]) => cmd._type === 'DeleteObjectsCommand')
        .map(([cmd]) => cmd.input);
      expect(listCalls).toHaveLength(1);
      expect(deleteInputs).toEqual([
        expect.objectContaining({
          Bucket: 'test-bucket',
          Delete: {
            Objects: [{ Key: 'upload/u/aa/1.jpg' }, { Key: 'upload/u/aa/2.jpg' }, { Key: 'upload/u/bb/3.jpg' }],
          },
        }),
      ]);
    });

    it('should paginate via ContinuationToken across multiple pages', async () => {
      mockSend
        .mockResolvedValueOnce({
          Contents: [{ Key: 'upload/u/a.jpg' }],
          IsTruncated: true,
          NextContinuationToken: 'token-page-2',
        })
        .mockResolvedValueOnce({ Deleted: [{}] })
        .mockResolvedValueOnce({ Contents: [{ Key: 'upload/u/b.jpg' }], IsTruncated: false })
        .mockResolvedValueOnce({ Deleted: [{}] });

      await backend.deletePrefix('upload/u/');

      const listInputs = mockSend.mock.calls
        .filter(([cmd]) => cmd._type === 'ListObjectsV2Command')
        .map(([cmd]) => cmd.input);
      const deleteCalls = mockSend.mock.calls.filter(([cmd]) => cmd._type === 'DeleteObjectsCommand');
      expect(listInputs).toHaveLength(2);
      expect(listInputs[0].ContinuationToken).toBeUndefined();
      expect(listInputs[1].ContinuationToken).toBe('token-page-2');
      expect(deleteCalls).toHaveLength(2);
    });

    it('should throw when DeleteObjects returns a non-empty Errors field', async () => {
      mockSend
        .mockResolvedValueOnce({ Contents: [{ Key: 'upload/u/x.jpg' }], IsTruncated: false })
        .mockResolvedValueOnce({
          Deleted: [],
          Errors: [{ Key: 'upload/u/x.jpg', Code: 'AccessDenied', Message: 'no perms' }],
        });

      await expect(backend.deletePrefix('upload/u/')).rejects.toThrow(/AccessDenied/);
    });

    it('should propagate exceptions from ListObjectsV2Command', async () => {
      mockSend.mockRejectedValueOnce(new Error('throttled'));

      await expect(backend.deletePrefix('upload/u/')).rejects.toThrow('throttled');
      expect(mockSend.mock.calls.filter(([cmd]) => cmd._type === 'DeleteObjectsCommand')).toEqual([]);
    });
  });

  describe('getPrefixUsage', () => {
    it('should sum object sizes across all pages', async () => {
      mockSend
        .mockResolvedValueOnce({
          Contents: [{ Size: 10 }, { Size: 20 }],
          IsTruncated: true,
          NextContinuationToken: 'token-page-2',
        })
        .mockResolvedValueOnce({
          Contents: [{ Size: 30 }, {}],
          IsTruncated: false,
        });

      await expect(backend.getPrefixUsage('thumbs/user-a/')).resolves.toBe(60);

      const listInputs = mockSend.mock.calls
        .filter(([cmd]) => cmd._type === 'ListObjectsV2Command')
        .map(([cmd]) => cmd.input);
      expect(listInputs).toEqual([
        expect.objectContaining({ Bucket: 'test-bucket', Prefix: 'thumbs/user-a/' }),
        expect.objectContaining({
          Bucket: 'test-bucket',
          Prefix: 'thumbs/user-a/',
          ContinuationToken: 'token-page-2',
        }),
      ]);
    });

    it('should return zero when the prefix matches nothing', async () => {
      mockSend.mockResolvedValueOnce({ Contents: undefined, IsTruncated: false });

      await expect(backend.getPrefixUsage('profile/ghost/')).resolves.toBe(0);
    });
  });
});
