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

import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3StorageBackend } from 'src/backends/s3-storage.backend';

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
      const strategy = await backend.getServeStrategy('thumbs/user1/ab/cd/thumb.webp', 'image/webp');
      expect(strategy.type).toBe('redirect');
      if (strategy.type === 'redirect') {
        expect(strategy.url).toContain('X-Amz-Signature');
      }
      expect(getSignedUrl).toHaveBeenCalled();
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

      const strategy = await proxyBackend.getServeStrategy('key.jpg', 'image/jpeg');
      expect(strategy.type).toBe('stream');
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
});
