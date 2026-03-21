import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { VectorIndex } from 'src/enum';
import { probes } from 'src/repositories/database.repository';
import { DB } from 'src/schema';
import { SharedSpaceAssetTable } from 'src/schema/tables/shared-space-asset.table';
import { SharedSpaceMemberTable } from 'src/schema/tables/shared-space-member.table';
import { SharedSpacePersonAliasTable } from 'src/schema/tables/shared-space-person-alias.table';
import { SharedSpacePersonFaceTable } from 'src/schema/tables/shared-space-person-face.table';
import { SharedSpacePersonTable } from 'src/schema/tables/shared-space-person.table';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';

@Injectable()
export class SharedSpaceRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string) {
    return this.db.selectFrom('shared_space').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAllByUserId(userId: string) {
    return this.db
      .selectFrom('shared_space')
      .innerJoin('shared_space_member', 'shared_space_member.spaceId', 'shared_space.id')
      .where('shared_space_member.userId', '=', userId)
      .selectAll('shared_space')
      .execute();
  }

  create(values: Insertable<SharedSpaceTable>) {
    return this.db.insertInto('shared_space').values(values).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { name: 'Updated Space' }] })
  update(id: string, values: Updateable<SharedSpaceTable>) {
    return this.db
      .updateTable('shared_space')
      .set(values)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async remove(id: string) {
    await this.db.deleteFrom('shared_space').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getMembers(spaceId: string) {
    return this.db
      .selectFrom('shared_space_member')
      .innerJoin('user', (join) =>
        join.onRef('user.id', '=', 'shared_space_member.userId').on('user.deletedAt', 'is', null),
      )
      .where('shared_space_member.spaceId', '=', spaceId)
      .select([
        'shared_space_member.spaceId',
        'shared_space_member.userId',
        'shared_space_member.role',
        'shared_space_member.joinedAt',
        'shared_space_member.showInTimeline',
        'shared_space_member.lastViewedAt',
        'user.name',
        'user.email',
        'user.profileImagePath',
        'user.profileChangedAt',
        'user.avatarColor',
      ])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getMember(spaceId: string, userId: string) {
    return this.db
      .selectFrom('shared_space_member')
      .innerJoin('user', (join) =>
        join.onRef('user.id', '=', 'shared_space_member.userId').on('user.deletedAt', 'is', null),
      )
      .where('shared_space_member.spaceId', '=', spaceId)
      .where('shared_space_member.userId', '=', userId)
      .select([
        'shared_space_member.spaceId',
        'shared_space_member.userId',
        'shared_space_member.role',
        'shared_space_member.joinedAt',
        'shared_space_member.showInTimeline',
        'shared_space_member.lastViewedAt',
        'user.name',
        'user.email',
        'user.profileImagePath',
        'user.profileChangedAt',
        'user.avatarColor',
      ])
      .executeTakeFirst();
  }

  addMember(values: Insertable<SharedSpaceMemberTable>) {
    return this.db.insertInto('shared_space_member').values(values).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID, { role: 'editor' }] })
  updateMember(spaceId: string, userId: string, values: Updateable<SharedSpaceMemberTable>) {
    return this.db
      .updateTable('shared_space_member')
      .set(values)
      .where('spaceId', '=', spaceId)
      .where('userId', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async removeMember(spaceId: string, userId: string) {
    await this.db
      .deleteFrom('shared_space_member')
      .where('spaceId', '=', spaceId)
      .where('userId', '=', userId)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getSpaceIdsForTimeline(userId: string) {
    return this.db
      .selectFrom('shared_space_member')
      .where('userId', '=', userId)
      .where('showInTimeline', '=', true)
      .select('spaceId')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getAssetCount(spaceId: string): Promise<number> {
    const result = await this.db
      .selectFrom('shared_space_asset')
      .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('shared_space_asset.spaceId', '=', spaceId)
      .where('asset.deletedAt', 'is', null)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  addAssets(values: Insertable<SharedSpaceAssetTable>[]) {
    if (values.length === 0) {
      return Promise.resolve([]);
    }

    return this.db
      .insertInto('shared_space_asset')
      .values(values)
      .onConflict((oc) => oc.doNothing())
      .returningAll()
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async removeAssets(spaceId: string, assetIds: string[]) {
    await this.db
      .deleteFrom('shared_space_asset')
      .where('spaceId', '=', spaceId)
      .where('assetId', 'in', assetIds)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getMostRecentAssetId(spaceId: string): Promise<string | undefined> {
    const result = await this.db
      .selectFrom('shared_space_asset')
      .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
      .where('shared_space_asset.spaceId', '=', spaceId)
      .where('asset.deletedAt', 'is', null)
      .orderBy('shared_space_asset.addedAt', 'desc')
      .select('asset.id')
      .limit(1)
      .executeTakeFirst();
    return result?.id;
  }

  @GenerateSql({ params: [DummyValue.UUID, 4] })
  getRecentAssets(spaceId: string, limit: number = 4) {
    return this.db
      .selectFrom('shared_space_asset')
      .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
      .where('shared_space_asset.spaceId', '=', spaceId)
      .where('asset.deletedAt', 'is', null)
      .orderBy('shared_space_asset.addedAt', 'desc')
      .select(['asset.id', 'asset.thumbhash'])
      .limit(limit)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getLastAssetAddedAt(spaceId: string): Promise<Date | undefined> {
    const result = await this.db
      .selectFrom('shared_space_asset')
      .where('spaceId', '=', spaceId)
      .select((eb) => eb.fn.max('addedAt').as('lastAddedAt'))
      .executeTakeFirst();
    return result?.lastAddedAt ?? undefined;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.DATE] })
  async getNewAssetCount(spaceId: string, since: Date): Promise<number> {
    const result = await this.db
      .selectFrom('shared_space_asset')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('spaceId', '=', spaceId)
      .where('addedAt', '>', since)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.DATE] })
  async getLastContributor(spaceId: string, since: Date): Promise<{ id: string; name: string } | undefined> {
    return this.db
      .selectFrom('shared_space_asset')
      .innerJoin('user', (join) =>
        join.onRef('user.id', '=', 'shared_space_asset.addedById').on('user.deletedAt', 'is', null),
      )
      .where('shared_space_asset.spaceId', '=', spaceId)
      .where('shared_space_asset.addedAt', '>', since)
      .orderBy('shared_space_asset.addedAt', 'desc')
      .select(['user.id', 'user.name'])
      .limit(1)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async updateMemberLastViewed(spaceId: string, userId: string): Promise<void> {
    await this.db
      .updateTable('shared_space_member')
      .set({ lastViewedAt: new Date() })
      .where('spaceId', '=', spaceId)
      .where('userId', '=', userId)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getContributionCounts(spaceId: string) {
    return this.db
      .selectFrom('shared_space_asset')
      .where('spaceId', '=', spaceId)
      .groupBy('addedById')
      .select(['addedById', (eb) => eb.fn.countAll().as('count')])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getMemberActivity(spaceId: string) {
    return this.db
      .selectFrom('shared_space_asset')
      .where('spaceId', '=', spaceId)
      .groupBy('addedById')
      .select([
        'addedById',
        (eb) => eb.fn.max('addedAt').as('lastAddedAt'),
        (eb) =>
          eb
            .selectFrom('shared_space_asset as ssa2')
            .whereRef('ssa2.addedById', '=', 'shared_space_asset.addedById')
            .where('ssa2.spaceId', '=', spaceId)
            .orderBy('ssa2.addedAt', 'desc')
            .select('ssa2.assetId')
            .limit(1)
            .as('recentAssetId'),
      ])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getMapMarkers(spaceId: string) {
    return this.db
      .selectFrom('shared_space_asset')
      .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .where('shared_space_asset.spaceId', '=', spaceId)
      .where('asset.deletedAt', 'is', null)
      .where('asset_exif.latitude', 'is not', null)
      .where('asset_exif.longitude', 'is not', null)
      .select([
        'asset.id',
        'asset_exif.latitude',
        'asset_exif.longitude',
        'asset_exif.city',
        'asset_exif.state',
        'asset_exif.country',
      ])
      .execute();
  }

  async logActivity(values: { spaceId: string; userId: string; type: string; data?: Record<string, unknown> }) {
    await this.db
      .insertInto('shared_space_activity')
      .values({
        spaceId: values.spaceId,
        userId: values.userId,
        type: values.type,
        data: (values.data ?? {}) as Record<string, unknown>,
      })
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, 50, 0] })
  getActivities(spaceId: string, limit: number = 50, offset: number = 0) {
    return this.db
      .selectFrom('shared_space_activity')
      .leftJoin('user', 'user.id', 'shared_space_activity.userId')
      .select([
        'shared_space_activity.id',
        'shared_space_activity.type',
        'shared_space_activity.data',
        'shared_space_activity.createdAt',
        'shared_space_activity.userId',
        'user.name',
        'user.email',
        'user.profileImagePath',
        'user.avatarColor',
      ])
      .where('shared_space_activity.spaceId', '=', spaceId)
      .orderBy('shared_space_activity.createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  }

  // ==========================================
  // Shared Space Person CRUD
  // ==========================================

  @GenerateSql({ params: [DummyValue.UUID] })
  getPersonsBySpaceId(spaceId: string) {
    return this.db
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', spaceId)
      .orderBy('name', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getPersonById(id: string) {
    return this.db.selectFrom('shared_space_person').selectAll().where('id', '=', id).executeTakeFirst();
  }

  createPerson(values: Insertable<SharedSpacePersonTable>) {
    return this.db.insertInto('shared_space_person').values(values).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { name: 'Updated Person' }] })
  updatePerson(id: string, values: Updateable<SharedSpacePersonTable>) {
    return this.db
      .updateTable('shared_space_person')
      .set(values)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deletePerson(id: string) {
    await this.db.deleteFrom('shared_space_person').where('id', '=', id).execute();
  }

  addPersonFaces(values: Insertable<SharedSpacePersonFaceTable>[]) {
    if (values.length === 0) {
      return Promise.resolve([]);
    }

    return this.db
      .insertInto('shared_space_person_face')
      .values(values)
      .onConflict((oc) => oc.doNothing())
      .returningAll()
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getPersonFaceCount(personId: string): Promise<number> {
    const result = await this.db
      .selectFrom('shared_space_person_face')
      .select((eb) => eb.fn.countAll().as('count'))
      .where('personId', '=', personId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getPersonAssetCount(personId: string): Promise<number> {
    const result = await this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .select((eb) => eb.fn.count(eb.fn('distinct', ['asset_face.assetId'])).as('count'))
      .where('shared_space_person_face.personId', '=', personId)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getPersonAssetIds(personId: string) {
    return this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .select('asset_face.assetId')
      .distinct()
      .where('shared_space_person_face.personId', '=', personId)
      .execute();
  }

  async reassignPersonFaces(fromPersonId: string, toPersonId: string) {
    await this.db
      .updateTable('shared_space_person_face')
      .set({ personId: toPersonId })
      .where('personId', '=', fromPersonId)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async removePersonFacesByAssetIds(spaceId: string, assetIds: string[]) {
    await this.db
      .deleteFrom('shared_space_person_face')
      .where(
        'assetFaceId',
        'in',
        this.db.selectFrom('asset_face').select('asset_face.id').where('asset_face.assetId', 'in', assetIds),
      )
      .where(
        'personId',
        'in',
        this.db
          .selectFrom('shared_space_person')
          .select('shared_space_person.id')
          .where('shared_space_person.spaceId', '=', spaceId),
      )
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteOrphanedPersons(spaceId: string) {
    await this.db
      .deleteFrom('shared_space_person')
      .where('spaceId', '=', spaceId)
      .where('id', 'not in', this.db.selectFrom('shared_space_person_face').select('personId'))
      .execute();
  }

  // ==========================================
  // Shared Space Person Alias CRUD
  // ==========================================

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getAlias(personId: string, userId: string) {
    return this.db
      .selectFrom('shared_space_person_alias')
      .selectAll()
      .where('personId', '=', personId)
      .where('userId', '=', userId)
      .executeTakeFirst();
  }

  upsertAlias(values: Insertable<SharedSpacePersonAliasTable>) {
    return this.db
      .insertInto('shared_space_person_alias')
      .values(values)
      .onConflict((oc) => oc.columns(['personId', 'userId']).doUpdateSet((eb) => ({ alias: eb.ref('excluded.alias') })))
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async deleteAlias(personId: string, userId: string) {
    await this.db
      .deleteFrom('shared_space_person_alias')
      .where('personId', '=', personId)
      .where('userId', '=', userId)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getAliasesBySpaceAndUser(spaceId: string, userId: string) {
    return this.db
      .selectFrom('shared_space_person_alias')
      .innerJoin('shared_space_person', 'shared_space_person.id', 'shared_space_person_alias.personId')
      .where('shared_space_person.spaceId', '=', spaceId)
      .where('shared_space_person_alias.userId', '=', userId)
      .selectAll('shared_space_person_alias')
      .execute();
  }

  // ==========================================
  // Face Matching Queries
  // ==========================================

  @GenerateSql({
    params: [DummyValue.UUID, DummyValue.VECTOR, { maxDistance: 0.6, numResults: 1 }],
  })
  findClosestSpacePerson(spaceId: string, embedding: string, options: { maxDistance: number; numResults: number }) {
    return this.db.transaction().execute(async (trx) => {
      await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.Face])}`.execute(trx);
      return await trx
        .with('cte', (qb) =>
          qb
            .selectFrom('shared_space_person')
            .innerJoin('shared_space_person_face', 'shared_space_person_face.personId', 'shared_space_person.id')
            .innerJoin('face_search', 'face_search.faceId', 'shared_space_person_face.assetFaceId')
            .select([
              'shared_space_person.id as personId',
              'shared_space_person.name',
              sql<number>`face_search.embedding <=> ${embedding}`.as('distance'),
            ])
            .where('shared_space_person.spaceId', '=', spaceId)
            .orderBy('distance')
            .limit(options.numResults),
        )
        .selectFrom('cte')
        .selectAll()
        .where('cte.distance', '<=', options.maxDistance)
        .execute();
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAssetFacesForMatching(assetId: string) {
    return this.db
      .selectFrom('asset_face')
      .innerJoin('face_search', 'face_search.faceId', 'asset_face.id')
      .select(['asset_face.id', 'asset_face.assetId', 'asset_face.personId', 'face_search.embedding'])
      .where('asset_face.assetId', '=', assetId)
      .where('asset_face.deletedAt', 'is', null)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async isAssetInSpace(spaceId: string, assetId: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('shared_space_asset')
      .select('assetId')
      .where('spaceId', '=', spaceId)
      .where('assetId', '=', assetId)
      .limit(1)
      .executeTakeFirst();
    return !!result;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async isFaceInSpace(spaceId: string, faceId: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('shared_space_asset')
      .innerJoin('asset_face', 'asset_face.assetId', 'shared_space_asset.assetId')
      .select('asset_face.id')
      .where('shared_space_asset.spaceId', '=', spaceId)
      .where('asset_face.id', '=', faceId)
      .where('asset_face.deletedAt', 'is', null)
      .limit(1)
      .executeTakeFirst();
    return !!result;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAssetIdsInSpace(spaceId: string) {
    return this.db.selectFrom('shared_space_asset').select('assetId').where('spaceId', '=', spaceId).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getSpaceIdsForAsset(assetId: string) {
    return this.db
      .selectFrom('shared_space_asset')
      .innerJoin('shared_space', 'shared_space.id', 'shared_space_asset.spaceId')
      .select('shared_space_asset.spaceId')
      .where('shared_space_asset.assetId', '=', assetId)
      .where('shared_space.faceRecognitionEnabled', '=', true)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async isPersonFaceAssigned(assetFaceId: string, spaceId: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('shared_space_person', 'shared_space_person.id', 'shared_space_person_face.personId')
      .select('shared_space_person_face.assetFaceId')
      .where('shared_space_person_face.assetFaceId', '=', assetFaceId)
      .where('shared_space_person.spaceId', '=', spaceId)
      .limit(1)
      .executeTakeFirst();
    return !!result;
  }
}
