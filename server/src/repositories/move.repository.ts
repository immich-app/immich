import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB, MoveHistory } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { MoveEntity } from 'src/entities/move.entity';
import { PathType } from 'src/enum';

export type MoveCreate = Pick<MoveEntity, 'oldPath' | 'newPath' | 'entityId' | 'pathType'> & Partial<MoveEntity>;

@Injectable()
export class MoveRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  create(entity: Insertable<MoveHistory>): Promise<MoveEntity> {
    return this.db
      .insertInto('move_history')
      .values(entity)
      .returningAll()
      .executeTakeFirstOrThrow() as Promise<MoveEntity>;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getByEntity(entityId: string, pathType: PathType): Promise<MoveEntity | undefined> {
    return this.db
      .selectFrom('move_history')
      .selectAll()
      .where('entityId', '=', entityId)
      .where('pathType', '=', pathType)
      .executeTakeFirst() as Promise<MoveEntity | undefined>;
  }

  update(id: string, entity: Updateable<MoveHistory>): Promise<MoveEntity> {
    return this.db
      .updateTable('move_history')
      .set(entity)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow() as unknown as Promise<MoveEntity>;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  delete(id: string): Promise<MoveEntity> {
    return this.db
      .deleteFrom('move_history')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow() as unknown as Promise<MoveEntity>;
  }
}
