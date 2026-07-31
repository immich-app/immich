import { TranscriptionStatus } from 'src/enum';

/**
 * Audio handed to the transcription model is raw little-endian signed 16-bit mono PCM.
 * At chunk scale compression buys nothing, while raw removes a decode dependency and is
 * byte-identical to what the model consumes, so a chunk is just a byte range of the
 * extracted stream.
 */
export const PCM_SAMPLE_RATE = 16_000;
export const PCM_BYTES_PER_SAMPLE = 2;
export const PCM_BYTES_PER_SECOND = PCM_SAMPLE_RATE * PCM_BYTES_PER_SAMPLE;

/** Half-width, in seconds, of the window searched around a target offset for a silence to cut at. */
export const SILENCE_SEARCH_WINDOW = 5;
/** Loudness below which `silencedetect` considers audio quiet, in dBFS. */
export const SILENCE_THRESHOLD_DB = -30;
/** Shortest quiet stretch, in seconds, that counts as a silence worth cutting at. */
export const SILENCE_MIN_DURATION = 0.25;

/** Inference is never allowed less than this, so first-use model loading is not mistaken for a hang. */
export const MINIMUM_INFERENCE_TIMEOUT = 60_000;

/**
 * Progress is recorded in whole milliseconds while boundaries are seconds, so comparing the two
 * needs slack for the rounding. Half a millisecond is the largest error that round-trip can produce.
 */
const OFFSET_EPSILON = 0.001;

/** A resumed remainder shorter than this cannot hold a word, so re-planning drops it. */
const MINIMUM_RESUME_REMAINDER = 0.25;

export type SilencePeriod = { start: number; end: number };
export type AudioChunk = { start: number; end: number };

export type ChunkPlanOptions = {
  duration: number;
  silences: SilencePeriod[];
  targetDuration: number;
  searchWindow?: number;
};

/**
 * Picks the cut point nearest `target` that falls inside a detected silence, or undefined when no
 * silence reaches the window. Cutting mid-word does not produce a truncated word: the model
 * hallucinates a different one and then invents plausible text to complete the sentence it believes
 * it heard, so a boundary in silence is worth a few seconds of deviation from the target.
 */
const findSilentBoundary = (silences: SilencePeriod[], lower: number, upper: number, target: number) => {
  let boundary: number | undefined;
  let distance = Infinity;

  for (const silence of silences) {
    const from = Math.max(silence.start, lower);
    const to = Math.min(silence.end, upper);
    if (to <= from) {
      continue;
    }

    // The middle of the quiet stretch is the point furthest from speech on either side, which
    // leaves the most room for the imprecision in where silence detection places its edges.
    const candidate = (from + to) / 2;
    const candidateDistance = Math.abs(candidate - target);
    // Strict comparison keeps the earliest of equally good candidates, which keeps planning
    // deterministic for a given silence list.
    if (candidateDistance < distance) {
      boundary = candidate;
      distance = candidateDistance;
    }
  }

  return boundary;
};

/**
 * Splits `duration` seconds of audio into chunks of roughly `targetDuration`, moving each boundary
 * onto the nearest silence within the search window and falling back to a hard cut when none
 * qualifies. Deterministic: identical inputs always produce identical boundaries.
 */
export const planChunks = ({
  duration,
  silences,
  targetDuration,
  searchWindow = SILENCE_SEARCH_WINDOW,
}: ChunkPlanOptions): AudioChunk[] => {
  if (duration <= 0 || targetDuration <= 0) {
    return [];
  }

  const ordered = silences
    .filter((silence) => silence.end > silence.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const chunks: AudioChunk[] = [];
  let cursor = 0;

  // Stop splitting once the remainder is short enough to be one chunk, so the last chunk absorbs
  // the tail instead of leaving a sliver behind it.
  while (duration - cursor > targetDuration + searchWindow) {
    const target = cursor + targetDuration;
    const lower = Math.max(target - searchWindow, cursor);
    const upper = Math.min(target + searchWindow, duration);
    const silent = findSilentBoundary(ordered, lower, upper, target);
    const boundary = silent !== undefined && silent > cursor ? silent : target;

    chunks.push({ start: cursor, end: boundary });
    cursor = boundary;
  }

  chunks.push({ start: cursor, end: duration });

  return chunks;
};

/**
 * Returns the chunks still to process given a progress offset in seconds.
 *
 * Progress is recorded as a time offset rather than a chunk index because indices are not stable
 * across runs: if the target chunk size or the silence thresholds change between a failure and its
 * retry, a given index denotes a different region. An offset stays meaningful under any re-planning,
 * which is why a boundary that has moved is clipped back to the offset rather than skipped — the
 * audio between the offset and the next boundary has never been transcribed.
 */
export const planResume = (chunks: AudioChunk[], offset: number): AudioChunk[] => {
  if (offset <= 0) {
    return chunks;
  }

  const pending: AudioChunk[] = [];

  for (const chunk of chunks) {
    if (chunk.end <= offset + OFFSET_EPSILON) {
      continue;
    }

    if (chunk.start >= offset - OFFSET_EPSILON) {
      pending.push(chunk);
      continue;
    }

    if (chunk.end - offset >= MINIMUM_RESUME_REMAINDER) {
      pending.push({ start: offset, end: chunk.end });
    }
  }

  return pending;
};

/** One window's raw detection as the model reports it, before any decision is taken about it. */
export type LanguageDetection = { language: string; languageConfidence: number };

/**
 * Resolves the language of each segment, holding on to the established language through detections
 * the model is not confident about.
 *
 * Detecting continuously is what lets a recording that changes language mid-way transcribe
 * correctly past the change, but it also multiplies exposure to the misdetection failure mode, in
 * which the model transliterates phonetically into confident nonsense rather than failing visibly.
 * Music, silence and ambient noise are the usual triggers, and they are exactly the cases the model
 * is unsure about; a genuine change of language is not. So a detection is believed only at or above
 * `minConfidence`, and below it the segment inherits what came before.
 *
 * Since a low-confidence segment resolves to the established language rather than to its own
 * detection, the established language only ever moves on a confident detection: a run of unsure
 * segments cannot walk the transcript away from the language actually being spoken, however long
 * it runs. That also makes the last resolved language the established one, which is what the caller
 * carries into the next chunk.
 *
 * The first segment of the first chunk is the one case with nothing to inherit. It keeps its own
 * detection whatever the confidence, on the grounds that a guess is still better than no language
 * at all, and the first confident detection after it takes over.
 */
export const resolveSegmentLanguages = (
  detections: LanguageDetection[],
  minConfidence: number,
  established?: string,
): string[] => {
  const resolved: string[] = [];
  let current = established;

  for (const detection of detections) {
    // At the threshold exactly the model is confident enough: the setting reads as the confidence
    // required, so requiring more than it would be off by one detection's worth of hesitation.
    if (current === undefined || detection.languageConfidence >= minConfidence) {
      current = detection.language;
    }

    resolved.push(current);
  }

  return resolved;
};

/** The model's own signals about a segment, as stored. Null for segments written before they were. */
export type SegmentQuality = {
  noSpeechProbability: number | null;
  avgLogProbability: number | null;
  compressionRatio: number | null;
};

/** Read-time thresholds, taken from the administrator settings on every read. */
export type QualityThresholds = {
  maxNoSpeechProbability: number;
  minAvgLogProbability: number;
  maxCompressionRatio: number;
};

/**
 * Whether a segment reads as a hallucination rather than as speech.
 *
 * Recognition run on near-silence does not produce nothing. It produces its training data's most
 * common captions — subscription pleas, translation credits — confidently and with plausible
 * timings, and it gets stuck repeating phrases. Voice activity detection cuts both down a long way
 * but cannot remove them, because breathing, laughter and distant noise are speech as far as it is
 * concerned.
 *
 * Two rules, taking the model's own numbers rather than a list of phrases. A blocklist would be
 * per-language, unbounded and permanently out of date; these identify the same segments for a
 * reason that holds in every language.
 *
 * The first rule needs both of its signals, because either alone has a legitimate explanation: a
 * high no-speech probability also describes quiet but real speech, and a low average
 * log-probability also describes real speech the model found hard — an accent, a crowd, a bad
 * microphone. Together they say the model neither heard speech nor believed what it wrote down.
 *
 * The second stands alone. Compression ratio is text length over its compressed size, so nothing
 * but a repetition loop reaches a high value; there is no innocent reading to pair it against.
 *
 * At a threshold exactly the segment is kept. The settings read as the worst still tolerated, so
 * discarding at the boundary would be off by one.
 */
export const isHallucination = (segment: SegmentQuality, thresholds: QualityThresholds) => {
  const { noSpeechProbability, avgLogProbability, compressionRatio } = segment;

  if (compressionRatio !== null && compressionRatio > thresholds.maxCompressionRatio) {
    return true;
  }

  // A segment stored before these signals existed has nothing to judge, and judging it on a
  // missing number would mean silently dropping every transcript made before this change.
  return (
    noSpeechProbability !== null &&
    avgLogProbability !== null &&
    noSpeechProbability > thresholds.maxNoSpeechProbability &&
    avgLogProbability < thresholds.minAvgLogProbability
  );
};

/**
 * Drops the segments that read as hallucinations, leaving the stored rows untouched.
 *
 * Applied when a transcript is read rather than when it is written. The rows are the record of
 * what the model produced; the caption track and the search text are derived from them. Filtering
 * at ingest would make every later change of threshold a re-run of inference across the whole
 * library, whereas filtering here makes it a query.
 */
export const filterHallucinations = <T extends SegmentQuality>(segments: T[], thresholds: QualityThresholds): T[] =>
  segments.filter((segment) => !isHallucination(segment, thresholds));

/**
 * The same chunk takes seconds on a GPU and minutes on a low-power CPU, so the timeout scales with
 * chunk duration rather than being fixed.
 */
export const getInferenceTimeout = (chunk: AudioChunk, multiplier: number) =>
  Math.max(MINIMUM_INFERENCE_TIMEOUT, Math.round((chunk.end - chunk.start) * multiplier * 1000));

/**
 * Whole-asset budget for one transcription job, in milliseconds.
 *
 * The inference timeout bounds a single model call and says nothing about how long the job as a
 * whole may run; a long video is hundreds of calls. Budgeting against the asset's own duration is
 * what stops a pathological file — every chunk returning just under its ceiling — from holding a
 * queue that runs one job at a time for the rest of the day.
 *
 * The floor is the inference floor because the budget is only ever consulted between chunks: the
 * first chunk of a run always goes ahead, so no job is killed having transcribed nothing.
 */
export const getJobTimeout = (duration: number, multiplier: number) =>
  Math.max(MINIMUM_INFERENCE_TIMEOUT, Math.round(duration * multiplier * 1000));

/** Byte range of a chunk within the extracted PCM stream, clamped to what was actually written. */
export const getChunkByteRange = (chunk: AudioChunk, byteLength: number) => {
  const align = (seconds: number) => Math.min(Math.round(seconds * PCM_SAMPLE_RATE) * PCM_BYTES_PER_SAMPLE, byteLength);
  const position = align(chunk.start);
  return { position, length: Math.max(align(chunk.end) - position, 0) };
};

/** Duration in seconds of an extracted PCM stream of `byteLength` bytes. */
export const getPcmDuration = (byteLength: number) => byteLength / PCM_BYTES_PER_SECOND;

/**
 * Never started, in flight and complete are three different answers, and no single column gives
 * all three: `transcribedAt` alone cannot distinguish a job that is running from one that was
 * never queued, and the progress marker alone cannot say whether the last chunk landed.
 */
export const getTranscriptionStatus = (status?: {
  transcribedAt: unknown | null;
  transcriptionProgressMs: number | null;
}) => {
  if (status?.transcribedAt) {
    return TranscriptionStatus.Complete;
  }

  return status?.transcriptionProgressMs === null || status?.transcriptionProgressMs === undefined
    ? TranscriptionStatus.NotStarted
    : TranscriptionStatus.InProgress;
};
