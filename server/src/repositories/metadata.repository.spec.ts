import { randomUUID } from 'node:crypto';
import { copyFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { MetadataRepository } from 'src/repositories/metadata.repository.js';

describe('removing embedded JPEG motion videos', () => {
  const repository = new MetadataRepository({ setContext: vi.fn(), warn: vi.fn() } as unknown as LoggingRepository);

  afterAll(async () => repository.teardown());

  it.each(['pixel-6-pro.jpg', 'pixel-8a.jpg', 'samsung-one-ui-5.jpg', 'samsung-one-ui-6.jpg'])(
    'converts %s without changing the still dimensions',
    async (filename) => {
      const folder = await mkdtemp(join(tmpdir(), 'immich-still-'));
      const path = join(folder, `${randomUUID()}.jpg`);
      try {
        await copyFile(join(process.cwd(), '../e2e/test-assets/formats/motionphoto', filename), path);
        const originalStat = await stat(path);
        const originalSize = originalStat.size;
        const original = await repository.readTags(path);
        expect(original.MotionPhoto || original.MicroVideo).toBeTruthy();

        await repository.removeMotionPhoto(path);

        const converted = await repository.readTags(path);
        const convertedStat = await stat(path);
        expect(convertedStat.size).toBeLessThan(originalSize);
        expect(converted.MotionPhoto || converted.MicroVideo).toBeFalsy();
        expect(converted.ContainerDirectory).toBeUndefined();
        expect([converted.ImageWidth, converted.ImageHeight]).toEqual([original.ImageWidth, original.ImageHeight]);
      } finally {
        await rm(folder, { recursive: true, force: true });
      }
    },
  );
});
