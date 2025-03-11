import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns, Partner } from 'src/database';
import { DB, Partners } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';

export interface PartnerIds {
  sharedById: string;
  sharedWithId: string;
}

export enum PartnerDirection {
  SharedBy = 'shared-by',
  SharedWith = 'shared-with',
}

const withSharedBy = (eb: ExpressionBuilder<DB, 'partners'>) => {
  return jsonObjectFrom(
    eb.selectFrom('users as sharedBy').select(columns.userDto).whereRef('sharedBy.id', '=', 'partners.sharedById'),
  ).as('sharedBy');
};

const withSharedWith = (eb: ExpressionBuilder<DB, 'partners'>) => {
  return jsonObjectFrom(
    eb
      .selectFrom('users as sharedWith')
      .select(columns.userDto)
      .whereRef('sharedWith.id', '=', 'partners.sharedWithId'),
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
      .executeTakeFirst() as Promise<Partner | undefined>;
  }

  @GenerateSql({ params: [{ sharedWithId: DummyValue.UUID, sharedById: DummyValue.UUID }] })
  create(values: Insertable<Partners>) {
    return this.db
      .insertInto('partners')
      .values(values)
      .returningAll()
      .returning(withSharedBy)
      .returning(withSharedWith)
      .executeTakeFirstOrThrow() as Promise<Partner>;
  }

  @GenerateSql({ params: [{ sharedWithId: DummyValue.UUID, sharedById: DummyValue.UUID }, { inTimeline: true }] })
  update({ sharedWithId, sharedById }: PartnerIds, values: Updateable<Partners>) {
    return this.db
      .updateTable('partners')
      .set(values)
      .where('sharedWithId', '=', sharedWithId)
      .where('sharedById', '=', sharedById)
      .returningAll()
      .returning(withSharedBy)
      .returning(withSharedWith)
      .executeTakeFirstOrThrow() as Promise<Partner>;
  }

  @GenerateSql({ params: [{ sharedWithId: DummyValue.UUID, sharedById: DummyValue.UUID }] })
  async remove({ sharedWithId, sharedById }: PartnerIds) {
    await this.db
      .deleteFrom('partners')
      .where('sharedWithId', '=', sharedWithId)
      .where('sharedById', '=', sharedById)
      .execute();
  }

  private builder() {
    return this.db
      .selectFrom('partners')
      .innerJoin('users as sharedBy', (join) =>
        join.onRef('partners.sharedById', '=', 'sharedBy.id').on('sharedBy.deletedAt', 'is', null),
      )
      .innerJoin('users as sharedWith', (join) =>
        join.onRef('partners.sharedWithId', '=', 'sharedWith.id').on('sharedWith.deletedAt', 'is', null),
      )
      .selectAll('partners')
      .select(withSharedBy)
      .select(withSharedWith);
  }
}
