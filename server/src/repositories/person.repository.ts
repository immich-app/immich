import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, Selectable, sql, SqlBool, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { AssetFace } from 'src/database';
import { Chunked, ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { AssetFileType, AssetVisibility, SourceType } from 'src/enum';
import { DB } from 'src/schema';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { FaceSearchTable } from 'src/schema/tables/face-search.table';
import { PersonTable } from 'src/schema/tables/person.table';
import { removeUndefinedKeys, withFilePath } from 'src/utils/database';
import { paginationHelper, PaginationOptions } from 'src/utils/pagination';

export interface PersonSearchOptions {
  minimumFaceCount: number;
  withHidden: boolean;
  closestFaceAssetId?: string;
}

export interface PersonNameSearchOptions {
  withHidden?: boolean;
}

export interface PersonNameResponse {
  id: string;
  name: string;
}

export interface AssetFaceId {
  assetId: string;
  personId: string;
}

export interface UpdateFacesData {
  oldPersonId?: string;
  faceIds?: string[];
  newPersonId: string;
}

export interface PersonStatistics {
  assets: number;
  faces: number;
}

export interface PeopleOverviewStatistics {
  total: number;
  hidden: number;
  detectedFaceCount: number;
}

export interface PeopleFaceStatistics {
  detectedFaceCount: number;
  assignedVisibleFaceCount: number;
  namedVisiblePersonCount: number;
  assignedHiddenFaceCount: number;
  unassignedFaceCount: number;
}

export interface PeopleFaceStatisticsOptions {
  minimumFaceCount?: number;
}

const peopleAssetVisibilities = [AssetVisibility.Archive, AssetVisibility.Timeline];

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
  personId?: string | null;
  assetId?: string;
  sourceType?: SourceType;
}

export interface RepresentativeFaceListOptions {
  personId: string;
  take: number;
  skip: number;
}

export interface RepresentativeFaceUpdateOptions {
  personId: string;
  assetFaceId: string;
}

export type UnassignFacesOptions = DeleteFacesOptions;

export type SelectFaceOptions = (keyof Selectable<AssetFaceTable>)[];

const withPerson = (eb: ExpressionBuilder<DB, 'asset_face'>) => {
  return jsonObjectFrom(
    eb.selectFrom('person').selectAll('person').whereRef('person.id', '=', 'asset_face.personId'),
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

  @GenerateSql({ params: [{ oldPersonId: DummyValue.UUID, newPersonId: DummyValue.UUID }] })
  async reassignFaces({ oldPersonId, faceIds, newPersonId }: UpdateFacesData): Promise<number> {
    const result = await this.db
      .updateTable('asset_face')
      .set({ personId: newPersonId })
      .$if(!!oldPersonId, (qb) => qb.where('asset_face.personId', '=', oldPersonId!))
      .$if(!!faceIds, (qb) => qb.where('asset_face.id', 'in', faceIds!))
      .executeTakeFirst();

    return Number(result.numChangedRows ?? 0);
  }

  async unassignFaces({ sourceType }: UnassignFacesOptions): Promise<void> {
    await this.db
      .updateTable('asset_face')
      .set({ personId: null })
      .where('asset_face.sourceType', '=', sourceType)
      .execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @Chunked()
  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.db.deleteFrom('person').where('person.id', 'in', ids).execute();
  }

  async deleteFaces({ sourceType }: DeleteFacesOptions): Promise<void> {
    await this.db.deleteFrom('asset_face').where('asset_face.sourceType', '=', sourceType).execute();
  }

  getAllFaces(options: GetAllFacesOptions = {}) {
    return this.db
      .selectFrom('asset_face')
      .selectAll('asset_face')
      .$if(options.personId === null, (qb) => qb.where('asset_face.personId', 'is', null))
      .$if(!!options.personId, (qb) => qb.where('asset_face.personId', '=', options.personId!))
      .$if(!!options.sourceType, (qb) => qb.where('asset_face.sourceType', '=', options.sourceType!))
      .$if(!!options.assetId, (qb) => qb.where('asset_face.assetId', '=', options.assetId!))
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

  @GenerateSql({ params: [DummyValue.UUID, { month: 4, day: 23 }] })
  getBirthdaysForDay(ownerId: string, { month, day }: { month: number; day: number }) {
    return this.db
      .selectFrom('person')
      .select(['id', 'name', 'birthDate'])
      .where('ownerId', '=', ownerId)
      .where('isHidden', '=', false)
      .where('type', '=', 'person')
      .where('name', '!=', '')
      .where('birthDate', 'is not', null)
      .where(sql`extract(month from "birthDate")`, '=', month)
      .where(sql`extract(day from "birthDate")`, '=', day)
      .execute();
  }

  @GenerateSql()
  getFileSamples() {
    return this.db
      .selectFrom('person')
      .select(['id', 'thumbnailPath'])
      .where('thumbnailPath', '!=', sql.lit(''))
      .limit(sql.lit(3))
      .execute();
  }

  @GenerateSql({ params: [{ take: 1, skip: 0 }, DummyValue.UUID] })
  async getAllForUser(pagination: PaginationOptions, userId: string, options?: PersonSearchOptions) {
    const items = await this.db
      .selectFrom('person')
      .selectAll('person')
      .innerJoin('asset_face', 'asset_face.personId', 'person.id')
      .innerJoin('asset', (join) =>
        join
          .onRef('asset_face.assetId', '=', 'asset.id')
          .on('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
          .on('asset.deletedAt', 'is', null),
      )
      .where('person.ownerId', '=', userId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .orderBy('person.isHidden', 'asc')
      .orderBy('person.isFavorite', 'desc')
      .having((eb) =>
        eb.or([
          eb('person.name', '!=', ''),
          eb((innerEb) => innerEb.fn.count('asset_face.assetId'), '>=', options?.minimumFaceCount || 1),
        ]),
      )
      .groupBy('person.id')
      .$if(!!options?.closestFaceAssetId, (qb) =>
        qb.orderBy((eb) =>
          eb(
            (eb) =>
              eb
                .selectFrom('face_search')
                .select('face_search.embedding')
                .whereRef('face_search.faceId', '=', 'person.faceAssetId'),
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
          .orderBy(sql`NULLIF(person.name, '') is null`, 'asc')
          .orderBy((eb) => eb.fn.count('asset_face.assetId'), 'desc')
          .orderBy(sql`NULLIF(person.name, '')`, (om) => om.asc().nullsLast())
          .orderBy('person.createdAt'),
      )
      .$if(!options?.withHidden, (qb) => qb.where('person.isHidden', '=', false))
      .offset(pagination.skip ?? 0)
      .limit(pagination.take + 1)
      .execute();

    return paginationHelper(items, pagination.take);
  }

  @GenerateSql()
  getAllWithoutFaces() {
    // The deletedAt / isVisible predicates must live inside the JOIN ON clause,
    // not in WHERE. A WHERE filter on a LEFT JOIN'd table silently converts it
    // to an INNER JOIN, which excludes persons with zero asset_face rows entirely
    // and leaves named zombies uncleaned after a force-recognition reset.
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .leftJoin('asset_face', (join) =>
        join
          .onRef('asset_face.personId', '=', 'person.id')
          .on('asset_face.deletedAt', 'is', null)
          .on('asset_face.isVisible', 'is', true),
      )
      .groupBy('person.id')
      .having((eb) => eb.fn.count('asset_face.assetId'), '=', 0)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaces(assetId: string, options?: { isVisible?: boolean }) {
    const isVisible = options === undefined ? true : options.isVisible;

    return this.db
      .selectFrom('asset_face')
      .selectAll('asset_face')
      .select(withPerson)
      .where('asset_face.assetId', '=', assetId)
      .where('asset_face.deletedAt', 'is', null)
      .$if(isVisible !== undefined, (qb) => qb.where('asset_face.isVisible', '=', isVisible!))
      .orderBy('asset_face.boundingBoxX1', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaceById(id: string) {
    // TODO return null instead of find or fail
    return this.db
      .selectFrom('asset_face')
      .selectAll('asset_face')
      .select(withPerson)
      .where('asset_face.id', '=', id)
      .where('asset_face.deletedAt', 'is', null)
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ personId: DummyValue.UUID, take: 50, skip: 0 }] })
  getRepresentativeFaces(options: RepresentativeFaceListOptions) {
    return this.db
      .selectFrom('person')
      .innerJoin('asset_face', (join) =>
        join.on((eb) =>
          eb.or([
            eb('asset_face.personId', '=', eb.ref('person.id')),
            eb.exists(
              eb
                .selectFrom('face_identity_face')
                .select('face_identity_face.assetFaceId')
                .whereRef('face_identity_face.assetFaceId', '=', 'asset_face.id')
                .whereRef('face_identity_face.identityId', '=', 'person.identityId'),
            ),
          ]),
        ),
      )
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .selectAll('asset_face')
      .select(['asset.fileCreatedAt', 'person.faceAssetId as representativeFaceId'])
      .where('person.id', '=', options.personId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom('face_identity_face')
              .select('face_identity_face.assetFaceId')
              .whereRef('face_identity_face.assetFaceId', '=', 'asset_face.id')
              .where(sql<SqlBool>`face_identity_face."identityId" IS DISTINCT FROM person."identityId"`),
          ),
        ),
      )
      .orderBy('asset.fileCreatedAt', 'desc')
      .orderBy('asset_face.id')
      .offset(options.skip)
      .limit(options.take + 1)
      .execute();
  }

  @GenerateSql({ params: [{ personId: DummyValue.UUID, assetFaceId: DummyValue.UUID }] })
  getRepresentativeFaceForUpdate(options: RepresentativeFaceUpdateOptions) {
    return this.db
      .selectFrom('person')
      .innerJoin('asset_face', (join) =>
        join.on((eb) =>
          eb.or([
            eb('asset_face.personId', '=', eb.ref('person.id')),
            eb.exists(
              eb
                .selectFrom('face_identity_face')
                .select('face_identity_face.assetFaceId')
                .whereRef('face_identity_face.assetFaceId', '=', 'asset_face.id')
                .whereRef('face_identity_face.identityId', '=', 'person.identityId'),
            ),
          ]),
        ),
      )
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .selectAll('asset_face')
      .where('person.id', '=', options.personId)
      .where('asset_face.id', '=', options.assetFaceId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom('face_identity_face')
              .select('face_identity_face.assetFaceId')
              .whereRef('face_identity_face.assetFaceId', '=', 'asset_face.id')
              .where(sql<SqlBool>`face_identity_face."identityId" IS DISTINCT FROM person."identityId"`),
          ),
        ),
      )
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaceForFacialRecognitionJob(id: string) {
    return this.db
      .selectFrom('asset_face')
      .select(['asset_face.id', 'asset_face.assetId', 'asset_face.personId', 'asset_face.sourceType'])
      .select((eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('asset')
            .select(['asset.ownerId', 'asset.visibility', 'asset.fileCreatedAt'])
            .whereRef('asset.id', '=', 'asset_face.assetId'),
        ).as('asset'),
      )
      .select(withFaceSearch)
      .where('asset_face.id', '=', id)
      .where('asset_face.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getDataForThumbnailGenerationJob(id: string) {
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
      .where('person.id', '=', id)
      .where('asset_face.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async reassignFace(assetFaceId: string, newPersonId: string): Promise<number> {
    const result = await this.db
      .updateTable('asset_face')
      .set({ personId: newPersonId })
      .where('asset_face.id', '=', assetFaceId)
      .executeTakeFirst();

    return Number(result.numChangedRows ?? 0);
  }

  getById(personId: string) {
    return this.db //
      .selectFrom('person')
      .selectAll('person')
      .where('person.id', '=', personId)
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
      .select(['person.id', 'person.name'])
      .distinctOn((eb) => eb.fn('lower', ['person.name']))
      .where((eb) => eb.and([eb('person.ownerId', '=', userId), eb('person.name', '!=', '')]))
      .$if(!withHidden, (qb) => qb.where('person.isHidden', '=', false))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getStatistics(personId: string): Promise<PersonStatistics> {
    const result = await this.db
      .selectFrom('asset_face')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .select((eb) => eb.fn.count(eb.fn('distinct', ['asset.id'])).as('assets'))
      .select((eb) => eb.fn.count(eb.fn('distinct', ['asset_face.id'])).as('faces'))
      .where('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .where('asset_face.personId', '=', personId)
      .executeTakeFirst();

    return {
      assets: Number(result?.assets ?? 0),
      faces: Number(result?.faces ?? 0),
    };
  }

  @GenerateSql({ params: [DummyValue.UUID, { minimumFaceCount: 3 }] })
  async getNumberOfPeople(userId: string, options: PeopleFaceStatisticsOptions = {}) {
    const minimumFaceCount = options.minimumFaceCount ?? 1;
    const result = await sql<{ total: number; hidden: number }>`
      WITH "eligible_people" AS (
        SELECT
          "person"."id",
          "person"."isHidden"
        FROM "person"
        INNER JOIN "asset_face" ON "asset_face"."personId" = "person"."id"
        INNER JOIN "asset" ON "asset"."id" = "asset_face"."assetId"
        WHERE "person"."ownerId" = ${userId}
          AND "asset"."visibility" = ${AssetVisibility.Timeline}
          AND "asset"."deletedAt" IS NULL
          AND "asset_face"."deletedAt" IS NULL
          AND "asset_face"."isVisible" = true
        GROUP BY "person"."id"
        HAVING NULLIF(BTRIM("person"."name"), '') IS NOT NULL
          OR COUNT("asset_face"."assetId") >= ${minimumFaceCount}
      )
      SELECT
        COUNT(*)::int AS "total",
        COUNT(*) FILTER (WHERE "isHidden" = true)::int AS "hidden"
      FROM "eligible_people"
    `.execute(this.db);

    const row = result.rows[0];
    return {
      total: Number(row?.total ?? 0),
      hidden: Number(row?.hidden ?? 0),
    };
  }

  @GenerateSql({ params: [DummyValue.UUID, { minimumFaceCount: 3 }] })
  async getPeopleOverviewStatistics(
    userId: string,
    options: PeopleFaceStatisticsOptions = {},
  ): Promise<PeopleOverviewStatistics> {
    const minimumFaceCount = options.minimumFaceCount ?? 1;
    const result = await sql<PeopleOverviewStatistics>`
      WITH "eligible_faces" AS (
        SELECT
          "asset_face"."id" AS "assetFaceId",
          "asset_face"."personId"
        FROM "asset_face"
        INNER JOIN "asset" ON "asset"."id" = "asset_face"."assetId"
        WHERE "asset"."ownerId" = ${userId}
          AND "asset"."deletedAt" IS NULL
          AND "asset"."isOffline" = false
          AND "asset"."visibility" IN (${sql.join(peopleAssetVisibilities)})
          AND "asset_face"."deletedAt" IS NULL
          AND "asset_face"."isVisible" = true
      ),
      "eligible_people" AS (
        SELECT
          "person"."id",
          "person"."isHidden"
        FROM "person"
        INNER JOIN "eligible_faces" ON "eligible_faces"."personId" = "person"."id"
        WHERE "person"."ownerId" = ${userId}
        GROUP BY "person"."id"
        HAVING NULLIF(BTRIM("person"."name"), '') IS NOT NULL
          OR COUNT(DISTINCT "eligible_faces"."assetFaceId") >= ${minimumFaceCount}
      )
      SELECT
        COUNT(DISTINCT "eligible_people"."id")::int AS "total",
        COUNT(DISTINCT "eligible_people"."id") FILTER (WHERE "eligible_people"."isHidden" = true)::int AS "hidden",
        COUNT(DISTINCT "eligible_faces"."assetFaceId")::int AS "detectedFaceCount"
      FROM "eligible_faces"
      LEFT JOIN "eligible_people" ON "eligible_people"."id" = "eligible_faces"."personId"
    `.execute(this.db);

    const row = result.rows[0];
    return {
      total: Number(row?.total ?? 0),
      hidden: Number(row?.hidden ?? 0),
      detectedFaceCount: Number(row?.detectedFaceCount ?? 0),
    };
  }

  @GenerateSql({ params: [DummyValue.UUID, { minimumFaceCount: 3 }] })
  async getPeopleFaceStatistics(
    userId: string,
    options: PeopleFaceStatisticsOptions = {},
  ): Promise<PeopleFaceStatistics> {
    const minimumFaceCount = options.minimumFaceCount ?? 1;
    const result = await sql<PeopleFaceStatistics>`
      WITH "eligible_faces" AS (
        SELECT
          "asset_face"."id" AS "assetFaceId",
          "asset_face"."personId"
        FROM "asset_face"
        INNER JOIN "asset" ON "asset"."id" = "asset_face"."assetId"
        WHERE "asset"."ownerId" = ${userId}
          AND "asset"."deletedAt" IS NULL
          AND "asset"."isOffline" = false
          AND "asset"."visibility" IN (${sql.join(peopleAssetVisibilities)})
          AND "asset_face"."deletedAt" IS NULL
          AND "asset_face"."isVisible" = true
      ),
      "person_face_counts" AS (
        SELECT
          "personId",
          COUNT(DISTINCT "assetFaceId")::int AS "assetCount"
        FROM "eligible_faces"
        WHERE "personId" IS NOT NULL
        GROUP BY "personId"
      ),
      "detected_faces" AS (
        SELECT
          "eligible_faces"."assetFaceId",
          "person"."id" AS "personId",
          NULLIF(BTRIM("person"."name"), '') IS NOT NULL AS "isNamed",
          CASE
            WHEN "person"."id" IS NOT NULL
              AND (
                NULLIF(BTRIM("person"."name"), '') IS NOT NULL
                OR "person_face_counts"."assetCount" >= ${minimumFaceCount}
              )
            THEN "person"."isHidden"
            ELSE NULL
          END AS "isHidden"
        FROM "eligible_faces"
        LEFT JOIN "person"
          ON "person"."id" = "eligible_faces"."personId"
          AND "person"."ownerId" = ${userId}
        LEFT JOIN "person_face_counts"
          ON "person_face_counts"."personId" = "person"."id"
      )
      SELECT
        COUNT(DISTINCT "assetFaceId")::int AS "detectedFaceCount",
        COUNT(DISTINCT "assetFaceId") FILTER (WHERE "isHidden" = false)::int AS "assignedVisibleFaceCount",
        COUNT(DISTINCT "personId") FILTER (WHERE "isHidden" = false AND "isNamed" = true)::int AS "namedVisiblePersonCount",
        COUNT(DISTINCT "assetFaceId") FILTER (WHERE "isHidden" = true)::int AS "assignedHiddenFaceCount",
        COUNT(DISTINCT "assetFaceId") FILTER (WHERE "isHidden" IS NULL)::int AS "unassignedFaceCount"
      FROM "detected_faces"
    `.execute(this.db);

    const row = result.rows[0];
    return {
      detectedFaceCount: Number(row?.detectedFaceCount ?? 0),
      assignedVisibleFaceCount: Number(row?.assignedVisibleFaceCount ?? 0),
      namedVisiblePersonCount: Number(row?.namedVisiblePersonCount ?? 0),
      assignedHiddenFaceCount: Number(row?.assignedHiddenFaceCount ?? 0),
      unassignedFaceCount: Number(row?.unassignedFaceCount ?? 0),
    };
  }

  create(person: Insertable<PersonTable>) {
    return this.db.insertInto('person').values(person).returningAll().executeTakeFirstOrThrow();
  }

  async createAll(people: Insertable<PersonTable>[]): Promise<string[]> {
    if (people.length === 0) {
      return [];
    }

    const results = await this.db.insertInto('person').values(people).returningAll().execute();
    return results.map(({ id }) => id);
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

    await query.selectFrom(sql`(select 1)`.as('dummy')).execute();
  }

  async update(person: Updateable<PersonTable> & { id: string }) {
    return this.db
      .updateTable('person')
      .set(person)
      .where('person.id', '=', person.id)
      .returningAll()
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
        oc.column('id').doUpdateSet((eb) =>
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

  @GenerateSql({ params: [[{ assetId: DummyValue.UUID, personId: DummyValue.UUID }]] })
  @ChunkedArray()
  getFacesByIds(ids: AssetFaceId[]) {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    const assetIds: string[] = [];
    const personIds: string[] = [];
    for (const { assetId, personId } of ids) {
      assetIds.push(assetId);
      personIds.push(personId);
    }

    return this.db
      .selectFrom('asset_face')
      .selectAll('asset_face')
      .select(withPerson)
      .where('asset_face.assetId', 'in', assetIds)
      .where('asset_face.personId', 'in', personIds)
      .where('asset_face.deletedAt', 'is', null)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getRandomFace(personId: string) {
    return this.db
      .selectFrom('asset_face')
      .selectAll('asset_face')
      .where('asset_face.personId', '=', personId)
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

  getByOwnerAndSpecies(ownerId: string, species: string) {
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .where('person.ownerId', '=', ownerId)
      .where('person.type', '=', 'pet')
      .where('person.species', '=', species)
      .executeTakeFirst();
  }

  async createAssetFace(face: Insertable<AssetFaceTable>): Promise<string> {
    const result = await this.db.insertInto('asset_face').values(face).returning('id').executeTakeFirstOrThrow();
    return result.id;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteAssetFace(id: string): Promise<void> {
    await this.db.deleteFrom('asset_face').where('asset_face.id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async softDeleteAssetFaces(id: string): Promise<void> {
    await this.db.updateTable('asset_face').set({ deletedAt: new Date() }).where('asset_face.id', '=', id).execute();
  }

  async vacuum({ reindexVectors }: { reindexVectors: boolean }): Promise<void> {
    await sql`VACUUM ANALYZE asset_face, face_search, person`.execute(this.db);
    await sql`REINDEX TABLE asset_face`.execute(this.db);
    await sql`REINDEX TABLE person`.execute(this.db);
    if (reindexVectors) {
      await sql`REINDEX TABLE face_search`.execute(this.db);
    }
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @Chunked()
  getForPeopleDelete(ids: string[]) {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.db.selectFrom('person').select(['id', 'thumbnailPath']).where('id', 'in', ids).execute();
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

  @GenerateSql({ params: [{ personId: DummyValue.UUID, assetId: DummyValue.UUID }] })
  getForFeatureFaceUpdate({ personId, assetId }: { personId: string; assetId: string }) {
    return this.db
      .selectFrom('asset_face')
      .select('asset_face.id')
      .where('asset_face.assetId', '=', assetId)
      .where('asset_face.personId', '=', personId)
      .innerJoin('asset', (join) => join.onRef('asset.id', '=', 'asset_face.assetId').on('asset.isOffline', '=', false))
      .executeTakeFirst();
  }
}
