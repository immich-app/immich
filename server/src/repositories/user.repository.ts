import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB, UserMetadata as DbUserMetadata, Users } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { UserMetadata } from 'src/entities/user-metadata.entity';
import { UserEntity, withMetadata } from 'src/entities/user.entity';
import {
  IUserRepository,
  UserFindOptions,
  UserListFilter,
  UserStatsQueryResponse,
} from 'src/interfaces/user.interface';
import { asUuid } from 'src/utils/database';

const columns = [
  'id',
  'email',
  'createdAt',
  'profileImagePath',
  'isAdmin',
  'shouldChangePassword',
  'deletedAt',
  'oauthId',
  'updatedAt',
  'storageLabel',
  'name',
  'quotaSizeInBytes',
  'quotaUsageInBytes',
  'status',
  'profileChangedAt',
] as const;

type Upsert = Insertable<DbUserMetadata>;

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.BOOLEAN] })
  get(userId: string, options: UserFindOptions): Promise<UserEntity | undefined> {
    options = options || {};

    const query = this.db.selectFrom('users').select(columns).select(withMetadata).where('users.id', '=', userId);

    if (options.withDeleted) {
      query.where('users.deletedAt', 'is', null);
    }

    return query.executeTakeFirst() as Promise<UserEntity | undefined>;
  }

  @GenerateSql()
  getAdmin(): Promise<UserEntity | undefined> {
    return this.db.selectFrom('users').select(columns).where('isAdmin', '=', true).executeTakeFirst() as Promise<
      UserEntity | undefined
    >;
  }

  @GenerateSql()
  async hasAdmin(): Promise<boolean> {
    const admin = (await this.db
      .selectFrom('users')
      .select('id')
      .where('isAdmin', '=', true)
      .executeTakeFirst()) as UserEntity;

    return !!admin;
  }

  @GenerateSql({ params: [DummyValue.EMAIL] })
  getByEmail(email: string, withPassword?: boolean): Promise<UserEntity | undefined> {
    return this.db
      .selectFrom('users')
      .select(columns)
      .$if(!!withPassword, (eb) => eb.select('password'))
      .where('email', '=', email)
      .executeTakeFirst() as Promise<UserEntity | undefined>;
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByStorageLabel(storageLabel: string): Promise<UserEntity | undefined> {
    return this.db
      .selectFrom('users')
      .select(columns)
      .where('storageLabel', '=', storageLabel)
      .executeTakeFirst() as Promise<UserEntity | undefined>;
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByOAuthId(oauthId: string): Promise<UserEntity | undefined> {
    return this.db.selectFrom('users').select(columns).where('oauthId', '=', oauthId).executeTakeFirst() as Promise<
      UserEntity | undefined
    >;
  }

  getDeletedUsers(): Promise<UserEntity[]> {
    return this.db
      .selectFrom('users')
      .select(columns)
      .where('deletedAt', 'is not', null)
      .execute() as unknown as Promise<UserEntity[]>;
  }

  getList({ withDeleted }: UserListFilter = {}): Promise<UserEntity[]> {
    const query = this.db.selectFrom('users').select(columns).select(withMetadata).orderBy('createdAt', 'desc');

    if (!withDeleted) {
      query.where('deletedAt', 'is', null);
    }

    return query.execute() as unknown as Promise<UserEntity[]>;
  }

  async create(dto: Insertable<Users>): Promise<UserEntity> {
    return this.db
      .insertInto('users')
      .values(dto)
      .returning(columns)
      .executeTakeFirst() as unknown as Promise<UserEntity>;
  }

  update(id: string, dto: Updateable<Users>): Promise<UserEntity> {
    return this.db
      .updateTable('users')
      .set(dto)
      .where('id', '=', asUuid(id))
      .where('deletedAt', 'is', null)
      .returning(columns)
      .returning(withMetadata)
      .executeTakeFirst() as unknown as Promise<UserEntity>;
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

  delete(user: UserEntity, hard?: boolean): Promise<UserEntity> {
    return hard
      ? (this.db.deleteFrom('users').where('id', '=', user.id).execute() as unknown as Promise<UserEntity>)
      : (this.db
          .updateTable('users')
          .set({ deletedAt: new Date() })
          .where('id', '=', user.id)
          .execute() as unknown as Promise<UserEntity>);
  }

  @GenerateSql()
  async getUserStats(): Promise<UserStatsQueryResponse[]> {
    const stats = (await this.db
      .selectFrom('users')
      .leftJoin('assets', 'assets.ownerId', 'users.id')
      .leftJoin('exif', 'exif.assetId', 'assets.id')
      .select(['users.id as userId', 'users.name as userName', 'users.quotaSizeInBytes as quotaSizeInBytes'])
      .select((eb) => [
        eb.fn
          .countAll()
          .filterWhere((eb) => eb.and([eb('assets.type', '=', 'IMAGE'), eb('assets.isVisible', '=', true)]))
          .as('photos'),
        eb.fn
          .countAll()
          .filterWhere((eb) => eb.and([eb('assets.type', '=', 'VIDEO'), eb('assets.isVisible', '=', true)]))
          .as('videos'),
        eb.fn
          .coalesce(eb.fn.sum('exif.fileSizeInByte').filterWhere('assets.libraryId', 'is', null), eb.lit(0))
          .as('usage'),
        eb.fn
          .coalesce(
            eb.fn
              .sum('exif.fileSizeInByte')
              .filterWhere((eb) => eb.and([eb('assets.libraryId', 'is', null), eb('assets.type', '=', 'IMAGE')])),
            eb.lit(0),
          )
          .as('usagePhotos'),
        eb.fn
          .coalesce(
            eb.fn
              .sum('exif.fileSizeInByte')
              .filterWhere((eb) => eb.and([eb('assets.libraryId', 'is', null), eb('assets.type', '=', 'VIDEO')])),
            eb.lit(0),
          )
          .as('usageVideos'),
      ])
      .where('assets.deletedAt', 'is', null)
      .groupBy('users.id')
      .orderBy('users.createdAt', 'asc')
      .execute()) as UserStatsQueryResponse[];

    for (const stat of stats) {
      stat.photos = Number(stat.photos);
      stat.videos = Number(stat.videos);
      stat.usage = Number(stat.usage);
      stat.usagePhotos = Number(stat.usagePhotos);
      stat.usageVideos = Number(stat.usageVideos);
      stat.quotaSizeInBytes = stat.quotaSizeInBytes;
    }

    return stats;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.NUMBER] })
  async updateUsage(id: string, delta: number): Promise<void> {
    await this.db
      .updateTable('users')
      .set({ quotaUsageInBytes: sql`"quotaUsageInBytes" + ${delta}`, updatedAt: new Date() })
      .where('id', '=', asUuid(id))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async syncUsage(id?: string) {
    const query = this.db.updateTable('users').set({
      quotaUsageInBytes: (eb) =>
        eb
          .selectFrom('assets')
          .leftJoin('exif', 'exif.assetId', 'assets.id')
          .select((eb) => eb.fn.coalesce(eb.fn.sum('exif.fileSizeInByte'), eb.lit(0)).as('usage'))
          .where('assets.libraryId', 'is', null)
          .where('assets.ownerId', '=', eb.ref('users.id')),
      updatedAt: new Date(),
    });

    if (id != undefined) {
      query.where('users.id', '=', asUuid(id));
    }

    await query.execute();
  }
}
