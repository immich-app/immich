import { Kysely } from 'kysely';
import { resolve } from 'node:path';
import { AssetType } from 'src/enum';
import { DB } from 'src/schema';
import { withAudioStream, withVideoFormat, withVideoPackets, withVideoStream } from 'src/utils/database';
import { eiffelTower, train, waterfall } from 'test/fixtures/media.stub';
import { ExifTestContext, testAssetsDir } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let database: Kysely<DB>;

beforeAll(async () => {
  database = await getKyselyDB();
});

const fixtures = [eiffelTower, waterfall, train];

describe('video metadata extraction', () => {
  it.each(fixtures)('$originalPath', async ({ originalPath: path, videoStream, audioStream, packets, format }) => {
    const ctx = new ExifTestContext(database);
    const { user } = await ctx.newUser();
    const originalPath = resolve(testAssetsDir, 'videos', path);
    const { asset } = await ctx.newAsset({ ownerId: user.id, originalPath, type: AssetType.Video });

    await ctx.sut.handleMetadataExtraction({ id: asset.id });

    const result = await database
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .innerJoin('asset_video', 'asset.id', 'asset_video.assetId')
      .innerJoin('asset_keyframe', 'asset.id', 'asset_keyframe.assetId')
      .leftJoin('asset_audio', 'asset.id', 'asset_audio.assetId')
      .where('asset.id', '=', asset.id)
      .select((eb) => withVideoStream(eb).$notNull().as('videoStream'))
      .select((eb) => withAudioStream(eb).as('audioStream'))
      .select((eb) => withVideoPackets(eb).$notNull().as('packets'))
      .select((eb) => withVideoFormat(eb).$notNull().as('format'))
      .executeTakeFirst();

    expect(result).toEqual({ videoStream, audioStream, packets, format });
  });
});
