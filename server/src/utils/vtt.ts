import { TranscriptionStatus } from 'src/enum';

const pad = (value: number, width = 2) => value.toString().padStart(width, '0');

const formatVttTimestamp = (seconds: number): string => {
  const totalMs = Math.round(seconds * 1000);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(ms, 3)}`;
};

export type TranscriptProgress = {
  status: TranscriptionStatus;
  /** How far into the audio the transcript is committed, in milliseconds. */
  progressMs: number;
};

/**
 * Renders a transcript as WebVTT, carrying the job state in `NOTE` blocks. Players ignore notes, so
 * a partial transcript renders as a caption track exactly like a finished one, while a client that
 * wants to keep polling can tell a transcript that has not started from one still filling in.
 */
export const toWebVtt = (
  segments: { startTime: number; endTime: number; text: string; correctedText: string | null }[],
  progress: TranscriptProgress,
): string => {
  let vtt = 'WEBVTT\n\n';
  vtt += `NOTE immich-transcription-status: ${progress.status}\n`;
  vtt += `NOTE immich-transcription-progress-ms: ${progress.progressMs}\n\n`;
  for (const segment of segments) {
    const text = segment.correctedText ?? segment.text;
    vtt += `${formatVttTimestamp(segment.startTime)} --> ${formatVttTimestamp(segment.endTime)}\n${text}\n\n`;
  }
  return vtt;
};
