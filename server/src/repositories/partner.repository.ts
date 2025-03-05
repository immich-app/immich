import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, JoinBuilder, Kysely, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { DB, Partners, Users } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { PartnerEntity } from 'src/entities/partner.entity';

export interface PartnerIds {
  sharedById: string;
  sharedWithId: string;
}

export enum PartnerDirection {
  SharedBy = 'shared-by',
  SharedWith = 'shared-with',
}

const columns = ['id', 'name', 'email', 'profileImagePath', 'profileChangedAt'] as const;

const onSharedBy = (join: JoinBuilder<DB & { sharedBy: Users }, 'partners' | 'sharedBy'>) =>
  join.onRef('partners.sharedById', '=', 'sharedBy.id').on('sharedBy.deletedAt', 'is', null);

const onSharedWith = (join: JoinBuilder<DB & { sharedWith: Users }, 'partners' | 'sharedWith'>) =>
  join.onRef('partners.sharedWithId', '=', 'sharedWith.id').on('sharedWith.deletedAt', 'is', null);

const withSharedBy = (eb: ExpressionBuilder<DB, 'partners'>) => {
  return jsonObjectFrom(
    eb.selectFrom('users as sharedBy').select(columns).whereRef('sharedBy.id', '=', 'partners.sharedById'),
  ).as('sharedBy');
};

const withSharedWith = (eb: ExpressionBuilder<DB, 'partners'>) => {
  return jsonObjectFrom(
    eb.selectFrom('users as sharedWith').select(columns).whereRef('sharedWith.id', '=', 'partners.sharedWithId'),
  ).as('sharedWith');
};

@Injectable()
export class PartnerRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getAll(userId: string): Promise<PartnerEntity[]> {
    return this.db
      .selectFrom('partners')
      .innerJoin('users as sharedBy', onSharedBy)
      .innerJoin('users as sharedWith', onSharedWith)
      .selectAll('partners')
      .select(withSharedBy)
      .select(withSharedWith)
      .where((eb) => eb.or([eb('sharedWithId', '=', userId), eb('sharedById', '=', userId)]))
      .execute() as Promise<PartnerEntity[]>;
  }

  @GenerateSql({ params: [{ sharedWithId: DummyValue.UUID, sharedById: DummyValue.UUID }] })
  get({ sharedWithId, sharedById }: PartnerIds): Promise<PartnerEntity | undefined> {
    return this.db
      .selectFrom('partners')
      .innerJoin('users as sharedBy', onSharedBy)
      .innerJoin('users as sharedWith', onSharedWith)
      .selectAll('partners')
      .select(withSharedBy)
      .select(withSharedWith)
      .where('sharedWithId', '=', sharedWithId)
      .where('sharedById', '=', sharedById)
      .executeTakeFirst() as unknown as Promise<PartnerEntity | undefined>;
  }

  @GenerateSql({ params: [{ sharedWithId: DummyValue.UUID, sharedById: DummyValue.UUID }] })
  create(values: Insertable<Partners>): Promise<PartnerEntity> {
    return this.db
      .insertInto('partners')
      .values(values)
      .returningAll()
      .returning(withSharedBy)
      .returning(withSharedWith)
      .executeTakeFirstOrThrow() as unknown as Promise<PartnerEntity>;
  }

  @GenerateSql({ params: [{ sharedWithId: DummyValue.UUID, sharedById: DummyValue.UUID }, { inTimeline: true }] })
  update({ sharedWithId, sharedById }: PartnerIds, values: Updateable<Partners>): Promise<PartnerEntity> {
    return this.db
      .updateTable('partners')
      .set(values)
      .where('sharedWithId', '=', sharedWithId)
      .where('sharedById', '=', sharedById)
      .returningAll()
      .returning(withSharedBy)
      .returning(withSharedWith)
      .executeTakeFirstOrThrow() as unknown as Promise<PartnerEntity>;
  }

  @GenerateSql({ params: [{ sharedWithId: DummyValue.UUID, sharedById: DummyValue.UUID }] })
  async remove({ sharedWithId, sharedById }: PartnerIds): Promise<void> {
    await this.db
      .deleteFrom('partners')
      .where('sharedWithId', '=', sharedWithId)
      .where('sharedById', '=', sharedById)
      .execute();
  }
}
