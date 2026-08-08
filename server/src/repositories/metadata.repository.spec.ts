import { ExifTool } from 'exiftool-vendored';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { automock } from 'test/utils';

describe(MetadataRepository.name, () => {
  it('should propagate sidecar write errors', async () => {
    const error = new Error('read-only file system');
    const logger = automock(LoggingRepository, { strict: false });
    const sut = new MetadataRepository(logger);
    const write = vitest.fn().mockRejectedValue(error);
    sut['exiftool'] = { write } as unknown as ExifTool;

    await expect(sut.writeTags('/read-only/asset.jpg.xmp', { Description: 'description' })).rejects.toBe(error);
    expect(logger.warn).toHaveBeenCalledWith(
      'Error writing exif data (/read-only/asset.jpg.xmp): Error: read-only file system',
    );
  });
});
