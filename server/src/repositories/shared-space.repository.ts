import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, NotNull, sql, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { ChunkedArray, ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { AssetType, AssetVisibility, SharedSpaceRole, VectorIndex } from 'src/enum';
import { probes } from 'src/repositories/database.repository';
import type { AssetSearchBuilderOptions } from 'src/repositories/search.repository';
import { DB } from 'src/schema';
import { SharedSpaceAssetTable } from 'src/schema/tables/shared-space-asset.table';
import { SharedSpaceLibraryTable } from 'src/schema/tables/shared-space-library.table';
import { SharedSpaceMemberTable } from 'src/schema/tables/shared-space-member.table';
import { SharedSpacePersonAliasTable } from 'src/schema/tables/shared-space-person-alias.table';
import { SharedSpacePersonFaceTable } from 'src/schema/tables/shared-space-person-face.table';
import { SharedSpacePersonTable } from 'src/schema/tables/shared-space-person.table';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { anyUuid, searchAssetBuilder } from 'src/utils/database';

const visibleSpaceAssetVisibilities = [AssetVisibility.Archive, AssetVisibility.Timeline];

export type LinkedSpacePerson = {
  id: string;
  isHidden: boolean;
  name?: string | null;
  birthDate?: string | null;
  updatedAt?: Date | string;
  type?: string;
};

export type SpacePersonPersonalThumbnail = {
  personId: string;
  thumbnailPath: string;
};

export type MetadataInheritanceCandidate = {
  personId: string;
  sourceProfileType?: 'user-person' | 'space-person';
  sourceProfileId?: string;
  userId: string;
  role: string;
  name: string;
  birthDate: Date | string | null;
  type: string;
  species: string | null;
  updatedAt: Date | string;
  supportingFaceCount: number;
  isAssetAdder: boolean;
};

export type SpacePersonIdentityEvidence = {
  identityId: string;
  type: string;
  supportingFaceCount: number;
};

type SpacePersonMatch = {
  personId: string;
  name: string;
  distance: number;
  identityId?: string | null;
  type?: string;
};

type SpacePersonWithEmbedding = {
  id: string;
  name: string;
  type: string;
  identityId?: string | null;
  isHidden: boolean;
  faceCount: number;
  representativeFaceId: string | null;
  representativeFaceSource?: string | null;
  embedding: string;
};

type AssetFaceForMatching = {
  id: string;
  assetId: string;
  personId: string | null;
  identityId?: string | null;
  type?: string | null;
  embedding: string;
};

type PetFaceForMatching = {
  id: string;
  assetId: string;
  personId: string | null;
  identityId?: string | null;
  type?: string;
};

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
        'shared_space_member.sharePersonMetadata',
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
        'shared_space_member.sharePersonMetadata',
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

  @GenerateSql({ params: [] })
  async getSpaceIdsWithFaceRecognitionEnabled(): Promise<string[]> {
    const rows = await this.db
      .selectFrom('shared_space')
      .select('id')
      .where('faceRecognitionEnabled', '=', true)
      .execute();
    return rows.map((r) => r.id);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getAssetCount(spaceId: string): Promise<number> {
    const result = await this.db
      .selectFrom(
        this.db
          .selectFrom('shared_space_asset')
          .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
          .select('asset.id')
          .where('shared_space_asset.spaceId', '=', spaceId)
          .where('asset.deletedAt', 'is', null)
          .where('asset.isOffline', '=', false)
          .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
          .union(
            this.db
              .selectFrom('shared_space_library')
              .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
              .select('asset.id')
              .where('shared_space_library.spaceId', '=', spaceId)
              .where('asset.deletedAt', 'is', null)
              .where('asset.isOffline', '=', false)
              .where('asset.visibility', 'in', visibleSpaceAssetVisibilities),
          )
          .as('combined'),
      )
      .select((eb) => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async bulkAddUserAssets(spaceId: string, userId: string): Promise<number> {
    const result = await this.db
      .insertInto('shared_space_asset')
      .columns(['spaceId', 'assetId', 'addedById'])
      .expression(
        this.db
          .selectFrom('asset')
          .select([sql.lit(spaceId).as('spaceId'), 'asset.id as assetId', sql.lit(userId).as('addedById')])
          .where('asset.ownerId', '=', userId)
          .where('asset.deletedAt', 'is', null)
          .where('asset.isOffline', '=', false)
          .where('asset.visibility', 'in', visibleSpaceAssetVisibilities),
      )
      .onConflict((oc) => oc.doNothing())
      .executeTakeFirst();
    return Number(result?.numInsertedOrUpdatedRows ?? 0);
  }

  @ChunkedArray()
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

  /**
   * Returns the set of space IDs that contain ANY of the given asset IDs
   * via direct membership (`shared_space_asset`) AND in which the user has
   * Owner or Editor role.
   *
   * Library-linked content (`shared_space_library`) is deliberately excluded
   * — only direct per-asset membership counts. See dedup-space-sync design
   * doc for rationale.
   *
   * Returns `Set<string>` (not `Map<assetId, spaceIds[]>` as
   * `albumRepository.getByAssetIds` does) because the dedup sync caller
   * applies every matched space to every keeper, so the per-asset grouping
   * is unused.
   */
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async getEditableByAssetIds(userId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    const rows = await this.db
      .selectFrom('shared_space_asset')
      .innerJoin('shared_space_member', 'shared_space_member.spaceId', 'shared_space_asset.spaceId')
      .select('shared_space_asset.spaceId')
      .where('shared_space_asset.assetId', 'in', [...assetIds])
      .where('shared_space_member.userId', '=', userId)
      .where('shared_space_member.role', 'in', [SharedSpaceRole.Owner, SharedSpaceRole.Editor])
      .distinct()
      .execute();

    return new Set(rows.map((row) => row.spaceId));
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async removeAssets(spaceId: string, assetIds: string[]) {
    await this.db
      .deleteFrom('shared_space_asset')
      .where('spaceId', '=', spaceId)
      .where('assetId', 'in', assetIds)
      .execute();
  }

  // ==========================================
  // Shared Space Library Link CRUD
  // ==========================================

  addLibrary(values: Insertable<SharedSpaceLibraryTable>) {
    return this.db
      .insertInto('shared_space_library')
      .values(values)
      .onConflict((oc) => oc.doNothing())
      .returningAll()
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  removeLibrary(spaceId: string, libraryId: string) {
    return this.db
      .deleteFrom('shared_space_library')
      .where('spaceId', '=', spaceId)
      .where('libraryId', '=', libraryId)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getLinkedLibraries(spaceId: string) {
    return this.db.selectFrom('shared_space_library').selectAll().where('spaceId', '=', spaceId).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getSpacesLinkedToLibrary(libraryId: string) {
    return this.db
      .selectFrom('shared_space_library')
      .innerJoin('shared_space', 'shared_space.id', 'shared_space_library.spaceId')
      .selectAll('shared_space_library')
      .select('shared_space.faceRecognitionEnabled')
      .where('shared_space_library.libraryId', '=', libraryId)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  hasLibraryLink(spaceId: string, libraryId: string) {
    return this.db
      .selectFrom('shared_space_library')
      .where('spaceId', '=', spaceId)
      .where('libraryId', '=', libraryId)
      .select('spaceId')
      .executeTakeFirst()
      .then((row) => !!row);
  }

  @GenerateSql({ params: [DummyValue.UUID, 4] })
  getRecentAssets(spaceId: string, limit = 4) {
    return this.db
      .selectFrom(
        this.db
          .selectFrom('shared_space_asset')
          .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
          .select(['asset.id', 'asset.thumbhash', 'asset.fileCreatedAt'])
          .where('shared_space_asset.spaceId', '=', spaceId)
          .where('asset.deletedAt', 'is', null)
          .where('asset.isOffline', '=', false)
          .where('asset.type', '=', AssetType.Image)
          .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
          .where('asset.thumbhash', 'is not', null)
          .union(
            this.db
              .selectFrom('shared_space_library')
              .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
              .select(['asset.id', 'asset.thumbhash', 'asset.fileCreatedAt'])
              .where('shared_space_library.spaceId', '=', spaceId)
              .where('asset.deletedAt', 'is', null)
              .where('asset.isOffline', '=', false)
              .where('asset.type', '=', AssetType.Image)
              .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
              .where('asset.thumbhash', 'is not', null),
          )
          .as('combined'),
      )
      .select(['combined.id', 'combined.thumbhash'])
      .orderBy('combined.fileCreatedAt', 'desc')
      .limit(limit)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getLastAssetAddedAt(spaceId: string): Promise<Date | undefined> {
    const result = await this.db
      .selectFrom('shared_space_asset')
      .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
      .where('spaceId', '=', spaceId)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
      .select((eb) => eb.fn.max('addedAt').as('lastAddedAt'))
      .executeTakeFirst();
    return result?.lastAddedAt ?? undefined;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.DATE] })
  async getNewAssetCount(spaceId: string, since: Date): Promise<number> {
    const result = await this.db
      .selectFrom(
        this.db
          .selectFrom('shared_space_asset')
          .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
          .select('asset.id')
          .where('shared_space_asset.spaceId', '=', spaceId)
          .where('shared_space_asset.addedAt', '>', since)
          .where('asset.deletedAt', 'is', null)
          .where('asset.isOffline', '=', false)
          .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
          .union(
            this.db
              .selectFrom('shared_space_library')
              .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
              .select('asset.id')
              .where('shared_space_library.spaceId', '=', spaceId)
              .where('asset.createdAt', '>', since)
              .where('asset.deletedAt', 'is', null)
              .where('asset.isOffline', '=', false)
              .where('asset.visibility', 'in', visibleSpaceAssetVisibilities),
          )
          .as('combined'),
      )
      .select((eb) => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.DATE] })
  async getLastContributor(spaceId: string, since: Date): Promise<{ id: string; name: string } | undefined> {
    return this.db
      .selectFrom('shared_space_asset')
      .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
      .innerJoin('user', (join) =>
        join.onRef('user.id', '=', 'shared_space_asset.addedById').on('user.deletedAt', 'is', null),
      )
      .where('shared_space_asset.spaceId', '=', spaceId)
      .where('shared_space_asset.addedAt', '>', since)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
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
      .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
      .where('shared_space_asset.spaceId', '=', spaceId)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
      .groupBy('shared_space_asset.addedById')
      .select(['shared_space_asset.addedById', (eb) => eb.fn.countAll().as('count')])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getMemberActivity(spaceId: string) {
    return this.db
      .selectFrom('shared_space_asset')
      .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
      .where('shared_space_asset.spaceId', '=', spaceId)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
      .groupBy('shared_space_asset.addedById')
      .select([
        'shared_space_asset.addedById',
        (eb) => eb.fn.max('shared_space_asset.addedAt').as('lastAddedAt'),
        (eb) =>
          eb
            .selectFrom('shared_space_asset as ssa2')
            .innerJoin('asset as asset2', 'asset2.id', 'ssa2.assetId')
            .whereRef('ssa2.addedById', '=', 'shared_space_asset.addedById')
            .where('ssa2.spaceId', '=', spaceId)
            .where('asset2.deletedAt', 'is', null)
            .where('asset2.isOffline', '=', false)
            .where('asset2.visibility', 'in', visibleSpaceAssetVisibilities)
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
      .selectFrom(
        this.db
          .selectFrom('shared_space_asset')
          .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
          .select('asset.id')
          .where('shared_space_asset.spaceId', '=', spaceId)
          .where('asset.deletedAt', 'is', null)
          .where('asset.isOffline', '=', false)
          .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
          .union(
            this.db
              .selectFrom('shared_space_library')
              .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
              .select('asset.id')
              .where('shared_space_library.spaceId', '=', spaceId)
              .where('asset.deletedAt', 'is', null)
              .where('asset.isOffline', '=', false)
              .where('asset.visibility', 'in', visibleSpaceAssetVisibilities),
          )
          .as('combined'),
      )
      .innerJoin('asset', 'asset.id', 'combined.id')
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
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

  @GenerateSql({
    params: [{ userIds: [DummyValue.UUID], visibility: AssetVisibility.Timeline }],
  })
  getFilteredMapMarkers(options: AssetSearchBuilderOptions) {
    return searchAssetBuilder(this.db, options)
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .where('asset_exif.latitude', 'is not', null)
      .where('asset_exif.longitude', 'is not', null)
      .select([
        'asset.id',
        'asset_exif.latitude as lat',
        'asset_exif.longitude as lon',
        'asset_exif.city',
        'asset_exif.state',
        'asset_exif.country',
      ])
      .$narrowType<{ lat: NotNull; lon: NotNull }>()
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
  async hasPetsBySpaceId(spaceId: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('shared_space_person')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('spaceId', '=', spaceId)
      .where('type', '=', 'pet')
      .executeTakeFirstOrThrow();
    return result.count > 0;
  }

  @GenerateSql({
    params: [DummyValue.UUID, { withHidden: false, petsEnabled: true, limit: 50, offset: 0, named: false }],
  })
  getPersonsBySpaceId(
    spaceId: string,
    options: {
      withHidden?: boolean;
      petsEnabled?: boolean;
      limit?: number;
      offset?: number;
      named?: boolean;
      name?: string;
      takenAfter?: Date;
      takenBefore?: Date;
    },
  ) {
    const escapedName = options.name
      ?.replaceAll('\\', String.raw`\\`)
      .replaceAll('%', String.raw`\%`)
      .replaceAll('_', String.raw`\_`);
    const namePattern = escapedName ? `%${escapedName}%` : undefined;

    return this.db
      .selectFrom('shared_space_person')
      .selectAll('shared_space_person')
      .where('shared_space_person.spaceId', '=', spaceId)
      .$if(!options.withHidden, (qb) => qb.where('shared_space_person.isHidden', '=', false))
      .$if(!options.petsEnabled, (qb) => qb.where('shared_space_person.type', '!=', 'pet'))
      .$if(!!options.named, (qb) => qb.where('shared_space_person.name', '!=', ''))
      .$if(!!namePattern, (qb) => qb.where(() => sql`"shared_space_person"."name" ILIKE ${namePattern} ESCAPE '\\'`))
      .$if(!!options.takenAfter || !!options.takenBefore, (qb) =>
        qb.where((eb) =>
          eb.exists(
            eb
              .selectFrom('shared_space_person_face as spf2')
              .innerJoin('asset_face as af2', 'af2.id', 'spf2.assetFaceId')
              .innerJoin('asset', 'asset.id', 'af2.assetId')
              .whereRef('spf2.personId', '=', 'shared_space_person.id')
              .$if(!!options.takenAfter, (qb2) => qb2.where('asset.fileCreatedAt', '>=', options.takenAfter!))
              .$if(!!options.takenBefore, (qb2) => qb2.where('asset.fileCreatedAt', '<', options.takenBefore!)),
          ),
        ),
      )
      .orderBy(
        sql`CASE WHEN shared_space_person.name != '' THEN 0
             ELSE 1 END`,
      )
      .orderBy('shared_space_person.assetCount', 'desc')
      .orderBy(sql`NULLIF(shared_space_person.name, '')`, (om) => om.asc().nullsLast())
      .orderBy('shared_space_person.id')
      .$if(!!options.limit, (qb) => qb.limit(options.limit!))
      .$if(!!options.offset, (qb) => qb.offset(options.offset!))
      .execute();
  }

  @GenerateSql({
    params: [DummyValue.UUID, { petsEnabled: true, named: false, name: 'Alice' }],
  })
  countPersonsBySpaceId(
    spaceId: string,
    options: {
      petsEnabled?: boolean;
      named?: boolean;
      name?: string;
      takenAfter?: Date;
      takenBefore?: Date;
    },
  ) {
    const escapedName = options.name
      ?.replaceAll('\\', String.raw`\\`)
      .replaceAll('%', String.raw`\%`)
      .replaceAll('_', String.raw`\_`);
    const namePattern = escapedName ? `%${escapedName}%` : undefined;
    const zero = sql.lit(0);

    return this.db
      .selectFrom('shared_space_person')
      .where('shared_space_person.spaceId', '=', spaceId)
      .$if(!options.petsEnabled, (qb) => qb.where('shared_space_person.type', '!=', 'pet'))
      .$if(!!options.named, (qb) => qb.where('shared_space_person.name', '!=', ''))
      .$if(!!namePattern, (qb) => qb.where(() => sql`"shared_space_person"."name" ILIKE ${namePattern} ESCAPE '\\'`))
      .$if(!!options.takenAfter || !!options.takenBefore, (qb) =>
        qb.where((eb) =>
          eb.exists(
            eb
              .selectFrom('shared_space_person_face as spf2')
              .innerJoin('asset_face as af2', 'af2.id', 'spf2.assetFaceId')
              .innerJoin('asset', 'asset.id', 'af2.assetId')
              .whereRef('spf2.personId', '=', 'shared_space_person.id')
              .$if(!!options.takenAfter, (qb2) => qb2.where('asset.fileCreatedAt', '>=', options.takenAfter!))
              .$if(!!options.takenBefore, (qb2) => qb2.where('asset.fileCreatedAt', '<', options.takenBefore!)),
          ),
        ),
      )
      .select((eb) => eb.fn.coalesce(eb.fn.countAll<number>(), zero).as('total'))
      .select((eb) => eb.fn.coalesce(eb.fn.countAll<number>().filterWhere('isHidden', '=', true), zero).as('hidden'))
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getPersonById(id: string) {
    return this.db
      .selectFrom('shared_space_person')
      .selectAll('shared_space_person')
      .where('shared_space_person.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [{ spaceId: DummyValue.UUID, personId: DummyValue.UUID, assetFaceId: DummyValue.UUID }] })
  getSpaceRepresentativeFaceForUpdate(input: { spaceId: string; personId: string; assetFaceId: string }) {
    return this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('shared_space_person', 'shared_space_person.id', 'shared_space_person_face.personId')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .selectAll('asset_face')
      .where('shared_space_person.spaceId', '=', input.spaceId)
      .where('shared_space_person.id', '=', input.personId)
      .where('asset_face.id', '=', input.assetFaceId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
      .where((eb) =>
        eb.or([
          eb.exists(
            eb
              .selectFrom('shared_space_asset')
              .select('shared_space_asset.assetId')
              .whereRef('shared_space_asset.assetId', '=', 'asset_face.assetId')
              .whereRef('shared_space_asset.spaceId', '=', 'shared_space_person.spaceId'),
          ),
          eb.exists(
            eb
              .selectFrom('shared_space_library')
              .select('shared_space_library.libraryId')
              .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
              .whereRef('shared_space_library.spaceId', '=', 'shared_space_person.spaceId'),
          ),
        ]),
      )
      .executeTakeFirst();
  }

  @GenerateSql({ params: [{ spaceId: DummyValue.UUID, personId: DummyValue.UUID, take: 50, skip: 0 }] })
  getSpaceRepresentativeFaces(input: { spaceId: string; personId: string; take: number; skip: number }) {
    return this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('shared_space_person', 'shared_space_person.id', 'shared_space_person_face.personId')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .selectAll('asset_face')
      .select(['asset.fileCreatedAt', 'shared_space_person.representativeFaceId'])
      .where('shared_space_person.spaceId', '=', input.spaceId)
      .where('shared_space_person.id', '=', input.personId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
      .where((eb) =>
        eb.or([
          eb.exists(
            eb
              .selectFrom('shared_space_asset')
              .select('shared_space_asset.assetId')
              .whereRef('shared_space_asset.assetId', '=', 'asset_face.assetId')
              .whereRef('shared_space_asset.spaceId', '=', 'shared_space_person.spaceId'),
          ),
          eb.exists(
            eb
              .selectFrom('shared_space_library')
              .select('shared_space_library.libraryId')
              .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
              .whereRef('shared_space_library.spaceId', '=', 'shared_space_person.spaceId'),
          ),
        ]),
      )
      .orderBy('asset.fileCreatedAt', 'desc')
      .orderBy('asset_face.id')
      .offset(input.skip)
      .limit(input.take + 1)
      .execute();
  }

  createPerson(values: Insertable<SharedSpacePersonTable>) {
    return this.db.insertInto('shared_space_person').values(values).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getSpacePersonByIdentity(spaceId: string, identityId: string) {
    return this.db
      .selectFrom('shared_space_person')
      .selectAll()
      .where('spaceId', '=', spaceId)
      .where('identityId', '=', identityId)
      .executeTakeFirst();
  }

  async getPersonalThumbnailForSpacePerson(input: {
    userId: string;
    spaceId: string;
    identityId: string;
  }): Promise<SpacePersonPersonalThumbnail | undefined> {
    const ownThumbnail = await this.db
      .selectFrom('person')
      .select(['person.id as personId', 'person.thumbnailPath'])
      .where('person.ownerId', '=', input.userId)
      .where('person.identityId', '=', input.identityId)
      .where('person.thumbnailPath', '!=', '')
      .orderBy('person.updatedAt', 'desc')
      .orderBy('person.id')
      .executeTakeFirst();

    if (ownThumbnail) {
      return ownThumbnail;
    }

    return this.db
      .selectFrom('person')
      .innerJoin('asset_face', 'asset_face.id', 'person.faceAssetId')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .select(['person.id as personId', 'person.thumbnailPath'])
      .where('person.identityId', '=', input.identityId)
      .where('person.thumbnailPath', '!=', '')
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
      .where((eb) =>
        eb.or([
          eb.exists(
            eb
              .selectFrom('shared_space_asset')
              .whereRef('shared_space_asset.assetId', '=', 'asset.id')
              .where('shared_space_asset.spaceId', '=', input.spaceId),
          ),
          eb.exists(
            eb
              .selectFrom('shared_space_library')
              .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
              .where('shared_space_library.spaceId', '=', input.spaceId),
          ),
        ]),
      )
      .orderBy('person.updatedAt', 'desc')
      .orderBy('person.id')
      .executeTakeFirst();
  }

  @GenerateSql({
    params: [{ spaceId: DummyValue.UUID, identityId: DummyValue.UUID, assetAdderIds: [DummyValue.UUID] }],
  })
  async getMetadataInheritanceCandidates(input: {
    spaceId: string;
    identityId: string;
    assetAdderIds?: string[];
  }): Promise<MetadataInheritanceCandidate[]> {
    const assetAdderIds = [...new Set(input.assetAdderIds)];
    const isAssetAdderSql =
      assetAdderIds.length > 0 ? sql<boolean>`person."ownerId" = ${anyUuid(assetAdderIds)}` : sql<boolean>`false`;

    const personalCandidates = await this.db
      .selectFrom('person')
      .innerJoin('shared_space_member', (join) =>
        join
          .onRef('shared_space_member.userId', '=', 'person.ownerId')
          .on('shared_space_member.spaceId', '=', input.spaceId)
          .on('shared_space_member.sharePersonMetadata', '=', true),
      )
      .leftJoin('asset_face', (join) =>
        join
          .onRef('asset_face.personId', '=', 'person.id')
          .on('asset_face.deletedAt', 'is', null)
          .on('asset_face.isVisible', 'is', true),
      )
      .leftJoin('shared_space_person_face', 'shared_space_person_face.assetFaceId', 'asset_face.id')
      .leftJoin('shared_space_person', (join) =>
        join
          .onRef('shared_space_person.id', '=', 'shared_space_person_face.personId')
          .on('shared_space_person.spaceId', '=', input.spaceId),
      )
      .select([
        'person.id as personId',
        sql<'user-person'>`'user-person'`.as('sourceProfileType'),
        'person.id as sourceProfileId',
        'person.ownerId as userId',
        'shared_space_member.role',
        'person.name',
        'person.birthDate',
        'person.type',
        'person.species',
        'person.updatedAt',
      ])
      .select((eb) => [
        eb.fn.count('shared_space_person.id').$castTo<number>().as('supportingFaceCount'),
        isAssetAdderSql.as('isAssetAdder'),
      ])
      .where('person.identityId', '=', input.identityId)
      .groupBy([
        'person.id',
        'person.ownerId',
        'shared_space_member.role',
        'person.name',
        'person.birthDate',
        'person.type',
        'person.species',
        'person.updatedAt',
        'isAssetAdder',
      ])
      .execute();

    if (assetAdderIds.length === 0) {
      return personalCandidates;
    }

    const visibleSpaceCandidates = await this.db
      .selectFrom('shared_space_person as source_person')
      .innerJoin('shared_space_member as source_member', (join) =>
        join
          .onRef('source_member.spaceId', '=', 'source_person.spaceId')
          .on('source_member.userId', '=', anyUuid(assetAdderIds))
          .on('source_member.showInTimeline', '=', true),
      )
      .innerJoin('shared_space_member as target_member', (join) =>
        join
          .on('target_member.spaceId', '=', input.spaceId)
          .on('target_member.userId', '=', anyUuid(assetAdderIds))
          .on('target_member.sharePersonMetadata', '=', true),
      )
      .leftJoin('shared_space_person_alias as source_alias', (join) =>
        join
          .onRef('source_alias.personId', '=', 'source_person.id')
          .onRef('source_alias.userId', '=', 'source_member.userId'),
      )
      .select([
        'source_person.id as personId',
        sql<'space-person'>`'space-person'`.as('sourceProfileType'),
        'source_person.id as sourceProfileId',
        'target_member.userId as userId',
        'target_member.role',
        'source_person.birthDate',
        'source_person.type',
        'source_person.updatedAt',
      ])
      .select((eb) => [
        sql<string>`COALESCE(NULLIF("source_alias"."alias", ''), "source_person"."name", '')`.as('name'),
        sql<string | null>`NULL`.as('species'),
        eb.ref('source_person.faceCount').$castTo<number>().as('supportingFaceCount'),
        sql<boolean>`true`.as('isAssetAdder'),
      ])
      .where('source_person.identityId', '=', input.identityId)
      .where('source_person.spaceId', '!=', input.spaceId)
      .where('source_person.isHidden', '=', false)
      .execute();

    return [...personalCandidates, ...visibleSpaceCandidates];
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async getSpacePersonAssetAdderIds(spaceId: string, personId: string): Promise<string[]> {
    const directRows = await this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .innerJoin('shared_space_asset', (join) =>
        join
          .onRef('shared_space_asset.assetId', '=', 'asset_face.assetId')
          .on('shared_space_asset.spaceId', '=', spaceId),
      )
      .select('shared_space_asset.addedById as userId')
      .distinct()
      .where('shared_space_person_face.personId', '=', personId)
      .where('shared_space_asset.addedById', 'is not', null)
      .execute();

    const libraryRows = await this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .innerJoin('shared_space_library', (join) =>
        join
          .onRef('shared_space_library.libraryId', '=', 'asset.libraryId')
          .on('shared_space_library.spaceId', '=', spaceId),
      )
      .select('shared_space_library.addedById as userId')
      .distinct()
      .where('shared_space_person_face.personId', '=', personId)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('shared_space_library.addedById', 'is not', null)
      .execute();

    return [...new Set([...directRows, ...libraryRows].flatMap((row) => (row.userId ? [row.userId] : [])))];
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async getSpaceAssetAdder(spaceId: string, assetId: string): Promise<{ addedById: string | null } | undefined> {
    const directRow = await this.db
      .selectFrom('shared_space_asset')
      .select('addedById')
      .where('spaceId', '=', spaceId)
      .where('assetId', '=', assetId)
      .executeTakeFirst();

    if (directRow?.addedById) {
      return directRow;
    }

    const libraryRow = await this.db
      .selectFrom('shared_space_library')
      .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
      .select('shared_space_library.addedById')
      .where('shared_space_library.spaceId', '=', spaceId)
      .where('asset.id', '=', assetId)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .executeTakeFirst();

    return libraryRow ?? directRow;
  }

  @GenerateSql({ params: [{ cursor: DummyValue.UUID, identityId: DummyValue.UUID, limit: 100 }] })
  getSpacePersonMetadataBackfillPage(input: { cursor?: string; identityId?: string; limit: number }) {
    return this.db
      .selectFrom('shared_space_person')
      .selectAll('shared_space_person')
      .where('identityId', 'is not', null)
      .$if(!!input.identityId, (qb) => qb.where('identityId', '=', input.identityId!))
      .$if(!!input.cursor, (qb) => qb.where('id', '>', input.cursor!))
      .orderBy('id')
      .limit(input.limit)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getIdentityEvidenceForSpacePerson(
    spaceId: string,
    spacePersonId: string,
    candidateIdentityIds?: string[],
  ): Promise<SpacePersonIdentityEvidence[]> {
    return this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .innerJoin('person', 'person.id', 'asset_face.personId')
      .select(['person.identityId', 'person.type'])
      .select((eb) => eb.fn.count('asset_face.id').$castTo<number>().as('supportingFaceCount'))
      .where('shared_space_person_face.personId', '=', spacePersonId)
      .where((eb) =>
        eb.or([
          eb.exists(
            eb
              .selectFrom('shared_space_asset')
              .select('shared_space_asset.assetId')
              .whereRef('shared_space_asset.assetId', '=', 'asset_face.assetId')
              .where('shared_space_asset.spaceId', '=', spaceId),
          ),
          eb.exists(
            eb
              .selectFrom('shared_space_library')
              .select('shared_space_library.libraryId')
              .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
              .where('shared_space_library.spaceId', '=', spaceId),
          ),
        ]),
      )
      .where('person.identityId', 'is not', null)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .where('asset.deletedAt', 'is', null)
      .where('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
      .$if(!!candidateIdentityIds?.length, (qb) => qb.where('person.identityId', 'in', candidateIdentityIds!))
      .groupBy(['person.identityId', 'person.type'])
      .$castTo<SpacePersonIdentityEvidence>()
      .execute();
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

  async addPersonFaces(values: Insertable<SharedSpacePersonFaceTable>[], options?: { skipRecount?: boolean }) {
    if (values.length === 0) {
      return [];
    }

    const result = await this.db
      .insertInto('shared_space_person_face')
      .values(values)
      .onConflict((oc) => oc.doNothing())
      .returningAll()
      .execute();

    if (!options?.skipRecount && result.length > 0) {
      const personIds = [...new Set(result.map((r) => r.personId))];
      await this.recountPersons(personIds);
    }

    return result;
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

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async reassignPersonFacesSafe(fromPersonId: string, toPersonId: string) {
    // Delete faces that already exist on the target to avoid PK violation
    await this.db
      .deleteFrom('shared_space_person_face')
      .where('personId', '=', fromPersonId)
      .where(
        'assetFaceId',
        'in',
        this.db.selectFrom('shared_space_person_face').select('assetFaceId').where('personId', '=', toPersonId),
      )
      .execute();

    await this.db
      .updateTable('shared_space_person_face')
      .set({ personId: toPersonId })
      .where('personId', '=', fromPersonId)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getFirstFaceIdForPerson(personId: string): Promise<string | null> {
    const result = await this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('face_search', 'face_search.faceId', 'shared_space_person_face.assetFaceId')
      .select('shared_space_person_face.assetFaceId')
      .where('shared_space_person_face.personId', '=', personId)
      .limit(1)
      .executeTakeFirst();
    return result?.assetFaceId ?? null;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async isSpacePersonRepresentativeFaceValid(personId: string, faceId: string): Promise<boolean> {
    const row = await this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('shared_space_person', 'shared_space_person.id', 'shared_space_person_face.personId')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .select('asset_face.id')
      .where('shared_space_person_face.personId', '=', personId)
      .where('asset_face.id', '=', faceId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
      .where((eb) =>
        eb.or([
          eb.exists(
            eb
              .selectFrom('shared_space_asset')
              .select('shared_space_asset.assetId')
              .whereRef('shared_space_asset.assetId', '=', 'asset_face.assetId')
              .whereRef('shared_space_asset.spaceId', '=', 'shared_space_person.spaceId'),
          ),
          eb.exists(
            eb
              .selectFrom('shared_space_library')
              .select('shared_space_library.libraryId')
              .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
              .whereRef('shared_space_library.spaceId', '=', 'shared_space_person.spaceId'),
          ),
        ]),
      )
      .executeTakeFirst();
    return !!row;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getFirstValidRepresentativeFaceForPerson(personId: string): Promise<string | null> {
    const row = await this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('shared_space_person', 'shared_space_person.id', 'shared_space_person_face.personId')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .select('asset_face.id')
      .where('shared_space_person_face.personId', '=', personId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
      .where((eb) =>
        eb.or([
          eb.exists(
            eb
              .selectFrom('shared_space_asset')
              .select('shared_space_asset.assetId')
              .whereRef('shared_space_asset.assetId', '=', 'asset_face.assetId')
              .whereRef('shared_space_asset.spaceId', '=', 'shared_space_person.spaceId'),
          ),
          eb.exists(
            eb
              .selectFrom('shared_space_library')
              .select('shared_space_library.libraryId')
              .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
              .whereRef('shared_space_library.spaceId', '=', 'shared_space_person.spaceId'),
          ),
        ]),
      )
      .orderBy('asset.fileCreatedAt', 'desc')
      .orderBy('asset_face.id')
      .executeTakeFirst();
    return row?.id ?? null;
  }

  async repairInvalidRepresentativeFaces(spaceId: string): Promise<void> {
    const people = await this.db
      .selectFrom('shared_space_person')
      .select(['id', 'representativeFaceId', 'representativeFaceSource'])
      .where('spaceId', '=', spaceId)
      .where('representativeFaceSource', '=', 'manual')
      .execute();

    for (const person of people) {
      const valid =
        !!person.representativeFaceId &&
        (await this.isSpacePersonRepresentativeFaceValid(person.id, person.representativeFaceId));
      if (valid) {
        continue;
      }

      await this.updatePerson(person.id, {
        representativeFaceSource: 'auto',
        representativeFaceId: await this.getFirstValidRepresentativeFaceForPerson(person.id),
      });
    }
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async repairOrphanedRepresentativeFaces(spaceId: string) {
    await this.db
      .updateTable('shared_space_person')
      .set((eb) => ({
        representativeFaceId: eb
          .selectFrom('shared_space_person_face')
          .innerJoin('face_search', 'face_search.faceId', 'shared_space_person_face.assetFaceId')
          .select('shared_space_person_face.assetFaceId')
          .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id')
          .limit(1),
      }))
      .where('shared_space_person.spaceId', '=', spaceId)
      .where('shared_space_person.representativeFaceId', 'is', null)
      .where('shared_space_person.representativeFaceSource', '=', 'auto')
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('shared_space_person_face')
            .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id'),
        ),
      )
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async removePersonFacesByAssetIds(spaceId: string, assetIds: string[]) {
    const assetFaceSubquery = this.db
      .selectFrom('asset_face')
      .select('asset_face.id')
      .where('asset_face.assetId', 'in', assetIds);

    const spacePersonSubquery = this.db
      .selectFrom('shared_space_person')
      .select('shared_space_person.id')
      .where('shared_space_person.spaceId', '=', spaceId);

    const affectedPersonIds = await this.db
      .selectFrom('shared_space_person_face')
      .select('personId')
      .distinct()
      .where('assetFaceId', 'in', assetFaceSubquery)
      .where('personId', 'in', spacePersonSubquery)
      .execute();

    await this.db
      .deleteFrom('shared_space_person_face')
      .where('assetFaceId', 'in', assetFaceSubquery)
      .where('personId', 'in', spacePersonSubquery)
      .execute();

    if (affectedPersonIds.length > 0) {
      await this.recountPersons(affectedPersonIds.map((r) => r.personId));
    }
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async removePersonFacesByLibrary(spaceId: string, libraryId: string) {
    const assetFaceSubquery = this.db
      .selectFrom('asset_face')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .select('asset_face.id')
      .where('asset.libraryId', '=', libraryId);

    const spacePersonSubquery = this.db
      .selectFrom('shared_space_person')
      .select('shared_space_person.id')
      .where('shared_space_person.spaceId', '=', spaceId);

    const affectedPersonIds = await this.db
      .selectFrom('shared_space_person_face')
      .select('personId')
      .distinct()
      .where('assetFaceId', 'in', assetFaceSubquery)
      .where('personId', 'in', spacePersonSubquery)
      .execute();

    await this.db
      .deleteFrom('shared_space_person_face')
      .where('assetFaceId', 'in', assetFaceSubquery)
      .where('personId', 'in', spacePersonSubquery)
      .execute();

    if (affectedPersonIds.length > 0) {
      await this.recountPersons(affectedPersonIds.map((r) => r.personId));
    }
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteOrphanedPersons(spaceId: string) {
    await this.db
      .deleteFrom('shared_space_person')
      .where('spaceId', '=', spaceId)
      .where('id', 'not in', this.db.selectFrom('shared_space_person_face').select('personId'))
      .execute();
  }

  @GenerateSql({ params: [] })
  async deleteAllOrphanedPersons() {
    await this.db
      .deleteFrom('shared_space_person')
      .where('id', 'not in', this.db.selectFrom('shared_space_person_face').select('personId'))
      .execute();
  }

  @GenerateSql({ params: [] })
  async deleteAllPersonFaces() {
    await this.db.deleteFrom('shared_space_person_face').execute();
  }

  @GenerateSql({ params: [] })
  async deleteAllPersons() {
    await this.db.deleteFrom('shared_space_person').execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  async recountPersons(personIds: string[]) {
    if (personIds.length === 0) {
      return;
    }

    await this.db
      .updateTable('shared_space_person')
      .set((eb) => ({
        faceCount: eb
          .selectFrom('shared_space_person_face')
          .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
          .innerJoin('asset', 'asset.id', 'asset_face.assetId')
          .where('asset_face.deletedAt', 'is', null)
          .where('asset_face.isVisible', 'is', true)
          .where('asset.deletedAt', 'is', null)
          .where('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
          .select((eb2) => eb2.fn.countAll().$castTo<number>().as('count'))
          .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id'),
        assetCount: eb
          .selectFrom('shared_space_person_face')
          .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
          .innerJoin('asset', 'asset.id', 'asset_face.assetId')
          .where('asset_face.deletedAt', 'is', null)
          .where('asset_face.isVisible', 'is', true)
          .where('asset.deletedAt', 'is', null)
          .where('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
          .select((eb2) =>
            eb2.fn
              .count(eb2.fn('distinct', ['asset_face.assetId']))
              .$castTo<number>()
              .as('count'),
          )
          .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id'),
      }))
      .where('id', 'in', personIds)
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

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async migrateAliases(fromPersonId: string, toPersonId: string) {
    // Get aliases from the source person
    const sourceAliases = await this.db
      .selectFrom('shared_space_person_alias')
      .selectAll()
      .where('personId', '=', fromPersonId)
      .execute();

    for (const alias of sourceAliases) {
      await this.db
        .insertInto('shared_space_person_alias')
        .values({ personId: toPersonId, userId: alias.userId, alias: alias.alias })
        .onConflict((oc) => oc.doNothing())
        .execute();
    }

    // Delete source aliases
    await this.db.deleteFrom('shared_space_person_alias').where('personId', '=', fromPersonId).execute();
  }

  // ==========================================
  // Face Matching Queries
  // ==========================================

  @GenerateSql({
    params: [DummyValue.UUID, DummyValue.VECTOR, { maxDistance: 0.6, numResults: 1 }],
  })
  findClosestSpacePerson(
    spaceId: string,
    embedding: string,
    options: { maxDistance: number; numResults: number; excludePersonIds?: string[]; type?: string },
  ): Promise<SpacePersonMatch[]> {
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
              'shared_space_person.identityId',
              'shared_space_person.type',
              sql<number>`face_search.embedding <=> ${embedding}`.as('distance'),
            ])
            .where('shared_space_person.spaceId', '=', spaceId)
            .$if(!!options.excludePersonIds?.length, (qb) =>
              qb.where('shared_space_person.id', 'not in', options.excludePersonIds!),
            )
            .$if(!!options.type, (qb) => qb.where('shared_space_person.type', '=', options.type!))
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
  getSpacePersonsWithEmbeddings(spaceId: string): Promise<SpacePersonWithEmbedding[]> {
    return this.db
      .selectFrom('shared_space_person')
      .innerJoin('face_search', 'face_search.faceId', 'shared_space_person.representativeFaceId')
      .select([
        'shared_space_person.id',
        'shared_space_person.name',
        'shared_space_person.type',
        'shared_space_person.identityId',
        'shared_space_person.isHidden',
        'shared_space_person.faceCount',
        'shared_space_person.representativeFaceId',
        'shared_space_person.representativeFaceSource',
        'face_search.embedding',
      ])
      .where('shared_space_person.spaceId', '=', spaceId)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAssetFacesForMatching(assetId: string): Promise<AssetFaceForMatching[]> {
    return this.db
      .selectFrom('asset_face')
      .innerJoin('face_search', 'face_search.faceId', 'asset_face.id')
      .leftJoin('person', 'person.id', 'asset_face.personId')
      .select([
        'asset_face.id',
        'asset_face.assetId',
        'asset_face.personId',
        'person.identityId',
        'person.type',
        'face_search.embedding',
      ])
      .where('asset_face.assetId', '=', assetId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async isAssetInSpace(spaceId: string, assetId: string): Promise<boolean> {
    const result = await this.db
      .selectFrom(
        this.db
          .selectFrom('shared_space_asset')
          .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
          .select('shared_space_asset.assetId as id')
          .where('shared_space_asset.spaceId', '=', spaceId)
          .where('shared_space_asset.assetId', '=', assetId)
          .where('asset.deletedAt', 'is', null)
          .where('asset.isOffline', '=', false)
          .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
          .union(
            this.db
              .selectFrom('shared_space_library')
              .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
              .select('asset.id')
              .where('shared_space_library.spaceId', '=', spaceId)
              .where('asset.id', '=', assetId)
              .where('asset.deletedAt', 'is', null)
              .where('asset.isOffline', '=', false)
              .where('asset.visibility', 'in', visibleSpaceAssetVisibilities),
          )
          .as('combined'),
      )
      .select('combined.id')
      .limit(1)
      .executeTakeFirst();
    return !!result;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async isFaceInSpace(spaceId: string, faceId: string): Promise<boolean> {
    const result = await this.db
      .selectFrom(
        this.db
          .selectFrom('shared_space_asset')
          .innerJoin('asset_face', 'asset_face.assetId', 'shared_space_asset.assetId')
          .select('asset_face.id')
          .where('shared_space_asset.spaceId', '=', spaceId)
          .where('asset_face.id', '=', faceId)
          .where('asset_face.deletedAt', 'is', null)
          .union(
            this.db
              .selectFrom('shared_space_library')
              .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
              .innerJoin('asset_face', 'asset_face.assetId', 'asset.id')
              .select('asset_face.id')
              .where('shared_space_library.spaceId', '=', spaceId)
              .where('asset_face.id', '=', faceId)
              .where('asset_face.deletedAt', 'is', null)
              .where('asset.deletedAt', 'is', null)
              .where('asset.isOffline', '=', false),
          )
          .as('combined'),
      )
      .select('combined.id')
      .limit(1)
      .executeTakeFirst();
    return !!result;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getAssetIdForFace(faceId: string): Promise<string | null> {
    const result = await this.db
      .selectFrom('asset_face')
      .select('assetId')
      .where('id', '=', faceId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    return result?.assetId ?? null;
  }

  @GenerateSql({ params: [DummyValue.UUID, { limit: DummyValue.NUMBER, afterAssetId: DummyValue.UUID }] })
  getAssetIdsInSpacePage(spaceId: string, options?: { limit?: number; afterAssetId?: string }) {
    const limit = options?.limit ?? 1000;
    const afterAssetId = options?.afterAssetId;
    const combined = this.db
      .selectFrom('shared_space_asset')
      .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
      .select('shared_space_asset.assetId as id')
      .where('shared_space_asset.spaceId', '=', spaceId)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isOffline', '=', false)
      .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
      .union(
        this.db
          .selectFrom('shared_space_library')
          .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
          .select('asset.id')
          .where('shared_space_library.spaceId', '=', spaceId)
          .where('asset.deletedAt', 'is', null)
          .where('asset.isOffline', '=', false)
          .where('asset.visibility', 'in', visibleSpaceAssetVisibilities),
      )
      .as('combined');

    return this.db
      .selectFrom(combined)
      .select('combined.id as assetId')
      .$if(!!afterAssetId, (qb) => qb.where('combined.id', '>', afterAssetId!))
      .orderBy('combined.id', 'asc')
      .limit(limit)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAssetIdsInSpace(spaceId: string) {
    return this.db
      .selectFrom(
        this.db
          .selectFrom('shared_space_asset')
          .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
          .select('shared_space_asset.assetId as id')
          .where('shared_space_asset.spaceId', '=', spaceId)
          .where('asset.deletedAt', 'is', null)
          .where('asset.isOffline', '=', false)
          .where('asset.visibility', 'in', visibleSpaceAssetVisibilities)
          .union(
            this.db
              .selectFrom('shared_space_library')
              .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
              .select('asset.id')
              .where('shared_space_library.spaceId', '=', spaceId)
              .where('asset.deletedAt', 'is', null)
              .where('asset.isOffline', '=', false)
              .where('asset.visibility', 'in', visibleSpaceAssetVisibilities),
          )
          .as('combined'),
      )
      .select('combined.id as assetId')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getSpaceIdsForAsset(assetId: string) {
    return this.db
      .selectFrom(
        this.db
          .selectFrom('shared_space_asset')
          .innerJoin('shared_space', 'shared_space.id', 'shared_space_asset.spaceId')
          .select('shared_space_asset.spaceId')
          .where('shared_space_asset.assetId', '=', assetId)
          .where('shared_space.faceRecognitionEnabled', '=', true)
          .union(
            this.db
              .selectFrom('shared_space_library')
              .innerJoin('asset', 'asset.libraryId', 'shared_space_library.libraryId')
              .innerJoin('shared_space', 'shared_space.id', 'shared_space_library.spaceId')
              .select('shared_space_library.spaceId')
              .where('asset.id', '=', assetId)
              .where('shared_space.faceRecognitionEnabled', '=', true),
          )
          .as('combined'),
      )
      .select('combined.spaceId')
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

  @GenerateSql({ params: [DummyValue.UUID] })
  getPetFacesForAsset(assetId: string): Promise<PetFaceForMatching[]> {
    return this.db
      .selectFrom('asset_face')
      .innerJoin('person', 'person.id', 'asset_face.personId')
      .select(['asset_face.id', 'asset_face.assetId', 'asset_face.personId', 'person.identityId', 'person.type'])
      .where('asset_face.assetId', '=', assetId)
      .where('asset_face.deletedAt', 'is', null)
      .where('person.type', '=', 'pet')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  findSpacePersonByLinkedPersonId(spaceId: string, personId: string) {
    return this.db
      .selectFrom('shared_space_person')
      .innerJoin('shared_space_person_face', 'shared_space_person_face.personId', 'shared_space_person.id')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .selectAll('shared_space_person')
      .where('shared_space_person.spaceId', '=', spaceId)
      .where('asset_face.personId', '=', personId)
      .limit(1)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async findSpacePersonsByLinkedPersonIds(spaceId: string, personIds: string[]) {
    if (personIds.length === 0) {
      return new Map<string, LinkedSpacePerson>();
    }

    const results = await this.db
      .selectFrom('shared_space_person')
      .innerJoin('shared_space_person_face', 'shared_space_person_face.personId', 'shared_space_person.id')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .select([
        'shared_space_person.id',
        'shared_space_person.name',
        'shared_space_person.isHidden',
        'shared_space_person.birthDate',
        'shared_space_person.updatedAt',
        'shared_space_person.type',
        'asset_face.personId',
      ])
      .where('shared_space_person.spaceId', '=', spaceId)
      .where('asset_face.personId', 'in', personIds)
      .groupBy([
        'shared_space_person.id',
        'shared_space_person.name',
        'shared_space_person.isHidden',
        'shared_space_person.birthDate',
        'shared_space_person.updatedAt',
        'shared_space_person.type',
        'asset_face.personId',
      ])
      .execute();

    const map = new Map<string, LinkedSpacePerson>();
    for (const row of results) {
      if (row.personId) {
        map.set(row.personId, {
          id: row.id,
          isHidden: row.isHidden,
          name: row.name,
          birthDate: row.birthDate,
          updatedAt: row.updatedAt,
          type: row.type,
        });
      }
    }
    return map;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async findSpaceForAssetAndUser(assetId: string, userId: string) {
    return this.db
      .selectFrom(
        this.db
          .selectFrom('shared_space_asset')
          .innerJoin('shared_space_member', 'shared_space_member.spaceId', 'shared_space_asset.spaceId')
          .innerJoin('asset', (join) =>
            join.onRef('asset.id', '=', 'shared_space_asset.assetId').on('asset.deletedAt', 'is', null),
          )
          .select('shared_space_asset.spaceId')
          .where('shared_space_asset.assetId', '=', assetId)
          .where('shared_space_member.userId', '=', userId)
          .union(
            this.db
              .selectFrom('shared_space_library')
              .innerJoin('shared_space_member', 'shared_space_member.spaceId', 'shared_space_library.spaceId')
              .innerJoin('asset', (join) =>
                join
                  .onRef('asset.libraryId', '=', 'shared_space_library.libraryId')
                  .on('asset.id', '=', assetId)
                  .on('asset.deletedAt', 'is', null)
                  .on('asset.isOffline', '=', false),
              )
              .select('shared_space_library.spaceId')
              .where('shared_space_member.userId', '=', userId),
          )
          .as('combined'),
      )
      .select('combined.spaceId')
      .limit(1)
      .executeTakeFirst();
  }
}
