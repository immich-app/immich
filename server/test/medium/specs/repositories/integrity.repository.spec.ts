import { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import { AssetFileType, IntegrityReport } from 'src/enum.js';
import { IntegrityRepository } from 'src/repositories/integrity.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { DB } from 'src/schema/index.js';
import { BaseService } from 'src/services/base.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { getKyselyDB } from 'test/utils.js';

let database: Kysely<DB>;

const setup = () => {
  const { ctx } = newMediumService(BaseService, {
    database,
    real: [IntegrityRepository],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(IntegrityRepository) };
};

beforeAll(async () => {
  database = await getKyselyDB();
});

beforeEach(async () => {
  await database.deleteFrom('integrity_report').execute();
});

describe(IntegrityRepository.name, () => {
  describe('create', () => {
    it.each([false, true])(
      'should upsert shared paths once with the last reference (existing: %s)',
      async (existing) => {
        const { ctx, sut } = setup();
        const { user } = await ctx.newUser();
        const { asset: first } = await ctx.newAsset({ ownerId: user.id });
        const { asset: second } = await ctx.newAsset({ ownerId: user.id });
        const firstFileId = randomUUID();
        const secondFileId = randomUUID();
        await ctx.newAssetFile({
          id: firstFileId,
          assetId: first.id,
          path: '/shared/sidecar.xmp',
          type: AssetFileType.Sidecar,
        });
        await ctx.newAssetFile({
          id: secondFileId,
          assetId: second.id,
          path: '/shared/sidecar.xmp',
          type: AssetFileType.Sidecar,
        });
        if (existing) {
          await sut.create({
            path: '/shared/sidecar.xmp',
            type: IntegrityReport.MissingFile,
            fileAssetId: firstFileId,
          });
        }

        const reports = [
          { path: '/shared/sidecar.xmp', type: IntegrityReport.MissingFile, fileAssetId: firstFileId },
          { path: '/other/original.jpg', type: IntegrityReport.MissingFile, assetId: first.id },
          { path: '/shared/sidecar.xmp', type: IntegrityReport.ChecksumFail, assetId: second.id },
          { path: '/shared/sidecar.xmp', type: IntegrityReport.MissingFile, fileAssetId: secondFileId },
        ];
        const original = structuredClone(reports);

        await expect(sut.create(reports)).resolves.toEqual(
          expect.objectContaining({ path: '/shared/sidecar.xmp', fileAssetId: secondFileId }),
        );
        expect(reports).toEqual(original);
        await expect(database.selectFrom('integrity_report').selectAll().execute()).resolves.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: '/shared/sidecar.xmp',
              type: IntegrityReport.MissingFile,
              fileAssetId: secondFileId,
            }),
            expect.objectContaining({
              path: '/shared/sidecar.xmp',
              type: IntegrityReport.ChecksumFail,
              assetId: second.id,
            }),
            expect.objectContaining({
              path: '/other/original.jpg',
              type: IntegrityReport.MissingFile,
              assetId: first.id,
            }),
          ]),
        );
        expect(await database.selectFrom('integrity_report').select('id').execute()).toHaveLength(3);
      },
    );

    it('should preserve distinct paths and report types', async () => {
      const { sut } = setup();
      const reports = [
        { path: '/path/Case.jpg', type: IntegrityReport.MissingFile },
        { path: '/path/case.jpg', type: IntegrityReport.MissingFile },
        { path: '/path/é.jpg', type: IntegrityReport.MissingFile },
        { path: '/path/e\u{301}.jpg', type: IntegrityReport.MissingFile },
        { path: '/path/Case.jpg', type: IntegrityReport.ChecksumFail },
      ];

      await sut.create(reports);

      const stored = await database.selectFrom('integrity_report').select(['path', 'type']).execute();
      expect(stored).toHaveLength(reports.length);
      expect(stored).toEqual(expect.arrayContaining(reports));
    });

    it('should preserve single-report insert and update behavior', async () => {
      const { ctx, sut } = setup();
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      const report = await sut.create({ path: '/single/original.jpg', type: IntegrityReport.MissingFile });

      await expect(
        sut.create({ path: '/single/original.jpg', type: IntegrityReport.MissingFile, assetId: asset.id }),
      ).resolves.toEqual(expect.objectContaining({ id: report.id, assetId: asset.id }));
      expect(await database.selectFrom('integrity_report').select('id').execute()).toHaveLength(1);
    });
  });
});
