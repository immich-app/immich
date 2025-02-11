import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, sql, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { DB, Libraries } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { LibraryStatsResponseDto } from 'src/dtos/library.dto';
import { LibraryEntity } from 'src/entities/library.entity';
import { AssetType } from 'src/enum';

const userColumns = [
  'users.id',
  'users.email',
  'users.createdAt',
  'users.profileImagePath',
  'users.isAdmin',
  'users.shouldChangePassword',
  'users.deletedAt',
  'users.oauthId',
  'users.updatedAt',
  'users.storageLabel',
  'users.name',
  'users.quotaSizeInBytes',
  'users.quotaUsageInBytes',
  'users.status',
  'users.profileChangedAt',
] as const;

const withOwner = (eb: ExpressionBuilder<DB, 'libraries'>) => {
  return jsonObjectFrom(eb.selectFrom('users').whereRef('users.id', '=', 'libraries.ownerId').select(userColumns)).as(
    'owner',
  );
};

@Injectable()
export class LibraryRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string, withDeleted = false): Promise<LibraryEntity | undefined> {
    return this.db
      .selectFrom('libraries')
      .selectAll('libraries')
      .select(withOwner)
      .where('libraries.id', '=', id)
      .$if(!withDeleted, (qb) => qb.where('libraries.deletedAt', 'is', null))
      .executeTakeFirst() as Promise<LibraryEntity | undefined>;
  }

  @GenerateSql({ params: [] })
  getAll(withDeleted = false): Promise<LibraryEntity[]> {
    return this.db
      .selectFrom('libraries')
      .selectAll('libraries')
      .select(withOwner)
      .orderBy('createdAt', 'asc')
      .$if(!withDeleted, (qb) => qb.where('libraries.deletedAt', 'is', null))
      .execute() as unknown as Promise<LibraryEntity[]>;
  }

  @GenerateSql()
  getAllDeleted(): Promise<LibraryEntity[]> {
    return this.db
      .selectFrom('libraries')
      .selectAll('libraries')
      .select(withOwner)
      .where('libraries.deletedAt', 'is not', null)
      .orderBy('createdAt', 'asc')
      .execute() as unknown as Promise<LibraryEntity[]>;
  }

  create(library: Insertable<Libraries>): Promise<LibraryEntity> {
    return this.db
      .insertInto('libraries')
      .values(library)
      .returningAll()
      .executeTakeFirstOrThrow() as Promise<LibraryEntity>;
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('libraries').where('libraries.id', '=', id).execute();
  }

  async softDelete(id: string): Promise<void> {
    await this.db.updateTable('libraries').set({ deletedAt: new Date() }).where('libraries.id', '=', id).execute();
  }

  update(id: string, library: Updateable<Libraries>): Promise<LibraryEntity> {
    return this.db
      .updateTable('libraries')
      .set(library)
      .where('libraries.id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow() as Promise<LibraryEntity>;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getStatistics(id: string): Promise<LibraryStatsResponseDto | undefined> {
    const stats = await this.db
      .selectFrom('libraries')
      .innerJoin('assets', 'assets.libraryId', 'libraries.id')
      .leftJoin('exif', 'exif.assetId', 'assets.id')
      .select((eb) =>
        eb.fn
          .countAll()
          .filterWhere((eb) => eb.and([eb('assets.type', '=', AssetType.IMAGE), eb('assets.isVisible', '=', true)]))
          .as('photos'),
      )
      .select((eb) =>
        eb.fn
          .countAll()
          .filterWhere((eb) => eb.and([eb('assets.type', '=', AssetType.VIDEO), eb('assets.isVisible', '=', true)]))
          .as('videos'),
      )
      .select((eb) => eb.fn.coalesce((eb) => eb.fn.sum('exif.fileSizeInByte'), eb.val(0)).as('usage'))
      .groupBy('libraries.id')
      .where('libraries.id', '=', id)
      .executeTakeFirst();

    // possibly a new library with 0 assets
    if (!stats) {
      const zero = sql<number>`0::int`;
      return this.db
        .selectFrom('libraries')
        .select(zero.as('photos'))
        .select(zero.as('videos'))
        .select(zero.as('usage'))
        .select(zero.as('total'))
        .where('libraries.id', '=', id)
        .executeTakeFirst();
    }

    return {
      photos: Number(stats.photos),
      videos: Number(stats.videos),
      usage: Number(stats.usage),
      total: Number(stats.photos) + Number(stats.videos),
    };
  }
}
