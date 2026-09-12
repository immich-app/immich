import { JobStatus } from 'src/enum.js';
import { DeviceMountService } from 'src/services/device-mount.service.js';
import { DeviceIdentityConfidence, DeviceIdentityMethod } from 'src/services/device-resolver/device-resolver.types.js';
import { newTestService } from 'test/utils.js';

const LIBRARY_ID = 'library-1';

const baseMount = {
  id: 'mount-1',
  libraryId: LIBRARY_ID,
  volumeId: 'KNOWN-VOLUME-ID',
  identityMethod: DeviceIdentityMethod.FilesystemSerial,
  identityConfidence: DeviceIdentityConfidence.High,
  lastKnownPath: '/mnt/external/old-mount',
  lastSeenAt: new Date('2026-09-01T00:00:00Z'),
  assetCount: 42,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-09-01T00:00:00Z'),
};

describe(DeviceMountService.name, () => {
  describe('handleReconcile', () => {
    it('discovers candidate roots itself and delegates to reconcilePath', async () => {
      const { sut, mocks } = newTestService(DeviceMountService);
      mocks.volumeInfo.listMountedVolumes.mockResolvedValue(['/mnt/external/new-mount']);
      mocks.deviceMount.getByLibraryId.mockResolvedValue(baseMount);
      mocks.storage.stat.mockRejectedValue(new Error('ENOENT'));
      mocks.volumeInfo.getFilesystemSerial.mockResolvedValue(baseMount.volumeId);
      mocks.library.get.mockResolvedValue({
        id: LIBRARY_ID,
        ownerId: 'owner-1',
        exclusionPatterns: [],
        importPaths: [],
      } as any);
      mocks.storage.crawl.mockResolvedValue([]);

      const status = await sut.handleReconcile({ id: LIBRARY_ID });

      expect(mocks.volumeInfo.listMountedVolumes).toHaveBeenCalled();
      expect(mocks.deviceMount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ lastKnownPath: '/mnt/external/new-mount' }),
      );
      expect(status).toBe(JobStatus.Success);
    });

    it('succeeds without relinking when nothing matches', async () => {
      const { sut, mocks } = newTestService(DeviceMountService);
      mocks.volumeInfo.listMountedVolumes.mockResolvedValue([]);
      mocks.deviceMount.getByLibraryId.mockResolvedValue(undefined);

      await expect(sut.handleReconcile({ id: LIBRARY_ID })).resolves.toBe(JobStatus.Success);
    });
  });

  it('does nothing for a library with no tracked device', async () => {
    const { sut, mocks } = newTestService(DeviceMountService);
    mocks.deviceMount.getByLibraryId.mockResolvedValue(undefined);

    const result = await sut.reconcilePath(LIBRARY_ID, ['/mnt/external/candidate']);

    expect(result).toEqual({ reason: 'not-tracked', relinked: false });
    expect(mocks.storage.stat).not.toHaveBeenCalled();
  });

  it('does nothing when the last-known path still exists', async () => {
    const { sut, mocks } = newTestService(DeviceMountService);
    mocks.deviceMount.getByLibraryId.mockResolvedValue(baseMount);
    mocks.storage.stat.mockResolvedValue({} as any);

    const result = await sut.reconcilePath(LIBRARY_ID, ['/mnt/external/candidate']);

    expect(result).toEqual({ reason: 'still-at-known-path', relinked: false });
    expect(mocks.volumeInfo.getFilesystemSerial).not.toHaveBeenCalled();
  });

  it('relinks the library and its assets when a candidate root matches the tracked volume', async () => {
    const { sut, mocks } = newTestService(DeviceMountService);
    mocks.deviceMount.getByLibraryId.mockResolvedValue(baseMount);
    mocks.storage.stat.mockRejectedValue(new Error('ENOENT'));
    mocks.volumeInfo.getFilesystemSerial.mockImplementation((root: string) =>
      Promise.resolve(root === '/mnt/external/new-mount' ? baseMount.volumeId : null),
    );
    mocks.library.get.mockResolvedValue({
      id: LIBRARY_ID,
      ownerId: 'owner-1',
      exclusionPatterns: [],
      importPaths: ['/mnt/external/old-mount/Photos', '/other/unrelated/path'],
    } as any);
    mocks.storage.crawl.mockResolvedValue([]);

    const result = await sut.reconcilePath(LIBRARY_ID, ['/mnt/external/unrelated', '/mnt/external/new-mount']);

    expect(result).toEqual({
      reason: 'relinked',
      relinked: true,
      oldPath: '/mnt/external/old-mount',
      newPath: '/mnt/external/new-mount',
    });

    // only the import path actually under the old mount gets rewritten; the unrelated one is untouched
    expect(mocks.library.update).toHaveBeenCalledWith(LIBRARY_ID, {
      importPaths: ['/mnt/external/new-mount/Photos', '/other/unrelated/path'],
    });

    expect(mocks.asset.rewriteOriginalPathPrefix).toHaveBeenCalledWith(
      LIBRARY_ID,
      '/mnt/external/old-mount',
      '/mnt/external/new-mount',
    );

    expect(mocks.deviceMount.upsert).toHaveBeenCalledWith({
      libraryId: LIBRARY_ID,
      volumeId: baseMount.volumeId,
      identityMethod: DeviceIdentityMethod.FilesystemSerial,
      identityConfidence: DeviceIdentityConfidence.High,
      lastKnownPath: '/mnt/external/new-mount',
    });
  });

  it('stops checking further candidates once a match is found', async () => {
    const { sut, mocks } = newTestService(DeviceMountService);
    mocks.deviceMount.getByLibraryId.mockResolvedValue(baseMount);
    mocks.storage.stat.mockRejectedValue(new Error('ENOENT'));
    mocks.volumeInfo.getFilesystemSerial
      .mockResolvedValueOnce(baseMount.volumeId)
      .mockResolvedValueOnce('should-not-be-reached');
    mocks.library.get.mockResolvedValue({
      id: LIBRARY_ID,
      ownerId: 'owner-1',
      exclusionPatterns: [],
      importPaths: [],
    } as any);
    mocks.storage.crawl.mockResolvedValue([]);

    await sut.reconcilePath(LIBRARY_ID, ['/mnt/external/first', '/mnt/external/second']);

    expect(mocks.volumeInfo.getFilesystemSerial).toHaveBeenCalledTimes(1);
  });

  it('reports no match when no candidate resolves to the tracked volume', async () => {
    const { sut, mocks } = newTestService(DeviceMountService);
    mocks.deviceMount.getByLibraryId.mockResolvedValue(baseMount);
    mocks.storage.stat.mockRejectedValue(new Error('ENOENT'));
    mocks.volumeInfo.getFilesystemSerial.mockResolvedValue('SOME-OTHER-VOLUME');

    const result = await sut.reconcilePath(LIBRARY_ID, ['/mnt/external/a', '/mnt/external/b']);

    expect(result).toEqual({ reason: 'no-match-found', relinked: false });
    expect(mocks.library.update).not.toHaveBeenCalled();
    expect(mocks.asset.rewriteOriginalPathPrefix).not.toHaveBeenCalled();
    expect(mocks.deviceMount.upsert).not.toHaveBeenCalled();
  });

  it('relinks a file renamed within the drive by matching its content checksum', async () => {
    const { sut, mocks } = newTestService(DeviceMountService);
    mocks.deviceMount.getByLibraryId.mockResolvedValue(baseMount);
    mocks.storage.stat.mockRejectedValue(new Error('ENOENT'));
    mocks.volumeInfo.getFilesystemSerial.mockResolvedValue(baseMount.volumeId);
    mocks.library.get.mockResolvedValue({
      id: LIBRARY_ID,
      ownerId: 'owner-1',
      exclusionPatterns: [],
      importPaths: [],
    } as any);
    // the file now lives at a different relative path than any asset is recorded at, so the prefix rewrite can't
    // find it - relinkByContent has to hash it and match by checksum instead.
    mocks.storage.crawl.mockResolvedValue(['/mnt/external/new-mount/Reorganized/vacation.jpg']);
    mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(undefined);
    mocks.crypto.hashFile.mockResolvedValue(Buffer.from('content-checksum'));
    mocks.asset.getByChecksum.mockResolvedValue({
      id: 'asset-42',
      originalPath: '/mnt/external/old-mount/Photos/vacation.jpg',
    } as any);

    await sut.reconcilePath(LIBRARY_ID, ['/mnt/external/new-mount']);

    expect(mocks.crypto.hashFile).toHaveBeenCalledWith('/mnt/external/new-mount/Reorganized/vacation.jpg');
    expect(mocks.asset.getByChecksum).toHaveBeenCalledWith({
      ownerId: 'owner-1',
      libraryId: LIBRARY_ID,
      checksum: Buffer.from('content-checksum'),
    });
    expect(mocks.asset.update).toHaveBeenCalledWith({
      id: 'asset-42',
      originalPath: '/mnt/external/new-mount/Reorganized/vacation.jpg',
    });
  });

  it('skips the content-checksum fallback for a file already linked at its current path', async () => {
    const { sut, mocks } = newTestService(DeviceMountService);
    mocks.deviceMount.getByLibraryId.mockResolvedValue(baseMount);
    mocks.storage.stat.mockRejectedValue(new Error('ENOENT'));
    mocks.volumeInfo.getFilesystemSerial.mockResolvedValue(baseMount.volumeId);
    mocks.library.get.mockResolvedValue({
      id: LIBRARY_ID,
      ownerId: 'owner-1',
      exclusionPatterns: [],
      importPaths: [],
    } as any);
    mocks.storage.crawl.mockResolvedValue(['/mnt/external/new-mount/Photos/vacation.jpg']);
    mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue({ id: 'asset-42' } as any);

    await sut.reconcilePath(LIBRARY_ID, ['/mnt/external/new-mount']);

    expect(mocks.crypto.hashFile).not.toHaveBeenCalled();
    expect(mocks.asset.update).not.toHaveBeenCalled();
  });

  it('does not update an asset when no checksum match is found for an unlinked file', async () => {
    const { sut, mocks } = newTestService(DeviceMountService);
    mocks.deviceMount.getByLibraryId.mockResolvedValue(baseMount);
    mocks.storage.stat.mockRejectedValue(new Error('ENOENT'));
    mocks.volumeInfo.getFilesystemSerial.mockResolvedValue(baseMount.volumeId);
    mocks.library.get.mockResolvedValue({
      id: LIBRARY_ID,
      ownerId: 'owner-1',
      exclusionPatterns: [],
      importPaths: [],
    } as any);
    mocks.storage.crawl.mockResolvedValue(['/mnt/external/new-mount/Photos/new-file.jpg']);
    mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(undefined);
    mocks.crypto.hashFile.mockResolvedValue(Buffer.from('no-match'));
    mocks.asset.getByChecksum.mockResolvedValue(undefined);

    await sut.reconcilePath(LIBRARY_ID, ['/mnt/external/new-mount']);

    expect(mocks.asset.update).not.toHaveBeenCalled();
  });

  it('still relinks the asset paths and mount record when the library row is missing', async () => {
    const { sut, mocks } = newTestService(DeviceMountService);
    mocks.deviceMount.getByLibraryId.mockResolvedValue(baseMount);
    mocks.storage.stat.mockRejectedValue(new Error('ENOENT'));
    mocks.volumeInfo.getFilesystemSerial.mockResolvedValue(baseMount.volumeId);
    mocks.library.get.mockResolvedValue(undefined);

    const result = await sut.reconcilePath(LIBRARY_ID, ['/mnt/external/new-mount']);

    expect(result.relinked).toBe(true);
    expect(mocks.library.update).not.toHaveBeenCalled();
    expect(mocks.asset.rewriteOriginalPathPrefix).toHaveBeenCalledWith(
      LIBRARY_ID,
      '/mnt/external/old-mount',
      '/mnt/external/new-mount',
    );
  });
});
