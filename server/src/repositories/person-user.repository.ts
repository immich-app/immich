import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { Chunked, DummyValue, GenerateSql } from 'src/decorators';
import { AlbumUserRole, AssetFileType, AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';
import { PersonUserTable } from 'src/schema/tables/person-user.table';
import { removeUndefinedKeys, withFilePath } from 'src/utils/database';

type PersonUserId = {
  personId: string;
  ownerId: string;
};

export type GetAllPeopleOptions = {
  ownerId?: string;
  thumbnailPath?: string;
  faceAssetId?: string | null;
  isHidden?: boolean;
};

@Injectable()
export class PersonUserRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  getAll(options: GetAllPeopleOptions = {}) {
    return this.db
      .selectFrom('person_user')
      .selectAll('person_user')
      .$if(!!options.ownerId, (qb) => qb.where('person_user.ownerId', '=', options.ownerId!))
      .$if(options.thumbnailPath !== undefined, (qb) =>
        qb.where('person_user.thumbnailPath', '=', options.thumbnailPath!),
      )
      .$if(options.faceAssetId === null, (qb) => qb.where('person_user.thumbnailFaceAssetId', 'is', null))
      .$if(!!options.faceAssetId, (qb) => qb.where('person_user.thumbnailFaceAssetId', '=', options.faceAssetId!))
      .$if(options.isHidden !== undefined, (qb) => qb.where('person_user.isHidden', '=', options.isHidden!))
      .stream();
  }

  get({ personId, ownerId }: PersonUserId) {
    return this.db
      .selectFrom('person_user')
      .selectAll()
      .where('person_user.personId', '=', personId)
      .where('person_user.ownerId', '=', ownerId)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID, personId: DummyValue.UUID }] })
  create(personUser: Insertable<PersonUserTable>) {
    return this.db.insertInto('person_user').values(personUser).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [[{ ownerId: DummyValue.UUID, personId: DummyValue.UUID }]] })
  async createAll(personUsers: Insertable<PersonUserTable>[]) {
    if (personUsers.length === 0) {
      return;
    }

    await this.db.insertInto('person_user').values(personUsers).returningAll().execute();
  }

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID, personId: DummyValue.UUID }, { role: AlbumUserRole.Viewer }] })
  update(dto: Updateable<PersonUserTable> & PersonUserId) {
    return this.db
      .updateTable('person_user')
      .set(dto)
      .where('ownerId', '=', dto.ownerId)
      .where('personId', '=', dto.personId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateAll(personUsers: Array<Updateable<PersonUserTable> & PersonUserId>) {
    if (personUsers.length === 0) {
      return;
    }

    await this.db
      .insertInto('person_user')
      .values(personUsers)
      .onConflict((oc) =>
        oc.columns(['personId', 'ownerId']).doUpdateSet((eb) =>
          removeUndefinedKeys(
            {
              isFavorite: eb.ref('excluded.isFavorite'),
              isHidden: eb.ref('excluded.isHidden'),
              thumbnailFaceAssetId: eb.ref('excluded.thumbnailFaceAssetId'),
              thumbnailPath: eb.ref('excluded.thumbnailPath'),
            },
            personUsers[0],
          ),
        ),
      )
      .execute();
  }

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID, personId: DummyValue.UUID }] })
  async delete({ ownerId, personId }: PersonUserId): Promise<void> {
    await this.db.deleteFrom('person_user').where('ownerId', '=', ownerId).where('personId', '=', personId).execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @Chunked()
  getForPeopleDelete(ids: string[]) {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.db
      .selectFrom('person_user')
      .select(['personId', 'thumbnailPath'])
      .where('personId', 'in', ids)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getNumberOfPeople(userId: string) {
    const zero = sql.lit(0);
    return this.db
      .selectFrom('person_user')
      .where((eb) =>
        eb.exists((eb) =>
          eb
            .selectFrom('asset_face')
            .whereRef('asset_face.personId', '=', 'person_user.personId')
            .where('asset_face.deletedAt', 'is', null)
            .where('asset_face.isVisible', '=', true)
            .where((eb) =>
              eb.exists((eb) =>
                eb
                  .selectFrom('asset')
                  .whereRef('asset.id', '=', 'asset_face.assetId')
                  .where('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
                  .where('asset.deletedAt', 'is', null),
              ),
            ),
        ),
      )
      .where('person_user.ownerId', '=', userId)
      .select((eb) => eb.fn.coalesce(eb.fn.countAll<number>(), zero).as('total'))
      .select((eb) =>
        eb.fn.coalesce(eb.fn.countAll<number>().filterWhere('person_user.isHidden', '=', true), zero).as('hidden'),
      )
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ personId: DummyValue.UUID, ownerId: DummyValue.UUID }] })
  getDataForThumbnailGenerationJob({ personId, ownerId }: PersonUserId) {
    return this.db
      .selectFrom('person_user')
      .innerJoin('asset_face', 'asset_face.id', 'person_user.thumbnailFaceAssetId')
      .innerJoin('asset', 'asset_face.assetId', 'asset.id')
      .leftJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
      .select([
        'person_user.ownerId',
        'asset_face.boundingBoxX1 as x1',
        'asset_face.boundingBoxY1 as y1',
        'asset_face.boundingBoxX2 as x2',
        'asset_face.boundingBoxY2 as y2',
        'asset_face.imageWidth as oldWidth',
        'asset_face.imageHeight as oldHeight',
        'asset.type',
        'asset.originalPath',
        'asset_exif.orientation as exifOrientation',
      ])
      .select((eb) => withFilePath(eb, AssetFileType.Preview).as('previewPath'))
      .where('person_user.personId', '=', personId)
      .where('person_user.ownerId', '=', ownerId)
      .where('asset_face.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql()
  getAllWithoutFaces() {
    return this.db
      .selectFrom('person_user')
      .select(['person_user.personId', 'person_user.thumbnailPath'])
      .leftJoin('asset_face', 'asset_face.personId', 'person_user.personId')
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is not', false)
      .having((eb) => eb.fn.count('asset_face.assetId'), '=', 0)
      .groupBy('person_user.personId')
      .groupBy('person_user.ownerId')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getThumbnailsForPerson(id: string) {
    return this.db.selectFrom('person_user').select('thumbnailPath').where('personId', '=', id).execute();
  }
}
