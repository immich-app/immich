import { Mocked, vitest } from 'vitest';
import type { RepositoryInterface } from 'src/types.js';
import { MediaRepository } from 'src/repositories/media.repository.js';

export const newMediaRepositoryMock = (): Mocked<RepositoryInterface<MediaRepository>> => {
  return {
    generateThumbnail: vitest.fn().mockImplementation(() => Promise.resolve()),
    writeExif: vitest.fn().mockImplementation(() => Promise.resolve()),
    copyTagGroup: vitest.fn().mockImplementation(() => Promise.resolve()),
    generateThumbhash: vitest.fn().mockResolvedValue(Buffer.from('')),
    decodeImage: vitest.fn().mockResolvedValue({ data: Buffer.from(''), info: {} }),
    extract: vitest.fn().mockResolvedValue(null),
    probe: vitest.fn(),
    probePackets: vitest.fn().mockResolvedValue({
      totalDuration: 0,
      packetCount: 0,
      outputFrames: 0,
      keyframePts: [],
      keyframeAccDuration: [],
      keyframeOwnDuration: [],
    }),
    transcode: vitest.fn(),
    getImageMetadata: vitest.fn(),
    isVideoContainer: vitest.fn().mockResolvedValue(false),
  };
};
