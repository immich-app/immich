import type { Kysely } from 'kysely';
import { trim } from 'lodash-es';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { AssetVisibility } from 'src/enum.js';
import { DB } from 'src/schema/index.js';
import { asUuid, onOriginal, withExif } from 'src/utils/database.js';

const escapeLikePattern = (value: string) => value.replaceAll(/[\\%_]/g, String.raw`\$&`);

export class ViewRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  async getUniqueOriginalPaths(userId: string) {
    const results = await this.db
      .selectFrom('asset')
      .innerJoin('asset_file as asset_original', onOriginal)
      .select((eb) => eb.fn<string>('substring', ['asset_original.path', eb.val('^(.*/)[^/]*$')]).as('directoryPath'))
      .distinct()
      .where('asset.ownerId', '=', asUuid(userId))
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .where('asset.deletedAt', 'is', null)
      .where('asset.fileCreatedAt', 'is not', null)
      .where('asset.fileModifiedAt', 'is not', null)
      .where('asset.localDateTime', 'is not', null)
      .orderBy('directoryPath', 'asc')
      .execute();

    return results.map((row) => row.directoryPath.replaceAll(/\/$/g, ''));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getAssetsByOriginalPath(userId: string, partialPath: string) {
    const directory = trim(partialPath, '/');
    const prefix = escapeLikePattern(directory ? `/${directory}/` : '/');

    return this.db
      .selectFrom('asset')
      .$call(withExif)
      .innerJoin('asset_file as asset_original', onOriginal)
      .selectAll('asset')
      .where('asset.ownerId', '=', asUuid(userId))
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .where('asset.deletedAt', 'is', null)
      .where('asset.fileCreatedAt', 'is not', null)
      .where('asset.fileModifiedAt', 'is not', null)
      .where('asset.localDateTime', 'is not', null)
      .where('asset_original.path', 'like', `${prefix}%`)
      .where('asset_original.path', 'not like', `${prefix}%/%`)
      .orderBy(
        (eb) => eb.fn('regexp_replace', ['asset_original.path', eb.val('.*/(.+)'), eb.val(String.raw`\1`)]),
        'asc',
      )
      .execute();
  }
}
