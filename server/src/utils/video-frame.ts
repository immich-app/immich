/**
 * Parses the byte-range fMP4 HLS playlist produced by video frame extraction (see
 * `VideoFrameExtractionConfig` in `src/utils/media.ts`). The playlist is a plain-text, spec-compliant
 * `.m3u8` describing a single `EXT-X-MAP` init segment followed by one `EXT-X-BYTERANGE` entry per
 * sampled frame, e.g.:
 *
 * ```
 * #EXT-X-MAP:URI="asset.m4s",BYTERANGE="813@0"
 * #EXTINF:1.000000,
 * #EXT-X-BYTERANGE:3843@813
 * asset.m4s
 * ```
 */
export function parseByteRangePlaylist(content: string): {
  initSegmentSize: number;
  frames: { byteOffset: number; byteSize: number }[];
} {
  const initMatch = /^#EXT-X-MAP:URI="[^"]*",BYTERANGE="(\d+)@(\d+)"/m.exec(content);
  const initSegmentSize = initMatch ? Number.parseInt(initMatch[1], 10) : 0;

  const frames: { byteOffset: number; byteSize: number }[] = [];
  const byteRangeRegex = /^#EXT-X-BYTERANGE:(\d+)@(\d+)/gm;
  for (const match of content.matchAll(byteRangeRegex)) {
    frames.push({ byteSize: Number.parseInt(match[1], 10), byteOffset: Number.parseInt(match[2], 10) });
  }

  return { initSegmentSize, frames };
}

/**
 * Parses the raw scdet `mafd` (mean absolute frame difference) interval-change score for each sampled
 * frame, printed by ffmpeg's `metadata=print` filter, e.g.:
 *
 * ```
 * frame:0    pts:0       pts_time:0
 * lavfi.scd.mafd=0.000
 * lavfi.scd.score=0.000
 * ```
 *
 * Frames are emitted in order, so the returned array's index corresponds to `frameIndex`.
 */
export function parseIntervalChangeScores(content: string): number[] {
  const scores: number[] = [];
  const mafdRegex = /lavfi\.scd\.mafd=([\d.]+)/g;
  for (const match of content.matchAll(mafdRegex)) {
    scores.push(Number.parseFloat(match[1]));
  }
  return scores;
}
