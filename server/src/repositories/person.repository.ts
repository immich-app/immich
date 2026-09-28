import { Injectable } from '@nestjs/common';
import {
  type Expression,
  type ExpressionBuilder,
  type Insertable,
  type Kysely,
  type Selectable,
  type ShallowDehydrateObject,
  type SqlBool,
  type Updateable,
  expressionBuilder,
  sql,
} from 'kysely';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { AssetFace, PersonUser, columns } from 'src/database.js';
import { Chunked, ChunkedArray, DummyValue, GenerateSql } from 'src/decorators.js';
import { PersonUserRole } from 'src/dtos/person.dto.js';
import { AssetFileType, AssetVisibility, SharingDirection, SourceType, UserMetadataKey } from 'src/enum.js';
import { type YearMonthDay } from 'src/repositories/asset.repository.js';
import { DB } from 'src/schema/index.js';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table.js';
import { FaceSearchTable } from 'src/schema/tables/face-search.table.js';
import { PersonGroupTable } from 'src/schema/tables/person-group.table.js';
import { PersonTable } from 'src/schema/tables/person.table.js';
import { anyUuid, dummy, inSharedAlbum, removeUndefinedKeys, withFilePath } from 'src/utils/database.js';
import { isLeapDayObserved } from 'src/utils/date.js';
import { type PaginationOptions, paginationHelper } from 'src/utils/pagination.js';

type PersonGroupRow = {
  ownedPerson: ShallowDehydrateObject<Selectable<PersonTable>>;
  otherPeople: { sharedById: string; role: PersonUserRole; name: string; birthDate: string | null }[];
  sharedBy: PersonUser[];
  sharedWith: PersonUser[];
};

export interface PersonFilterOptions {
  sharedById?: string;
  sharedWithId?: string;
  isFavorite?: boolean;
  isHidden?: boolean;
}

export interface PersonSearchOptions extends PersonFilterOptions {
  withHidden: boolean;
  closestFaceAssetId?: string;
}

export interface PersonNameSearchOptions {
  withHidden?: boolean;
}

export interface PersonNameResponse {
  personGroupId: string;
  name: string;
}

export interface AssetFaceId {
  assetId: string;
  personGroupId: string;
}

export interface UpdateGroupIdData {
  oldPersonGroupId: string;
  ownerId: string;
  newPersonGroupId: string;
}

export interface UpdateFacesData {
  oldPersonGroupId?: string;
  faceIds?: string[];
  ownerId?: string;
  newPersonGroupId: string;
}

export interface PersonStatistics {
  assets: number;
}

export interface DeleteFacesOptions {
  sourceType: SourceType;
}

export interface GetAllPeopleOptions {
  ownerId?: string;
  thumbnailPath?: string;
  faceAssetId?: string | null;
  isHidden?: boolean;
}

export interface GetAllFacesOptions {
  personGroupId?: string | null;
  assetId?: string;
  sourceType?: SourceType;
  clusterGroupId?: string;
}

export type UnassignFacesOptions = DeleteFacesOptions & { clusterGroupId?: string };

export type GetFacesOptions = WithPersonOptions & { isVisible?: boolean };

/** a person is identified by its owner and the group it belongs to */
export type PersonId = { ownerId: string; personGroupId: string };

export type ReassignCluster = { userId: string; newClusterId: string };

export type WithPersonOptions = {
  /** whose version of the person to select */
  viewingUserId: string;
};

const withOwnedPerson = (userId: string) => {
  return (eb: ExpressionBuilder<DB, 'person_group'>) =>
    jsonObjectFrom(
      eb
        .selectFrom('person')
        .selectAll('person')
        .whereRef('person.personGroupId', '=', 'person_group.id')
        .where('person.ownerId', '=', userId),
    )
      .$notNull()
      .as('ownedPerson');
};

const withOtherPeopleFor = (userId: string, personGroupId: Expression<string>) =>
  jsonArrayFrom(
    expressionBuilder<DB>()
      .selectFrom('person as other')
      .innerJoin('person_user', (join) =>
        join
          .onRef('person_user.personGroupId', '=', 'other.personGroupId')
          .onRef('person_user.sharedById', '=', 'other.ownerId')
          .on('person_user.sharedWithId', '=', userId),
      )
      .select(['person_user.sharedById', 'person_user.role', 'other.name', 'other.birthDate'])
      .where('other.personGroupId', '=', personGroupId)
      .where((eb) => eb.or([eb('other.birthDate', 'is not', null), eb('other.name', '!=', '')])),
  ).as('otherPeople');

const withPersonUsersFor = (userId: string, personGroupId: Expression<string>, direction: SharingDirection) => {
  const [userColumn, viewerColumn] =
    direction === SharingDirection.SharedBy
      ? (['person_user.sharedById', 'person_user.sharedWithId'] as const)
      : (['person_user.sharedWithId', 'person_user.sharedById'] as const);

  return jsonArrayFrom(
    expressionBuilder<DB>()
      .selectFrom('person_user')
      .innerJoin('user', (join) => join.onRef('user.id', '=', userColumn).on('user.deletedAt', 'is', null))
      .select(columns.user)
      .select('person_user.role')
      .where('person_user.personGroupId', '=', personGroupId)
      .where(viewerColumn, '=', userId)
      .orderBy('user.name'),
  )
    .$castTo<PersonUser[]>()
    .as(direction === SharingDirection.SharedBy ? 'sharedBy' : 'sharedWith');
};

const withSharing = (userId: string, personGroupId: Expression<string>) => [
  withOtherPeopleFor(userId, personGroupId),
  withPersonUsersFor(userId, personGroupId, SharingDirection.SharedBy),
  withPersonUsersFor(userId, personGroupId, SharingDirection.SharedWith),
];

const withOtherPeople = (userId: string) => {
  return (eb: ExpressionBuilder<DB, 'person_group'>) => withSharing(userId, eb.ref('person_group.id'));
};

const withOtherPeopleForPerson = (userId: string) => {
  return (eb: ExpressionBuilder<DB, 'person'>) => withSharing(userId, eb.ref('person.personGroupId'));
};

const withFilters = (userId: string, options: PersonFilterOptions = {}) => {
  const { sharedById, sharedWithId, isFavorite, isHidden } = options;
  return (eb: ExpressionBuilder<DB & { owned: DB['person'] }, 'person_group' | 'owned'>) => {
    const filters: Expression<SqlBool>[] = [];

    if (sharedById || sharedWithId) {
      filters.push(
        eb.exists(
          eb
            .selectFrom('person_user')
            .whereRef('person_user.personGroupId', '=', 'person_group.id')
            // only consider shares that involve the current user
            .where((eb) =>
              eb.or([eb('person_user.sharedById', '=', userId), eb('person_user.sharedWithId', '=', userId)]),
            )
            .$if(!!sharedById, (qb) => qb.where('person_user.sharedById', '=', sharedById!))
            .$if(!!sharedWithId, (qb) => qb.where('person_user.sharedWithId', '=', sharedWithId!)),
        ),
      );
    }

    if (isFavorite !== undefined) {
      filters.push(eb('owned.isFavorite', '=', isFavorite));
    }

    if (isHidden !== undefined) {
      filters.push(eb('owned.isHidden', '=', isHidden));
    }

    return eb.and(filters);
  };
};

const asPerson = ({ ownedPerson, otherPeople, sharedBy, sharedWith }: PersonGroupRow) => ({
  ...ownedPerson,
  otherPeople,
  sharedBy,
  sharedWith,
});

const faceCount = (eb: ExpressionBuilder<DB, 'asset'>) => eb.fn.count('asset.id');

const withPerson = ({ viewingUserId }: WithPersonOptions) => {
  return (eb: ExpressionBuilder<DB, 'asset_face'>) =>
    jsonObjectFrom(
      eb
        .selectFrom('person')
        .selectAll('person')
        .select(withOtherPeopleForPerson(viewingUserId))
        .whereRef('person.personGroupId', '=', 'asset_face.personGroupId')
        .where('person.ownerId', '=', viewingUserId),
    ).as('person');
};

const withFaceSearch = (eb: ExpressionBuilder<DB, 'asset_face'>) => {
  return jsonObjectFrom(
    eb.selectFrom('face_search').selectAll('face_search').whereRef('face_search.faceId', '=', 'asset_face.id'),
  ).as('faceSearch');
};

@Injectable()
export class PersonRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [{ oldPersonGroupId: DummyValue.UUID, newPersonGroupId: DummyValue.UUID }] })
  async reassignFaces({ oldPersonGroupId, faceIds, ownerId, newPersonGroupId }: UpdateFacesData): Promise<number> {
    const result = await this.db
      .updateTable('asset_face')
      .from('asset')
      .whereRef('asset_face.assetId', '=', 'asset.id')
      .set({ personGroupId: newPersonGroupId })
      .$if(!!oldPersonGroupId, (qb) => qb.where('asset_face.personGroupId', '=', oldPersonGroupId!))
      .$if(!!faceIds, (qb) => qb.where('asset_face.id', 'in', faceIds!))
      .$if(!!ownerId, (qb) => qb.where('asset.ownerId', '=', ownerId!))
      .executeTakeFirst();

    return Number(result.numUpdatedRows ?? 0);
  }

  @GenerateSql({ params: [{ oldPersonGroupId: DummyValue.UUID, newPersonGroupId: DummyValue.UUID }] })
  updateGroupId({ oldPersonGroupId, ownerId, newPersonGroupId }: UpdateGroupIdData) {
    return this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('asset_face')
        .from('asset')
        .whereRef('asset_face.assetId', '=', 'asset.id')
        .set({ personGroupId: newPersonGroupId })
        .where('asset_face.personGroupId', '=', oldPersonGroupId)
        .where('asset.ownerId', '=', ownerId)
        .executeTakeFirst();

      return trx
        .updateTable('person')
        .set({ personGroupId: newPersonGroupId })
        .where('person.personGroupId', '=', oldPersonGroupId)
        .where('person.ownerId', '=', ownerId)
        .returningAll()
        .executeTakeFirstOrThrow();
    });
  }

  @GenerateSql({ params: [{ sourceType: SourceType.MachineLearning, clusterGroupId: DummyValue.UUID }] })
  async unassignFaces({ sourceType, clusterGroupId }: UnassignFacesOptions): Promise<void> {
    await this.db
      .updateTable('asset_face')
      .set({ personGroupId: null })
      .from('asset')
      .whereRef('asset_face.assetId', '=', 'asset.id')
      .where('asset_face.sourceType', '=', sourceType)
      .$if(!!clusterGroupId, (qb) =>
        qb.innerJoin('user', 'user.id', 'asset.ownerId').where('user.clusterGroupId', '=', clusterGroupId!),
      )
      .execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.UUID] })
  @Chunked()
  async delete(personGroupIds: string[], ownerId?: string) {
    if (personGroupIds.length === 0) {
      return [];
    }

    return this.db
      .deleteFrom('person')
      .$if(!!ownerId, (qb) => qb.where('ownerId', '=', ownerId!))
      .where('person.personGroupId', 'in', personGroupIds)
      .returning(['personGroupId', 'ownerId', 'thumbnailPath'])
      .execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @Chunked()
  async deleteGroups(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.db.deleteFrom('person_group').where('person_group.id', 'in', ids).execute();
  }

  @GenerateSql()
  async deleteEmptyGroups(): Promise<number> {
    const result = await this.db
      .deleteFrom('person_group')
      .where(({ not, exists, selectFrom }) =>
        not(
          exists(
            selectFrom('person')
              .whereRef('person.personGroupId', '=', 'person_group.id')
              .select('person.personGroupId'),
          ),
        ),
      )
      .executeTakeFirst();

    return Number(result.numDeletedRows);
  }

  @GenerateSql()
  async deleteOrphanedClusterGroups(): Promise<number> {
    const result = await this.db
      .deleteFrom('cluster_group')
      .where(({ not, exists, selectFrom }) =>
        not(exists(selectFrom('user').whereRef('user.clusterGroupId', '=', 'cluster_group.id').select('user.id'))),
      )
      .executeTakeFirst();

    return Number(result.numDeletedRows);
  }

  async deleteFaces({ sourceType }: DeleteFacesOptions): Promise<void> {
    await this.db.deleteFrom('asset_face').where('asset_face.sourceType', '=', sourceType).execute();
  }

  @GenerateSql({
    params: [{ personGroupId: null, sourceType: SourceType.MachineLearning, clusterGroupId: DummyValue.UUID }],
    stream: true,
  })
  getAllFaces(options: GetAllFacesOptions = {}) {
    return this.db
      .selectFrom('asset_face')
      .selectAll('asset_face')
      .$if(options.personGroupId === null, (qb) => qb.where('asset_face.personGroupId', 'is', null))
      .$if(!!options.personGroupId, (qb) => qb.where('asset_face.personGroupId', '=', options.personGroupId!))
      .$if(!!options.sourceType, (qb) => qb.where('asset_face.sourceType', '=', options.sourceType!))
      .$if(!!options.assetId, (qb) => qb.where('asset_face.assetId', '=', options.assetId!))
      .$if(!!options.clusterGroupId, (qb) =>
        qb
          .innerJoin('asset', 'asset.id', 'asset_face.assetId')
          .innerJoin('user', 'user.id', 'asset.ownerId')
          .where('user.clusterGroupId', '=', options.clusterGroupId!),
      )
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .stream();
  }

  getAll(options: GetAllPeopleOptions = {}) {
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .$if(!!options.ownerId, (qb) => qb.where('person.ownerId', '=', options.ownerId!))
      .$if(options.thumbnailPath !== undefined, (qb) => qb.where('person.thumbnailPath', '=', options.thumbnailPath!))
      .$if(options.faceAssetId === null, (qb) => qb.where('person.faceAssetId', 'is', null))
      .$if(!!options.faceAssetId, (qb) => qb.where('person.faceAssetId', '=', options.faceAssetId!))
      .$if(options.isHidden !== undefined, (qb) => qb.where('person.isHidden', '=', options.isHidden!))
      .stream();
  }

  @GenerateSql(
    { params: [DummyValue.UUID, { year: 2025, month: 1, day: 1 }] },
    { name: 'leap day fallback', params: [DummyValue.UUID, { year: 2025, month: 2, day: 28 }] },
  )
  async forBirthdayMemories(ownerId: string, { year, month, day }: YearMonthDay) {
    const isLeapDayBirthday = isLeapDayObserved({ year, month, day });

    const people = await this.db
      .selectFrom('person')
      .select(['person.personGroupId', 'person.name'])
      .select(sql<number>`date_part('year', person."birthDate")::int`.as('birthYear'))
      .select(sql<number>`date_part('month', person."birthDate")::int`.as('birthMonth'))
      .select(sql<number>`date_part('day', person."birthDate")::int`.as('birthDay'))
      .where('person.ownerId', '=', ownerId)
      .where('person.isHidden', '=', false)
      .where('person.name', '!=', '')
      .where('person.birthDate', 'is not', null)
      .where((eb) => {
        const bornOn = (month: number, day: number) =>
          eb.and([
            eb(sql`date_part('month', person."birthDate")::int`, '=', month),
            eb(sql`date_part('day', person."birthDate")::int`, '=', day),
          ]);

        return isLeapDayBirthday ? eb.or([bornOn(month, day), bornOn(2, 29)]) : bornOn(month, day);
      })
      .where(sql`date_part('year', person."birthDate")::int`, '<', year)
      .execute();

    return people.map(({ personGroupId, name, birthYear, birthMonth, birthDay }) => ({
      personGroupId,
      name,
      birthDate: { year: birthYear, month: birthMonth, day: birthDay },
    }));
  }

  @GenerateSql()
  getFileSamples() {
    return this.db
      .selectFrom('person')
      .select(['ownerId', 'personGroupId', 'thumbnailPath'])
      .where('thumbnailPath', '!=', sql.lit(''))
      .limit(sql.lit(3))
      .execute();
  }

  @GenerateSql({ params: [{ take: 1, skip: 0 }, DummyValue.UUID] })
  async getAllForUser(pagination: PaginationOptions, userId: string, options?: PersonSearchOptions) {
    const items = await this.db
      .selectFrom('person_group')
      .innerJoin('person as owned', (join) =>
        join.onRef('owned.personGroupId', '=', 'person_group.id').on('owned.ownerId', '=', userId),
      )
      .leftJoin('asset_face', (join) =>
        join
          .onRef('asset_face.personGroupId', '=', 'person_group.id')
          .on('asset_face.deletedAt', 'is', null)
          .on('asset_face.isVisible', 'is', true),
      )
      .leftJoin('asset', (join) =>
        join
          .onRef('asset.id', '=', 'asset_face.assetId')
          .on('asset.ownerId', '=', userId)
          .on('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
          .on('asset.deletedAt', 'is', null),
      )
      .select(withOwnedPerson(userId))
      .select(withOtherPeople(userId))
      .groupBy(['person_group.id', 'owned.ownerId', 'owned.personGroupId'])
      .having((eb) =>
        eb.or([
          // shared people are always included
          eb.exists(
            eb
              .selectFrom('person_user')
              .select('person_user.sharedWithId')
              .whereRef('person_user.personGroupId', '=', 'person_group.id')
              .where('person_user.sharedWithId', '=', userId),
          ),
          eb.and([eb(faceCount, '>', 0), eb('owned.name', '!=', '')]),
          eb(
            faceCount,
            '>=',
            sql<number>`COALESCE(
              (SELECT value -> 'people' ->> 'minimumFaces'
              FROM user_metadata
              WHERE "userId" = ${userId}
                AND key = ${sql.lit(UserMetadataKey.Preferences)}),
              '3'
            )::int `,
          ),
        ]),
      )
      .orderBy('owned.isHidden', 'asc')
      .orderBy('owned.isFavorite', 'desc')
      .$if(!!options?.closestFaceAssetId, (qb) =>
        qb.orderBy((eb) =>
          eb(
            (eb) =>
              eb
                .selectFrom('face_search')
                .select('face_search.embedding')
                .whereRef('face_search.faceId', '=', 'owned.faceAssetId'),
            '<=>',
            (eb) =>
              eb
                .selectFrom('face_search')
                .select('face_search.embedding')
                .where('face_search.faceId', '=', options!.closestFaceAssetId!),
          ),
        ),
      )
      .$if(!options?.closestFaceAssetId, (qb) =>
        qb
          .orderBy(sql`NULLIF("owned"."name", '') is null`, 'asc')
          .orderBy(faceCount, 'desc')
          .orderBy(sql`NULLIF("owned"."name", '')`, (om) => om.asc().nullsLast())
          .orderBy('owned.createdAt'),
      )
      // an explicit isHidden filter takes precedence over withHidden
      .$if(!options?.withHidden && options?.isHidden === undefined, (qb) => qb.where('owned.isHidden', '=', false))
      .where(withFilters(userId, options))
      .offset(pagination.skip ?? 0)
      .limit(pagination.take + 1)
      .execute();

    return paginationHelper(
      items.map((item) => asPerson(item)),
      pagination.take,
    );
  }

  @GenerateSql()
  getAllWithoutFaces() {
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .leftJoin('asset_face', 'asset_face.personGroupId', 'person.personGroupId')
      .where('asset_face.deletedAt', 'is', null)
      .where((eb) => eb.or([eb('asset_face.isVisible', 'is', null), eb('asset_face.isVisible', '=', true)]))
      .having((eb) => eb.fn.count('asset_face.assetId'), '=', 0)
      .groupBy(['person.ownerId', 'person.personGroupId'])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, { viewingUserId: DummyValue.UUID, isVisible: true }] })
  getFaces(assetId: string, options: GetFacesOptions) {
    const { viewingUserId, isVisible } = options;

    return this.db
      .selectFrom('asset_face')
      .selectAll('asset_face')
      .select(withPerson({ viewingUserId }))
      .where('asset_face.assetId', '=', assetId)
      .where('asset_face.deletedAt', 'is', null)
      .$if(isVisible !== undefined, (qb) => qb.where('asset_face.isVisible', '=', isVisible!))
      .orderBy('asset_face.boundingBoxX1', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, { viewingUserId: DummyValue.UUID }] })
  getFaceById(id: string, { viewingUserId }: WithPersonOptions) {
    // TODO return null instead of find or fail
    return this.db
      .selectFrom('asset_face')
      .selectAll('asset_face')
      .select(withPerson({ viewingUserId }))
      .where('asset_face.id', '=', id)
      .where('asset_face.deletedAt', 'is', null)
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaceForFacialRecognitionJob(id: string) {
    return this.db
      .selectFrom('asset_face')
      .select(['asset_face.id', 'asset_face.personGroupId', 'asset_face.sourceType'])
      .select((eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('asset')
            .innerJoin('user', 'user.id', 'asset.ownerId')
            .select(['asset.ownerId', 'asset.visibility', 'asset.fileCreatedAt', 'user.clusterGroupId'])
            .whereRef('asset.id', '=', 'asset_face.assetId'),
        ).as('asset'),
      )
      .select(withFaceSearch)
      .where('asset_face.id', '=', id)
      .where('asset_face.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID, personGroupId: DummyValue.UUID }] })
  getDataForThumbnailGenerationJob({ ownerId, personGroupId }: PersonId) {
    return this.db
      .selectFrom('person')
      .innerJoin('asset_face', 'asset_face.id', 'person.faceAssetId')
      .innerJoin('asset', 'asset_face.assetId', 'asset.id')
      .leftJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
      .select([
        'person.ownerId',
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
      .where('person.ownerId', '=', ownerId)
      .where('person.personGroupId', '=', personGroupId)
      .where('asset_face.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async reassignFace(assetFaceId: string, newPersonGroupId: string): Promise<number> {
    const result = await this.db
      .updateTable('asset_face')
      .set({ personGroupId: newPersonGroupId })
      .where('asset_face.id', '=', assetFaceId)
      .executeTakeFirst();

    return Number(result.numChangedRows ?? 0);
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, personGroupId: DummyValue.UUID }] })
  async getForUser({ userId, personGroupId }: { userId: string; personGroupId: string }) {
    const group = await this.db
      .selectFrom('person_group')
      .select(withOwnedPerson(userId))
      .select(withOtherPeople(userId))
      .where('person_group.id', '=', personGroupId)
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('person')
            .select('person.ownerId')
            .whereRef('person.personGroupId', '=', 'person_group.id')
            .where('person.ownerId', '=', userId),
        ),
      )
      .executeTakeFirst();

    return group && asPerson(group);
  }

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID, personGroupId: DummyValue.UUID }] })
  getByGroupId({ ownerId, personGroupId }: PersonId) {
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .select(withOtherPeopleForPerson(ownerId))
      .where('person.personGroupId', '=', personGroupId)
      .where('person.ownerId', '=', ownerId)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID, personGroupId: DummyValue.UUID }] })
  getForThumbnail({ ownerId, personGroupId }: PersonId) {
    return this.db
      .selectFrom('person_group')
      .select(({ selectFrom }) => [
        // TODO-DANIEL I would've done a left join of person_user and sorted by person.ownerId = ownerId desc.
        // should probably discuss with Mert which approach is more efficient.
        selectFrom('person')
          .select('person.thumbnailPath')
          .whereRef('person.personGroupId', '=', 'person_group.id')
          .where('person.ownerId', '=', ownerId)
          .as('thumbnailPath'),
        selectFrom('person')
          .innerJoin('person_user', (join) =>
            join
              .onRef('person_user.personGroupId', '=', 'person.personGroupId')
              .onRef('person_user.sharedById', '=', 'person.ownerId')
              .on('person_user.sharedWithId', '=', ownerId),
          )
          .select('person.thumbnailPath')
          .whereRef('person.personGroupId', '=', 'person_group.id')
          .where('person.thumbnailPath', '!=', '')
          .limit(1)
          .as('sharedThumbnailPath'),
      ])
      .where('person_group.id', '=', personGroupId)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING, { withHidden: true }] })
  getByName(userId: string, personName: string, { withHidden }: PersonNameSearchOptions) {
    return this.db
      .with('similarity_threshold', (db) =>
        db.selectNoFrom(sql`set_config('pg_trgm.word_similarity_threshold', '0.5', true)`.as('thresh')),
      )
      .selectFrom(['similarity_threshold', 'person'])
      .selectAll('person')
      .select(withOtherPeopleForPerson(userId))
      .where('person.ownerId', '=', userId)
      .where(() => sql`f_unaccent("person"."name") %> f_unaccent(${personName})`)
      .orderBy(sql`f_unaccent("person"."name") <->>> f_unaccent(${personName})`)
      .limit(100)
      .$if(!withHidden, (qb) => qb.where('person.isHidden', '=', false))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, { withHidden: true }] })
  getDistinctNames(userId: string, { withHidden }: PersonNameSearchOptions): Promise<PersonNameResponse[]> {
    return this.db
      .selectFrom('person')
      .select(['person.personGroupId', 'person.name'])
      .distinctOn((eb) => eb.fn('lower', ['person.name']))
      .where((eb) => eb.and([eb('person.ownerId', '=', userId), eb('person.name', '!=', '')]))
      .$if(!withHidden, (qb) => qb.where('person.isHidden', '=', false))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async getStatistics(
    personGroupId: string,
    { ownerId, partnerIds }: { ownerId: string; partnerIds: string[] },
  ): Promise<PersonStatistics> {
    const result = await this.db
      .selectFrom('asset_face')
      .leftJoin('asset', (join) =>
        join
          .onRef('asset.id', '=', 'asset_face.assetId')
          .on('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
          .on('asset.deletedAt', 'is', null)
          .on((eb) => eb.or([eb('asset.ownerId', '=', anyUuid([ownerId, ...partnerIds])), inSharedAlbum(eb, ownerId)])),
      )
      .select((eb) => eb.fn.count(eb.fn('distinct', ['asset.id'])).as('count'))
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .where('asset_face.personGroupId', '=', personGroupId)
      .executeTakeFirst();

    return {
      assets: result ? Number(result.count) : 0,
    };
  }
  @GenerateSql({ params: [DummyValue.UUID] })
  getNumberOfPeople(userId: string, options?: PersonFilterOptions) {
    const zero = sql.lit(0);
    return this.db
      .selectFrom('person_group')
      .leftJoin('person as owned', (join) =>
        join.onRef('owned.personGroupId', '=', 'person_group.id').on('owned.ownerId', '=', userId),
      )
      .where((eb) =>
        eb.or([
          eb.and([
            eb('owned.ownerId', 'is not', null),
            eb.exists((eb) =>
              eb
                .selectFrom('asset_face')
                .whereRef('asset_face.personGroupId', '=', 'person_group.id')
                .where('asset_face.deletedAt', 'is', null)
                .where('asset_face.isVisible', '=', true)
                .where((eb) =>
                  eb.exists((eb) =>
                    eb
                      .selectFrom('asset')
                      .whereRef('asset.id', '=', 'asset_face.assetId')
                      .where('asset.ownerId', '=', userId)
                      .where('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
                      .where('asset.deletedAt', 'is', null),
                  ),
                ),
            ),
          ]),
          eb.exists((eb) =>
            eb
              .selectFrom('person_user')
              .select('person_user.sharedById')
              .whereRef('person_user.personGroupId', '=', 'person_group.id')
              .where('person_user.sharedWithId', '=', userId),
          ),
        ]),
      )
      .where(withFilters(userId, options))
      .select((eb) => eb.fn.coalesce(eb.fn.countAll<number>(), zero).as('total'))
      .select((eb) =>
        eb.fn.coalesce(eb.fn.countAll<number>().filterWhere('owned.isHidden', '=', true), zero).as('hidden'),
      )
      .executeTakeFirstOrThrow();
  }

  create(person: Insertable<PersonTable>) {
    return this.db
      .insertInto('person')
      .values(person)
      .returningAll()
      .returning(withOtherPeopleForPerson(person.ownerId))
      .executeTakeFirstOrThrow();
  }

  async createAll(people: Insertable<PersonTable>[]) {
    if (people.length === 0) {
      return [];
    }

    return this.db.insertInto('person').values(people).returningAll().execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  createGroup(ownerId: string) {
    return this.db
      .insertInto('person_group')
      .columns(['clusterGroupId'])
      .expression((eb) => eb.selectFrom('user').select('user.clusterGroupId').where('user.id', '=', ownerId))
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, newClusterId: DummyValue.UUID }] })
  async reassignCluster({ userId, newClusterId }: ReassignCluster): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      // a group nobody else has people in moves across as it is
      await trx
        .updateTable('person_group')
        .set({ clusterGroupId: newClusterId })
        .where('person_group.id', 'in', (eb) =>
          eb.selectFrom('person').select('person.personGroupId').where('person.ownerId', '=', userId),
        )
        .where(({ not, exists, selectFrom }) =>
          not(
            exists(
              selectFrom('person')
                .select('person.personGroupId')
                .whereRef('person.personGroupId', '=', 'person_group.id')
                .where('person.ownerId', '!=', userId),
            ),
          ),
        )
        .execute();

      // the rest is shared with someone else, so this user gets a group of their own for each
      const mapping = await trx
        .with('shared', (db) =>
          db
            .selectFrom('person')
            .select('person.personGroupId as oldId')
            .distinct()
            .where('person.ownerId', '=', userId)
            .where(({ exists, selectFrom }) =>
              exists(
                selectFrom('person as other')
                  .select('other.personGroupId')
                  .whereRef('other.personGroupId', '=', 'person.personGroupId')
                  .where('other.ownerId', '!=', userId),
              ),
            ),
        )
        .with(
          (cte) => cte('mapping').materialized(),
          (db) => db.selectFrom('shared').select(['shared.oldId', sql<string>`uuid_generate_v4()`.as('newId')]),
        )
        .with('created', (db) =>
          db
            .insertInto('person_group')
            .columns(['id', 'clusterGroupId'])
            .expression((eb) =>
              eb.selectFrom('mapping').select(['mapping.newId', sql.val(newClusterId).as('clusterGroupId')]),
            ),
        )
        .selectFrom('mapping')
        .select(['mapping.oldId', 'mapping.newId'])
        .execute();

      if (mapping.length === 0) {
        return;
      }

      const oldIds = mapping.map(({ oldId }) => oldId);
      const newIds = mapping.map(({ newId }) => newId);
      const remapped = sql<{
        oldId: string;
        newId: string;
      }>`(select unnest(${`{${oldIds}}`}::uuid[]) as "oldId", unnest(${`{${newIds}}`}::uuid[]) as "newId")`.as(
        'mapping',
      );

      await trx
        .updateTable('person')
        .from(remapped)
        .set((eb) => ({ personGroupId: eb.ref('mapping.newId') }))
        .whereRef('person.personGroupId', '=', 'mapping.oldId')
        .where('person.ownerId', '=', userId)
        .execute();

      await trx
        .updateTable('asset_face')
        .from(remapped)
        .set((eb) => ({ personGroupId: eb.ref('mapping.newId') }))
        .whereRef('asset_face.personGroupId', '=', 'mapping.oldId')
        .where(({ exists, selectFrom }) =>
          exists(
            selectFrom('asset')
              .select('asset.id')
              .whereRef('asset.id', '=', 'asset_face.assetId')
              .where('asset.ownerId', '=', userId),
          ),
        )
        .execute();
    });
  }

  @GenerateSql({ params: [DummyValue.UUID, 2] })
  async createGroups(personGroups: Insertable<PersonGroupTable>[]) {
    if (personGroups.length === 0) {
      return [];
    }

    return this.db.insertInto('person_group').values(personGroups).returningAll().execute();
  }

  @GenerateSql({ params: [[], [], [{ faceId: DummyValue.UUID, embedding: DummyValue.VECTOR }]] })
  async refreshFaces(
    facesToAdd: (Insertable<AssetFaceTable> & { assetId: string })[],
    faceIdsToRemove: string[],
    embeddingsToAdd?: Insertable<FaceSearchTable>[],
  ): Promise<void> {
    let query = this.db;
    if (facesToAdd.length > 0) {
      (query as any) = query.with('added', (db) => db.insertInto('asset_face').values(facesToAdd));
    }

    if (faceIdsToRemove.length > 0) {
      (query as any) = query.with('removed', (db) =>
        db.deleteFrom('asset_face').where('asset_face.id', '=', (eb) => eb.fn.any(eb.val(faceIdsToRemove))),
      );
    }

    if (embeddingsToAdd?.length) {
      (query as any) = query.with('added_embeddings', (db) => db.insertInto('face_search').values(embeddingsToAdd));
    }

    await query.selectFrom(dummy).execute();
  }

  async update(person: Updateable<PersonTable> & PersonId) {
    return this.db
      .updateTable('person')
      .set(person)
      .where('person.ownerId', '=', person.ownerId)
      .where('person.personGroupId', '=', person.personGroupId)
      .returningAll()
      .returning(withOtherPeopleForPerson(person.ownerId))
      .executeTakeFirstOrThrow();
  }

  async updateAll(people: Insertable<PersonTable>[]): Promise<void> {
    if (people.length === 0) {
      return;
    }

    await this.db
      .insertInto('person')
      .values(people)
      .onConflict((oc) =>
        oc.columns(['ownerId', 'personGroupId']).doUpdateSet((eb) =>
          removeUndefinedKeys(
            {
              name: eb.ref('excluded.name'),
              birthDate: eb.ref('excluded.birthDate'),
              thumbnailPath: eb.ref('excluded.thumbnailPath'),
              faceAssetId: eb.ref('excluded.faceAssetId'),
              isHidden: eb.ref('excluded.isHidden'),
              isFavorite: eb.ref('excluded.isFavorite'),
              color: eb.ref('excluded.color'),
            },
            people[0],
          ),
        ),
      )
      .execute();
  }

  @GenerateSql({
    params: [[{ assetId: DummyValue.UUID, personGroupId: DummyValue.UUID }], { viewingUserId: DummyValue.UUID }],
  })
  @ChunkedArray()
  getFacesByIds(ids: AssetFaceId[], { viewingUserId }: WithPersonOptions) {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    const assetIds: string[] = [];
    const personGroupIds: string[] = [];
    for (const { assetId, personGroupId } of ids) {
      assetIds.push(assetId);
      personGroupIds.push(personGroupId);
    }

    return this.db
      .selectFrom('asset_face')
      .selectAll('asset_face')
      .select(withPerson({ viewingUserId }))
      .where('asset_face.assetId', 'in', assetIds)
      .where('asset_face.personGroupId', 'in', personGroupIds)
      .where('asset_face.deletedAt', 'is', null)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getRandomFace(personGroupId: string) {
    return this.db
      .selectFrom('asset_face')
      .selectAll('asset_face')
      .where('asset_face.personGroupId', '=', personGroupId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .executeTakeFirst();
  }

  @GenerateSql()
  async getLatestFaceDate(): Promise<string | undefined> {
    const result = (await this.db
      .selectFrom('asset_job_status')
      .select((eb) => sql`${eb.fn.max('asset_job_status.facesRecognizedAt')}::text`.as('latestDate'))
      .executeTakeFirst()) as { latestDate: string } | undefined;

    return result?.latestDate;
  }

  async createAssetFace(face: Insertable<AssetFaceTable>): Promise<void> {
    await this.db.insertInto('asset_face').values(face).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteAssetFace(id: string): Promise<void> {
    await this.db.deleteFrom('asset_face').where('asset_face.id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async softDeleteAssetFaces(id: string): Promise<void> {
    await this.db.updateTable('asset_face').set({ deletedAt: new Date() }).where('asset_face.id', '=', id).execute();
  }

  @GenerateSql({ params: [[], []] })
  async updateVisibility(visible: AssetFace[], hidden: AssetFace[]): Promise<void> {
    if (visible.length === 0 && hidden.length === 0) {
      return;
    }

    await this.db.transaction().execute(async (trx) => {
      if (visible.length > 0) {
        await trx
          .updateTable('asset_face')
          .set({ isVisible: true })
          .where(
            'asset_face.id',
            'in',
            visible.map(({ id }) => id),
          )
          .execute();
      }

      if (hidden.length > 0) {
        await trx
          .updateTable('asset_face')
          .set({ isVisible: false })
          .where(
            'asset_face.id',
            'in',
            hidden.map(({ id }) => id),
          )
          .execute();
      }
    });
  }

  @GenerateSql({ params: [{ personGroupId: DummyValue.UUID, assetId: DummyValue.UUID }] })
  getForFeatureFaceUpdate({ personGroupId, assetId }: { personGroupId: string; assetId: string }) {
    return this.db
      .selectFrom('asset_face')
      .select('asset_face.id')
      .where('asset_face.assetId', '=', assetId)
      .where('asset_face.personGroupId', '=', personGroupId)
      .where('asset_face.deletedAt', 'is', null)
      .innerJoin('asset', (join) => join.onRef('asset.id', '=', 'asset_face.assetId').on('asset.isOffline', '=', false))
      .executeTakeFirst();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  getForMergePerson(personGroupIds: string[]) {
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .where('person.personGroupId', 'in', personGroupIds)
      .execute();
  }
}
