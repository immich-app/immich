import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { FamilyMemberTable } from 'src/schema/tables/family-member.table';
import { asUuid } from 'src/utils/database';

@Injectable()
export class FamilyMemberRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string) {
    return this.db
      .selectFrom('family_member')
      .selectAll()
      .where('id', '=', asUuid(id))
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByOwnerId(ownerId: string) {
    return this.db
      .selectFrom('family_member')
      .selectAll()
      .where('ownerId', '=', asUuid(ownerId))
      .orderBy('name', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getByOwnerAndName(ownerId: string, name: string) {
    return this.db
      .selectFrom('family_member')
      .selectAll()
      .where('ownerId', '=', asUuid(ownerId))
      .where('name', '=', name)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByTagId(tagId: string) {
    return this.db
      .selectFrom('family_member')
      .selectAll()
      .where('tagId', '=', asUuid(tagId))
      .executeTakeFirst();
  }

  create(dto: Insertable<FamilyMemberTable>) {
    return this.db
      .insertInto('family_member')
      .values(dto)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  update(id: string, dto: Updateable<FamilyMemberTable>) {
    return this.db
      .updateTable('family_member')
      .set(dto)
      .where('id', '=', asUuid(id))
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string) {
    await this.db.deleteFrom('family_member').where('id', '=', asUuid(id)).execute();
  }

  /**
   * Get photos of a family member taken within a specific date range
   * (useful for age-based queries)
   */
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.DATE, DummyValue.DATE] })
  getPhotosInDateRange(memberId: string, startDate: Date, endDate: Date) {
    return this.db
      .selectFrom('family_member')
      .innerJoin('tag_asset', 'tag_asset.tagId', 'family_member.tagId')
      .innerJoin('asset', 'asset.id', 'tag_asset.assetId')
      .select([
        'asset.id',
        'asset.originalFileName',
        'asset.fileCreatedAt',
        'asset.thumbhash',
      ])
      .where('family_member.id', '=', asUuid(memberId))
      .where('asset.fileCreatedAt', '>=', startDate)
      .where('asset.fileCreatedAt', '<=', endDate)
      .where('asset.deletedAt', 'is', null)
      .orderBy('asset.fileCreatedAt', 'asc')
      .execute();
  }
}
