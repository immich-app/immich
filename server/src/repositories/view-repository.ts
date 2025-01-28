import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { withExif } from 'src/entities/asset.entity';
import { asUuid } from 'src/utils/database';

export class ViewRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  async getUniqueOriginalPaths(userId: string) {
    const results = await this.db
      .selectFrom('assets')
      .select((eb) => eb.fn<string>('substring', ['assets.originalPath', eb.val('^(.*/)[^/]*$')]).as('directoryPath'))
      .distinct()
      .where('ownerId', '=', asUuid(userId))
      .where('isVisible', '=', true)
      .where('isArchived', '=', false)
      .where('deletedAt', 'is', null)
      .execute();

    return results.map((row) => row.directoryPath.replaceAll(/^\/|\/$/g, ''));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getAssetsByOriginalPath(userId: string, partialPath: string) {
    const normalizedPath = partialPath.replaceAll(/^\/|\/$/g, '');

    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .$call(withExif)
      .where('ownerId', '=', asUuid(userId))
      .where('isVisible', '=', true)
      .where('isArchived', '=', false)
      .where('deletedAt', 'is', null)
      .where('originalPath', 'like', `%${normalizedPath}/%`)
      .where('originalPath', 'not like', `%${normalizedPath}/%/%`)
      .orderBy(
        (eb) => eb.fn('regexp_replace', ['assets.originalPath', eb.val('.*/(.+)'), eb.val(String.raw`\1`)]),
        'asc',
      )
      .execute();
  }
}
