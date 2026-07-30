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

/**
 * The same chunk takes seconds on a GPU and minutes on a low-power CPU, so the timeout scales with
 * chunk duration rather than being fixed.
 */
export const getInferenceTimeout = (chunk: AudioChunk, multiplier: number) =>
  Math.max(MINIMUM_INFERENCE_TIMEOUT, Math.round((chunk.end - chunk.start) * multiplier * 1000));

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
