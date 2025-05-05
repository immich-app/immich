import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB, MoveHistory } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetPathType, PathType } from 'src/enum';

@Injectable()
export class MoveRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  create(entity: Insertable<MoveHistory>) {
    return this.db.insertInto('move_history').values(entity).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getByEntity(entityId: string, pathType: PathType) {
    return this.db
      .selectFrom('move_history')
      .selectAll()
      .where('entityId', '=', entityId)
      .where('pathType', '=', pathType)
      .executeTakeFirst();
  }

  update(id: string, entity: Updateable<MoveHistory>) {
    return this.db
      .updateTable('move_history')
      .set(entity)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  delete(id: string) {
    return this.db.deleteFrom('move_history').where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql()
  async cleanMoveHistory(): Promise<void> {
    await this.db
      .deleteFrom('move_history')
      .where((eb) =>
        eb(
          'move_history.entityId',
          'not in',
          eb.selectFrom('assets').select('id').whereRef('assets.id', '=', 'move_history.entityId'),
        ),
      )
      .where('move_history.pathType', '=', sql.lit(AssetPathType.ORIGINAL))
      .execute();
  }

  @GenerateSql()
  async cleanMoveHistorySingle(assetId: string): Promise<void> {
    await this.db
      .deleteFrom('move_history')
      .where('move_history.pathType', '=', sql.lit(AssetPathType.ORIGINAL))
      .where('entityId', '=', assetId)
      .execute();
  }
}
