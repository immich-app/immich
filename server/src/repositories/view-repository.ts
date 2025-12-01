import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetFileType, AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';
import { asUuid, withExif } from 'src/utils/database';

export class ViewRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  async getUniqueOriginalPaths(userId: string) {
    const results = await this.db
      .selectFrom('asset')
      .innerJoin('asset_file', 'asset.id', 'asset_file.assetId')
      .select((eb) =>
        eb.fn<string>('substring', [eb.ref('asset_file.path'), eb.val('^(.*/)[^/]*$')]).as('directoryPath'),
      )
      .distinct()
      .where('asset.ownerId', '=', asUuid(userId))
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .where('asset.deletedAt', 'is', null)
      .where('asset.fileCreatedAt', 'is not', null)
      .where('asset.fileModifiedAt', 'is not', null)
      .where('asset.localDateTime', 'is not', null)
      .where((eb) => eb(eb.ref('asset_file.type'), '=', AssetFileType.Original))
      .orderBy('directoryPath', 'asc')
      .execute();

    return results.map((row) => row.directoryPath.replaceAll(/\/$/g, ''));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getAssetsByOriginalPath(userId: string, partialPath: string) {
    const normalizedPath = partialPath.replaceAll(/\/$/g, '');

    return this.db
      .selectFrom('asset')
      .innerJoin('asset_file', 'asset.id', 'asset_file.assetId')
      .selectAll('asset')
      .where('asset.ownerId', '=', asUuid(userId))
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .where('asset.deletedAt', 'is', null)
      .where('asset.fileCreatedAt', 'is not', null)
      .where('asset.fileModifiedAt', 'is not', null)
      .where('asset.localDateTime', 'is not', null)
      .where((eb) => eb(eb.ref('asset_file.type'), '=', AssetFileType.Original))
      .where((eb) => eb(eb.ref('asset_file.path'), 'like', `%${normalizedPath}/%`))
      .where((eb) => eb(eb.ref('asset_file.path'), 'not like', `%${normalizedPath}/%/%`))
      .orderBy(
        (eb) => eb.fn('regexp_replace', [eb.ref('asset_file.path'), eb.val('.*/(.+)'), eb.val(String.raw`\\1`)]),
        'asc',
      )
      .$call(withExif)
      .execute();
  }
}
