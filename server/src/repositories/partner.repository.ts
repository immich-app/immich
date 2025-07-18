import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, NotNull, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { PartnerTable } from 'src/schema/tables/partner.table';

export interface PartnerIds {
  sharedById: string;
  sharedWithId: string;
}

export enum PartnerDirection {
  SharedBy = 'shared-by',
  SharedWith = 'shared-with',
}

const withSharedBy = (eb: ExpressionBuilder<DB, 'partner'>) => {
  return jsonObjectFrom(
    eb.selectFrom('user as sharedBy').select(columns.user).whereRef('sharedBy.id', '=', 'partner.sharedById'),
  ).as('sharedBy');
};

const withSharedWith = (eb: ExpressionBuilder<DB, 'partner'>) => {
  return jsonObjectFrom(
    eb.selectFrom('user as sharedWith').select(columns.user).whereRef('sharedWith.id', '=', 'partner.sharedWithId'),
  ).as('sharedWith');
};

@Injectable()
export class PartnerRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getAll(userId: string) {
    return this.builder()
      .where((eb) => eb.or([eb('sharedWithId', '=', userId), eb('sharedById', '=', userId)]))
      .execute();
  }

  @GenerateSql({ params: [{ sharedWithId: DummyValue.UUID, sharedById: DummyValue.UUID }] })
  get({ sharedWithId, sharedById }: PartnerIds) {
    return this.builder()
      .where('sharedWithId', '=', sharedWithId)
      .where('sharedById', '=', sharedById)
      .executeTakeFirst();
  }

  create(values: Insertable<PartnerTable>) {
    return this.db
      .insertInto('partner')
      .values(values)
      .returningAll()
      .returning(withSharedBy)
      .returning(withSharedWith)
      .$narrowType<{ sharedWith: NotNull; sharedBy: NotNull }>()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ sharedWithId: DummyValue.UUID, sharedById: DummyValue.UUID }, { inTimeline: true }] })
  update({ sharedWithId, sharedById }: PartnerIds, values: Updateable<PartnerTable>) {
    return this.db
      .updateTable('partner')
      .set(values)
      .where('sharedWithId', '=', sharedWithId)
      .where('sharedById', '=', sharedById)
      .returningAll()
      .returning(withSharedBy)
      .returning(withSharedWith)
      .$narrowType<{ sharedWith: NotNull; sharedBy: NotNull }>()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ sharedWithId: DummyValue.UUID, sharedById: DummyValue.UUID }] })
  async remove({ sharedWithId, sharedById }: PartnerIds) {
    await this.db
      .deleteFrom('partner')
      .where('sharedWithId', '=', sharedWithId)
      .where('sharedById', '=', sharedById)
      .execute();
  }

  private builder() {
    return this.db
      .selectFrom('partner')
      .innerJoin('user as sharedBy', (join) =>
        join.onRef('partner.sharedById', '=', 'sharedBy.id').on('sharedBy.deletedAt', 'is', null),
      )
      .innerJoin('user as sharedWith', (join) =>
        join.onRef('partner.sharedWithId', '=', 'sharedWith.id').on('sharedWith.deletedAt', 'is', null),
      )
      .selectAll('partner')
      .select(withSharedBy)
      .select(withSharedWith);
  }
}
