import { execFile } from 'node:child_process';
import { mkdtempDisposableSync, statSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';
import type { TranscodeCommand } from 'src/types.js';
import { AssetEditAction, MirrorAxis } from 'src/dtos/editing.dto.js';
import { Colorspace, ImageFormat } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MediaRepository } from 'src/repositories/media.repository.js';
import { automock } from 'test/utils.js';

const spyOnThumbnailTranscode = (repository: MediaRepository) =>
  vi.spyOn(
    repository as unknown as {
      transcodeThumbnailOnce(input: string, output: string, options: TranscodeCommand): Promise<boolean>;
    },
    'transcodeThumbnailOnce',
  );

const thumbnailCommand = (): TranscodeCommand => ({
  inputOptions: ['-skip_frame', 'nointra', '-sws_flags', 'accurate_rnd+full_chroma_int'],
  outputOptions: ['-frames:v', '1'],
  twoPass: false,
  progress: { frameCount: 6, percentInterval: 5 },
});

const getPixelColor = async (buffer: Buffer, x: number, y: number) => {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width!;
  const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
  };
};

const buildTestQuadImage = async () => {
  // build a 4 quadrant image for testing mirroring
  const base = sharp({
    create: { width: 1000, height: 1000, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).png();

  const tl = await sharp({
    create: { width: 500, height: 500, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();

  const tr = await sharp({
    create: { width: 500, height: 500, channels: 3, background: { r: 0, g: 255, b: 0 } },
  })
    .png()
    .toBuffer();

  const bl = await sharp({
    create: { width: 500, height: 500, channels: 3, background: { r: 0, g: 0, b: 255 } },
  })
    .png()
    .toBuffer();

  const br = await sharp({
    create: { width: 500, height: 500, channels: 3, background: { r: 255, g: 255, b: 0 } },
  })
    .png()
    .toBuffer();

  const image = base.composite([
    { input: tl, left: 0, top: 0 }, // top-left
    { input: tr, left: 500, top: 0 }, // top-right
    { input: bl, left: 0, top: 500 }, // bottom-left
    { input: br, left: 500, top: 500 }, // bottom-right
  ]);

  return image.png().toBuffer();
};

describe(MediaRepository.name, () => {
  let sut: MediaRepository;

  beforeEach(() => {
    // eslint-disable-next-line no-sparse-arrays
    sut = new MediaRepository(automock(LoggingRepository, { args: [, { getEnv: () => ({}) }], strict: false }));
  });

  describe('edit (single actions)', () => {
    it('should apply crop edit correctly', async () => {
      const result = sut['edit'](
        sharp({
          create: {
            width: 1000,
            height: 1000,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 },
          },
        }).png(),
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

      const metadata = await result.toBuffer().then((buf) => sharp(buf).metadata());
      expect(metadata.width).toBe(700);
      expect(metadata.height).toBe(300);
    });
    it('should apply rotate edit correctly', async () => {
      const result = sut['edit'](
        sharp({
          create: {
            width: 500,
            height: 1000,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 },
          },
        }).png(),
        [
          {
            action: AssetEditAction.Rotate,
            parameters: {
              angle: 90,
            },
          },
        ],
      );

      const metadata = await result.toBuffer().then((buf) => sharp(buf).metadata());
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(500);
    });

    it('should apply mirror edit correctly', async () => {
      const resultHorizontal = sut['edit'](sharp(await buildTestQuadImage()), [
        {
          action: AssetEditAction.Mirror,
          parameters: {
            axis: MirrorAxis.Horizontal,
          },
        },
      ]);

      const bufferHorizontal = await resultHorizontal.toBuffer();
      const metadataHorizontal = await resultHorizontal.metadata();
      expect(metadataHorizontal.width).toBe(1000);
      expect(metadataHorizontal.height).toBe(1000);

      expect(await getPixelColor(bufferHorizontal, 10, 10)).toEqual({ r: 0, g: 255, b: 0 });
      expect(await getPixelColor(bufferHorizontal, 990, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(await getPixelColor(bufferHorizontal, 10, 990)).toEqual({ r: 255, g: 255, b: 0 });
      expect(await getPixelColor(bufferHorizontal, 990, 990)).toEqual({ r: 0, g: 0, b: 255 });

      const resultVertical = sut['edit'](sharp(await buildTestQuadImage()), [
        {
          action: AssetEditAction.Mirror,
          parameters: {
            axis: MirrorAxis.Vertical,
          },
        },
      ]);

      const bufferVertical = await resultVertical.toBuffer();
      const metadataVertical = await resultVertical.metadata();
      expect(metadataVertical.width).toBe(1000);
      expect(metadataVertical.height).toBe(1000);

      // top-left should now be bottom-left (blue)
      expect(await getPixelColor(bufferVertical, 10, 10)).toEqual({ r: 0, g: 0, b: 255 });
      // top-right should now be bottom-right (yellow)
      expect(await getPixelColor(bufferVertical, 990, 10)).toEqual({ r: 255, g: 255, b: 0 });
      // bottom-left should now be top-left (red)
      expect(await getPixelColor(bufferVertical, 10, 990)).toEqual({ r: 255, g: 0, b: 0 });
      // bottom-right should now be top-right (blue)
      expect(await getPixelColor(bufferVertical, 990, 990)).toEqual({ r: 0, g: 255, b: 0 });
    });
  });

  describe('edit (multiple sequential edits)', () => {
    it('should apply horizontal mirror then vertical mirror (equivalent to 180° rotation)', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = sut['edit'](sharp(imageBuffer), [
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);

      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 255, g: 255, b: 0 });
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 0, g: 0, b: 255 });
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 0, g: 255, b: 0 });
      expect(await getPixelColor(buffer, 990, 990)).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should apply rotate 90° then horizontal mirror', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = sut['edit'](sharp(imageBuffer), [
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);

      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 0, g: 0, b: 255 });
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 0, g: 255, b: 0 });
      expect(await getPixelColor(buffer, 990, 990)).toEqual({ r: 255, g: 255, b: 0 });
    });

    it('should apply 180° rotation', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = sut['edit'](sharp(imageBuffer), [{ action: AssetEditAction.Rotate, parameters: { angle: 180 } }]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);

      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 255, g: 255, b: 0 });
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 0, g: 0, b: 255 });
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 0, g: 255, b: 0 });
      expect(await getPixelColor(buffer, 990, 990)).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should apply 270° rotations', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = sut['edit'](sharp(imageBuffer), [{ action: AssetEditAction.Rotate, parameters: { angle: 270 } }]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);

      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 0, g: 255, b: 0 });
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 255, g: 255, b: 0 });
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 255, g: 0, b: 0 });
      expect(await getPixelColor(buffer, 990, 990)).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should apply crop then rotate 90°', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = sut['edit'](sharp(imageBuffer), [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 1000, height: 500 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(500);
      expect(metadata.height).toBe(1000);

      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should apply rotate 90° then crop', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = sut['edit'](sharp(imageBuffer), [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 500, height: 1000 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(500);

      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 0, g: 0, b: 255 });
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should apply vertical mirror then horizontal mirror then rotate 90°', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = sut['edit'](sharp(imageBuffer), [
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Vertical } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);

      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 0, g: 255, b: 0 });
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 255, g: 255, b: 0 });
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 255, g: 0, b: 0 });
      expect(await getPixelColor(buffer, 990, 990)).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should apply crop to single quadrant then mirror', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = sut['edit'](sharp(imageBuffer), [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 500, height: 500 } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(500);
      expect(metadata.height).toBe(500);

      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(await getPixelColor(buffer, 490, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(await getPixelColor(buffer, 10, 490)).toEqual({ r: 255, g: 0, b: 0 });
      expect(await getPixelColor(buffer, 490, 490)).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should apply all operations: crop, rotate, mirror', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = sut['edit'](sharp(imageBuffer), [
        { action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 500, height: 1000 } },
        { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
        { action: AssetEditAction.Mirror, parameters: { axis: MirrorAxis.Horizontal } },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(500);

      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 255, g: 0, b: 0 });
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 0, g: 0, b: 255 });
    });
  });

  describe('transcodeThumbnail', () => {
    it.each(['jpeg', 'webp'])(
      'should extract a %s thumbnail when the visible frames are not intra frames',
      async (format) => {
        using directory = mkdtempDisposableSync(join(tmpdir(), 'media-thumbnail-'));
        const source = join(directory.path, 'synthetic.mp4');
        const trimmed = join(directory.path, 'trimmed.mp4');
        const output = join(directory.path, `thumbnail.${format}`);
        const run = promisify(execFile);
        await run('ffmpeg', [
          '-v',
          'error',
          '-f',
          'lavfi',
          '-i',
          'color=c=red:s=64x64:r=30:d=2',
          '-c:v',
          'libx264',
          '-g',
          '60',
          '-keyint_min',
          '60',
          '-sc_threshold',
          '0',
          '-bf',
          '0',
          '-pix_fmt',
          'yuv420p',
          source,
        ]);
        await run('ffmpeg', ['-v', 'error', '-ss', '0.2', '-i', source, '-t', '0.2', '-c', 'copy', trimmed]);
        const transcode = spyOnThumbnailTranscode(sut);

        await sut.transcodeThumbnail(trimmed, output, {
          ...thumbnailCommand(),
          outputOptions: [
            '-vf',
            'fps=12:start_time=0:eof_action=pass:round=down,thumbnail=12,trim=end_frame=1',
            '-frames:v',
            '1',
            '-update',
            '1',
            '-pix_fmt',
            'yuvj420p',
          ],
        });

        expect(transcode).toHaveBeenCalledTimes(2);
        expect(await sharp(output).metadata()).toEqual(expect.objectContaining({ format, width: 64, height: 64 }));
        expect(await sharp(output).resize(1, 1).raw().toBuffer()).toHaveLength(3);
      },
    );

    it('should publish a nonempty thumbnail without retrying', async () => {
      using directory = mkdtempDisposableSync(join(tmpdir(), 'media-thumbnail-'));
      const output = join(directory.path, 'preview.jpeg');
      const transcode = spyOnThumbnailTranscode(sut).mockImplementation(async (_, temporary) => {
        await writeFile(temporary, 'thumbnail');
        return true;
      });

      await sut.transcodeThumbnail('video.mp4', output, thumbnailCommand());

      expect(await readFile(output, 'utf8')).toBe('thumbnail');
      expect(transcode).toHaveBeenCalledOnce();
      expect(await readdir(directory.path)).toEqual(['preview.jpeg']);
    });

    it.each([false, true])('should retry a missing or empty output (empty file: %s)', async (emptyFile) => {
      using directory = mkdtempDisposableSync(join(tmpdir(), 'media-thumbnail-'));
      const output = join(directory.path, 'thumbnail.webp');
      await writeFile(output, 'old thumbnail');
      const options = thumbnailCommand();
      const originalOptions = structuredClone(options);
      const transcode = spyOnThumbnailTranscode(sut)
        .mockImplementationOnce(async (_, temporary) => {
          if (emptyFile) {
            await writeFile(temporary, '');
          }
          return true;
        })
        .mockImplementationOnce(async (_, temporary) => {
          expect(await readFile(output, 'utf8')).toBe('old thumbnail');
          await writeFile(temporary, 'new thumbnail');
          return true;
        });

      await sut.transcodeThumbnail('video.mp4', output, options);

      expect(transcode).toHaveBeenCalledTimes(2);
      expect(transcode).toHaveBeenLastCalledWith('video.mp4', expect.any(String), {
        ...options,
        inputOptions: ['-sws_flags', 'accurate_rnd+full_chroma_int'],
      });
      expect(options).toEqual(originalOptions);
      expect(await readFile(output, 'utf8')).toBe('new thumbnail');
      expect(await readdir(directory.path)).toEqual(['thumbnail.webp']);
    });

    it('should preserve the old thumbnail if both attempts produce no frames', async () => {
      using directory = mkdtempDisposableSync(join(tmpdir(), 'media-thumbnail-'));
      const output = join(directory.path, 'preview.jpeg');
      await writeFile(output, 'old thumbnail');
      const transcode = spyOnThumbnailTranscode(sut).mockResolvedValue(true);

      await expect(sut.transcodeThumbnail('video.mp4', output, thumbnailCommand())).rejects.toThrow(
        'Video thumbnail extraction produced no frames',
      );

      expect(transcode).toHaveBeenCalledTimes(2);
      expect(await readFile(output, 'utf8')).toBe('old thumbnail');
      expect(await readdir(directory.path)).toEqual(['preview.jpeg']);
    });

    it('should not retry empty output when frame skipping is already disabled', async () => {
      using directory = mkdtempDisposableSync(join(tmpdir(), 'media-thumbnail-'));
      const output = join(directory.path, 'preview.jpeg');
      const transcode = spyOnThumbnailTranscode(sut).mockResolvedValue(true);

      await expect(
        sut.transcodeThumbnail('video.mts', output, { ...thumbnailCommand(), inputOptions: [] }),
      ).rejects.toThrow('Video thumbnail extraction produced no frames');

      expect(transcode).toHaveBeenCalledOnce();
      expect(await readdir(directory.path)).toEqual([]);
    });

    it('should not publish partial output from a failed attempt when the retry produces no frames', async () => {
      using directory = mkdtempDisposableSync(join(tmpdir(), 'media-thumbnail-'));
      const output = join(directory.path, 'thumbnail.webp');
      await writeFile(output, 'old thumbnail');
      const transcode = spyOnThumbnailTranscode(sut)
        .mockImplementationOnce(async (_, temporary) => {
          await writeFile(temporary, 'partial thumbnail');
          return false;
        })
        .mockResolvedValueOnce(true);

      await expect(sut.transcodeThumbnail('video.mp4', output, thumbnailCommand())).rejects.toThrow(
        'Video thumbnail extraction produced no frames',
      );

      expect(transcode).toHaveBeenCalledTimes(2);
      expect(await readFile(output, 'utf8')).toBe('old thumbnail');
      expect(await readdir(directory.path)).toEqual(['thumbnail.webp']);
    });

    it('should propagate transcoding errors without replacing an existing thumbnail', async () => {
      using directory = mkdtempDisposableSync(join(tmpdir(), 'media-thumbnail-'));
      const output = join(directory.path, 'preview.jpeg');
      await writeFile(output, 'old thumbnail');
      const error = new Error('FFmpeg failed');
      const transcode = spyOnThumbnailTranscode(sut).mockRejectedValue(error);

      await expect(sut.transcodeThumbnail('video.mp4', output, thumbnailCommand())).rejects.toBe(error);

      expect(transcode).toHaveBeenCalledOnce();
      expect(await readFile(output, 'utf8')).toBe('old thumbnail');
      expect(await readdir(directory.path)).toEqual(['preview.jpeg']);
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
      const decoded = await sut.decodeImage(buffer, { colorspace: Colorspace.P3, processInvalidImages: false });
      await sut.generateThumbnail(
        decoded,
        {
          colorspace: Colorspace.P3,
          quality: 80,
          format: ImageFormat.Webp,
          processInvalidImages: false,
          decodingTier: 0,
        },
        file,
      );

      expect(statSync(file).blksize).toBeGreaterThan(0);
    });
  });
});
