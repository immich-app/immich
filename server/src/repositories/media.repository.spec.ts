import type { Pixels } from '@immich/native-core';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { mkdtempDisposableSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AssetEditAction, AssetEditActionItem, MirrorAxis } from 'src/dtos/editing.dto.js';
import { Colorspace, ImageEffort, ImageFormat } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MediaRepository } from 'src/repositories/media.repository.js';
import { automock } from 'test/utils.js';

const getPixelColor = ({ data, width }: Pixels, x: number, y: number) => {
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
  };
};

type Color = [number, number, number];

const buildTestImage = (width: number, height: number, color: (x: number, y: number) => Color) => {
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pixels.set(color(x, y), (y * width + x) * 3);
    }
  }
  return Buffer.concat([Buffer.from(`P6 ${width} ${height} 255\n`), pixels]);
};

// a 4 quadrant image for testing mirroring: red, green, blue and yellow
const buildTestQuadImage = () =>
  buildTestImage(1000, 1000, (x, y) =>
    y < 500 ? (x < 500 ? [255, 0, 0] : [0, 255, 0]) : x < 500 ? [0, 0, 255] : [255, 255, 0],
  );

describe(MediaRepository.name, () => {
  let sut: MediaRepository;

  beforeEach(() => {
    // eslint-disable-next-line no-sparse-arrays
    sut = new MediaRepository(automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false }));
  });

  const applyEdits = async (input: Buffer, edits: AssetEditActionItem[]) => {
    using decoded = await sut.decodeImage(input, { profile: Colorspace.Srgb, strict: true });
    return decoded.pixels(sut['transform']({ edits }));
  };

  describe('edit (single actions)', () => {
    it('should apply crop edit correctly', async () => {
      const result = await applyEdits(
        buildTestImage(1000, 900, () => [255, 0, 0]),
        [
          {
            action: AssetEditAction.Crop,
            parameters: {
              x: 100,
              y: 200,
              width: 700,
              height: 300,
            },
          },
        ],
      );
      expect(result.width).toBe(700);
      expect(result.height).toBe(300);
    });
    it('should apply rotate edit correctly', async () => {
      const result = await applyEdits(
        buildTestImage(500, 1000, () => [255, 0, 0]),
        [
          {
            action: AssetEditAction.Rotate,
            parameters: {
              angle: 90,
            },
          },
        ],
      );
      expect(result.width).toBe(1000);
      expect(result.height).toBe(500);
    });

    it('should apply mirror edit correctly', async () => {
      const resultHorizontal = await applyEdits(buildTestQuadImage(), [
        {
          action: AssetEditAction.Mirror,
          parameters: {
            axis: MirrorAxis.Horizontal,
          },
        },
      ]);
      expect(resultHorizontal.width).toBe(1000);
      expect(resultHorizontal.height).toBe(1000);

      expect(getPixelColor(resultHorizontal, 10, 10)).toEqual({ r: 0, g: 255, b: 0 });
      expect(getPixelColor(resultHorizontal, 990, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(getPixelColor(resultHorizontal, 10, 990)).toEqual({ r: 255, g: 255, b: 0 });
      expect(getPixelColor(resultHorizontal, 990, 990)).toEqual({ r: 0, g: 0, b: 255 });

      const resultVertical = await applyEdits(buildTestQuadImage(), [
        {
          action: AssetEditAction.Mirror,
          parameters: {
            axis: MirrorAxis.Vertical,
          },
        },
      ]);
      expect(resultVertical.width).toBe(1000);
      expect(resultVertical.height).toBe(1000);

      // top-left should now be bottom-left (blue)
      expect(getPixelColor(resultVertical, 10, 10)).toEqual({ r: 0, g: 0, b: 255 });
      // top-right should now be bottom-right (yellow)
      expect(getPixelColor(resultVertical, 990, 10)).toEqual({ r: 255, g: 255, b: 0 });
      // bottom-left should now be top-left (red)
      expect(getPixelColor(resultVertical, 10, 990)).toEqual({ r: 255, g: 0, b: 0 });
      // bottom-right should now be top-right (blue)
      expect(getPixelColor(resultVertical, 990, 990)).toEqual({ r: 0, g: 255, b: 0 });
    });
  });

  describe('edit (multiple sequential edits)', () => {
    it('should apply horizontal mirror then vertical mirror (equivalent to 180° rotation)', async () => {
      const imageBuffer = buildTestQuadImage();
      const result = await applyEdits(imageBuffer, [
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      ]);
      expect(result.width).toBe(1000);
      expect(result.height).toBe(1000);

      expect(getPixelColor(result, 10, 10)).toEqual({ r: 255, g: 255, b: 0 });
      expect(getPixelColor(result, 990, 10)).toEqual({ r: 0, g: 0, b: 255 });
      expect(getPixelColor(result, 10, 990)).toEqual({ r: 0, g: 255, b: 0 });
      expect(getPixelColor(result, 990, 990)).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should apply rotate 90° then horizontal mirror', async () => {
      const imageBuffer = buildTestQuadImage();
      const result = await applyEdits(imageBuffer, [
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      ]);
      expect(result.width).toBe(1000);
      expect(result.height).toBe(1000);

      expect(getPixelColor(result, 10, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(getPixelColor(result, 990, 10)).toEqual({ r: 0, g: 0, b: 255 });
      expect(getPixelColor(result, 10, 990)).toEqual({ r: 0, g: 255, b: 0 });
      expect(getPixelColor(result, 990, 990)).toEqual({ r: 255, g: 255, b: 0 });
    });

    it('should apply 180° rotation', async () => {
      const imageBuffer = buildTestQuadImage();
      const result = await applyEdits(imageBuffer, [{ action: AssetEditAction.Rotate, parameters: { angle: 180 } }]);
      expect(result.width).toBe(1000);
      expect(result.height).toBe(1000);

      expect(getPixelColor(result, 10, 10)).toEqual({ r: 255, g: 255, b: 0 });
      expect(getPixelColor(result, 990, 10)).toEqual({ r: 0, g: 0, b: 255 });
      expect(getPixelColor(result, 10, 990)).toEqual({ r: 0, g: 255, b: 0 });
      expect(getPixelColor(result, 990, 990)).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should apply 270° rotations', async () => {
      const imageBuffer = buildTestQuadImage();
      const result = await applyEdits(imageBuffer, [{ action: AssetEditAction.Rotate, parameters: { angle: 270 } }]);
      expect(result.width).toBe(1000);
      expect(result.height).toBe(1000);

      expect(getPixelColor(result, 10, 10)).toEqual({ r: 0, g: 255, b: 0 });
      expect(getPixelColor(result, 990, 10)).toEqual({ r: 255, g: 255, b: 0 });
      expect(getPixelColor(result, 10, 990)).toEqual({ r: 255, g: 0, b: 0 });
      expect(getPixelColor(result, 990, 990)).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should apply crop then rotate 90°', async () => {
      const imageBuffer = buildTestQuadImage();
      const result = await applyEdits(imageBuffer, [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 1000, height: 500 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ]);
      expect(result.width).toBe(500);
      expect(result.height).toBe(1000);

      expect(getPixelColor(result, 10, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(getPixelColor(result, 10, 990)).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should apply rotate 90° then crop', async () => {
      const imageBuffer = buildTestQuadImage();
      const result = await applyEdits(imageBuffer, [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 500, height: 1000 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ]);
      expect(result.width).toBe(1000);
      expect(result.height).toBe(500);

      expect(getPixelColor(result, 10, 10)).toEqual({ r: 0, g: 0, b: 255 });
      expect(getPixelColor(result, 990, 10)).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should apply vertical mirror then horizontal mirror then rotate 90°', async () => {
      const imageBuffer = buildTestQuadImage();
      const result = await applyEdits(imageBuffer, [
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ]);
      expect(result.width).toBe(1000);
      expect(result.height).toBe(1000);

      expect(getPixelColor(result, 10, 10)).toEqual({ r: 0, g: 255, b: 0 });
      expect(getPixelColor(result, 990, 10)).toEqual({ r: 255, g: 255, b: 0 });
      expect(getPixelColor(result, 10, 990)).toEqual({ r: 255, g: 0, b: 0 });
      expect(getPixelColor(result, 990, 990)).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should apply crop to single quadrant then mirror', async () => {
      const imageBuffer = buildTestQuadImage();
      const result = await applyEdits(imageBuffer, [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 500, height: 500 } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      ]);
      expect(result.width).toBe(500);
      expect(result.height).toBe(500);

      expect(getPixelColor(result, 10, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(getPixelColor(result, 490, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(getPixelColor(result, 10, 490)).toEqual({ r: 255, g: 0, b: 0 });
      expect(getPixelColor(result, 490, 490)).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should apply all operations: crop, rotate, mirror', async () => {
      const imageBuffer = buildTestQuadImage();
      const result = await applyEdits(imageBuffer, [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 500, height: 1000 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      ]);
      expect(result.width).toBe(1000);
      expect(result.height).toBe(500);

      expect(getPixelColor(result, 10, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(getPixelColor(result, 990, 10)).toEqual({ r: 0, g: 0, b: 255 });
    });
  });

  describe('probe', () => {
    it.each([
      { formatLongName: 'QuickTime / MOV', nbFrames: 'N/A', isFragmented: true },
      { formatLongName: 'QuickTime / MOV', nbFrames: '557', isFragmented: false },
      { formatLongName: 'Matroska / WebM', nbFrames: 'N/A', isFragmented: false },
    ])('should detect fragmentation for $formatLongName with $nbFrames frames', async (testCase) => {
      const data = {
        format: { format_name: 'test', format_long_name: testCase.formatLongName },
        streams: [{ index: 0, codec_type: 'video', codec_name: 'h264', nb_frames: testCase.nbFrames }],
      } as FfprobeData;
      vi.spyOn(ffmpeg, 'ffprobe').mockImplementation((...args: unknown[]) =>
        (args.at(-1) as (error: null, data: FfprobeData) => void)(null, data),
      );

      const { format } = await sut.probe('/path/to/video');

      expect(format.isFragmented).toBe(testCase.isFragmented);
    });
  });

  describe('generateThumbnail', () => {
    it('should process random Authentik thumbnail image', async () => {
      const response = await fetch(
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCA2NCA2NCIgdmVyc2lvbj0iMS4xIj48cmVjdCBmaWxsPSIjMzc3YjM3IiBjeD0iMzIiIGN5PSIzMiIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByPSIzMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBzdHlsZT0iY29sb3I6ICNmZmY7IGxpbmUtaGVpZ2h0OiAxOyBmb250LWZhbWlseTogJ1JlZEhhdFRleHQnLCdPdmVycGFzcycsb3ZlcnBhc3MsaGVsdmV0aWNhLGFyaWFsLHNhbnMtc2VyaWY7ICIgZmlsbD0iI2ZmZiIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjgiIGZvbnQtd2VpZ2h0PSI0MDAiIGR5PSIuMWVtIj5BQTwvdGV4dD48L3N2Zz4=',
      );
      const buffer = Buffer.from(await response.arrayBuffer());
      const dir = mkdtempDisposableSync(join(tmpdir(), 'media-repository-'));
      const file = join(dir.path, 'test.webp');
      using decoded = await sut.decodeImage(buffer, { profile: Colorspace.P3, strict: true });
      await sut.generateThumbnail(
        decoded,
        {
          quality: 80,
          format: ImageFormat.Webp,
          effort: ImageEffort.Medium,
          progressive: false,
          decodingTier: 0,
        },
        file,
      );

      expect(statSync(file).blksize).toBeGreaterThan(0);
    });
  });
});
