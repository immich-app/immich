import { mkdtempDisposableSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Colorspace, ImageEffort, ImageFormat } from 'src/enum.js';
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
