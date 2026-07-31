import { tokenizeForSearch } from 'src/utils/database';
import {
  buildTranscriptSearchText,
  filterHallucinations,
  getChunkByteRange,
  getInferenceTimeout,
  getPcmDuration,
  MINIMUM_INFERENCE_TIMEOUT,
  PCM_BYTES_PER_SECOND,
  planChunks,
  planResume,
  resolveSegmentLanguages,
  SearchableSegment,
  SegmentQuality,
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

const detection = (language: string, languageConfidence: number) => ({ language, languageConfidence });

describe('resolveSegmentLanguages', () => {
  it('should honour a confident switch', () => {
    const resolved = resolveSegmentLanguages([detection('en', 0.98), detection('fr', 0.95)], 0.7);

    expect(resolved).toEqual(['en', 'fr']);
  });

  it('should inherit the previous language on a low-confidence switch', () => {
    const resolved = resolveSegmentLanguages([detection('en', 0.98), detection('cy', 0.31)], 0.7);

    expect(resolved).toEqual(['en', 'en']);
  });

  it('should take the first segment at face value, having nothing to inherit', () => {
    const resolved = resolveSegmentLanguages([detection('en', 0.02)], 0.7);

    expect(resolved).toEqual(['en']);
  });

  it('should not drift through a run of low-confidence detections', () => {
    const resolved = resolveSegmentLanguages(
      [
        detection('en', 0.99),
        detection('cy', 0.4),
        detection('mi', 0.35),
        detection('haw', 0.3),
        detection('nn', 0.25),
      ],
      0.7,
    );

    expect(resolved).toEqual(['en', 'en', 'en', 'en', 'en']);
  });

  it('should believe a detection exactly at the threshold', () => {
    const resolved = resolveSegmentLanguages([detection('en', 0.98), detection('fr', 0.7)], 0.7);

    expect(resolved).toEqual(['en', 'fr']);
  });

  it('should inherit an established language from an earlier chunk', () => {
    const resolved = resolveSegmentLanguages([detection('cy', 0.2)], 0.7, 'de');

    expect(resolved).toEqual(['de']);
  });

  it('should let a confident detection override an established language', () => {
    const resolved = resolveSegmentLanguages([detection('it', 0.93)], 0.7, 'de');

    expect(resolved).toEqual(['it']);
  });

  it('should resolve nothing for a chunk with no segments', () => {
    expect(resolveSegmentLanguages([], 0.7, 'de')).toEqual([]);
  });

  it('should return to a language it had already established', () => {
    const resolved = resolveSegmentLanguages(
      [detection('en', 0.96), detection('fr', 0.91), detection('xx', 0.1), detection('en', 0.94)],
      0.7,
    );

    expect(resolved).toEqual(['en', 'fr', 'fr', 'en']);
  });
});

/** Ordinary speech, overridden per test with whichever signal is under examination. */
const segment = (overrides: Partial<SegmentQuality & { text: string }> = {}) => ({
  text: 'Hello there',
  noSpeechProbability: 0.02,
  avgLogProbability: -0.2,
  compressionRatio: 1.4,
  ...overrides,
});

describe('filterHallucinations', () => {
  const thresholds = { maxNoSpeechProbability: 0.6, minAvgLogProbability: -1, maxCompressionRatio: 2.4 };

  it('should keep segments passing every rule', () => {
    const segments = [segment(), segment({ text: 'General Kenobi' })];

    expect(filterHallucinations(segments, thresholds)).toEqual(segments);
  });

  it('should return nothing for a transcript with no segments', () => {
    expect(filterHallucinations([], thresholds)).toEqual([]);
  });

  it('should keep a segment failing only the no-speech probability', () => {
    // Quiet but genuine speech: the model doubts there is speech, then decodes it confidently.
    const segments = [segment({ noSpeechProbability: 0.93 })];

    expect(filterHallucinations(segments, thresholds)).toEqual(segments);
  });

  it('should keep a segment failing only the average log-probability', () => {
    // A heavy accent or a noisy room: hard to decode, but the model does hear speech.
    const segments = [segment({ avgLogProbability: -2.1 })];

    expect(filterHallucinations(segments, thresholds)).toEqual(segments);
  });

  it('should discard a segment failing both paired signals', () => {
    const segments = [segment({ noSpeechProbability: 0.93, avgLogProbability: -2.1 })];

    expect(filterHallucinations(segments, thresholds)).toEqual([]);
  });

  it('should discard a segment on the repetition signal alone', () => {
    // Everything else says speech; only the compression ratio gives the loop away.
    const segments = [segment({ text: 'Thank you. Thank you. Thank you.', compressionRatio: 3.6 })];

    expect(filterHallucinations(segments, thresholds)).toEqual([]);
  });

  it('should keep a segment at each threshold exactly', () => {
    const segments = [segment({ noSpeechProbability: 0.6, avgLogProbability: -1 }), segment({ compressionRatio: 2.4 })];

    expect(filterHallucinations(segments, thresholds)).toEqual(segments);
  });

  it('should keep only the good segments of a mixed transcript', () => {
    const good = segment();
    const segments = [
      good,
      segment({ text: 'Subtitles by the Amara.org community', noSpeechProbability: 0.98, avgLogProbability: -2.4 }),
      segment({ text: 'you you you you', compressionRatio: 4.2 }),
    ];

    expect(filterHallucinations(segments, thresholds)).toEqual([good]);
  });

  it('should keep a segment stored before the signals existed', () => {
    // Judging a missing signal would silently blank every transcript made before this change.
    const segments = [segment({ noSpeechProbability: null, avgLogProbability: null, compressionRatio: null })];

    expect(filterHallucinations(segments, thresholds)).toEqual(segments);
  });

  it('should keep a segment whose paired signals are only half recorded', () => {
    const segments = [segment({ noSpeechProbability: 0.98, avgLogProbability: null })];

    expect(filterHallucinations(segments, thresholds)).toEqual(segments);
  });

  it('should change what it discards when the thresholds change', () => {
    // The point of filtering at read time: the same stored rows, judged differently.
    const segments = [segment({ noSpeechProbability: 0.7, avgLogProbability: -1.2 })];

    expect(filterHallucinations(segments, thresholds)).toEqual([]);
    expect(filterHallucinations(segments, { ...thresholds, maxNoSpeechProbability: 0.9 })).toEqual(segments);
  });
});

/** Ordinary speech, ready for indexing, overridden per test with whichever field is under examination. */
const searchableSegment = (overrides: Partial<SearchableSegment> = {}): SearchableSegment => ({
  text: 'Hello there',
  correctedText: null,
  noSpeechProbability: 0.02,
  avgLogProbability: -0.2,
  compressionRatio: 1.4,
  ...overrides,
});

describe('buildTranscriptSearchText', () => {
  const thresholds = { maxNoSpeechProbability: 0.6, minAvgLogProbability: -1, maxCompressionRatio: 2.4 };

  it('should return an empty string for a transcript with no segments', () => {
    expect(buildTranscriptSearchText([], thresholds)).toBe('');
  });

  it('should flatten every segment into one space-joined string', () => {
    const segments = [searchableSegment({ text: 'Hello there' }), searchableSegment({ text: 'General Kenobi' })];

    expect(buildTranscriptSearchText(segments, thresholds)).toBe('Hello there General Kenobi');
  });

  it('should prefer a correction over the model text', () => {
    const segments = [searchableSegment({ text: 'Han Solo', correctedText: 'Han Solo the smuggler' })];

    expect(buildTranscriptSearchText(segments, thresholds)).toBe('Han Solo the smuggler');
  });

  it('should fall back to the model text when there is no correction', () => {
    const segments = [searchableSegment({ text: 'Hello there', correctedText: null })];

    expect(buildTranscriptSearchText(segments, thresholds)).toBe('Hello there');
  });

  it('should exclude a segment failing the quality thresholds', () => {
    const good = searchableSegment({ text: 'Hello there' });
    const hallucinated = searchableSegment({
      text: 'Subtitles by the Amara.org community',
      noSpeechProbability: 0.98,
      avgLogProbability: -2.4,
    });

    expect(buildTranscriptSearchText([good, hallucinated], thresholds)).toBe('Hello there');
  });

  it('should exclude a hallucination even when it carries a correction', () => {
    // A correction fixes what a real segment says; it does not rescue a segment that was never
    // speech to begin with.
    const segments = [
      searchableSegment({
        text: 'Subtitles by the Amara.org community',
        correctedText: 'something else entirely',
        noSpeechProbability: 0.98,
        avgLogProbability: -2.4,
      }),
    ];

    expect(buildTranscriptSearchText(segments, thresholds)).toBe('');
  });

  it('should tokenize with the same tokenizer a query is tokenized with', () => {
    const text = "Grandmother's café, straight ahead";
    const segments = [searchableSegment({ text })];

    expect(buildTranscriptSearchText(segments, thresholds)).toBe(tokenizeForSearch(text).join(' '));
  });

  it('should tokenize CJK text the same way the query tokenizer does', () => {
    const text = '你好世界';
    const segments = [searchableSegment({ text })];

    expect(buildTranscriptSearchText(segments, thresholds)).toBe(tokenizeForSearch(text).join(' '));
  });
});
