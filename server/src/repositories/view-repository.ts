import { type Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { AssetVisibility } from 'src/enum.js';
import { DB } from 'src/schema/index.js';
import { asUuid, withExif } from 'src/utils/database.js';

const escapeLikePattern = (value: string) => value.replaceAll(/[\\%_]/g, String.raw`\$&`);

export class ViewRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  async getUniqueOriginalPaths(userId: string) {
    const originalPath = sql.ref('asset.originalPath');
    const results = await this.db
      .selectFrom('asset')
      .select(
        sql<string>`left(${originalPath}, length(${originalPath}) - length(split_part(${originalPath}, '/', -1)))`.as(
          'directoryPath',
        ),
      )
      .distinct()
      .where('ownerId', '=', asUuid(userId))
      .where('visibility', '=', AssetVisibility.Timeline)
      .where('deletedAt', 'is', null)
      .where('fileCreatedAt', 'is not', null)
      .where('fileModifiedAt', 'is not', null)
      .where('localDateTime', 'is not', null)
      .orderBy('directoryPath', 'asc')
      .execute();

    return results.map((row) => row.directoryPath.replaceAll(/\/$/g, ''));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getAssetsByOriginalPath(userId: string, partialPath: string) {
    const normalizedPath = partialPath.replaceAll(/\/$/g, '');
    // the mobile app strips the leading slash from the folder path
    const directories =
      normalizedPath === '' || normalizedPath.startsWith('/')
        ? [normalizedPath]
        : [normalizedPath, `/${normalizedPath}`];

    return this.db
      .selectFrom('asset')
      .selectAll('asset')
      .$call(withExif)
      .where('ownerId', '=', asUuid(userId))
      .where('visibility', '=', AssetVisibility.Timeline)
      .where('deletedAt', 'is', null)
      .where('fileCreatedAt', 'is not', null)
      .where('fileModifiedAt', 'is not', null)
      .where('localDateTime', 'is not', null)
      .where((eb) =>
        eb.or(
          directories.map((directory) => {
            const prefix = `${escapeLikePattern(directory)}/`;
            return eb.and([eb('originalPath', 'like', `${prefix}%`), eb('originalPath', 'not like', `${prefix}%/%`)]);
          }),
        ),
      )
      .orderBy(
        (eb) => eb.fn('regexp_replace', ['asset.originalPath', eb.val('.*/(.+)'), eb.val(String.raw`\1`)]),
        'asc',
      )
      .execute();
  }
}
