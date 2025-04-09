import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, Selectable, sql, Updateable } from 'kysely';
import { jsonArrayFrom, jsonBuildObject, jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { AssetFaces, DB, FaceSearch, Person } from 'src/db';
import { ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { AssetFileType, SourceType } from 'src/enum';
import { removeUndefinedKeys, toJson } from 'src/utils/database';
import { PaginationOptions } from 'src/utils/pagination';

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
}

export interface PeopleStatistics {
  total: number;
  hidden: number;
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
  personId?: string | null;
  assetId?: string;
  sourceType?: SourceType;
}

export type UnassignFacesOptions = DeleteFacesOptions;

export type SelectFaceOptions = (keyof Selectable<AssetFaces>)[];

const withPerson = (eb: ExpressionBuilder<DB, 'asset_faces'>) => {
  return jsonObjectFrom(
    eb.selectFrom('person').selectAll('person').whereRef('person.id', '=', 'asset_faces.personId'),
  ).as('person');
};

const withAsset = (eb: ExpressionBuilder<DB, 'asset_faces'>) => {
  return jsonObjectFrom(
    eb.selectFrom('assets').selectAll('assets').whereRef('assets.id', '=', 'asset_faces.assetId'),
  ).as('asset');
};

const withFaceSearch = (eb: ExpressionBuilder<DB, 'asset_faces'>) => {
  return jsonObjectFrom(
    eb.selectFrom('face_search').selectAll('face_search').whereRef('face_search.faceId', '=', 'asset_faces.id'),
  ).as('faceSearch');
};

@Injectable()
export class PersonRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [{ oldPersonId: DummyValue.UUID, newPersonId: DummyValue.UUID }] })
  async reassignFaces({ oldPersonId, faceIds, newPersonId }: UpdateFacesData): Promise<number> {
    const result = await this.db
      .updateTable('asset_faces')
      .set({ personId: newPersonId })
      .$if(!!oldPersonId, (qb) => qb.where('asset_faces.personId', '=', oldPersonId!))
      .$if(!!faceIds, (qb) => qb.where('asset_faces.id', 'in', faceIds!))
      .executeTakeFirst();

    return Number(result.numChangedRows ?? 0);
  }

  @GenerateSql({ params: [{ sourceType: SourceType.EXIF }] })
  async unassignFaces({ sourceType }: UnassignFacesOptions): Promise<void> {
    await this.db
      .updateTable('asset_faces')
      .set({ personId: null })
      .where('asset_faces.sourceType', '=', sourceType)
      .execute();

    await this.vacuum({ reindexVectors: false });
  }

  @GenerateSql({ params: [[{ id: DummyValue.UUID }]] })
  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.db.deleteFrom('person').where('person.id', 'in', ids).execute();
  }

  @GenerateSql({ params: [{ sourceType: SourceType.EXIF }] })
  async deleteFaces({ sourceType }: DeleteFacesOptions): Promise<void> {
    await this.db.deleteFrom('asset_faces').where('asset_faces.sourceType', '=', sourceType).execute();

    await this.vacuum({ reindexVectors: sourceType === SourceType.MACHINE_LEARNING });
  }

  getAllFaces(options: GetAllFacesOptions | undefined = {}): AsyncIterableIterator<Selectable<AssetFaces>> {
    return this.db
      .selectFrom('asset_faces')
      .selectAll('asset_faces')
      .$if(options.personId === null, (qb) => qb.where('asset_faces.personId', 'is', null))
      .$if(!!options.personId, (qb) => qb.where('asset_faces.personId', '=', options.personId!))
      .$if(!!options.sourceType, (qb) => qb.where('asset_faces.sourceType', '=', options.sourceType!))
      .$if(!!options.assetId, (qb) => qb.where('asset_faces.assetId', '=', options.assetId!))
      .where('asset_faces.deletedAt', 'is', null)
      .stream();
  }

  getAll(options: GetAllPeopleOptions | undefined = {}) {
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

  async getAllForUser(pagination: PaginationOptions, userId: string, options?: PersonSearchOptions) {
    const items = await this.db
      .selectFrom('person')
      .selectAll('person')
      .innerJoin('asset_faces', 'asset_faces.personId', 'person.id')
      .innerJoin('assets', (join) =>
        join
          .onRef('asset_faces.assetId', '=', 'assets.id')
          .on('assets.isArchived', '=', false)
          .on('assets.deletedAt', 'is', null),
      )
      .where('person.ownerId', '=', userId)
      .where('asset_faces.deletedAt', 'is', null)
      .orderBy('person.isHidden', 'asc')
      .orderBy('person.isFavorite', 'desc')
      .having((eb) =>
        eb.or([
          eb('person.name', '!=', ''),
          eb((innerEb) => innerEb.fn.count('asset_faces.assetId'), '>=', options?.minimumFaceCount || 1),
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
          .orderBy((eb) => eb.fn.count('asset_faces.assetId'), 'desc')
          .orderBy(sql`NULLIF(person.name, '')`, sql`asc nulls last`)
          .orderBy('person.createdAt'),
      )
      .$if(!options?.withHidden, (qb) => qb.where('person.isHidden', '=', false))
      .offset(pagination.skip ?? 0)
      .limit(pagination.take + 1)
      .execute();

    if (items.length > pagination.take) {
      return { items: items.slice(0, -1), hasNextPage: true };
    }

    return { items, hasNextPage: false };
  }

  @GenerateSql()
  getAllWithoutFaces() {
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .leftJoin('asset_faces', 'asset_faces.personId', 'person.id')
      .where('asset_faces.deletedAt', 'is', null)
      .having((eb) => eb.fn.count('asset_faces.assetId'), '=', 0)
      .groupBy('person.id')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaces(assetId: string) {
    return this.db
      .selectFrom('asset_faces')
      .selectAll('asset_faces')
      .select(withPerson)
      .where('asset_faces.assetId', '=', assetId)
      .where('asset_faces.deletedAt', 'is', null)
      .orderBy('asset_faces.boundingBoxX1', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaceById(id: string) {
    // TODO return null instead of find or fail
    return this.db
      .selectFrom('asset_faces')
      .selectAll('asset_faces')
      .select(withPerson)
      .where('asset_faces.id', '=', id)
      .where('asset_faces.deletedAt', 'is', null)
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFaceForFacialRecognitionJob(id: string) {
    return this.db
      .selectFrom('asset_faces')
      .select(['asset_faces.id', 'asset_faces.personId', 'asset_faces.sourceType'])
      .select((eb) =>
        jsonObjectFrom(
          eb
            .selectFrom('assets')
            .select(['assets.ownerId', 'assets.isArchived', 'assets.fileCreatedAt'])
            .whereRef('assets.id', '=', 'asset_faces.assetId'),
        ).as('asset'),
      )
      .select(withFaceSearch)
      .where('asset_faces.id', '=', id)
      .where('asset_faces.deletedAt', 'is', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getPersonForThumbnailGenerationJob(id: string) {
    return this.db
      .selectFrom('person')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('asset_faces')
            .leftJoinLateral(
              (eb) =>
                eb
                  .selectFrom('assets')
                  .innerJoin('exif', 'exif.assetId', 'assets.id')
                  .select(['assets.originalPath', 'assets.type'])
                  .select((eb) =>
                    jsonBuildObject({
                      exifImageWidth: eb.ref('exif.exifImageWidth'),
                      exifImageHeight: eb.ref('exif.exifImageHeight'),
                    }).as('exifInfo'),
                  )
                  .select((eb) =>
                    jsonArrayFrom(
                      eb
                        .selectFrom('asset_files')
                        .select(['asset_files.path', 'asset_files.type'])
                        .whereRef('assets.id', '=', 'asset_files.assetId')
                        .where('asset_files.type', '=', AssetFileType.PREVIEW)
                        .limit(1),
                    ).as('files'),
                  )
                  .whereRef('assets.id', '=', 'asset_faces.assetId')
                  .as('asset'),
              (join) => join.onTrue(),
            )
            .select([
              'asset_faces.boundingBoxX1',
              'asset_faces.boundingBoxY1',
              'asset_faces.boundingBoxX2',
              'asset_faces.boundingBoxY2',
              'asset_faces.imageWidth',
              'asset_faces.imageHeight',
            ])
            .select((eb) => toJson(eb, 'asset').as('asset'))
            .whereRef('asset_faces.id', '=', 'person.faceAssetId')
            .where('asset_faces.deletedAt', 'is', null)
            .as('face'),
        (join) => join.onTrue(),
      )
      .select(['person.id', 'person.ownerId', 'person.faceAssetId'])
      .select((eb) => toJson(eb, 'face').as('face'))
      .where('person.id', '=', id)
      .where('person.faceAssetId', 'is not', null)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async reassignFace(assetFaceId: string, newPersonId: string): Promise<number> {
    const result = await this.db
      .updateTable('asset_faces')
      .set({ personId: newPersonId })
      .where('asset_faces.id', '=', assetFaceId)
      .executeTakeFirst();

    return Number(result.numChangedRows ?? 0);
  }

  getById(personId: string) {
    return (
      this.db //
        .selectFrom('person')
        .selectAll('person')
        .where('person.id', '=', personId)
        .executeTakeFirst() ?? null
    );
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING, { withHidden: true }] })
  getByName(userId: string, personName: string, { withHidden }: PersonNameSearchOptions) {
    return this.db
      .selectFrom('person')
      .selectAll('person')
      .where((eb) =>
        eb.and([
          eb('person.ownerId', '=', userId),
          eb.or([
            eb(eb.fn('lower', ['person.name']), 'like', `${personName.toLowerCase()}%`),
            eb(eb.fn('lower', ['person.name']), 'like', `% ${personName.toLowerCase()}%`),
          ]),
        ]),
      )
      .limit(1000)
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
      .selectFrom('asset_faces')
      .leftJoin('assets', (join) =>
        join
          .onRef('assets.id', '=', 'asset_faces.assetId')
          .on('asset_faces.personId', '=', personId)
          .on('assets.isArchived', '=', false)
          .on('assets.deletedAt', 'is', null),
      )
      .select((eb) => eb.fn.count(eb.fn('distinct', ['assets.id'])).as('count'))
      .where('asset_faces.deletedAt', 'is', null)
      .executeTakeFirst();

    return {
      assets: result ? Number(result.count) : 0,
    };
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getNumberOfPeople(userId: string): Promise<PeopleStatistics> {
    const items = await this.db
      .selectFrom('person')
      .innerJoin('asset_faces', 'asset_faces.personId', 'person.id')
      .where('person.ownerId', '=', userId)
      .where('asset_faces.deletedAt', 'is', null)
      .innerJoin('assets', (join) =>
        join
          .onRef('assets.id', '=', 'asset_faces.assetId')
          .on('assets.deletedAt', 'is', null)
          .on('assets.isArchived', '=', false),
      )
      .select((eb) => eb.fn.count(eb.fn('distinct', ['person.id'])).as('total'))
      .select((eb) =>
        eb.fn
          .count(eb.fn('distinct', ['person.id']))
          .filterWhere('person.isHidden', '=', true)
          .as('hidden'),
      )
      .executeTakeFirst();

    if (items == undefined) {
      return { total: 0, hidden: 0 };
    }

    return {
      total: Number(items.total),
      hidden: Number(items.hidden),
    };
  }

  create(person: Insertable<Person>) {
    return this.db.insertInto('person').values(person).returningAll().executeTakeFirstOrThrow();
  }

  async createAll(people: Insertable<Person>[]): Promise<string[]> {
    if (people.length === 0) {
      return [];
    }

    const results = await this.db.insertInto('person').values(people).returningAll().execute();
    return results.map(({ id }) => id);
  }

  @GenerateSql({ params: [[], [], [{ faceId: DummyValue.UUID, embedding: DummyValue.VECTOR }]] })
  async refreshFaces(
    facesToAdd: (Insertable<AssetFaces> & { assetId: string })[],
    faceIdsToRemove: string[],
    embeddingsToAdd?: Insertable<FaceSearch>[],
  ): Promise<void> {
    let query = this.db;
    if (facesToAdd.length > 0) {
      (query as any) = query.with('added', (db) => db.insertInto('asset_faces').values(facesToAdd));
    }

    if (faceIdsToRemove.length > 0) {
      (query as any) = query.with('removed', (db) =>
        db.deleteFrom('asset_faces').where('asset_faces.id', '=', (eb) => eb.fn.any(eb.val(faceIdsToRemove))),
      );
    }

    if (embeddingsToAdd?.length) {
      (query as any) = query.with('added_embeddings', (db) => db.insertInto('face_search').values(embeddingsToAdd));
    }

    await query.selectFrom(sql`(select 1)`.as('dummy')).execute();
  }

  async update(person: Updateable<Person> & { id: string }) {
    return this.db
      .updateTable('person')
      .set(person)
      .where('person.id', '=', person.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateAll(people: Insertable<Person>[]): Promise<void> {
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
      .selectFrom('asset_faces')
      .selectAll('asset_faces')
      .select(withAsset)
      .select(withPerson)
      .where('asset_faces.assetId', 'in', assetIds)
      .where('asset_faces.personId', 'in', personIds)
      .where('asset_faces.deletedAt', 'is', null)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getRandomFace(personId: string) {
    return this.db
      .selectFrom('asset_faces')
      .selectAll('asset_faces')
      .where('asset_faces.personId', '=', personId)
      .where('asset_faces.deletedAt', 'is', null)
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

  async createAssetFace(face: Insertable<AssetFaces>): Promise<void> {
    await this.db.insertInto('asset_faces').values(face).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteAssetFace(id: string): Promise<void> {
    await this.db.deleteFrom('asset_faces').where('asset_faces.id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async softDeleteAssetFaces(id: string): Promise<void> {
    await this.db.updateTable('asset_faces').set({ deletedAt: new Date() }).where('asset_faces.id', '=', id).execute();
  }

  private async vacuum({ reindexVectors }: { reindexVectors: boolean }): Promise<void> {
    await sql`VACUUM ANALYZE asset_faces, face_search, person`.execute(this.db);
    await sql`REINDEX TABLE asset_faces`.execute(this.db);
    await sql`REINDEX TABLE person`.execute(this.db);
    if (reindexVectors) {
      await sql`REINDEX TABLE face_search`.execute(this.db);
    }
  }
}
