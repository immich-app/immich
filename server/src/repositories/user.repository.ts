import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, sql, Updateable } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { DateTime } from 'luxon';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DB, UserMetadata as DbUserMetadata } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetType, AssetVisibility, UserStatus } from 'src/enum';
import { UserTable } from 'src/schema/tables/user.table';
import { UserMetadata, UserMetadataItem } from 'src/types';
import { asUuid } from 'src/utils/database';

type Upsert = Insertable<DbUserMetadata>;

export interface UserListFilter {
  id?: string;
  withDeleted?: boolean;
}

export interface UserStatsQueryResponse {
  userId: string;
  userName: string;
  photos: number;
  videos: number;
  usage: number;
  usagePhotos: number;
  usageVideos: number;
  quotaSizeInBytes: number | null;
}

export interface UserFindOptions {
  withDeleted?: boolean;
}

const withMetadata = (eb: ExpressionBuilder<DB, 'users'>) => {
  return jsonArrayFrom(
    eb
      .selectFrom('user_metadata')
      .select(['user_metadata.key', 'user_metadata.value'])
      .whereRef('users.id', '=', 'user_metadata.userId'),
  ).as('metadata');
};

@Injectable()
export class UserRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.BOOLEAN] })
  get(userId: string, options: UserFindOptions) {
    options = options || {};

    return this.db
      .selectFrom('users')
      .select(columns.userAdmin)
      .select(withMetadata)
      .where('users.id', '=', userId)
      .$if(!options.withDeleted, (eb) => eb.where('users.deletedAt', 'is', null))
      .executeTakeFirst();
  }

  getMetadata(userId: string) {
    return this.db
      .selectFrom('user_metadata')
      .select(['key', 'value'])
      .where('user_metadata.userId', '=', userId)
      .execute() as Promise<UserMetadataItem[]>;
  }

  @GenerateSql()
  getAdmin() {
    return this.db
      .selectFrom('users')
      .select(columns.userAdmin)
      .select(withMetadata)
      .where('users.isAdmin', '=', true)
      .where('users.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql()
  async hasAdmin(): Promise<boolean> {
    const admin = await this.db
      .selectFrom('users')
      .select('users.id')
      .where('users.isAdmin', '=', true)
      .where('users.deletedAt', 'is', null)
      .executeTakeFirst();

    return !!admin;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForPinCode(id: string) {
    return this.db
      .selectFrom('users')
      .select(['users.pinCode', 'users.password'])
      .where('users.id', '=', id)
      .where('users.deletedAt', 'is', null)
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.EMAIL] })
  getByEmail(email: string, options?: { withPassword?: boolean }) {
    return this.db
      .selectFrom('users')
      .select(columns.userAdmin)
      .select(withMetadata)
      .$if(!!options?.withPassword, (eb) => eb.select('password'))
      .where('email', '=', email)
      .where('users.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByStorageLabel(storageLabel: string) {
    return this.db
      .selectFrom('users')
      .select(columns.userAdmin)
      .where('users.storageLabel', '=', storageLabel)
      .where('users.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByOAuthId(oauthId: string) {
    return this.db
      .selectFrom('users')
      .select(columns.userAdmin)
      .select(withMetadata)
      .where('users.oauthId', '=', oauthId)
      .where('users.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DateTime.now().minus({ years: 1 })] })
  getDeletedAfter(target: DateTime) {
    return this.db.selectFrom('users').select(['id']).where('users.deletedAt', '<', target.toJSDate()).execute();
  }

  @GenerateSql(
    { name: 'with deleted', params: [{ withDeleted: true }] },
    { name: 'without deleted', params: [{ withDeleted: false }] },
  )
  getList({ id, withDeleted }: UserListFilter = {}) {
    return this.db
      .selectFrom('users')
      .select(columns.userAdmin)
      .select(withMetadata)
      .$if(!withDeleted, (eb) => eb.where('users.deletedAt', 'is', null))
      .$if(!!id, (eb) => eb.where('users.id', '=', id!))
      .orderBy('createdAt', 'desc')
      .execute();
  }

  async create(dto: Insertable<UserTable>) {
    return this.db
      .insertInto('users')
      .values(dto)
      .returning(columns.userAdmin)
      .returning(withMetadata)
      .executeTakeFirstOrThrow();
  }

  update(id: string, dto: Updateable<UserTable>) {
    return this.db
      .updateTable('users')
      .set(dto)
      .where('users.id', '=', asUuid(id))
      .where('users.deletedAt', 'is', null)
      .returning(columns.userAdmin)
      .returning(withMetadata)
      .executeTakeFirstOrThrow();
  }

  restore(id: string) {
    return this.db
      .updateTable('users')
      .set({ status: UserStatus.ACTIVE, deletedAt: null })
      .where('users.id', '=', asUuid(id))
      .returning(columns.userAdmin)
      .returning(withMetadata)
      .executeTakeFirstOrThrow();
  }

  async upsertMetadata<T extends keyof UserMetadata>(id: string, { key, value }: { key: T; value: UserMetadata[T] }) {
    await this.db
      .insertInto('user_metadata')
      .values({ userId: id, key, value } as Upsert)
      .onConflict((oc) =>
        oc.columns(['userId', 'key']).doUpdateSet({
          key,
          value,
        } as Upsert),
      )
      .execute();
  }

  async deleteMetadata<T extends keyof UserMetadata>(id: string, key: T) {
    await this.db.deleteFrom('user_metadata').where('userId', '=', id).where('key', '=', key).execute();
  }

  delete(user: { id: string }, hard?: boolean) {
    return hard
      ? this.db.deleteFrom('users').where('id', '=', user.id).execute()
      : this.db.updateTable('users').set({ deletedAt: new Date() }).where('id', '=', user.id).execute();
  }

  @GenerateSql()
  getUserStats() {
    return this.db
      .selectFrom('users')
      .leftJoin('assets', 'assets.ownerId', 'users.id')
      .leftJoin('exif', 'exif.assetId', 'assets.id')
      .select(['users.id as userId', 'users.name as userName', 'users.quotaSizeInBytes as quotaSizeInBytes'])
      .select((eb) => [
        eb.fn
          .countAll<number>()
          .filterWhere((eb) =>
            eb.and([
              eb('assets.type', '=', sql.lit(AssetType.IMAGE)),
              eb('assets.visibility', '!=', sql.lit(AssetVisibility.HIDDEN)),
            ]),
          )
          .as('photos'),
        eb.fn
          .countAll<number>()
          .filterWhere((eb) =>
            eb.and([
              eb('assets.type', '=', sql.lit(AssetType.VIDEO)),
              eb('assets.visibility', '!=', sql.lit(AssetVisibility.HIDDEN)),
            ]),
          )
          .as('videos'),
        eb.fn
          .coalesce(eb.fn.sum<number>('exif.fileSizeInByte').filterWhere('assets.libraryId', 'is', null), eb.lit(0))
          .as('usage'),
        eb.fn
          .coalesce(
            eb.fn
              .sum<number>('exif.fileSizeInByte')
              .filterWhere((eb) =>
                eb.and([eb('assets.libraryId', 'is', null), eb('assets.type', '=', sql.lit(AssetType.IMAGE))]),
              ),
            eb.lit(0),
          )
          .as('usagePhotos'),
        eb.fn
          .coalesce(
            eb.fn
              .sum<number>('exif.fileSizeInByte')
              .filterWhere((eb) =>
                eb.and([eb('assets.libraryId', 'is', null), eb('assets.type', '=', sql.lit(AssetType.VIDEO))]),
              ),
            eb.lit(0),
          )
          .as('usageVideos'),
      ])
      .where('assets.deletedAt', 'is', null)
      .groupBy('users.id')
      .orderBy('users.createdAt', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.NUMBER] })
  async updateUsage(id: string, delta: number): Promise<void> {
    await this.db
      .updateTable('users')
      .set({ quotaUsageInBytes: sql`"quotaUsageInBytes" + ${delta}`, updatedAt: new Date() })
      .where('id', '=', asUuid(id))
      .where('users.deletedAt', 'is', null)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async syncUsage(id?: string) {
    const query = this.db
      .updateTable('users')
      .set({
        quotaUsageInBytes: (eb) =>
          eb
            .selectFrom('assets')
            .leftJoin('exif', 'exif.assetId', 'assets.id')
            .select((eb) => eb.fn.coalesce(eb.fn.sum<number>('exif.fileSizeInByte'), eb.lit(0)).as('usage'))
            .where('assets.libraryId', 'is', null)
            .where('assets.ownerId', '=', eb.ref('users.id')),
        updatedAt: new Date(),
      })
      .where('users.deletedAt', 'is', null)
      .$if(id != undefined, (eb) => eb.where('users.id', '=', asUuid(id!)));

    await query.execute();
  }
}
