import { Kysely, sql } from 'kysely';
import { Stats } from 'node:fs';
import { StorageCore } from 'src/cores/storage.core.js';
import { AssetEditAction } from 'src/dtos/editing.dto.js';
import { AssetFileType, ImageFormat, JobStatus } from 'src/enum.js';
import { AssetEditRepository } from 'src/repositories/asset-edit.repository.js';
import { AssetJobRepository } from 'src/repositories/asset-job.repository.js';
import { AssetRepository, PublishImageGeneration } from 'src/repositories/asset.repository.js';
import { LibraryRepository } from 'src/repositories/library.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { DB } from 'src/schema/index.js';
import { BaseService } from 'src/services/base.service.js';
import { MediaService } from 'src/services/media.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { newUuid } from 'test/small.factory.js';
import { getKyselyDB, newTestService } from 'test/utils.js';

let database: Kysely<DB>;

beforeAll(async () => {
  database = await getKyselyDB();
});

afterAll(async () => {
  await database?.destroy();
});

const setup = async () => {
  const { ctx } = newMediumService(BaseService, { database, real: [], mock: [LoggingRepository] });
  const { user } = await ctx.newUser();
  const { asset } = await ctx.newAsset({ ownerId: user.id, originalPath: '/photos/photo.nef' });
  const repository = ctx.get(AssetRepository);
  await repository.upsertFiles([
    { assetId: asset.id, type: AssetFileType.Sidecar, path: '/photos/photo.xmp' },
    { assetId: asset.id, type: AssetFileType.Thumbnail, path: '/cache/old-thumb.jpg' },
    { assetId: asset.id, type: AssetFileType.Preview, path: '/cache/old-preview.jpg' },
    { assetId: asset.id, type: AssetFileType.FullSize, path: '/cache/old-full.jpg' },
  ]);
  await repository.observeImageDevelopmentInput(asset.id, 'current');
  const input: PublishImageGeneration = {
    assetId: asset.id,
    originalPath: asset.originalPath,
    sidecarPath: '/photos/photo.xmp',
    fingerprint: 'current',
    edits: [],
    files: [
      { assetId: asset.id, type: AssetFileType.Thumbnail, path: '/cache/new-thumb.jpg' },
      { assetId: asset.id, type: AssetFileType.Preview, path: '/cache/new-preview.jpg' },
    ],
    thumbhash: Buffer.from('same-thumbhash'),
    base: { isDeveloped: true, width: 1200, height: 800 },
    dimensions: { width: 1200, height: 800 },
    visibility: { faces: { visible: [], hidden: [] }, ocr: { visible: [], hidden: [] } },
  };
  return { ctx, asset, repository, input };
};

describe('sidecar development publication', () => {
  it.each(['observe', 'sidecar', 'remove-sidecar', 'edit'] as const)(
    'serializes %s changes with publication using the asset-first lock order',
    async (change) => {
      const { ctx, asset, repository } = await setup();
      let pending!: Promise<unknown>;
      await database.transaction().execute(async (tx) => {
        await tx.selectFrom('asset').select('id').where('id', '=', asset.id).forUpdate().executeTakeFirstOrThrow();
        switch (change) {
          case 'observe': {
            pending = repository.observeImageDevelopmentInput(asset.id, 'changed');
            break;
          }
          case 'sidecar': {
            pending = repository.upsertFile({
              assetId: asset.id,
              type: AssetFileType.Sidecar,
              path: '/photos/changed.xmp',
            });
            break;
          }
          case 'remove-sidecar': {
            pending = repository.deleteFile({ assetId: asset.id, type: AssetFileType.Sidecar });
            break;
          }
          case 'edit': {
            pending = ctx
              .get(AssetEditRepository)
              .replaceAll(asset.id, [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }]);
            break;
          }
        }
        await vi.waitFor(async () => {
          const blocked = await sql<{
            count: number;
          }>`select count(*)::int as count from pg_stat_activity where wait_event_type = 'Lock' and query like '%for update%'`.execute(
            database,
          );
          expect(blocked.rows[0].count).toBeGreaterThan(0);
        });
        const state = await tx
          .selectFrom('asset_job_status')
          .select('development')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow();
        expect(state.development!.observedInputFingerprint).toBe('current');
        const sidecar = await tx
          .selectFrom('asset_file')
          .select('path')
          .where('assetId', '=', asset.id)
          .where('type', '=', AssetFileType.Sidecar)
          .executeTakeFirstOrThrow();
        expect(sidecar.path).toBe('/photos/photo.xmp');
        expect(await ctx.get(AssetEditRepository).getAll(asset.id)).toEqual([]);
      });
      await pending;
      if (change === 'observe') {
        const state = await database
          .selectFrom('asset_job_status')
          .select('development')
          .where('assetId', '=', asset.id)
          .executeTakeFirstOrThrow();
        expect(state.development!.observedInputFingerprint).toBe('changed');
        return;
      }
      if (change === 'edit') {
        expect(await ctx.get(AssetEditRepository).getAll(asset.id)).toEqual([
          expect.objectContaining({ action: AssetEditAction.Rotate }),
        ]);
        return;
      }
      const sidecar = await database
        .selectFrom('asset_file')
        .select('path')
        .where('assetId', '=', asset.id)
        .where('type', '=', AssetFileType.Sidecar)
        .executeTakeFirst();
      expect(sidecar?.path).toBe(change === 'sidecar' ? '/photos/changed.xmp' : undefined);
    },
  );

  it('rejects an ordinary generation after sidecar publication and leaves the current fingerprint intact', async () => {
    const { asset, repository, input } = await setup();
    await repository.publishImageGeneration(input);
    const before = await repository.getById(asset.id);
    await expect(
      repository.publishImageGeneration({
        ...input,
        sidecarPath: null,
        fingerprint: null,
        base: undefined,
        files: [{ assetId: asset.id, type: AssetFileType.Preview, path: '/cache/stale-original.jpg' }],
      }),
    ).resolves.toBeNull();
    expect((await repository.getById(asset.id))!.updateId).toBe(before!.updateId);
    const state = await database
      .selectFrom('asset_job_status')
      .select('development')
      .where('assetId', '=', asset.id)
      .executeTakeFirstOrThrow();
    expect(state.development!.publishedInputFingerprint).toBe('current');
    await expect(
      database
        .selectFrom('asset_file')
        .select('path')
        .where('assetId', '=', asset.id)
        .where('type', '=', AssetFileType.Preview)
        .executeTakeFirst(),
    ).resolves.toEqual({ path: '/cache/new-preview.jpg' });
  });

  it('publishes ordinary edited images atomically and preserves the original variants on reset', async () => {
    const { ctx, asset, repository, input } = await setup();
    await repository.deleteFile({ assetId: asset.id, type: AssetFileType.Sidecar });
    await database.deleteFrom('asset_job_status').where('assetId', '=', asset.id).execute();
    const edits = [{ action: AssetEditAction.Crop, parameters: { x: 0, y: 0, width: 600, height: 400 } }] as const;
    await ctx.get(AssetEditRepository).replaceAll(asset.id, [...edits]);
    const editedInput = {
      ...input,
      fingerprint: null,
      sidecarPath: null,
      base: undefined,
      editedOnly: true,
      edits: [...edits],
      dimensions: { width: 600, height: 400 },
      files: [{ assetId: asset.id, type: AssetFileType.Preview, path: '/cache/edited-preview.jpg', isEdited: true }],
    };
    await expect(repository.publishImageGeneration(editedInput)).resolves.toEqual([]);
    await expect(repository.getForThumbnail(asset.id, AssetFileType.Preview, false)).resolves.toMatchObject({
      path: '/cache/old-preview.jpg',
    });
    await expect(repository.getForThumbnail(asset.id, AssetFileType.Preview, true)).resolves.toMatchObject({
      path: '/cache/edited-preview.jpg',
    });
    await ctx.get(AssetEditRepository).replaceAll(asset.id, []);
    await expect(
      repository.publishImageGeneration({
        ...editedInput,
        edits: [],
        files: [],
        dimensions: { width: 1200, height: 800 },
      }),
    ).resolves.toEqual(['/cache/edited-preview.jpg']);
    await expect(repository.getForThumbnail(asset.id, AssetFileType.Preview, false)).resolves.toMatchObject({
      path: '/cache/old-preview.jpg',
    });
  });

  it.each([false, true])(
    'preserves newly published dimensions when metadata started before publication committed (developed: %s)',
    async (isDeveloped) => {
      const { asset, repository, input } = await setup();
      let metadataUpdate!: ReturnType<AssetRepository['update']>;
      await database.transaction().execute(async (tx) => {
        await tx.selectFrom('asset').select('id').where('id', '=', asset.id).forUpdate().executeTakeFirstOrThrow();
        metadataUpdate = repository.update(
          { id: asset.id, width: 6000, height: 4000 },
          { preservePublishedImageDimensions: true },
        );
        await vi.waitFor(async () => {
          const blocked = await sql<{
            count: number;
          }>`select count(*)::int as count from pg_stat_activity where wait_event_type = 'Lock' and query like '%for update%'`.execute(
            database,
          );
          expect(blocked.rows[0].count).toBeGreaterThan(0);
        });
        await tx
          .updateTable('asset_job_status')
          .set({
            development: {
              observedInputFingerprint: 'current',
              publishedInputFingerprint: 'current',
              publishedBase: { ...input.base!, isDeveloped },
            },
          })
          .where('assetId', '=', asset.id)
          .execute();
        await tx.updateTable('asset').set({ width: 1200, height: 800 }).where('id', '=', asset.id).execute();
      });
      await metadataUpdate;
      expect(await repository.getById(asset.id)).toMatchObject({ width: 1200, height: 800, isDeveloped });
    },
  );

  it('does not let a cache migration replace a more recent generation', async () => {
    const { asset, repository, input } = await setup();
    await repository.publishImageGeneration(input);
    await expect(
      repository.replaceFilePath(
        asset.id,
        AssetFileType.Preview,
        '/cache/old-preview.jpg',
        '/new-cache/old-preview.jpg',
      ),
    ).resolves.toBe(false);
    await expect(
      repository.replaceFilePath(
        asset.id,
        AssetFileType.Preview,
        '/cache/new-preview.jpg',
        '/new-cache/new-preview.jpg',
      ),
    ).resolves.toBe(true);
    await expect(repository.getForThumbnail(asset.id, AssetFileType.Preview, false)).resolves.toMatchObject({
      path: '/new-cache/new-preview.jpg',
    });
    // A replay of the same immutable generation is already successfully moved.
    await expect(
      repository.replaceFilePath(
        asset.id,
        AssetFileType.Preview,
        '/cache/new-preview.jpg',
        '/new-cache/new-preview.jpg',
      ),
    ).resolves.toBe(true);
  });

  it('keeps a live destination when an overlapping EXDEV migration replays the same generation', async () => {
    const { ctx, asset, repository } = await setup();
    const { sut, mocks } = newTestService(MediaService);
    StorageCore.setMediaLocation('/data');
    const basename = `${asset.id}_preview-${newUuid()}.jpeg`;
    const oldPath = `/old-cache/${basename}`;
    const newPath = StorageCore.getImagePath(asset, {
      fileType: AssetFileType.Preview,
      format: ImageFormat.Jpeg,
      isEdited: false,
    }).replace(`${asset.id}_preview.jpeg`, () => basename);
    await repository.upsertFile({ assetId: asset.id, type: AssetFileType.Preview, path: newPath });
    const snapshot = await ctx.get(AssetJobRepository).getForMigrationJob(asset.id);
    mocks.assetJob.getForMigrationJob.mockResolvedValue({
      ...snapshot!,
      files: snapshot!.files
        .filter((file) => file.type === AssetFileType.Preview)
        .map((file) => ({ ...file, path: oldPath })),
    });
    mocks.asset.replaceFilePath.mockImplementation(repository.replaceFilePath.bind(repository));
    mocks.move.create.mockImplementation((request) => Promise.resolve({ ...request, id: 'replayed-move' }));
    mocks.storage.rename.mockRejectedValue(Object.assign(new Error('Cross-device move'), { code: 'EXDEV' }));
    mocks.storage.stat.mockResolvedValue({ size: 128, atime: new Date(), mtime: new Date() } as Stats);

    await expect(sut.handleAssetMigration({ id: asset.id })).resolves.toBe(JobStatus.Success);

    expect(mocks.storage.copyFile).toHaveBeenCalledExactlyOnceWith(oldPath, newPath);
    expect(mocks.storage.unlink).toHaveBeenCalledExactlyOnceWith(oldPath);
    expect(mocks.storage.unlink).not.toHaveBeenCalledWith(newPath);
    await expect(repository.getForThumbnail(asset.id, AssetFileType.Preview, false)).resolves.toMatchObject({
      path: newPath,
    });
  });

  it('never serves an edited-only fullsize file for an unedited request', async () => {
    const { asset, repository, input } = await setup();
    input.files.push({
      assetId: asset.id,
      type: AssetFileType.FullSize,
      path: '/cache/edited-only.jpg',
      isEdited: true,
    });
    await repository.publishImageGeneration(input);
    await expect(repository.getForThumbnail(asset.id, AssetFileType.FullSize, false)).resolves.toMatchObject({
      path: null,
      isDeveloped: true,
    });
    await expect(repository.getForThumbnail(asset.id, AssetFileType.FullSize, true)).resolves.toMatchObject({
      path: '/cache/edited-only.jpg',
    });
  });

  it('builds OCR search from every visible stored row, including entries without crop coordinates', async () => {
    const { asset, repository, input } = await setup();
    const rows = await database
      .insertInto('asset_ocr')
      .values([
        {
          assetId: asset.id,
          text: ' mapped ',
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 0,
          x3: 1,
          y3: 1,
          x4: 0,
          y4: 1,
          boxScore: 1,
          textScore: 1,
        },
        {
          assetId: asset.id,
          text: ' keep me ',
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 0,
          x3: 1,
          y3: 1,
          x4: 0,
          y4: 1,
          boxScore: 1,
          textScore: 1,
        },
      ])
      .returning(['id', 'text'])
      .execute();
    await database.insertInto('ocr_search').values({ assetId: asset.id, text: 'mapped keep me' }).execute();
    input.visibility.ocr = { visible: [], hidden: [rows[0].id] };
    await repository.publishImageGeneration(input);
    await expect(
      database.selectFrom('ocr_search').select('text').where('assetId', '=', asset.id).executeTakeFirst(),
    ).resolves.toEqual({ text: 'keep me' });
    input.visibility.ocr = { visible: [rows[0].id], hidden: [] };
    await repository.publishImageGeneration(input);
    const expected = rows
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((row) => row.text.trim())
      .join(' ');
    await expect(
      database.selectFrom('ocr_search').select('text').where('assetId', '=', asset.id).executeTakeFirst(),
    ).resolves.toEqual({ text: expected });
  });

  it('publishes files, dimensions, state and revision together while preserving the source and XMP', async () => {
    const { asset, repository, input } = await setup();
    const before = await repository.getById(asset.id);
    await expect(repository.publishImageGeneration(input)).resolves.toEqual([
      '/cache/old-thumb.jpg',
      '/cache/old-preview.jpg',
      '/cache/old-full.jpg',
    ]);
    const after = await repository.getById(asset.id);
    expect(after).toMatchObject({
      originalPath: asset.originalPath,
      width: 1200,
      height: 800,
      thumbhash: input.thumbhash,
      isDeveloped: true,
    });
    expect(after!.updateId).not.toBe(before!.updateId);
    await expect(
      database.selectFrom('asset_file').select('path').where('assetId', '=', asset.id).orderBy('path').execute(),
    ).resolves.toEqual([
      { path: '/cache/new-preview.jpg' },
      { path: '/cache/new-thumb.jpg' },
      { path: '/photos/photo.xmp' },
    ]);
    await expect(
      database.selectFrom('asset_job_status').select('development').where('assetId', '=', asset.id).executeTakeFirst(),
    ).resolves.toEqual({
      development: {
        observedInputFingerprint: 'current',
        publishedInputFingerprint: 'current',
        publishedBase: input.base,
      },
    });
    // Same placeholders still require fresh URLs after successful regeneration.
    await repository.publishImageGeneration(input);
    expect((await repository.getById(asset.id))!.updateId).not.toBe(after!.updateId);
  });

  it('preserves publication and unrelated job state when observing changed inputs', async () => {
    const { asset, repository, input } = await setup();
    await repository.publishImageGeneration(input);
    const metadataExtractedAt = new Date('2026-01-01T00:00:00Z');
    await repository.upsertJobStatus({ assetId: asset.id, metadataExtractedAt });
    await repository.observeImageDevelopmentInput(asset.id, 'changed');
    const status = await database
      .selectFrom('asset_job_status')
      .selectAll()
      .where('assetId', '=', asset.id)
      .executeTakeFirstOrThrow();
    expect(status.metadataExtractedAt).toEqual(metadataExtractedAt);
    expect(status.development).toEqual({
      observedInputFingerprint: 'changed',
      publishedInputFingerprint: 'current',
      publishedBase: input.base,
    });
  });

  it('discards a generation whose XMP observation was superseded', async () => {
    const { asset, repository, input } = await setup();
    const before = await repository.getById(asset.id);
    await repository.observeImageDevelopmentInput(asset.id, 'newer');
    await expect(repository.publishImageGeneration(input)).resolves.toBeNull();
    expect((await repository.getById(asset.id))!.updateId).toBe(before!.updateId);
    await expect(
      database
        .selectFrom('asset_file')
        .select('path')
        .where('assetId', '=', asset.id)
        .where('type', '=', AssetFileType.Preview)
        .executeTakeFirst(),
    ).resolves.toEqual({ path: '/cache/old-preview.jpg' });
  });

  it('discards a generation when native Immich edits changed during rendering', async () => {
    const { ctx, asset, repository, input } = await setup();
    await ctx
      .get(AssetEditRepository)
      .replaceAll(asset.id, [{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }]);
    await expect(repository.publishImageGeneration(input)).resolves.toBeNull();
    const state = await database
      .selectFrom('asset_job_status')
      .select('development')
      .where('assetId', '=', asset.id)
      .executeTakeFirstOrThrow();
    expect(state.development!.publishedInputFingerprint).toBeNull();
  });

  it('rolls back earlier pointer writes when publication fails', async () => {
    const { asset, repository, input } = await setup();
    const before = await repository.getById(asset.id);
    // Invalid dimensions fail after files and development state have already been replaced.
    input.dimensions.width = NaN;
    await expect(repository.publishImageGeneration(input)).rejects.toThrow();
    expect((await repository.getById(asset.id))!.updateId).toBe(before!.updateId);
    await expect(
      database
        .selectFrom('asset_file')
        .select('path')
        .where('assetId', '=', asset.id)
        .where('type', '=', AssetFileType.Preview)
        .executeTakeFirst(),
    ).resolves.toEqual({ path: '/cache/old-preview.jpg' });
    const state = await database
      .selectFrom('asset_job_status')
      .select('development')
      .where('assetId', '=', asset.id)
      .executeTakeFirstOrThrow();
    expect(state.development!.publishedInputFingerprint).toBeNull();
  });

  it('returns to the original base after successful XMP removal', async () => {
    const { asset, repository, input } = await setup();
    await repository.publishImageGeneration(input);
    await repository.observeImageDevelopmentInput(asset.id, 'removed');
    await repository.publishImageGeneration({
      ...input,
      fingerprint: 'removed',
      base: { ...input.base!, isDeveloped: false },
    });
    expect((await repository.getById(asset.id))!.isDeveloped).toBe(false);
  });

  it('keeps sidecars out of thumbnail cleanup and returns native edits in sequence', async () => {
    const { ctx, asset, input } = await setup();
    await ctx.newExif({ assetId: asset.id, exifImageWidth: 1200, exifImageHeight: 800 });
    await ctx.get(AssetEditRepository).replaceAll(asset.id, [
      { action: AssetEditAction.Rotate, parameters: { angle: 90 } },
      { action: AssetEditAction.Mirror, parameters: { axis: 'horizontal' } },
    ]);
    const job = await ctx.get(AssetJobRepository).getForGenerateThumbnailJob(asset.id);
    expect(job!.sidecarPath).toBe('/photos/photo.xmp');
    expect(job!.files.every((file) => file.type !== AssetFileType.Sidecar)).toBe(true);
    expect(job!.edits.map((edit) => edit.action)).toEqual([AssetEditAction.Rotate, AssetEditAction.Mirror]);
    expect(job!.development!.observedInputFingerprint).toBe(input.fingerprint);
  });

  it('resolves shared-basename and extension sidecars only in their owning library', async () => {
    const { ctx, asset } = await setup();
    const libraryRepository = ctx.get(LibraryRepository);
    const library = await libraryRepository.create({
      name: 'photos',
      ownerId: asset.ownerId,
      importPaths: ['/photos'],
      exclusionPatterns: [],
    });
    const otherLibrary = await libraryRepository.create({
      name: 'other',
      ownerId: asset.ownerId,
      importPaths: ['/photos'],
      exclusionPatterns: [],
    });
    await ctx.database.updateTable('asset').set({ libraryId: library.id }).where('id', '=', asset.id).execute();
    const { asset: jpeg } = await ctx.newAsset({
      ownerId: asset.ownerId,
      libraryId: library.id,
      originalPath: '/photos/photo.jpg',
    });
    await ctx.newAsset({ ownerId: asset.ownerId, libraryId: otherLibrary.id, originalPath: '/photos/photo.nef' });
    const jobs = ctx.get(AssetJobRepository);
    const owners = await jobs.getForSidecarPath(library.id, '/photos/photo.xmp');
    expect(owners.map((row) => row.id).sort()).toEqual([asset.id, jpeg.id].sort());
    await expect(jobs.getForSidecarPath(library.id, '/photos/photo.jpg.xmp')).resolves.toEqual([{ id: jpeg.id }]);
    await ctx.database
      .updateTable('asset_file')
      .set({ path: '/photos/custom.xmp' })
      .where('assetId', '=', asset.id)
      .where('type', '=', AssetFileType.Sidecar)
      .execute();
    await expect(jobs.getForSidecarPath(library.id, '/photos/custom.xmp')).resolves.toEqual([{ id: asset.id }]);
  });
});
