import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
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

  @GenerateSql({ params: [{ sourceAssetId: DummyValue.UUID, targetAssetId: DummyValue.UUID }] })
  async copySharedLinks({ sourceAssetId, targetAssetId }: { sourceAssetId: string; targetAssetId: string }) {
    return this.db
      .insertInto('shared_link_asset')
      .expression((eb) =>
        eb
          .selectFrom('shared_link_asset')
          .select((eb) => [eb.val(targetAssetId).as('assetsId'), 'shared_link_asset.sharedLinksId'])
          .where('shared_link_asset.assetsId', '=', sourceAssetId),
      )
      .onConflict((oc) => oc.doNothing())
      .execute();
  }
}
