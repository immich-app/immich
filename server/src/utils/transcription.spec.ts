import {
  getChunkByteRange,
  getInferenceTimeout,
  getPcmDuration,
  MINIMUM_INFERENCE_TIMEOUT,
  PCM_BYTES_PER_SECOND,
  planChunks,
  planResume,
} from 'src/utils/transcription';
import { describe, expect, it } from 'vitest';

describe('planChunks', () => {
  it('should return a single chunk when the audio is shorter than the target', () => {
    expect(planChunks({ duration: 12, silences: [], targetDuration: 30 })).toEqual([{ start: 0, end: 12 }]);
  });

  it('should return nothing for empty audio', () => {
    expect(planChunks({ duration: 0, silences: [], targetDuration: 30 })).toEqual([]);
  });

  it('should hard cut at the target when the audio contains no silences', () => {
    expect(planChunks({ duration: 100, silences: [], targetDuration: 30, searchWindow: 5 })).toEqual([
      { start: 0, end: 30 },
      { start: 30, end: 60 },
      { start: 60, end: 90 },
      { start: 90, end: 100 },
    ]);
  });

  it('should hard cut when every silence falls outside the search window', () => {
    const silences = [
      { start: 10, end: 12 },
      { start: 40, end: 42 },
    ];

    expect(planChunks({ duration: 60, silences, targetDuration: 30, searchWindow: 5 })).toEqual([
      { start: 0, end: 30 },
      { start: 30, end: 60 },
    ]);
  });

  it('should cut exactly at the target when a silence spans it', () => {
    const silences = [{ start: 29.5, end: 30.5 }];

    expect(planChunks({ duration: 60, silences, targetDuration: 30, searchWindow: 5 })).toEqual([
      { start: 0, end: 30 },
      { start: 30, end: 60 },
    ]);
  });

  it('should cut in the middle of the nearest silence within the window', () => {
    const silences = [
      { start: 26, end: 28 },
      { start: 33, end: 33.5 },
    ];

    expect(planChunks({ duration: 60, silences, targetDuration: 30, searchWindow: 5 })).toEqual([
      { start: 0, end: 27 },
      { start: 27, end: 60 },
    ]);
  });

  it('should clamp a silence that overruns the search window', () => {
    // The silence starts before the window; only the part inside it is a legal cut point.
    const silences = [{ start: 5, end: 27 }];

    expect(planChunks({ duration: 60, silences, targetDuration: 30, searchWindow: 5 })).toEqual([
      { start: 0, end: 26 },
      { start: 26, end: 60 },
    ]);
  });

  it('should treat a silence left open at end of stream as reaching the window', () => {
    const silences = [{ start: 28, end: Infinity }];

    expect(planChunks({ duration: 60, silences, targetDuration: 30, searchWindow: 5 })).toEqual([
      { start: 0, end: 31.5 },
      { start: 31.5, end: 60 },
    ]);
  });

  it('should produce identical boundaries for identical inputs', () => {
    const silences = [
      { start: 33, end: 33.5 },
      { start: 26, end: 28 },
      { start: 61, end: 64 },
    ];
    const options = { duration: 200, silences, targetDuration: 30, searchWindow: 5 };

    expect(planChunks(options)).toEqual(planChunks({ ...options, silences: silences.toReversed() }));
  });

  it('should cover the audio without gaps or overlaps', () => {
    const chunks = planChunks({
      duration: 200,
      silences: [
        { start: 26, end: 28 },
        { start: 61, end: 64 },
        { start: 118, end: 118.4 },
      ],
      targetDuration: 30,
      searchWindow: 5,
    });

    expect(chunks[0].start).toBe(0);
    expect(chunks.at(-1)!.end).toBe(200);
    for (const [index, chunk] of chunks.entries()) {
      expect(chunk.end).toBeGreaterThan(chunk.start);
      if (index > 0) {
        expect(chunk.start).toBe(chunks[index - 1].end);
      }
    }
  });
});

describe('planResume', () => {
  const chunks = [
    { start: 0, end: 30 },
    { start: 30, end: 62 },
    { start: 62, end: 90 },
  ];

  it('should return every chunk when nothing has been processed', () => {
    expect(planResume(chunks, 0)).toEqual(chunks);
  });

  it('should drop chunks already covered by the offset', () => {
    expect(planResume(chunks, 62)).toEqual([{ start: 62, end: 90 }]);
  });

  it('should tolerate the rounding of a millisecond offset back to seconds', () => {
    expect(planResume(chunks, 62_000.4 / 1000)).toEqual([{ start: 62, end: 90 }]);
  });

  it('should return nothing when the offset covers the whole plan', () => {
    expect(planResume(chunks, 90)).toEqual([]);
  });

  it('should clip the straddling chunk when the boundary set has changed', () => {
    // The offset was recorded against a plan whose boundary sat at 62; re-planning moved it to 59,
    // so 62..91 must still be transcribed while 59..62 must not be transcribed twice.
    const replanned = [
      { start: 0, end: 29 },
      { start: 29, end: 59 },
      { start: 59, end: 91 },
    ];

    expect(planResume(replanned, 62)).toEqual([{ start: 62, end: 91 }]);
  });

  it('should drop a straddling remainder too short to hold a word', () => {
    expect(planResume(chunks, 61.9)).toEqual([{ start: 62, end: 90 }]);
  });
});

describe('getInferenceTimeout', () => {
  it('should scale with chunk duration', () => {
    expect(getInferenceTimeout({ start: 60, end: 120 }, 30)).toBe(1_800_000);
  });

  it('should never go below the floor that covers first-use model loading', () => {
    expect(getInferenceTimeout({ start: 0, end: 1 }, 30)).toBe(MINIMUM_INFERENCE_TIMEOUT);
  });
});

describe('getChunkByteRange', () => {
  it('should align a chunk to whole samples', () => {
    expect(getChunkByteRange({ start: 1, end: 2.5 }, 10 * PCM_BYTES_PER_SECOND)).toEqual({
      position: PCM_BYTES_PER_SECOND,
      length: 1.5 * PCM_BYTES_PER_SECOND,
    });
  });

  it('should clamp to the bytes actually written', () => {
    expect(getChunkByteRange({ start: 1, end: 30 }, 2 * PCM_BYTES_PER_SECOND)).toEqual({
      position: PCM_BYTES_PER_SECOND,
      length: PCM_BYTES_PER_SECOND,
    });
  });

  it('should return an empty range for a chunk past the end of the stream', () => {
    expect(getChunkByteRange({ start: 10, end: 12 }, PCM_BYTES_PER_SECOND)).toEqual({
      position: PCM_BYTES_PER_SECOND,
      length: 0,
    });
  });
});

describe('getPcmDuration', () => {
  it('should derive duration from the byte count', () => {
    expect(getPcmDuration(16 * PCM_BYTES_PER_SECOND)).toBe(16);
  });
});
