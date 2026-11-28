import { mkdtempDisposableSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { defaults } from 'src/dtos/config.dto.js';
import { Colorspace, ImageEffort, ImageFormat, TranscodeTarget } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MediaRepository } from 'src/repositories/media.repository.js';
import { ThumbnailConfig } from 'src/utils/media.js';
import { testAssetsDir } from 'test/medium.factory.js';
import { automock } from 'test/utils.js';

const tags = ['JpgFromRaw2', 'JpgFromRaw', 'PreviewJXL', 'PreviewImage'];

describe(MediaRepository.name, () => {
  let sut: MediaRepository;

  beforeEach(() => {
    sut = new MediaRepository(
      automock(LoggingRepository, { args: [undefined, { getEnv: () => ({}) }], strict: false }),
    );
  });

  const getEmbeddedImages = async (path: string) => {
    const images = await sut.getEmbeddedImages(resolve(testAssetsDir, path), tags);
    return Promise.all(
      images.map(async ({ tag, buffer, photometricInterpretation }) => {
        const { width, height } = await sut.getImageMetadata(buffer);
        return { tag, photometricInterpretation, width, height };
      }),
    );
  };

  const frameOf = async (path: string) => {
    const input = resolve(testAssetsDir, path);
    const { videoStreams, format } = await sut.probe(input);
    const config = ThumbnailConfig.create(defaults.ffmpeg);
    const frame = await sut.getVideoFrame(
      input,
      config.getCommand(TranscodeTarget.Video, videoStreams[0], undefined, format),
    );
    const cicp = frame.indexOf('cICP');
    return { size: await sut.getImageMetadata(frame), cicp: [...frame.subarray(cicp + 4, cicp + 8)] };
  };

  describe('generateThumbnail', () => {
    it('processes an AVIF with more items than the libheif security limit', async () => {
      const input = await readFile(resolve(testAssetsDir, 'formats/avif/security-limit.avif'));

      const metadata = await sut.getImageMetadata(input);
      expect(metadata).toEqual({ width: 1, height: 1 });

      using decoded = await sut.decodeImage(input, { profile: Colorspace.P3, strict: true });
      const dir = mkdtempDisposableSync(join(tmpdir(), 'media-repository-'));
      const file = join(dir.path, 'test.webp');
      await sut.generateThumbnail(
        decoded,
        {
          quality: 80,
          effort: ImageEffort.Medium,
          format: ImageFormat.Webp,
          progressive: false,
          decodingTier: 0,
        },
        file,
      );
      expect(statSync(file).size).toBeGreaterThan(0);
    });
  });

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

  describe('getVideoFrame', () => {
    it('takes the first frame of an hdr video upright, in its own light', async () => {
      await expect(frameOf('videos/train.mov')).resolves.toEqual({
        size: { width: 1080, height: 1920 },
        cicp: [9, 18, 0, 1],
      });
    });

    it('takes the first frame of an sdr video upright', async () => {
      await expect(frameOf('videos/waterfall.mp4')).resolves.toEqual({
        size: { width: 2160, height: 3840 },
        cicp: [1, 1, 0, 1],
      });
    });
  });
});
