import { Stats } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AssetEntity } from 'src/entities/asset.entity';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { MetadataRepository } from 'src/repositories/metadata.repository';
import { MetadataService } from 'src/services/metadata.service';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newRandomImage, newTestService } from 'test/utils';
import { Mocked } from 'vitest';

const metadataRepository = new MetadataRepository(newLoggerRepositoryMock());

const createTestFile = async (exifData: Record<string, any>) => {
  const data = newRandomImage();
  const filePath = join(tmpdir(), 'test.png');
  await writeFile(filePath, data);
  await metadataRepository.writeTags(filePath, exifData);
  return { filePath };
};

type TimeZoneTest = {
  description: string;
  serverTimeZone?: string;
  exifData: Record<string, any>;
  expected: {
    localDateTime: string;
    dateTimeOriginal: string;
    timeZone: string | null;
  };
};

describe(MetadataService.name, () => {
  let sut: MetadataService;

  let assetMock: Mocked<IAssetRepository>;
  let storageMock: Mocked<IStorageRepository>;

  beforeEach(() => {
    ({ sut, assetMock, storageMock } = newTestService(MetadataService, { metadataRepository }));

    storageMock.stat.mockResolvedValue({ size: 123_456 } as Stats);

    delete process.env.TZ;
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('handleMetadataExtraction', () => {
    const timeZoneTests: TimeZoneTest[] = [
      {
        description: 'should handle no time zone information',
        exifData: {
          DateTimeOriginal: '2022:01:01 00:00:00',
        },
        expected: {
          localDateTime: '2022-01-01T00:00:00.000Z',
          dateTimeOriginal: '2022-01-01T00:00:00.000Z',
          timeZone: null,
        },
      },
      {
        description: 'should handle no time zone information and server behind UTC',
        serverTimeZone: 'America/Los_Angeles',
        exifData: {
          DateTimeOriginal: '2022:01:01 00:00:00',
        },
        expected: {
          localDateTime: '2022-01-01T00:00:00.000Z',
          dateTimeOriginal: '2022-01-01T08:00:00.000Z',
          timeZone: null,
        },
      },
      {
        description: 'should handle no time zone information and server ahead of UTC',
        serverTimeZone: 'Europe/Brussels',
        exifData: {
          DateTimeOriginal: '2022:01:01 00:00:00',
        },
        expected: {
          localDateTime: '2022-01-01T00:00:00.000Z',
          dateTimeOriginal: '2021-12-31T23:00:00.000Z',
          timeZone: null,
        },
      },
      {
        description: 'should handle no time zone information and server ahead of UTC in the summer',
        serverTimeZone: 'Europe/Brussels',
        exifData: {
          DateTimeOriginal: '2022:06:01 00:00:00',
        },
        expected: {
          localDateTime: '2022-06-01T00:00:00.000Z',
          dateTimeOriginal: '2022-05-31T22:00:00.000Z',
          timeZone: null,
        },
      },
      {
        description: 'should handle a +13:00 time zone',
        exifData: {
          DateTimeOriginal: '2022:01:01 00:00:00+13:00',
        },
        expected: {
          localDateTime: '2022-01-01T00:00:00.000Z',
          dateTimeOriginal: '2021-12-31T11:00:00.000Z',
          timeZone: 'UTC+13',
        },
      },
    ];

    it.each(timeZoneTests)('$description', async ({ exifData, serverTimeZone, expected }) => {
      process.env.TZ = serverTimeZone ?? undefined;

      const { filePath } = await createTestFile(exifData);
      assetMock.getByIds.mockResolvedValue([{ id: 'asset-1', originalPath: filePath } as AssetEntity]);

      await sut.handleMetadataExtraction({ id: 'asset-1' });

      expect(assetMock.upsertExif).toHaveBeenCalledWith(
        expect.objectContaining({
          dateTimeOriginal: new Date(expected.dateTimeOriginal),
          timeZone: expected.timeZone,
        }),
      );

      expect(assetMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          localDateTime: new Date(expected.localDateTime),
        }),
      );
    });
  });
});
