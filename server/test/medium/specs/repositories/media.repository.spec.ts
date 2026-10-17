import { resolve } from 'node:path';
import sharp from 'sharp';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MediaRepository } from 'src/repositories/media.repository.js';
import { testAssetsDir } from 'test/medium.factory.js';

const tags = ['JpgFromRaw2', 'JpgFromRaw', 'PreviewJXL', 'PreviewImage'];

const sut = new MediaRepository(LoggingRepository.create());

const getEmbeddedImages = async (path: string) => {
  const images = await sut.getEmbeddedImages(resolve(testAssetsDir, path), tags);
  return Promise.all(
    images.map(async ({ tag, buffer, photometricInterpretation }) => {
      const { width, height } = await sharp(buffer).metadata();
      return { tag, photometricInterpretation, width, height };
    }),
  );
};

describe(MediaRepository.name, () => {
  describe('getEmbeddedImages', () => {
    it('should return every copy of a tag with the photometric interpretation of its group', async () => {
      await expect(getEmbeddedImages('formats/raw/Ricoh/GR3/Ricoh_GR3-450.DNG')).resolves.toEqual([
        { tag: 'PreviewImage', photometricInterpretation: 6, width: 6000, height: 4000 },
        { tag: 'PreviewImage', photometricInterpretation: undefined, width: 720, height: 480 },
      ]);
    });

    it('should return images in the order of the requested tags', async () => {
      await expect(getEmbeddedImages('formats/raw/Nikon/D700/philadelphia.nef')).resolves.toEqual([
        { tag: 'JpgFromRaw', photometricInterpretation: undefined, width: 4256, height: 2832 },
        { tag: 'PreviewImage', photometricInterpretation: undefined, width: 570, height: 375 },
      ]);
    });

    it('should return tags that are only extracted when requested by name', async () => {
      await expect(getEmbeddedImages('formats/raw/Panasonic/DMC-GH4/4_3.rw2')).resolves.toEqual([
        { tag: 'JpgFromRaw', photometricInterpretation: undefined, width: 1920, height: 1440 },
      ]);
    });

    it('should return an empty list if there are no embedded images', async () => {
      await expect(getEmbeddedImages('formats/jpg/el_torcal_rocks.jpg')).resolves.toEqual([]);
    });

    it('should throw if the file cannot be read', async () => {
      await expect(getEmbeddedImages('formats/raw/does-not-exist.dng')).rejects.toThrow();
    });
  });
});
