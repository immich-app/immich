import sharp from 'sharp';
import { EditActionType, MirrorAxis } from 'src/dtos/editing.dto';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MediaRepository } from 'src/repositories/media.repository';
import { automock } from 'test/utils';

const getPixelColor = async (buffer: Buffer, x: number, y: number) => {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width!;
  const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
    a: data[idx + 3],
  };
};

const buildTestQuadImage = async () => {
  // build a 4 quadrant image for testing mirroring
  const base = sharp({
    create: { width: 1000, height: 1000, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png();

  const tl = await sharp({
    create: { width: 500, height: 500, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
  })
    .png()
    .toBuffer();

  const tr = await sharp({
    create: { width: 500, height: 500, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } },
  })
    .png()
    .toBuffer();

  const bl = await sharp({
    create: { width: 500, height: 500, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 1 } },
  })
    .png()
    .toBuffer();

  const br = await sharp({
    create: { width: 500, height: 500, channels: 4, background: { r: 255, g: 255, b: 0, alpha: 1 } },
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

  describe('applyEdit', () => {
    it('should apply crop edit correctly', async () => {
      const result = sut['applyEdit'](
        sharp({
          create: {
            width: 1000,
            height: 1000,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 },
          },
        }).png(),
        {
          action: EditActionType.Crop,
          parameters: {
            x: 100,
            y: 200,
            width: 700,
            height: 300,
          },
          index: 0,
        },
      );

      const metadata = await result.toBuffer().then((buf) => sharp(buf).metadata());
      expect(metadata.width).toBe(700);
      expect(metadata.height).toBe(300);
    });
    it('should apply rotate edit correctly', async () => {
      const result = sut['applyEdit'](
        sharp({
          create: {
            width: 500,
            height: 1000,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 },
          },
        }).png(),
        {
          action: EditActionType.Rotate,
          parameters: {
            angle: 90,
          },
          index: 0,
        },
      );

      const metadata = await result.toBuffer().then((buf) => sharp(buf).metadata());
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(500);
    });

    it('should apply mirror edit correctly', async () => {
      const resultHorizontal = sut['applyEdit'](sharp(await buildTestQuadImage()), {
        action: EditActionType.Mirror,
        parameters: {
          axis: MirrorAxis.Horizontal,
        },
        index: 0,
      });

      const bufferHorizontal = await resultHorizontal.toBuffer();
      const metadataHorizontal = await resultHorizontal.metadata();
      expect(metadataHorizontal.width).toBe(1000);
      expect(metadataHorizontal.height).toBe(1000);

      // top-left should now be top-right (green)
      expect(await getPixelColor(bufferHorizontal, 10, 10)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
      // top-right should now be top-left (red)
      expect(await getPixelColor(bufferHorizontal, 990, 10)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      // bottom-left should now be bottom-right (yellow)
      expect(await getPixelColor(bufferHorizontal, 10, 990)).toEqual({ r: 255, g: 255, b: 0, a: 255 });
      // bottom-right should now be bottom-left (blue)
      expect(await getPixelColor(bufferHorizontal, 990, 990)).toEqual({ r: 0, g: 0, b: 255, a: 255 });

      const resultVertical = sut['applyEdit'](sharp(await buildTestQuadImage()), {
        action: EditActionType.Mirror,
        parameters: {
          axis: MirrorAxis.Vertical,
        },
        index: 0,
      });

      const bufferVertical = await resultVertical.toBuffer();
      const metadataVertical = await resultVertical.metadata();
      expect(metadataVertical.width).toBe(1000);
      expect(metadataVertical.height).toBe(1000);

      // top-left should now be bottom-left (blue)
      expect(await getPixelColor(bufferVertical, 10, 10)).toEqual({ r: 0, g: 0, b: 255, a: 255 });
      // top-right should now be bottom-right (yellow)
      expect(await getPixelColor(bufferVertical, 990, 10)).toEqual({ r: 255, g: 255, b: 0, a: 255 });
      // bottom-left should now be top-left (red)
      expect(await getPixelColor(bufferVertical, 10, 990)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      // bottom-right should now be top-right (blue)
      expect(await getPixelColor(bufferVertical, 990, 990)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
    });
  });

  describe('applyEdits (multiple sequential edits)', () => {
    it('should apply horizontal mirror then vertical mirror (equivalent to 180° rotation)', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = await sut['applyEdits'](sharp(imageBuffer), [
        { action: EditActionType.Mirror, parameters: { axis: MirrorAxis.Horizontal }, index: 0 },
        { action: EditActionType.Mirror, parameters: { axis: MirrorAxis.Vertical }, index: 1 },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);

      // After horizontal mirror: TL=Green, TR=Red, BL=Yellow, BR=Blue
      // After vertical mirror: TL=Yellow, TR=Blue, BL=Green, BR=Red
      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 255, g: 255, b: 0, a: 255 }); // Yellow (was BR)
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 0, g: 0, b: 255, a: 255 }); // Blue (was BL)
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 0, g: 255, b: 0, a: 255 }); // Green (was TR)
      expect(await getPixelColor(buffer, 990, 990)).toEqual({ r: 255, g: 0, b: 0, a: 255 }); // Red (was TL)
    });

    it('should apply rotate 90° then horizontal mirror', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = await sut['applyEdits'](sharp(imageBuffer), [
        { action: EditActionType.Rotate, parameters: { angle: 90 }, index: 0 },
        { action: EditActionType.Mirror, parameters: { axis: MirrorAxis.Horizontal }, index: 1 },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);

      // Original: TL=Red, TR=Green, BL=Blue, BR=Yellow
      // After 90° CW rotation: TL=Blue, TR=Red, BL=Yellow, BR=Green
      // After horizontal mirror: TL=Red, TR=Blue, BL=Green, BR=Yellow
      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 255, g: 0, b: 0, a: 255 }); // Red
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 0, g: 0, b: 255, a: 255 }); // Blue
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 0, g: 255, b: 0, a: 255 }); // Green
      expect(await getPixelColor(buffer, 990, 990)).toEqual({ r: 255, g: 255, b: 0, a: 255 }); // Yellow
    });

    it('should apply multiple 90° rotations (90° + 90° = 180°)', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = await sut['applyEdits'](sharp(imageBuffer), [
        { action: EditActionType.Rotate, parameters: { angle: 90 }, index: 0 },
        { action: EditActionType.Rotate, parameters: { angle: 90 }, index: 1 },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);

      // Original: TL=Red, TR=Green, BL=Blue, BR=Yellow
      // After 180° rotation: TL=Yellow, TR=Blue, BL=Green, BR=Red
      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 255, g: 255, b: 0, a: 255 }); // Yellow (was BR)
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 0, g: 0, b: 255, a: 255 }); // Blue (was BL)
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 0, g: 255, b: 0, a: 255 }); // Green (was TR)
      expect(await getPixelColor(buffer, 990, 990)).toEqual({ r: 255, g: 0, b: 0, a: 255 }); // Red (was TL)
    });

    it('should apply three 90° rotations (270° total)', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = await sut['applyEdits'](sharp(imageBuffer), [
        { action: EditActionType.Rotate, parameters: { angle: 90 }, index: 0 },
        { action: EditActionType.Rotate, parameters: { angle: 90 }, index: 1 },
        { action: EditActionType.Rotate, parameters: { angle: 90 }, index: 2 },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);

      // Original: TL=Red, TR=Green, BL=Blue, BR=Yellow
      // After 270° CW (or 90° CCW): TL=Green, TR=Yellow, BL=Red, BR=Blue
      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 0, g: 255, b: 0, a: 255 }); // Green (was TR)
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 255, g: 255, b: 0, a: 255 }); // Yellow (was BR)
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 255, g: 0, b: 0, a: 255 }); // Red (was TL)
      expect(await getPixelColor(buffer, 990, 990)).toEqual({ r: 0, g: 0, b: 255, a: 255 }); // Blue (was BL)
    });

    it('should apply crop then rotate 90°', async () => {
      const imageBuffer = await buildTestQuadImage();
      // Crop to keep only top half (TL=Red, TR=Green), result is 1000x500
      const result = await sut['applyEdits'](sharp(imageBuffer), [
        { action: EditActionType.Crop, parameters: { x: 0, y: 0, width: 1000, height: 500 }, index: 0 },
        { action: EditActionType.Rotate, parameters: { angle: 90 }, index: 1 },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      // After crop: 1000x500, after 90° rotation: 500x1000
      expect(metadata.width).toBe(500);
      expect(metadata.height).toBe(1000);

      // Before rotation (cropped top half): Left=Red, Right=Green
      // After 90° CW: Top=Red, Bottom=Green
      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 255, g: 0, b: 0, a: 255 }); // Red (top)
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 0, g: 255, b: 0, a: 255 }); // Green (bottom)
    });

    it('should apply rotate 90° then crop', async () => {
      const imageBuffer = await buildTestQuadImage();
      // After 90° rotation: TL=Blue, TR=Red, BL=Yellow, BR=Green
      // Then crop left half to keep only TL=Blue, BL=Yellow
      const result = await sut['applyEdits'](sharp(imageBuffer), [
        { action: EditActionType.Rotate, parameters: { angle: 90 }, index: 0 },
        { action: EditActionType.Crop, parameters: { x: 0, y: 0, width: 500, height: 1000 }, index: 1 },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(500);
      expect(metadata.height).toBe(1000);

      // Left half after rotation: TL=Blue, BL=Yellow
      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 0, g: 0, b: 255, a: 255 }); // Blue
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 255, g: 255, b: 0, a: 255 }); // Yellow
    });

    it('should apply vertical mirror then horizontal mirror then rotate 90°', async () => {
      const imageBuffer = await buildTestQuadImage();
      const result = await sut['applyEdits'](sharp(imageBuffer), [
        { action: EditActionType.Mirror, parameters: { axis: MirrorAxis.Vertical }, index: 0 },
        { action: EditActionType.Mirror, parameters: { axis: MirrorAxis.Horizontal }, index: 1 },
        { action: EditActionType.Rotate, parameters: { angle: 90 }, index: 2 },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);

      // Original: TL=Red, TR=Green, BL=Blue, BR=Yellow
      // After vertical mirror: TL=Blue, TR=Yellow, BL=Red, BR=Green
      // After horizontal mirror: TL=Yellow, TR=Blue, BL=Green, BR=Red
      // After 90° CW rotation: TL=Green, TR=Yellow, BL=Red, BR=Blue
      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 0, g: 255, b: 0, a: 255 }); // Green
      expect(await getPixelColor(buffer, 990, 10)).toEqual({ r: 255, g: 255, b: 0, a: 255 }); // Yellow
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 255, g: 0, b: 0, a: 255 }); // Red
      expect(await getPixelColor(buffer, 990, 990)).toEqual({ r: 0, g: 0, b: 255, a: 255 }); // Blue
    });

    it('should apply crop to single quadrant then mirror', async () => {
      const imageBuffer = await buildTestQuadImage();
      // Crop to top-left quadrant (Red only), then mirror shouldn't change color
      const result = await sut['applyEdits'](sharp(imageBuffer), [
        { action: EditActionType.Crop, parameters: { x: 0, y: 0, width: 500, height: 500 }, index: 0 },
        { action: EditActionType.Mirror, parameters: { axis: MirrorAxis.Horizontal }, index: 1 },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      expect(metadata.width).toBe(500);
      expect(metadata.height).toBe(500);

      // Entire cropped area should be red
      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      expect(await getPixelColor(buffer, 490, 10)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      expect(await getPixelColor(buffer, 10, 490)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      expect(await getPixelColor(buffer, 490, 490)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    });

    it('should apply four operations: crop, rotate, mirror, rotate', async () => {
      const imageBuffer = await buildTestQuadImage();
      // Crop to left half (TL=Red, BL=Blue), then rotate 90°, then mirror vertical, then rotate 90° again
      const result = await sut['applyEdits'](sharp(imageBuffer), [
        { action: EditActionType.Crop, parameters: { x: 0, y: 0, width: 500, height: 1000 }, index: 0 },
        { action: EditActionType.Rotate, parameters: { angle: 90 }, index: 1 },
        { action: EditActionType.Mirror, parameters: { axis: MirrorAxis.Vertical }, index: 2 },
        { action: EditActionType.Rotate, parameters: { angle: 90 }, index: 3 },
      ]);

      const buffer = await result.png().toBuffer();
      const metadata = await sharp(buffer).metadata();
      // Crop: 500xRotate 90°: 1000x500, Mirror: 1000x500, Rotate 90°: 500x1000
      expect(metadata.width).toBe(500);
      expect(metadata.height).toBe(1000);

      // After crop (left half): Top=Red, Bottom=Blue (500x1000)
      // After 90° CW: Left=Red, Right=Blue (1000x500)
      // After horizontal mirror: Left=Blue, Right=Red (1000x500)
      // After 90° CW: Top=Blue, Bottom=Red (500x1000)
      expect(await getPixelColor(buffer, 10, 10)).toEqual({ r: 0, g: 0, b: 255, a: 255 }); // Blue
      expect(await getPixelColor(buffer, 10, 990)).toEqual({ r: 255, g: 0, b: 0, a: 255 }); // Red
    });
  });
});
