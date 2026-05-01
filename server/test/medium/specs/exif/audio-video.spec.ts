import { Kysely } from 'kysely';
import { resolve } from 'node:path';
import {
  AacProfile,
  AssetType,
  ColorMatrix,
  ColorPrimaries,
  ColorTransfer,
  DvProfile,
  DvSignalCompatibility,
  H264Profile,
  HevcProfile,
} from 'src/enum';
import { DB } from 'src/schema';
import { ExifTestContext, testAssetsDir } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let database: Kysely<DB>;

beforeAll(async () => {
  database = await getKyselyDB();
});

const fixtures = [
  {
    file: 'eiffel-tower.mp4',
    video: {
      codecName: 'h264',
      formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
      formatLongName: 'QuickTime / MOV',
      pixelFormat: 'yuv420p',
      bitrate: 5_128_622,
      frameCount: 557,
      timeBase: 90_000,
      index: 0,
      profile: H264Profile.High,
      level: 40,
      colorPrimaries: ColorPrimaries.Smpte170M,
      colorTransfer: ColorTransfer.Smpte170M,
      colorMatrix: ColorMatrix.Smpte170M,
      dvProfile: null,
      dvLevel: null,
      dvBlSignalCompatibilityId: null,
    },
    audio: { codecName: 'aac', bitrate: 125_629, index: 1, profile: AacProfile.Lc },
    keyframes: {
      totalDuration: 2_012_441,
      packetCount: 557,
      outputFrames: 557,
      pts: [0, 462_502, 925_004, 1_210_454, 1_387_506, 1_542_878, 1_850_008],
      accDuration: [3613, 466_077, 928_541, 1_213_968, 1_391_005, 1_546_364, 1_853_469],
      ownDuration: [3613, 3613, 3613, 3613, 3613, 3613, 3613],
    },
  },
  {
    file: 'waterfall.mp4',
    video: {
      codecName: 'hevc',
      formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
      formatLongName: 'QuickTime / MOV',
      pixelFormat: 'yuvj420p',
      bitrate: 43_363_499,
      frameCount: 309,
      timeBase: 90_000,
      index: 2,
      profile: HevcProfile.Main,
      level: 156,
      colorPrimaries: ColorPrimaries.Bt709,
      colorTransfer: ColorTransfer.Bt709,
      colorMatrix: ColorMatrix.Bt709,
      dvProfile: null,
      dvLevel: null,
      dvBlSignalCompatibilityId: null,
    },
    audio: { codecName: 'aac', bitrate: 191_878, index: 1, profile: null },
    keyframes: {
      totalDuration: 932_286,
      packetCount: 309,
      outputFrames: 309,
      pts: [0, 89_987, 179_974, 269_961, 359_948, 449_936, 539_923, 629_910, 725_166, 815_273, 905_295],
      accDuration: [2999, 92_987, 182_974, 272_961, 362_948, 452_934, 542_922, 632_909, 728_175, 818_274, 908_296],
      ownDuration: [2999, 3000, 3000, 3000, 3000, 2998, 2999, 2999, 3009, 3001, 3001],
    },
  },
  {
    file: 'train.mov',
    video: {
      codecName: 'hevc',
      formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
      formatLongName: 'QuickTime / MOV',
      pixelFormat: 'yuv420p10le',
      bitrate: 12_595_191,
      frameCount: 1229,
      timeBase: 600,
      index: 0,
      profile: HevcProfile.Main10,
      level: 123,
      colorPrimaries: ColorPrimaries.Bt2020,
      colorTransfer: ColorTransfer.AribStdB67,
      colorMatrix: ColorMatrix.Bt2020Nc,
      dvProfile: DvProfile.Dvhe08,
      dvLevel: 5,
      dvBlSignalCompatibilityId: DvSignalCompatibility.Hlg,
    },
    audio: { codecName: 'aac', bitrate: 175_477, index: 1, profile: AacProfile.Lc },
    keyframes: {
      totalDuration: 12_290,
      packetCount: 1229,
      outputFrames: 1303,
      pts: [
        0, 601, 1201, 1802, 2402, 3003, 3604, 4204, 4805, 5405, 6006, 6607, 7207, 7808, 8408, 9009, 9609, 10_210,
        10_811, 11_411, 12_062, 12_703,
      ],
      accDuration: [
        10, 580, 1180, 1780, 2380, 2980, 3580, 4180, 4780, 5380, 5980, 6580, 7180, 7780, 8380, 8980, 9580, 10_180,
        10_780, 11_380, 11_780, 12_100,
      ],
      ownDuration: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    },
  },
];

const isExpected = <T extends keyof DB>(name: T, id: string, expected: Omit<DB[T], 'assetId'>) => {
  const { table, ref } = database.dynamic;
  const res = database.selectFrom(table(name).as('t')).selectAll().where(ref('assetId'), '=', id).executeTakeFirst();
  return expect(res).resolves.toEqual({ ...expected, assetId: id });
};

describe('video metadata extraction', () => {
  it.each(fixtures)('$file', async ({ file, video, audio, keyframes }) => {
    const ctx = new ExifTestContext(database);
    const { user } = await ctx.newUser();
    const originalPath = resolve(testAssetsDir, 'videos', file);
    const { asset } = await ctx.newAsset({ ownerId: user.id, originalPath, type: AssetType.Video });

    await ctx.sut.handleMetadataExtraction({ id: asset.id });

    await isExpected('asset_audio', asset.id, audio);
    await isExpected('asset_video', asset.id, video);
    await isExpected('asset_keyframe', asset.id, keyframes);
  });
});
