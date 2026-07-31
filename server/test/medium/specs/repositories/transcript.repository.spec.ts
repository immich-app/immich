import { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TranscriptRepository } from 'src/repositories/transcript.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { AudioChunk, planChunks, planResume } from 'src/utils/transcription';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const { ctx } = newMediumService(BaseService, {
    database: db || defaultDatabase,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: ctx.get(TranscriptRepository) };
};

const newTranscribableAsset = async (ctx: Awaited<ReturnType<typeof setup>>['ctx']) => {
  const { user } = await ctx.newUser();
  const { asset } = await ctx.newAsset({ ownerId: user.id });
  return asset;
};

const segment = (assetId: string, startTime: number, endTime: number, text: string, language?: string) => ({
  assetId,
  startTime,
  endTime,
  text,
  language,
});

/** Mimics the job loop: transcribe the pending chunks, committing one at a time. */
const runChunks = async (sut: TranscriptRepository, assetId: string, chunks: AudioChunk[], stopAfter = Infinity) => {
  for (const [index, chunk] of chunks.entries()) {
    if (index >= stopAfter) {
      return;
    }

    await sut.appendChunk(
      assetId,
      [segment(assetId, chunk.start, chunk.start + 1, `chunk at ${chunk.start}`)],
      Math.round(chunk.end * 1000),
    );
  }
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(TranscriptRepository.name, () => {
  describe('getStatus', () => {
    it('should report nothing for an asset that has never been transcribed', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);

      await expect(sut.getStatus(asset.id)).resolves.toBeUndefined();
    });

    it('should report a progress marker without a completion time while in flight', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);

      await sut.appendChunk(asset.id, [segment(asset.id, 0, 1, 'Hello')], 30_000);

      await expect(sut.getStatus(asset.id)).resolves.toEqual({
        transcribedAt: null,
        transcriptionProgressMs: 30_000,
      });
    });
  });

  describe('appendChunk', () => {
    it('should commit segments and the progress marker together', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);

      await sut.appendChunk(asset.id, [segment(asset.id, 0, 1.5, 'Hello there')], 30_000);

      await expect(sut.getByAssetId(asset.id)).resolves.toEqual([
        expect.objectContaining({ startTime: 0, endTime: 1.5, text: 'Hello there' }),
      ]);
      await expect(sut.getStatus(asset.id)).resolves.toMatchObject({ transcriptionProgressMs: 30_000 });
    });

    it('should advance progress for a chunk that contains no speech', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);

      await sut.appendChunk(asset.id, [], 30_000);

      // Without this the absence of rows would be ambiguous between "processed, found no speech"
      // and "never processed", and the chunk would be replayed on every resume.
      await expect(sut.getByAssetId(asset.id)).resolves.toEqual([]);
      await expect(sut.getStatus(asset.id)).resolves.toMatchObject({ transcriptionProgressMs: 30_000 });
    });

    it('should leave no partial rows and no progress when a chunk fails mid-insert', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);
      await sut.appendChunk(asset.id, [segment(asset.id, 0, 1, 'First chunk')], 30_000);

      // The second row references an asset that does not exist, so the insert aborts partway.
      await expect(
        sut.appendChunk(
          asset.id,
          [segment(asset.id, 30, 31, 'Second chunk'), segment(randomUUID(), 31, 32, 'Orphan')],
          60_000,
        ),
      ).rejects.toThrow();

      await expect(sut.getByAssetId(asset.id)).resolves.toEqual([expect.objectContaining({ text: 'First chunk' })]);
      await expect(sut.getStatus(asset.id)).resolves.toMatchObject({ transcriptionProgressMs: 30_000 });
    });
  });

  describe('getLastLanguage', () => {
    it('should report nothing for an asset with no segments', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);

      await expect(sut.getLastLanguage(asset.id)).resolves.toBeUndefined();
    });

    it('should report the language of the latest segment, not the latest row written', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);

      // Written in one chunk, so insertion order says nothing about which came last in the audio.
      await sut.appendChunk(
        asset.id,
        [segment(asset.id, 30, 31, 'Später', 'de'), segment(asset.id, 0, 1, 'Hello', 'en')],
        60_000,
      );

      await expect(sut.getLastLanguage(asset.id)).resolves.toBe('de');
    });

    it('should report nothing when the latest segment predates language detection', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);

      await sut.appendChunk(asset.id, [segment(asset.id, 0, 1, 'Hello')], 30_000);

      await expect(sut.getLastLanguage(asset.id)).resolves.toBeUndefined();
    });

    it('should not see another asset transcript', async () => {
      const { ctx, sut } = setup();
      const [asset, other] = [await newTranscribableAsset(ctx), await newTranscribableAsset(ctx)];
      await sut.appendChunk(other.id, [segment(other.id, 0, 1, 'Bonjour', 'fr')], 30_000);

      await expect(sut.getLastLanguage(asset.id)).resolves.toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should clear an earlier attempt and open a run at zero', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);
      await sut.appendChunk(asset.id, [segment(asset.id, 0, 1, 'Stale')], 30_000);

      await sut.reset(asset.id);

      await expect(sut.getByAssetId(asset.id)).resolves.toEqual([]);
      await expect(sut.getStatus(asset.id)).resolves.toMatchObject({ transcriptionProgressMs: 0 });
    });

    it('should preserve a corrected segment rather than deleting it with the rest', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);
      await sut.appendChunk(
        asset.id,
        [segment(asset.id, 0, 1, 'Stale'), segment(asset.id, 30, 31, 'Misheard name')],
        60_000,
      );
      const [, misheard] = await sut.getByAssetId(asset.id);
      await sut.updateSegment(misheard.id, asset.id, 'Corrected name');

      await sut.reset(asset.id);

      await expect(sut.getByAssetId(asset.id)).resolves.toEqual([
        expect.objectContaining({ id: misheard.id, text: 'Misheard name', correctedText: 'Corrected name' }),
      ]);
      await expect(sut.getStatus(asset.id)).resolves.toMatchObject({ transcriptionProgressMs: 0 });
    });
  });

  describe('deleteAll', () => {
    it('should drop every transcript and its progress marker', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);
      await sut.appendChunk(asset.id, [segment(asset.id, 0, 1, 'Stale')], 30_000);

      await sut.deleteAll();

      await expect(sut.getByAssetId(asset.id)).resolves.toEqual([]);
      await expect(sut.getStatus(asset.id)).resolves.toEqual({
        transcribedAt: null,
        transcriptionProgressMs: null,
      });
    });

    it('should leave an asset with any corrected segment completely untouched', async () => {
      const { ctx, sut } = setup();
      const corrected = await newTranscribableAsset(ctx);
      const plain = await newTranscribableAsset(ctx);
      await sut.appendChunk(
        corrected.id,
        [segment(corrected.id, 0, 1, 'Stale'), segment(corrected.id, 30, 31, 'Misheard name')],
        60_000,
      );
      const [, misheard] = await sut.getByAssetId(corrected.id);
      await sut.updateSegment(misheard.id, corrected.id, 'Corrected name');
      await sut.appendChunk(plain.id, [segment(plain.id, 0, 1, 'Stale')], 30_000);

      await sut.deleteAll();

      await expect(sut.getByAssetId(corrected.id)).resolves.toEqual([
        expect.objectContaining({ text: 'Stale', correctedText: null }),
        expect.objectContaining({ id: misheard.id, text: 'Misheard name', correctedText: 'Corrected name' }),
      ]);
      await expect(sut.getStatus(corrected.id)).resolves.toMatchObject({ transcriptionProgressMs: 60_000 });
      await expect(sut.getByAssetId(plain.id)).resolves.toEqual([]);
      await expect(sut.getStatus(plain.id)).resolves.toEqual({
        transcribedAt: null,
        transcriptionProgressMs: null,
      });
    });
  });

  describe('updateSegment', () => {
    it('should write a correction and return the updated segment', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);
      await sut.appendChunk(asset.id, [segment(asset.id, 0, 1, 'Misheard name')], 1000);
      const [stored] = await sut.getByAssetId(asset.id);

      const result = await sut.updateSegment(stored.id, asset.id, 'Corrected name');

      expect(result).toMatchObject({ id: stored.id, text: 'Misheard name', correctedText: 'Corrected name' });
      await expect(sut.getByAssetId(asset.id)).resolves.toEqual([
        expect.objectContaining({ correctedText: 'Corrected name' }),
      ]);
    });

    it('should clear a correction back to the model text when set to null', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);
      await sut.appendChunk(asset.id, [segment(asset.id, 0, 1, 'Misheard name')], 1000);
      const [stored] = await sut.getByAssetId(asset.id);
      await sut.updateSegment(stored.id, asset.id, 'Corrected name');

      const result = await sut.updateSegment(stored.id, asset.id, null);

      expect(result).toMatchObject({ correctedText: null });
    });

    it('should not update a segment belonging to another asset', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);
      const other = await newTranscribableAsset(ctx);
      await sut.appendChunk(asset.id, [segment(asset.id, 0, 1, 'Hello')], 1000);
      const [stored] = await sut.getByAssetId(asset.id);

      await expect(sut.updateSegment(stored.id, other.id, 'Nope')).resolves.toBeUndefined();
      await expect(sut.getByAssetId(asset.id)).resolves.toEqual([expect.objectContaining({ correctedText: null })]);
    });
  });

  describe('quality signals', () => {
    it('should round-trip the signals a segment was stored with', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);

      await sut.appendChunk(
        asset.id,
        [
          {
            ...segment(asset.id, 0, 1, 'Hello there', 'en'),
            noSpeechProbability: 0.02,
            avgLogProbability: -0.25,
            compressionRatio: 1.5,
          },
        ],
        1000,
      );

      const [stored] = await sut.getByAssetId(asset.id);
      // `real` is single precision, so the stored values are close rather than identical. The
      // thresholds they are compared against are nowhere near that fine.
      expect(stored.noSpeechProbability).toBeCloseTo(0.02, 6);
      expect(stored.avgLogProbability).toBeCloseTo(-0.25, 6);
      expect(stored.compressionRatio).toBeCloseTo(1.5, 6);
    });

    it('should store a segment every threshold would reject', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);

      await sut.appendChunk(
        asset.id,
        [
          {
            ...segment(asset.id, 0, 4, 'Subtitles by the Amara.org community', 'en'),
            noSpeechProbability: 0.98,
            avgLogProbability: -2.4,
            compressionRatio: 3.1,
          },
        ],
        4000,
      );

      // Nothing is discarded at ingest, so retuning the thresholds later has rows to work on.
      await expect(sut.getByAssetId(asset.id)).resolves.toHaveLength(1);
    });

    it('should leave the signals null for a segment written without them', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);

      await sut.appendChunk(asset.id, [segment(asset.id, 0, 1, 'Older transcript', 'en')], 1000);

      const [stored] = await sut.getByAssetId(asset.id);
      expect(stored.noSpeechProbability).toBeNull();
      expect(stored.avgLogProbability).toBeNull();
      expect(stored.compressionRatio).toBeNull();
    });
  });

  describe('resumption', () => {
    it('should produce no duplicate segments when an interrupted run is resumed', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);
      const chunks = planChunks({ duration: 120, silences: [], targetDuration: 30 });

      await sut.reset(asset.id);
      await runChunks(sut, asset.id, chunks, 2);

      const progressMs = (await sut.getStatus(asset.id))!.transcriptionProgressMs!;
      expect(progressMs).toBe(60_000);
      await runChunks(sut, asset.id, planResume(chunks, progressMs / 1000));

      const segments = await sut.getByAssetId(asset.id);
      expect(segments.map(({ startTime }) => startTime)).toEqual([0, 30, 60, 90]);
    });

    it('should not re-transcribe covered audio when the boundary set has changed', async () => {
      const { ctx, sut } = setup();
      const asset = await newTranscribableAsset(ctx);

      await sut.reset(asset.id);
      await runChunks(sut, asset.id, planChunks({ duration: 120, silences: [], targetDuration: 30 }), 2);

      // The retry plans with a different target size, so no boundary lines up with the offset.
      const progressMs = (await sut.getStatus(asset.id))!.transcriptionProgressMs!;
      const replanned = planChunks({ duration: 120, silences: [], targetDuration: 45 });
      const pending = planResume(replanned, progressMs / 1000);

      expect(pending[0].start).toBe(60);
      await runChunks(sut, asset.id, pending);

      const segments = await sut.getByAssetId(asset.id);
      expect(segments.map(({ startTime }) => startTime)).toEqual([0, 30, 60, 90]);
      expect(new Set(segments.map(({ startTime }) => startTime)).size).toBe(segments.length);
    });
  });
});
