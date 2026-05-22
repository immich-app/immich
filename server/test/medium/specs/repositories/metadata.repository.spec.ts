import { Kysely } from 'kysely';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { newDate } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let database: Kysely<DB>;

const setup = () => {
  const { ctx } = newMediumService(BaseService, {
    database,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(MetadataRepository) };
};

beforeAll(async () => {
  database = await getKyselyDB();
});

describe(MetadataRepository.name, () => {
  describe('writeTags', () => {
    it('should write an empty description', async () => {
      const { sut } = setup();
      const dir = mkdtempSync(join(tmpdir(), 'metadata-medium-write-tags'));
      const sidecarFile = join(dir, 'sidecar.xmp');

      await sut.writeTags(sidecarFile, { Description: '' });
      expect(readFileSync(sidecarFile).toString()).toEqual(expect.stringContaining('rdf:Description'));
    });

    it('should write an empty tags list', async () => {
      const { sut } = setup();
      const dir = mkdtempSync(join(tmpdir(), 'metadata-medium-write-tags'));
      const sidecarFile = join(dir, 'sidecar.xmp');

      await sut.writeTags(sidecarFile, { TagsList: [] });
      const fileContent = readFileSync(sidecarFile).toString();
      expect(fileContent).toEqual(expect.stringContaining('digiKam:TagsList'));
      expect(fileContent).toEqual(expect.stringContaining('<rdf:li/>'));
    });
  });

  it('should write tags', async () => {
    const { sut } = setup();
    const dir = mkdtempSync(join(tmpdir(), 'metadata-medium-write-tags'));
    const sidecarFile = join(dir, 'sidecar.xmp');

    await sut.writeTags(sidecarFile, {
      Description: 'my-description',
      ImageDescription: 'my-image-description',
      DateTimeOriginal: newDate().toISOString(),
      GPSLatitude: 42,
      GPSLongitude: 69,
      Rating: 3,
      TagsList: ['tagA'],
    });

    const fileContent = readFileSync(sidecarFile).toString();
    expect(fileContent).toEqual(expect.stringContaining('my-description'));
    expect(fileContent).toEqual(expect.stringContaining('my-image-description'));
    expect(fileContent).toEqual(expect.stringContaining('exif:DateTimeOriginal'));
    expect(fileContent).toEqual(expect.stringContaining('<exif:GPSLatitude>42,0.0N</exif:GPSLatitude>'));
    expect(fileContent).toEqual(expect.stringContaining('<exif:GPSLongitude>69,0.0E</exif:GPSLongitude>'));
    expect(fileContent).toEqual(expect.stringContaining('<xmp:Rating>3</xmp:Rating>'));
    expect(fileContent).toEqual(expect.stringContaining('tagA'));
  });
});
