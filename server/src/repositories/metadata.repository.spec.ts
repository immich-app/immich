import { rm } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vitest } from 'vitest';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MetadataRepository } from 'src/repositories/metadata.repository.js';

vitest.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    rm: vitest.fn(),
  };
});

describe(MetadataRepository.name, () => {
  let sut: MetadataRepository;
  let loggerMock: LoggingRepository;

  beforeEach(() => {
    vitest.clearAllMocks();

    loggerMock = {
      setContext: vitest.fn(),
      warn: vitest.fn(),
      debug: vitest.fn(),
    } as unknown as LoggingRepository;

    sut = new MetadataRepository(loggerMock);
  });

  describe('writeTags', () => {
    it('should write tags', async () => {
      const writeSpy = vitest.spyOn((sut as any).exiftool, 'write').mockResolvedValue(undefined as never);

      await sut.writeTags('/path/to/asset.xmp', { Description: 'new-desc' });

      expect(writeSpy).toHaveBeenCalledWith('/path/to/asset.xmp', { 'Description^': 'new-desc' });
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });

    it('should delete stale temporary file and retry when temporary file already exists', async () => {
      const writeSpy = vitest
        .spyOn((sut as any).exiftool, 'write')
        .mockRejectedValueOnce(new Error('Error: Temporary file already exists:/path/to/asset.xmp_exiftool_tmp'))
        .mockResolvedValueOnce(undefined as never);

      await sut.writeTags('/path/to/asset.xmp', { Description: 'new-desc' });

      expect(rm).toHaveBeenCalledWith('/path/to/asset.xmp_exiftool_tmp', { force: true });
      expect(writeSpy).toHaveBeenCalledTimes(2);
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });

    it('should log warning if retry fails after deleting stale temporary file', async () => {
      const retryError = new Error('Disk full');
      vitest
        .spyOn((sut as any).exiftool, 'write')
        .mockRejectedValueOnce(new Error('Error: Temporary file already exists:/path/to/asset.xmp_exiftool_tmp'))
        .mockRejectedValueOnce(retryError);

      await sut.writeTags('/path/to/asset.xmp', { Description: 'new-desc' });

      expect(rm).toHaveBeenCalledWith('/path/to/asset.xmp_exiftool_tmp', { force: true });
      expect(loggerMock.warn).toHaveBeenCalledWith('Error writing exif data (/path/to/asset.xmp): Error: Disk full');
    });

    it('should log warning directly if error is not temporary file already exists', async () => {
      const otherError = new Error('Permission denied');
      vitest.spyOn((sut as any).exiftool, 'write').mockRejectedValueOnce(otherError);

      await sut.writeTags('/path/to/asset.xmp', { Description: 'new-desc' });

      expect(rm).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalledWith(
        'Error writing exif data (/path/to/asset.xmp): Error: Permission denied',
      );
    });
  });
});
