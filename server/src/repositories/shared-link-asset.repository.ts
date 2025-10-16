import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/schema';

export class SharedLinkAssetRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async remove(sharedLinkId: string, assetsId: string[]) {
    const deleted = await this.db
      .deleteFrom('shared_link_asset')
      .where('shared_link_asset.sharedLinksId', '=', sharedLinkId)
      .where('shared_link_asset.assetsId', 'in', assetsId)
      .returning('assetsId')
      .execute();

    return deleted.map((row) => row.assetsId);
  }
}
