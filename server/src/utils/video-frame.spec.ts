import { parseByteRangePlaylist, parseIntervalChangeScores } from 'src/utils/video-frame';
import { describe, expect, it } from 'vitest';

describe('parseByteRangePlaylist', () => {
  it('parses each sampled frame byte range from a valid playlist', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-VERSION:7',
      '#EXT-X-MAP:URI="asset.m4s",BYTERANGE="813@0"',
      '#EXTINF:1.000000,',
      '#EXT-X-BYTERANGE:3843@813',
      'asset.m4s',
      '#EXTINF:1.000000,',
      '#EXT-X-BYTERANGE:3238@4656',
      'asset.m4s',
      '#EXT-X-ENDLIST',
    ].join('\n');

    expect(parseByteRangePlaylist(playlist)).toEqual({
      byteRanges: [
        { byteOffset: 813, byteSize: 3843 },
        { byteOffset: 4656, byteSize: 3238 },
      ],
    });
  });

  it('does not mistake the EXT-X-MAP init segment byte range for a sampled frame', () => {
    const playlist = ['#EXTM3U', '#EXT-X-MAP:URI="asset.m4s",BYTERANGE="813@0"', '#EXT-X-ENDLIST'].join('\n');

    expect(parseByteRangePlaylist(playlist)).toEqual({ byteRanges: [] });
  });

  it('returns an empty array when no frames were extracted', () => {
    expect(parseByteRangePlaylist('')).toEqual({ byteRanges: [] });
  });

  it('parses a single frame', () => {
    const playlist = ['#EXTM3U', '#EXT-X-BYTERANGE:100@0', 'asset.m4s', '#EXT-X-ENDLIST'].join('\n');

    expect(parseByteRangePlaylist(playlist)).toEqual({ byteRanges: [{ byteOffset: 0, byteSize: 100 }] });
  });
});

describe('parseIntervalChangeScores', () => {
  it('parses the mafd score for each frame', () => {
    const scores = [
      'frame:0    pts:0       pts_time:0',
      'lavfi.scd.mafd=0.000',
      'lavfi.scd.score=0.000',
      'frame:1    pts:1       pts_time:1',
      'lavfi.scd.mafd=2.516',
      'lavfi.scd.score=2.516',
    ].join('\n');

    expect(parseIntervalChangeScores(scores)).toEqual([0, 2.516]);
  });

  it('ignores the score line, only reading mafd', () => {
    const scores = ['lavfi.scd.mafd=12.345', 'lavfi.scd.score=99.999'].join('\n');

    expect(parseIntervalChangeScores(scores)).toEqual([12.345]);
  });

  it('returns an empty array when there are no scores', () => {
    expect(parseIntervalChangeScores('')).toEqual([]);
  });
});
