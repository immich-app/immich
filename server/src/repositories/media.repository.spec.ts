import { mkdtempDisposableSync, statSync } from 'node:fs';
import fs, { chmod, mkdtemp, readFile, rm, truncate, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { Mocked, vitest } from 'vitest';
import { defaults } from 'src/dtos/config.dto.js';
import { AssetEditAction, MirrorAxis } from 'src/dtos/editing.dto.js';
import { Colorspace, ImageFormat } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { DevelopImageOptions, MediaRepository } from 'src/repositories/media.repository.js';
import { automock } from 'test/utils.js';

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

const buildLookupTablePacket = (data: string) =>
  `<xmp xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" crs:Table_1="${data}"/>`;

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
        { colorspace: Colorspace.P3, quality: 80, format: ImageFormat.Webp, processInvalidImages: false },
        file,
      );

      expect(statSync(file).blksize).toBeGreaterThan(0);
    });
  });
});

describe('MediaRepository sidecar renderer', () => {
  let directory: string;
  let script: string;
  let options: DevelopImageOptions & { sidecarPath: string };
  let sut: MediaRepository;
  let logger: Mocked<LoggingRepository>;

  const fake = async (mode = 'developed', version = 'renderer-build-a') => {
    await writeFile(join(directory, 'response.json'), JSON.stringify({ mode, version }));
  };

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'immich-sidecar-protocol-'));
    script = join(directory, 'renderer.cjs');
    options = {
      originalPath: join(directory, 'original with spaces;$(literal).nef'),
      sidecarPath: join(directory, 'original sidecar.xmp'),
      colorspace: Colorspace.Srgb,
      size: 1440,
    };
    await writeFile(options.originalPath, 'original fixture');
    await writeFile(options.sidecarPath, '<xmp exposure="1"/>');
    await writeFile(
      script,
      String.raw`#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const directory = __dirname;
const { mode, version } = JSON.parse(fs.readFileSync(path.join(directory, 'response.json'), 'utf8'));
fs.appendFileSync(path.join(directory, 'calls.jsonl'), JSON.stringify(process.argv.slice(2)) + '\n');
if (process.argv[2] === '--version') { process.stdout.write(version + '\n'); }
else if (mode === 'failed') { process.stderr.write('source decode failed'); process.exitCode = 3; }
else if (mode === 'empty') {}
else if (mode === 'bad-json') { process.stdout.write('{invalid\n'); }
else if (mode === 'oversized-header') { process.stdout.write('x'.repeat(65537)); }
else {
  const header = mode === 'skipped' || mode === 'skipped-extra' || mode === 'unsupported-only'
    ? { version: 1, rendererVersion: version, status: 'skipped', reason: 'no-applicable-development', unmapped: mode === 'unsupported-only' ? ['CameraProfile'] : undefined }
    : { version: mode === 'bad-version' ? 2 : 1, rendererVersion: version, status: 'developed',
        width: mode === 'oversized-image' ? 20000 : 2, height: mode === 'oversized-image' ? 20000 : 1,
        nativeWidth: 6000, nativeHeight: 4000, channels: 4,
        colorspace: mode === 'wrong-colorspace' ? 'p3' : 'srgb',
        isDeveloped: mode === 'raw-default' ? false : mode === 'raw-developed' ? true : mode === 'bad-state' ? 'true' : undefined,
        unmapped: ['CameraProfile'] };
  const json = JSON.stringify(header) + '\n';
  process.stdout.write(json.slice(0, 11));
  setTimeout(() => {
    process.stdout.write(json.slice(11));
    if (mode === 'skipped-extra') process.stdout.write(Buffer.from([1]));
    else if (header.status === 'developed') process.stdout.write(Buffer.from([10,20,30,255,40,50,60,255]).subarray(0, mode === 'truncated' ? 3 : 8));
    if (mode === 'excess') process.stdout.write(Buffer.from([1]));
  }, 5);
}
`,
    );
    await chmod(script, 0o755);
    await fake();
    vitest.stubEnv('IMMICH_SIDECAR_RENDERER', script);
    logger = automock(LoggingRepository, { strict: false });
    sut = new MediaRepository(logger);
  });

  afterEach(async () => {
    vitest.unstubAllEnvs();
    await rm(directory, { recursive: true, force: true });
  });

  it('reads a chunked frame and passes file paths and short-edge size as literal arguments', async () => {
    const developed = await sut.developImage(options);
    expect(developed).toEqual({
      data: Buffer.from([10, 20, 30, 255, 40, 50, 60, 255]),
      info: { width: 2, height: 1, channels: 4 },
      colorspace: Colorspace.Srgb,
      nativeDimensions: { width: 6000, height: 4000 },
      isDeveloped: true,
    });
    const calls = await readFile(join(directory, 'calls.jsonl'), 'utf8');
    expect(JSON.parse(calls.trim())).toEqual([
      '--original',
      options.originalPath,
      '--sidecar',
      options.sidecarPath,
      '--colorspace',
      'srgb',
      '--size',
      '1440',
    ]);
    expect(logger.warn).toHaveBeenCalledWith('Sidecar settings not reproduced: CameraProfile');
  });

  it('omits size when native output is requested', async () => {
    await sut.developImage({ ...options, size: undefined });
    const calls = await readFile(join(directory, 'calls.jsonl'), 'utf8');
    expect(calls.includes('--size')).toBe(false);
  });

  it.each([
    ['raw-default', false],
    ['raw-developed', true],
  ])('renders RAW without an external sidecar and reports %s state', async (mode, isDeveloped) => {
    await fake(mode as string);

    await expect(sut.developImage({ ...options, sidecarPath: undefined })).resolves.toMatchObject({
      isDeveloped,
      nativeDimensions: { width: 6000, height: 4000 },
    });

    const calls = await readFile(join(directory, 'calls.jsonl'), 'utf8');
    expect(JSON.parse(calls.trim())).toEqual([
      '--original',
      options.originalPath,
      '--colorspace',
      'srgb',
      '--size',
      '1440',
    ]);
  });

  it.each([
    ['skipped', 'did not return a bitmap'],
    ['developed', 'did not report its development state'],
  ])('rejects incomplete ordinary RAW protocol responses (%s)', async (mode, error) => {
    await fake(mode);
    await expect(sut.developImage({ ...options, sidecarPath: undefined })).rejects.toThrow(error);
  });

  it('returns null for a metadata-only skipped packet', async () => {
    await fake('skipped');
    await expect(sut.developImage(options)).resolves.toBeNull();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns null for unsupported-only adjustments and reports them', async () => {
    await fake('unsupported-only');
    await expect(sut.developImage(options)).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith('Sidecar settings not reproduced: CameraProfile');
  });

  it.each([
    ['failed', 'source decode failed'],
    ['empty', 'no metadata'],
    ['truncated', 'incomplete pixel data'],
    ['excess', 'excess pixel data'],
    ['skipped-extra', 'excess pixel data'],
    ['oversized-header', 'metadata exceeds 64 KiB'],
    ['oversized-image', 'output exceeds the supported image size'],
    ['wrong-colorspace', 'wrong output colorspace'],
  ])('rejects %s without returning a usable bitmap', async (mode, error) => {
    await fake(mode);
    await expect(sut.developImage(options)).rejects.toThrow(error);
  });

  it.each(['bad-json', 'bad-version', 'bad-state'])('rejects invalid protocol metadata (%s)', async (mode) => {
    await fake(mode);
    await expect(sut.developImage(options)).rejects.toThrow();
  });

  const fingerprint = () => sut.getDevelopmentInputFingerprint({ ...options, image: defaults.image });

  it('hashes XMP content even when its path, size and modification time stay unchanged', async () => {
    const date = new Date('2026-01-01T00:00:00Z');
    await utimes(options.sidecarPath, date, date);
    const before = await fingerprint();
    await writeFile(options.sidecarPath, '<xmp exposure="2"/>');
    await utimes(options.sidecarPath, date, date);
    expect(await fingerprint()).not.toBe(before);
  });

  it('invalidates when the original changes', async () => {
    const before = await fingerprint();
    await writeFile(options.originalPath, 'new longer original fixture');
    expect(await fingerprint()).not.toBe(before);
  });

  it('invalidates native RAW inputs when embedded metadata changes the original modification time', async () => {
    const input = { ...options, sidecarPath: null, image: defaults.image };
    const beforeDate = new Date('2026-01-01T00:00:00Z');
    const afterDate = new Date('2026-01-02T00:00:00Z');
    await utimes(options.originalPath, beforeDate, beforeDate);
    const before = await sut.getDevelopmentInputFingerprint(input);
    await writeFile(options.originalPath, 'metadata fixture');
    await utimes(options.originalPath, afterDate, afterDate);

    expect(await sut.getDevelopmentInputFingerprint(input)).not.toBe(before);
  });

  it('invalidates when output configuration changes', async () => {
    const before = await fingerprint();
    const changed = await sut.getDevelopmentInputFingerprint({
      ...options,
      image: { ...defaults.image, preview: { ...defaults.image.preview, quality: defaults.image.preview.quality - 1 } },
    });
    expect(changed).not.toBe(before);
  });

  it('includes the renderer build version and caches the version lookup per server process', async () => {
    const first = await fingerprint();
    expect(await fingerprint()).toBe(first);
    const log = await readFile(join(directory, 'calls.jsonl'), 'utf8');
    const calls = log
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(calls).toEqual([['--version']]);
    await fake('developed', 'renderer-build-b');
    sut = new MediaRepository(logger);
    expect(await fingerprint()).not.toBe(first);
  });

  it('fingerprints Lightroom lookup tables in packets larger than 4 MiB', async () => {
    const table = 'A'.repeat(5 * 1024 * 1024);
    await writeFile(options.sidecarPath, buildLookupTablePacket(table));
    const before = await fingerprint();
    await writeFile(options.sidecarPath, buildLookupTablePacket(`${table.slice(0, -1)}B`));
    expect(await fingerprint()).not.toBe(before);
  });

  it('distinguishes sidecar removal and rejects XMP larger than 128 MiB', async () => {
    const before = await fingerprint();
    const removed = await sut.getDevelopmentInputFingerprint({ ...options, sidecarPath: null, image: defaults.image });
    expect(removed).not.toBe(before);
    await truncate(options.sidecarPath, 128 * 1024 * 1024 + 1);
    await expect(fingerprint()).rejects.toThrow('XMP packet exceeds 128 MiB');
  });

  it('rejects an XMP that grows beyond the bound after its initial size check', async () => {
    const open = fs.open.bind(fs);
    const spy = vitest.spyOn(fs, 'open').mockImplementation(async (...args) => {
      const file = await open(...args);
      const initial = await file.stat();
      vitest.spyOn(file, 'stat').mockResolvedValue(initial);
      await truncate(options.sidecarPath, 128 * 1024 * 1024 + 1);
      return file;
    });
    try {
      await expect(fingerprint()).rejects.toThrow('XMP packet exceeds 128 MiB');
    } finally {
      spy.mockRestore();
    }
  });
});
