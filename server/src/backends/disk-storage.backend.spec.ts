import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { DiskStorageBackend } from 'src/backends/disk-storage.backend';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('DiskStorageBackend', () => {
  let backend: DiskStorageBackend;
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `immich-disk-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    backend = new DiskStorageBackend(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('put', () => {
    it('should write a buffer to disk at mediaLocation/key', async () => {
      const content = Buffer.from('hello world');
      await backend.put('upload/user1/ab/cd/file.jpg', content);

      const written = await readFile(join(testDir, 'upload/user1/ab/cd/file.jpg'));
      expect(written.toString()).toBe('hello world');
    });

    it('should write a readable stream to disk', async () => {
      const stream = Readable.from([Buffer.from('stream content')]);
      await backend.put('upload/user1/ab/cd/file.jpg', stream);

      const written = await readFile(join(testDir, 'upload/user1/ab/cd/file.jpg'));
      expect(written.toString()).toBe('stream content');
    });
  });

  describe('get', () => {
    it('should return a readable stream', async () => {
      const filePath = join(testDir, 'thumbs/user1/ab/cd/thumb.webp');
      await mkdir(join(testDir, 'thumbs/user1/ab/cd'), { recursive: true });
      await writeFile(filePath, 'thumb data');

      const result = await backend.get('thumbs/user1/ab/cd/thumb.webp');
      const chunks: Buffer[] = [];
      for await (const chunk of result.stream) {
        chunks.push(Buffer.from(chunk));
      }
      expect(Buffer.concat(chunks).toString()).toBe('thumb data');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const filePath = join(testDir, 'test.txt');
      await writeFile(filePath, 'data');
      expect(await backend.exists('test.txt')).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      expect(await backend.exists('nope.txt')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove file from disk', async () => {
      const filePath = join(testDir, 'delete-me.txt');
      await writeFile(filePath, 'data');
      await backend.delete('delete-me.txt');
      expect(existsSync(filePath)).toBe(false);
    });
  });

  describe('getServeStrategy', () => {
    it('should always return file strategy with full path', async () => {
      const strategy = await backend.getServeStrategy('thumbs/user1/ab/cd/thumb.webp', 'image/webp');
      expect(strategy).toEqual({
        type: 'file',
        path: join(testDir, 'thumbs/user1/ab/cd/thumb.webp'),
      });
    });
  });

  describe('downloadToTemp', () => {
    it('should return the real path with no-op cleanup', async () => {
      const filePath = join(testDir, 'original.jpg');
      await writeFile(filePath, 'image data');

      const { tempPath, cleanup } = await backend.downloadToTemp('original.jpg');
      expect(tempPath).toBe(filePath);

      // cleanup should be a no-op (file still exists)
      await cleanup();
      expect(existsSync(filePath)).toBe(true);
    });
  });
});
