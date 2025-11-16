import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';

export class SharedLinkAssetRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async remove(sharedLinkId: string, assetId: string[]) {
    const deleted = await this.db
      .deleteFrom('shared_link_asset')
      .where('shared_link_asset.sharedLinkId', '=', sharedLinkId)
      .where('shared_link_asset.assetId', 'in', assetId)
      .returning('assetId')
      .execute();

    return deleted.map((row) => row.assetId);
  }

  @GenerateSql({ params: [{ sourceAssetId: DummyValue.UUID, targetAssetId: DummyValue.UUID }] })
  async copySharedLinks({ sourceAssetId, targetAssetId }: { sourceAssetId: string; targetAssetId: string }) {
    return this.db
      .insertInto('shared_link_asset')
      .expression((eb) =>
        eb
          .selectFrom('shared_link_asset')
          .select((eb) => [eb.val(targetAssetId).as('assetId'), 'shared_link_asset.sharedLinkId'])
          .where('shared_link_asset.assetId', '=', sourceAssetId),
      )
      .onConflict((oc) => oc.doNothing())
      .execute();
  }
}
