/**
 * Parses the byte-range fMP4 HLS playlist (`.m3u8`) describing a single `EXT-X-MAP`
 * init segment followed by one `EXT-X-BYTERANGE` entry per sampled frame, e.g.:
 *
 * ```
 * #EXT-X-MAP:URI="asset.m4s",BYTERANGE="813@0"
 * #EXTINF:1.000000,
 * #EXT-X-BYTERANGE:3843@813
 * asset.m4s
 * ```
 */
export function parseByteRangePlaylist(content: string): {
  byteRanges: { byteOffset: number; byteSize: number }[];
} {
  const byteRanges: { byteOffset: number; byteSize: number }[] = [];
  const byteRangeRegex = /^#EXT-X-BYTERANGE:(\d+)@(\d+)/gm;
  for (const match of content.matchAll(byteRangeRegex)) {
    byteRanges.push({ byteSize: Math.trunc(Number(match[1])), byteOffset: Math.trunc(Number(match[2])) });
  }

  return { byteRanges };
}

/**
 * Parses the raw scdet `mafd` (mean absolute frame difference) interval-change score for each sampled frame:
 *
 * ```
 * frame:0    pts:0       pts_time:0
 * lavfi.scd.mafd=0.000
 * lavfi.scd.score=0.000
 * ```
 */
export function parseIntervalChangeScores(content: string): number[] {
  const scores: number[] = [];
  const mafdRegex = /lavfi\.scd\.mafd=([\d.]+)/g;
  for (const match of content.matchAll(mafdRegex)) {
    scores.push(Number(match[1]));
  }
  return scores;
}
