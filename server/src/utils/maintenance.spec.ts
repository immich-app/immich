import { jwtVerify } from 'jose';
import { StorageCore } from 'src/cores/storage.core';
import { StorageFolder } from 'src/enum';
import { StorageRepository } from 'src/repositories/storage.repository';
import { createMaintenanceLoginUrl, detectPriorInstall, generateMaintenanceSecret, signMaintenanceJwt } from 'src/utils/maintenance';
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('generateMaintenanceSecret', () => {
  it('should return a hex string', () => {
    const secret = generateMaintenanceSecret();
    expect(secret).toMatch(/^[0-9a-f]+$/);
  });

  it('should return a 128-character hex string (64 bytes)', () => {
    const secret = generateMaintenanceSecret();
    expect(secret).toHaveLength(128);
  });

  it('should return unique values on each call', () => {
    const secret1 = generateMaintenanceSecret();
    const secret2 = generateMaintenanceSecret();
    expect(secret1).not.toBe(secret2);
  });
});

describe('signMaintenanceJwt', () => {
  it('should return a valid JWT string', async () => {
    const secret = generateMaintenanceSecret();
    const auth = { username: 'admin' };
    const token = await signMaintenanceJwt(secret, auth);
    expect(typeof token).toBe('string');
    // JWT has three dot-separated parts
    expect(token.split('.')).toHaveLength(3);
  });

  it('should encode the username in the JWT payload', async () => {
    const secret = generateMaintenanceSecret();
    const auth = { username: 'testuser' };
    const token = await signMaintenanceJwt(secret, auth);

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    expect(payload.username).toBe('testuser');
  });

  it('should set an expiration time', async () => {
    const secret = generateMaintenanceSecret();
    const auth = { username: 'admin' };
    const token = await signMaintenanceJwt(secret, auth);

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    expect(payload.exp).toBeDefined();
    // expiration should be ~4 hours from now
    const fourHoursInSeconds = 4 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);
    expect(payload.exp! - now).toBeGreaterThan(fourHoursInSeconds - 60);
    expect(payload.exp! - now).toBeLessThanOrEqual(fourHoursInSeconds);
  });

  it('should set an issued-at time', async () => {
    const secret = generateMaintenanceSecret();
    const auth = { username: 'admin' };
    const token = await signMaintenanceJwt(secret, auth);

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    expect(payload.iat).toBeDefined();
    const now = Math.floor(Date.now() / 1000);
    expect(payload.iat!).toBeLessThanOrEqual(now);
    expect(payload.iat!).toBeGreaterThan(now - 10);
  });

  it('should use HS256 algorithm', async () => {
    const secret = generateMaintenanceSecret();
    const auth = { username: 'admin' };
    const token = await signMaintenanceJwt(secret, auth);

    const { protectedHeader } = await jwtVerify(token, new TextEncoder().encode(secret));
    expect(protectedHeader.alg).toBe('HS256');
  });

  it('should not be verifiable with a wrong secret', async () => {
    const secret = generateMaintenanceSecret();
    const wrongSecret = generateMaintenanceSecret();
    const auth = { username: 'admin' };
    const token = await signMaintenanceJwt(secret, auth);

    await expect(jwtVerify(token, new TextEncoder().encode(wrongSecret))).rejects.toThrow();
  });
});

describe('createMaintenanceLoginUrl', () => {
  it('should create a URL with the base URL and token parameter', async () => {
    const secret = generateMaintenanceSecret();
    const auth = { username: 'admin' };
    const url = await createMaintenanceLoginUrl('https://my.immich.app', auth, secret);
    expect(url).toMatch(/^https:\/\/my\.immich\.app\/maintenance\?token=.+/);
  });

  it('should include a valid JWT as the token parameter', async () => {
    const secret = generateMaintenanceSecret();
    const auth = { username: 'admin' };
    const url = await createMaintenanceLoginUrl('https://example.com', auth, secret);
    const token = url.split('token=')[1];
    expect(token).toBeDefined();

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    expect(payload.username).toBe('admin');
  });

  it('should work with different base URLs', async () => {
    const secret = generateMaintenanceSecret();
    const auth = { username: 'admin' };
    const url = await createMaintenanceLoginUrl('http://localhost:2283', auth, secret);
    expect(url).toMatch(/^http:\/\/localhost:2283\/maintenance\?token=.+/);
  });
});

describe('detectPriorInstall', () => {
  beforeAll(() => {
    StorageCore.setMediaLocation('/tmp/test-immich-media');
  });

  it('should detect readable and writable storage folders', async () => {
    const storageRepository = {
      readdir: vi.fn().mockResolvedValue(['file1.jpg', 'file2.jpg', '.immich']),
      readFile: vi.fn().mockResolvedValue(Buffer.from('test')),
      overwriteFile: vi.fn().mockResolvedValue(undefined),
    } as unknown as StorageRepository;

    const result = await detectPriorInstall(storageRepository);

    expect(result.storage).toHaveLength(Object.values(StorageFolder).length);
    for (const folder of result.storage) {
      expect(folder.readable).toBe(true);
      expect(folder.writable).toBe(true);
      // '.immich' should be filtered from count
      expect(folder.files).toBe(2);
    }
  });

  it('should handle non-readable and non-writable storage', async () => {
    const storageRepository = {
      readdir: vi.fn().mockResolvedValue([]),
      readFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
      overwriteFile: vi.fn().mockRejectedValue(new Error('EACCES')),
    } as unknown as StorageRepository;

    const result = await detectPriorInstall(storageRepository);

    expect(result.storage).toHaveLength(Object.values(StorageFolder).length);
    for (const folder of result.storage) {
      expect(folder.readable).toBe(false);
      expect(folder.writable).toBe(false);
      expect(folder.files).toBe(0);
    }
  });

  it('should handle readable but not writable storage', async () => {
    const storageRepository = {
      readdir: vi.fn().mockResolvedValue(['photo.jpg']),
      readFile: vi.fn().mockResolvedValue(Buffer.from('data')),
      overwriteFile: vi.fn().mockRejectedValue(new Error('EACCES')),
    } as unknown as StorageRepository;

    const result = await detectPriorInstall(storageRepository);

    for (const folder of result.storage) {
      expect(folder.readable).toBe(true);
      expect(folder.writable).toBe(false);
      expect(folder.files).toBe(1);
    }
  });

  it('should return all StorageFolder enum values as folder names', async () => {
    const storageRepository = {
      readdir: vi.fn().mockResolvedValue([]),
      readFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
      overwriteFile: vi.fn().mockRejectedValue(new Error('EACCES')),
    } as unknown as StorageRepository;

    const result = await detectPriorInstall(storageRepository);
    const folderNames = result.storage.map((s) => s.folder);
    expect(folderNames).toEqual(expect.arrayContaining(Object.values(StorageFolder)));
  });

  it('should filter out .immich from file count but keep other files', async () => {
    const storageRepository = {
      readdir: vi.fn().mockResolvedValue(['.immich', 'a.jpg', 'b.png', 'c.mp4']),
      readFile: vi.fn().mockResolvedValue(Buffer.from('data')),
      overwriteFile: vi.fn().mockResolvedValue(undefined),
    } as unknown as StorageRepository;

    const result = await detectPriorInstall(storageRepository);
    for (const folder of result.storage) {
      expect(folder.files).toBe(3);
    }
  });
});
