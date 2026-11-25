import { mkdtempDisposableSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Colorspace, ImageEffort, ImageFormat, RawExtractedFormat } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MediaRepository } from 'src/repositories/media.repository.js';
import { testAssetsDir } from 'test/medium.factory.js';
import { automock } from 'test/utils.js';

describe(MediaRepository.name, () => {
  let sut: MediaRepository;

  beforeEach(() => {
    sut = new MediaRepository(
      automock(LoggingRepository, { args: [undefined, { getEnv: () => ({}) }], strict: false }),
    );
  });

  describe('extract', () => {
    it('should extract the full-resolution preview from a Ricoh GR III DNG', async () => {
      const result = await sut.extract(resolve(testAssetsDir, 'formats/raw/Ricoh/GR3/Ricoh_GR3-450.DNG'));

      expect(result).not.toBeNull();
      expect(result?.format).toBe(RawExtractedFormat.Jpeg);
      expect(await sut.getImageMetadata(result!.buffer)).toEqual({
        width: 6000,
        height: 4000,
        isTransparent: false,
      });
    });
  });

  describe('generateThumbnail', () => {
    it('processes an AVIF with more items than the libheif security limit', async () => {
      const input = await readFile(resolve(testAssetsDir, 'formats/avif/security-limit.avif'));

      const metadata = await sut.getImageMetadata(input);
      expect(metadata).toEqual({ width: 1, height: 1, isTransparent: false });

      const decoded = await sut.decodeImage(input, { colorspace: Colorspace.P3, processInvalidImages: false });
      const dir = mkdtempDisposableSync(join(tmpdir(), 'media-repository-'));
      const file = join(dir.path, 'test.webp');
      await sut.generateThumbnail(
        decoded,
        {
          colorspace: Colorspace.P3,
          quality: 80,
          effort: ImageEffort.Medium,
          format: ImageFormat.Webp,
          processInvalidImages: false,
          decodingTier: 0,
        },
        file,
      );
      expect(statSync(file).size).toBeGreaterThan(0);
    });
  });
});
