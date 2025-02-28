import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB, UserMetadata as DbUserMetadata, Users } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { UserMetadata, UserMetadataItem } from 'src/entities/user-metadata.entity';
import { UserEntity, withMetadata } from 'src/entities/user.entity';
import { AssetType, UserStatus } from 'src/enum';
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

export interface UserListFilter {
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

@Injectable()
export class UserRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.BOOLEAN] })
  get(userId: string, options: UserFindOptions): Promise<UserEntity | undefined> {
    options = options || {};

    return this.db
      .selectFrom('users')
      .select(columns)
      .select(withMetadata)
      .where('users.id', '=', userId)
      .$if(!options.withDeleted, (eb) => eb.where('users.deletedAt', 'is', null))
      .executeTakeFirst() as Promise<UserEntity | undefined>;
  }

  getMetadata(userId: string) {
    return this.db
      .selectFrom('user_metadata')
      .select(['key', 'value'])
      .where('user_metadata.userId', '=', userId)
      .execute() as Promise<UserMetadataItem[]>;
  }

  @GenerateSql()
  getAdmin(): Promise<UserEntity | undefined> {
    return this.db
      .selectFrom('users')
      .select(columns)
      .where('users.isAdmin', '=', true)
      .where('users.deletedAt', 'is', null)
      .executeTakeFirst() as Promise<UserEntity | undefined>;
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

  @GenerateSql({ params: [DummyValue.EMAIL] })
  getByEmail(email: string, withPassword?: boolean): Promise<UserEntity | undefined> {
    return this.db
      .selectFrom('users')
      .select(columns)
      .$if(!!withPassword, (eb) => eb.select('password'))
      .where('email', '=', email)
      .where('users.deletedAt', 'is', null)
      .executeTakeFirst() as Promise<UserEntity | undefined>;
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByStorageLabel(storageLabel: string): Promise<UserEntity | undefined> {
    return this.db
      .selectFrom('users')
      .select(columns)
      .where('users.storageLabel', '=', storageLabel)
      .where('users.deletedAt', 'is', null)
      .executeTakeFirst() as Promise<UserEntity | undefined>;
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByOAuthId(oauthId: string): Promise<UserEntity | undefined> {
    return this.db
      .selectFrom('users')
      .select(columns)
      .where('users.oauthId', '=', oauthId)
      .where('users.deletedAt', 'is', null)
      .executeTakeFirst() as Promise<UserEntity | undefined>;
  }

  getDeletedUsers(): Promise<UserEntity[]> {
    return this.db
      .selectFrom('users')
      .select(columns)
      .where('users.deletedAt', 'is not', null)
      .execute() as unknown as Promise<UserEntity[]>;
  }

  getList({ withDeleted }: UserListFilter = {}): Promise<UserEntity[]> {
    return this.db
      .selectFrom('users')
      .select(columns)
      .select(withMetadata)
      .$if(!withDeleted, (eb) => eb.where('users.deletedAt', 'is', null))
      .orderBy('createdAt', 'desc')
      .execute() as unknown as Promise<UserEntity[]>;
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
      .where('users.id', '=', asUuid(id))
      .where('users.deletedAt', 'is', null)
      .returning(columns)
      .returning(withMetadata)
      .executeTakeFirst() as unknown as Promise<UserEntity>;
  }

  restore(id: string): Promise<UserEntity> {
    return this.db
      .updateTable('users')
      .set({ status: UserStatus.ACTIVE, deletedAt: null })
      .where('users.id', '=', asUuid(id))
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

  delete(user: { id: string }, hard?: boolean): Promise<UserEntity> {
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
          .filterWhere((eb) => eb.and([eb('assets.type', '=', AssetType.IMAGE), eb('assets.isVisible', '=', true)]))
          .as('photos'),
        eb.fn
          .countAll()
          .filterWhere((eb) => eb.and([eb('assets.type', '=', AssetType.VIDEO), eb('assets.isVisible', '=', true)]))
          .as('videos'),
        eb.fn
          .coalesce(eb.fn.sum('exif.fileSizeInByte').filterWhere('assets.libraryId', 'is', null), eb.lit(0))
          .as('usage'),
        eb.fn
          .coalesce(
            eb.fn
              .sum('exif.fileSizeInByte')
              .filterWhere((eb) =>
                eb.and([eb('assets.libraryId', 'is', null), eb('assets.type', '=', AssetType.IMAGE)]),
              ),
            eb.lit(0),
          )
          .as('usagePhotos'),
        eb.fn
          .coalesce(
            eb.fn
              .sum('exif.fileSizeInByte')
              .filterWhere((eb) =>
                eb.and([eb('assets.libraryId', 'is', null), eb('assets.type', '=', AssetType.VIDEO)]),
              ),
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
