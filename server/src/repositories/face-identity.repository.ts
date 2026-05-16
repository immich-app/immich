import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Selectable, sql, Transaction } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import {
  MergeScopedPeopleDto,
  PeopleResponseDto,
  PersonResponseDto,
  ScopedPersonProfileRefDto,
} from 'src/dtos/person.dto';
import { AssetVisibility, SharedSpaceRole, SourceType, VectorIndex } from 'src/enum';
import { probes } from 'src/repositories/database.repository';
import type { PeopleFaceStatistics, PersonStatistics } from 'src/repositories/person.repository';
import { DB } from 'src/schema';
import { FaceIdentityFaceSource, FaceIdentityFaceTable } from 'src/schema/tables/face-identity-face.table';
import { FaceIdentityTable } from 'src/schema/tables/face-identity.table';
import { anyUuid } from 'src/utils/database';
import { asBirthDateString, asDateString } from 'src/utils/date';

export type FaceIdentity = Selectable<FaceIdentityTable>;
export type FaceIdentityFace = Selectable<FaceIdentityFaceTable>;

export type LinkFaceInput = {
  assetFaceId: string;
  identityId: string;
  source: FaceIdentityFaceSource;
  confidence?: number | null;
};

export type LinkPersonFacesInput = {
  personId: string;
  identityId: string;
  source: FaceIdentityFaceSource;
};

export type BackfillResult = {
  processed: number;
  nextCursor?: string;
  affectedSpaceAssets?: SharedSpaceFaceMatchBackfillTarget[];
};

export type SpacePersonBackfillResult = BackfillResult & {
  conflictCount: number;
};

export type FaceIdentityBackfillWork = {
  hasPersonalIdentityWork: boolean;
  hasSpacePersonIdentityWork: boolean;
  hasSharedSpaceProjectionWork: boolean;
};

export type SharedSpaceFaceMatchBackfillTarget = {
  spaceId: string;
  assetId: string;
};

export type PendingSharedSpaceFaceMatchBackfillTarget = SharedSpaceFaceMatchBackfillTarget & {
  updatedAt: Date;
  updateId: string;
};

export type MergeIdentitiesResult = {
  personalProfileConflictCount: number;
  spaceProfileConflictCount: number;
};

export type AccessibleIdentityFaceMatch = {
  identityId: string;
  type: string;
  distance: number;
};

type AccessiblePeopleOptions = {
  withHidden: boolean;
  page: number;
  size: number;
  minimumFaceCount?: number;
};

type AccessiblePeopleSearchOptions = {
  name: string;
  withHidden?: boolean;
  limit?: number;
  minimumFaceCount?: number;
};

type ProfileKind = 'person' | 'space-person';
type PersonalBackfillRow = {
  id: string;
  ownerId: string;
  identityId: string | null;
};
type PersonalBackfillIdentityGroup = {
  identityId: string;
};
type SpacePersonBackfillRow = {
  id: string;
  spaceId: string;
  identityId: string | null;
  representativeFaceId: string | null;
  representativeFaceSource: string;
  type: string;
};

type SpacePersonBackfillIdentityGroup = {
  identityId: string;
  type: string;
  faceCount: number | string | bigint;
  representativeFaceId: string;
};

const peopleAssetVisibilities = [AssetVisibility.Archive, AssetVisibility.Timeline];
const sharedSpaceFaceMatchBackfillTargetInsertChunkSize = 1000;

export type ScopedPersonTokenResolution = {
  identityIds: string[];
  legacyPersonIds: string[];
  legacySpacePersonIds: string[];
  hasInaccessibleToken: boolean;
};

export type RepairRefsResolution =
  | {
      accessible: false;
      reason: 'not-found-or-no-access' | 'incompatible-type';
    }
  | {
      accessible: true;
      targetIdentityId: string;
      sourceIdentityIds: string[];
      type: string;
      allAttachedProfilesRepairable: boolean;
      hasScopedProfileConflict: boolean;
    };

export type DetachRefResolution =
  | {
      accessible: false;
      reason: 'not-found-or-no-access';
    }
  | {
      accessible: true;
      identityId: string;
      type: string;
      allBackingFacesRepairable: boolean;
    };

type RepairProfile = {
  type: ProfileKind;
  id: string;
  spaceId: string | null;
  identityId: string;
  identityType: string;
  representativeFaceId: string | null;
};

type AccessiblePeopleIdentityPageRow = {
  identityId: string;
  visibleAssetCount: string | number;
};

type AccessiblePeopleCountRow = {
  total: string | number | null;
  hidden: string | number | null;
};

type AccessiblePeopleStatisticsRow = AccessiblePeopleCountRow & {
  detectedFaceCount: string | number | null;
};

type HydratedAccessiblePersonRow = {
  profileType: 'user-person' | 'space-person';
  profileId: string;
  spaceId: string | null;
  name: string | null;
  birthDate: string | Date | null;
  thumbnailPath: string | null;
  isHidden: boolean;
  isFavorite: boolean | null;
  color: string | null;
  updatedAt: string | Date | null;
  type: string | null;
  species: string | null;
  numberOfAssets: string | number | null;
};

@Injectable()
export class FaceIdentityRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({
    params: [
      {
        userId: DummyValue.UUID,
        tokens: [`person:${DummyValue.UUID}`, `space-person:${DummyValue.UUID}`],
        scope: { withSharedSpaces: true, spaceId: DummyValue.UUID, timelineSpaceIds: [DummyValue.UUID] },
      },
    ],
  })
  async resolveScopedPersonTokens(input: {
    userId: string;
    tokens: string[];
    scope: { withSharedSpaces?: boolean; spaceId?: string; timelineSpaceIds?: string[] };
  }): Promise<ScopedPersonTokenResolution> {
    const tokens = [...new Set(input.tokens.filter(Boolean))];
    const identityIds = new Set<string>();
    const legacyPersonIds = new Set<string>();
    const legacySpacePersonIds = new Set<string>();
    let hasInaccessibleToken = false;

    const ownPersonTokenIds = new Set<string>();
    const scopedSpacePersonIds = new Set<string>();
    const passThroughLegacyPersonIds = new Set<string>();

    for (const token of tokens) {
      if (token.startsWith('person:')) {
        ownPersonTokenIds.add(token.slice('person:'.length));
      } else if (token.startsWith('space-person:')) {
        scopedSpacePersonIds.add(token.slice('space-person:'.length));
      } else if (input.scope.withSharedSpaces) {
        ownPersonTokenIds.add(token);
      } else {
        passThroughLegacyPersonIds.add(token);
      }
    }

    for (const id of passThroughLegacyPersonIds) {
      legacyPersonIds.add(id);
    }

    if (ownPersonTokenIds.size > 0) {
      const rows = await this.db
        .selectFrom('person')
        .select(['id', 'identityId'])
        .where('ownerId', '=', input.userId)
        .where('id', 'in', [...ownPersonTokenIds])
        .execute();
      const rowsById = new Map(rows.map((row) => [row.id, row]));

      for (const personId of ownPersonTokenIds) {
        const row = rowsById.get(personId);
        if (!row) {
          hasInaccessibleToken = true;
          continue;
        }
        if (row.identityId) {
          identityIds.add(row.identityId);
        } else {
          legacyPersonIds.add(personId);
        }
      }
    }

    if (scopedSpacePersonIds.size > 0) {
      const rows = await this.db
        .selectFrom('shared_space_person')
        .innerJoin('shared_space_member', (join) =>
          join
            .onRef('shared_space_member.spaceId', '=', 'shared_space_person.spaceId')
            .on('shared_space_member.userId', '=', input.userId),
        )
        .select([
          'shared_space_person.id',
          'shared_space_person.identityId',
          'shared_space_person.spaceId',
          'shared_space_member.showInTimeline',
        ])
        .where('shared_space_person.id', 'in', [...scopedSpacePersonIds])
        .where((eb) =>
          eb.exists(
            eb
              .selectFrom('shared_space_person_face')
              .innerJoin('asset_face as profile_face', 'profile_face.id', 'shared_space_person_face.assetFaceId')
              .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id')
              .where('profile_face.deletedAt', 'is', null)
              .where('profile_face.isVisible', '=', true),
          ),
        )
        .execute();
      const rowsById = new Map(rows.map((row) => [row.id, row]));
      const timelineSpaceIds = new Set(input.scope.timelineSpaceIds);

      for (const spacePersonId of scopedSpacePersonIds) {
        const row = rowsById.get(spacePersonId);
        const spaceMatchesScope =
          !!row &&
          (!input.scope.spaceId || row.spaceId === input.scope.spaceId) &&
          (!input.scope.withSharedSpaces ||
            (row.showInTimeline === true && timelineSpaceIds.size > 0 && timelineSpaceIds.has(row.spaceId)));

        if (!row || !spaceMatchesScope) {
          hasInaccessibleToken = true;
          continue;
        }

        if (row.identityId) {
          identityIds.add(row.identityId);
        } else {
          legacySpacePersonIds.add(spacePersonId);
        }
      }
    }

    return {
      identityIds: [...identityIds],
      legacyPersonIds: [...legacyPersonIds],
      legacySpacePersonIds: [...legacySpacePersonIds],
      hasInaccessibleToken,
    };
  }

  @GenerateSql({
    params: [
      {
        userId: DummyValue.UUID,
        embedding: DummyValue.VECTOR,
        maxDistance: 0.6,
        type: 'person',
        excludeIdentityId: DummyValue.UUID,
      },
    ],
  })
  async findClosestAccessibleIdentityForFace(input: {
    userId: string;
    embedding: string;
    maxDistance: number;
    type: string;
    excludeIdentityId?: string | null;
  }): Promise<AccessibleIdentityFaceMatch | undefined> {
    return this.db.transaction().execute(async (trx) => {
      await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.Face])}`.execute(trx);

      const result = await sql<AccessibleIdentityFaceMatch>`
        WITH identity_matches AS (
          SELECT
            shared_space_person."identityId" AS "identityId",
            shared_space_person.type,
            MIN(face_search.embedding <=> ${input.embedding})::float8 AS distance
          FROM shared_space_person
          INNER JOIN shared_space_member
            ON shared_space_member."spaceId" = shared_space_person."spaceId"
            AND shared_space_member."userId" = ${input.userId}
            AND shared_space_member."showInTimeline" = true
          INNER JOIN shared_space_person_face
            ON shared_space_person_face."personId" = shared_space_person.id
          INNER JOIN asset_face
            ON asset_face.id = shared_space_person_face."assetFaceId"
          INNER JOIN asset
            ON asset.id = asset_face."assetId"
          INNER JOIN face_search
            ON face_search."faceId" = asset_face.id
          WHERE shared_space_person."identityId" IS NOT NULL
            AND shared_space_person.type = ${input.type}
            AND shared_space_person."isHidden" = false
            ${input.excludeIdentityId ? sql`AND shared_space_person."identityId" <> ${input.excludeIdentityId}` : sql``}
            AND asset_face."deletedAt" IS NULL
            AND asset_face."isVisible" = true
            AND asset."deletedAt" IS NULL
            AND asset."isOffline" = false
            AND asset.visibility = ${AssetVisibility.Timeline}
            AND NOT EXISTS (
              SELECT 1
              FROM person existing_person
              WHERE existing_person."ownerId" = ${input.userId}
                AND existing_person."identityId" = shared_space_person."identityId"
            )
            ${
              input.excludeIdentityId
                ? sql`
                  AND NOT EXISTS (
                    SELECT 1
                    FROM shared_space_person source_space_person
                    INNER JOIN shared_space_person target_space_person
                      ON target_space_person."spaceId" = source_space_person."spaceId"
                      AND target_space_person."identityId" = shared_space_person."identityId"
                    WHERE source_space_person."identityId" = ${input.excludeIdentityId}
                  )
                `
                : sql``
            }
          GROUP BY shared_space_person."identityId", shared_space_person.type
        )
        SELECT "identityId", type, distance
        FROM identity_matches
        WHERE distance <= ${input.maxDistance}
        ORDER BY distance
        LIMIT 2
      `.execute(trx);

      return result.rows.length === 1 ? result.rows[0] : undefined;
    });
  }

  async getBackfillWork(): Promise<FaceIdentityBackfillWork> {
    const result = await sql<Pick<FaceIdentityBackfillWork, 'hasPersonalIdentityWork' | 'hasSpacePersonIdentityWork'>>`
      SELECT
        (
          EXISTS (
            SELECT 1
            FROM person
            WHERE person."identityId" IS NULL
          )
          OR EXISTS (
            SELECT 1
            FROM asset_face
            INNER JOIN asset ON asset.id = asset_face."assetId"
            LEFT JOIN face_identity_face ON face_identity_face."assetFaceId" = asset_face.id
            WHERE asset_face."personId" IS NOT NULL
              AND asset_face."deletedAt" IS NULL
              AND asset_face."isVisible" = true
              AND asset."deletedAt" IS NULL
              AND face_identity_face."assetFaceId" IS NULL
          )
          OR EXISTS (
            SELECT 1
            FROM asset_face
            INNER JOIN asset ON asset.id = asset_face."assetId"
            INNER JOIN person ON person.id = asset_face."personId"
            INNER JOIN face_identity_face ON face_identity_face."assetFaceId" = asset_face.id
            WHERE asset_face."personId" IS NOT NULL
              AND asset_face."deletedAt" IS NULL
              AND asset_face."isVisible" = true
              AND asset."deletedAt" IS NULL
              AND person."identityId" IS DISTINCT FROM face_identity_face."identityId"
          )
        ) AS "hasPersonalIdentityWork",
        EXISTS (
            SELECT 1
            FROM shared_space_person
            INNER JOIN shared_space ON shared_space.id = shared_space_person."spaceId"
            INNER JOIN shared_space_person_face
              ON shared_space_person_face."personId" = shared_space_person.id
            INNER JOIN asset_face
              ON asset_face.id = shared_space_person_face."assetFaceId"
            INNER JOIN face_identity_face
              ON face_identity_face."assetFaceId" = asset_face.id
            WHERE shared_space."faceRecognitionEnabled" = true
              AND asset_face."deletedAt" IS NULL
              AND asset_face."isVisible" = true
              AND shared_space_person."identityId" IS DISTINCT FROM face_identity_face."identityId"
        ) AS "hasSpacePersonIdentityWork"
    `.execute(this.db);
    const projectionTargets = await this.getSharedSpaceFaceMatchBackfillTargets({ limit: 1 });

    return {
      hasPersonalIdentityWork: result.rows[0]?.hasPersonalIdentityWork ?? false,
      hasSpacePersonIdentityWork: result.rows[0]?.hasSpacePersonIdentityWork ?? false,
      hasSharedSpaceProjectionWork: projectionTargets.length > 0,
    };
  }

  async hasBackfillWork(): Promise<boolean> {
    const work = await this.getBackfillWork();
    const pendingTargets = await this.getPendingSharedSpaceFaceMatchBackfillTargets({ limit: 1 });
    return (
      work.hasPersonalIdentityWork ||
      work.hasSpacePersonIdentityWork ||
      work.hasSharedSpaceProjectionWork ||
      pendingTargets.length > 0
    );
  }

  async getSharedSpaceFaceMatchBackfillTargets(
    input: { limit?: number; assetFaceIds?: string[] } = {},
  ): Promise<SharedSpaceFaceMatchBackfillTarget[]> {
    if (input.assetFaceIds && input.assetFaceIds.length === 0) {
      return [];
    }

    const limit = input.limit === undefined ? sql`` : sql`LIMIT ${input.limit}`;
    const assetFaceIds = input.assetFaceIds ? [...new Set(input.assetFaceIds)] : undefined;
    const assetFaceFilter = assetFaceIds ? sql`AND asset_face.id = ${anyUuid(assetFaceIds)}` : sql``;
    const result = await sql<SharedSpaceFaceMatchBackfillTarget>`
      WITH face_spaces AS (
        SELECT
          shared_space_asset."spaceId",
          asset.id AS "assetId",
          asset_face.id AS "assetFaceId",
          face_identity_face."identityId",
          COALESCE(person.type, 'person') AS type
        FROM shared_space_asset
        INNER JOIN shared_space ON shared_space.id = shared_space_asset."spaceId"
        INNER JOIN asset ON asset.id = shared_space_asset."assetId"
        INNER JOIN asset_face ON asset_face."assetId" = asset.id
        INNER JOIN face_identity_face ON face_identity_face."assetFaceId" = asset_face.id
        LEFT JOIN person ON person.id = asset_face."personId"
        WHERE shared_space."faceRecognitionEnabled" = true
          AND asset."deletedAt" IS NULL
          AND asset."isOffline" = false
          AND asset.visibility IN (${sql.join(peopleAssetVisibilities)})
          AND asset_face."personId" IS NOT NULL
          AND asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
          ${assetFaceFilter}

        UNION

        SELECT
          shared_space_library."spaceId",
          asset.id AS "assetId",
          asset_face.id AS "assetFaceId",
          face_identity_face."identityId",
          COALESCE(person.type, 'person') AS type
        FROM shared_space_library
        INNER JOIN shared_space ON shared_space.id = shared_space_library."spaceId"
        INNER JOIN asset ON asset."libraryId" = shared_space_library."libraryId"
        INNER JOIN asset_face ON asset_face."assetId" = asset.id
        INNER JOIN face_identity_face ON face_identity_face."assetFaceId" = asset_face.id
        LEFT JOIN person ON person.id = asset_face."personId"
        WHERE shared_space."faceRecognitionEnabled" = true
          AND asset."deletedAt" IS NULL
          AND asset."isOffline" = false
          AND asset.visibility IN (${sql.join(peopleAssetVisibilities)})
          AND asset_face."personId" IS NOT NULL
          AND asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
          ${assetFaceFilter}
      ),
      targets AS (
        SELECT DISTINCT "spaceId", "assetId"
        FROM face_spaces
        WHERE (
            SELECT COUNT(*)
            FROM shared_space_person_face
            INNER JOIN shared_space_person
              ON shared_space_person.id = shared_space_person_face."personId"
            WHERE shared_space_person_face."assetFaceId" = face_spaces."assetFaceId"
              AND shared_space_person."spaceId" = face_spaces."spaceId"
          ) != 1
          OR NOT EXISTS (
            SELECT 1
            FROM shared_space_person_face
            INNER JOIN shared_space_person
              ON shared_space_person.id = shared_space_person_face."personId"
            WHERE shared_space_person_face."assetFaceId" = face_spaces."assetFaceId"
              AND shared_space_person."spaceId" = face_spaces."spaceId"
              AND shared_space_person."identityId" IS NOT DISTINCT FROM face_spaces."identityId"
              AND shared_space_person.type = face_spaces.type
          )
      )
      SELECT "spaceId", "assetId"
      FROM targets
      ORDER BY "spaceId", "assetId"
      ${limit}
    `.execute(this.db);

    return result.rows;
  }

  private dedupeSharedSpaceFaceMatchBackfillTargets(
    targets: SharedSpaceFaceMatchBackfillTarget[],
  ): SharedSpaceFaceMatchBackfillTarget[] {
    return [
      ...new Map(
        targets
          .toSorted((a, b) => a.spaceId.localeCompare(b.spaceId) || a.assetId.localeCompare(b.assetId))
          .map((target) => [`${target.spaceId}:${target.assetId}`, target]),
      ).values(),
    ];
  }

  private async getSharedSpaceFaceMatchTargetsForAssetFaces(
    assetFaceIds: string[],
  ): Promise<SharedSpaceFaceMatchBackfillTarget[]> {
    if (assetFaceIds.length === 0) {
      return [];
    }

    const uniqueAssetFaceIds = [...new Set(assetFaceIds)];
    const result = await sql<SharedSpaceFaceMatchBackfillTarget>`
      WITH face_spaces AS (
        SELECT
          shared_space_asset."spaceId",
          asset.id AS "assetId"
        FROM shared_space_asset
        INNER JOIN shared_space ON shared_space.id = shared_space_asset."spaceId"
        INNER JOIN asset ON asset.id = shared_space_asset."assetId"
        INNER JOIN asset_face ON asset_face."assetId" = asset.id
        WHERE shared_space."faceRecognitionEnabled" = true
          AND asset."deletedAt" IS NULL
          AND asset."isOffline" = false
          AND asset.visibility IN (${sql.join(peopleAssetVisibilities)})
          AND asset_face.id = ${anyUuid(uniqueAssetFaceIds)}
          AND asset_face."personId" IS NOT NULL
          AND asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
          AND NOT EXISTS (
            SELECT 1
            FROM shared_space_person_face
            INNER JOIN shared_space_person
              ON shared_space_person.id = shared_space_person_face."personId"
            WHERE shared_space_person_face."assetFaceId" = asset_face.id
              AND shared_space_person."spaceId" = shared_space_asset."spaceId"
          )

        UNION

        SELECT
          shared_space_library."spaceId",
          asset.id AS "assetId"
        FROM shared_space_library
        INNER JOIN shared_space ON shared_space.id = shared_space_library."spaceId"
        INNER JOIN asset ON asset."libraryId" = shared_space_library."libraryId"
        INNER JOIN asset_face ON asset_face."assetId" = asset.id
        WHERE shared_space."faceRecognitionEnabled" = true
          AND asset."deletedAt" IS NULL
          AND asset."isOffline" = false
          AND asset.visibility IN (${sql.join(peopleAssetVisibilities)})
          AND asset_face.id = ${anyUuid(uniqueAssetFaceIds)}
          AND asset_face."personId" IS NOT NULL
          AND asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
          AND NOT EXISTS (
            SELECT 1
            FROM shared_space_person_face
            INNER JOIN shared_space_person
              ON shared_space_person.id = shared_space_person_face."personId"
            WHERE shared_space_person_face."assetFaceId" = asset_face.id
              AND shared_space_person."spaceId" = shared_space_library."spaceId"
          )
      )
      SELECT DISTINCT "spaceId", "assetId"
      FROM face_spaces
      ORDER BY "spaceId", "assetId"
    `.execute(this.db);

    return result.rows;
  }

  private async addPendingSharedSpaceFaceMatchBackfillTargets(
    targets: SharedSpaceFaceMatchBackfillTarget[],
  ): Promise<SharedSpaceFaceMatchBackfillTarget[]> {
    const uniqueTargets = this.dedupeSharedSpaceFaceMatchBackfillTargets(targets);
    if (uniqueTargets.length === 0) {
      return [];
    }

    for (let index = 0; index < uniqueTargets.length; index += sharedSpaceFaceMatchBackfillTargetInsertChunkSize) {
      const chunk = uniqueTargets.slice(index, index + sharedSpaceFaceMatchBackfillTargetInsertChunkSize);
      await this.db
        .insertInto('shared_space_face_match_backfill_target')
        .values(chunk)
        .onConflict((oc) => oc.columns(['spaceId', 'assetId']).doUpdateSet({ updatedAt: sql`now()` }))
        .execute();
    }

    return uniqueTargets;
  }

  private async addPendingSharedSpaceFaceMatchBackfillTargetsForAssetFaces(
    assetFaceIds: string[],
  ): Promise<SharedSpaceFaceMatchBackfillTarget[]> {
    return this.addPendingSharedSpaceFaceMatchBackfillTargets(
      await this.getSharedSpaceFaceMatchTargetsForAssetFaces(assetFaceIds),
    );
  }

  async getPendingSharedSpaceFaceMatchBackfillTargets(
    input: { limit?: number } = {},
  ): Promise<PendingSharedSpaceFaceMatchBackfillTarget[]> {
    return this.db
      .selectFrom('shared_space_face_match_backfill_target')
      .select(['spaceId', 'assetId', 'updatedAt', 'updateId'])
      .orderBy('spaceId')
      .orderBy('assetId')
      .$if(input.limit !== undefined, (qb) => qb.limit(input.limit!))
      .$castTo<PendingSharedSpaceFaceMatchBackfillTarget>()
      .execute();
  }

  async deletePendingSharedSpaceFaceMatchBackfillTargets(
    targets: PendingSharedSpaceFaceMatchBackfillTarget[],
  ): Promise<void> {
    if (targets.length === 0) {
      return;
    }

    for (let index = 0; index < targets.length; index += 1000) {
      const chunk = targets.slice(index, index + 1000);
      await sql`
        DELETE FROM "shared_space_face_match_backfill_target"
        WHERE ("spaceId", "assetId", "updateId") IN (${sql.join(
          chunk.map((target) => sql`(${target.spaceId}, ${target.assetId}, ${target.updateId})`),
        )})
      `.execute(this.db);
    }
  }

  @GenerateSql({
    params: [
      DummyValue.UUID,
      {
        name: DummyValue.STRING,
        withHidden: true,
        limit: 50,
      },
    ],
  })
  async searchAccessiblePeople(userId: string, options: AccessiblePeopleSearchOptions): Promise<PersonResponseDto[]> {
    const rows = await this.getAccessiblePeopleIdentityPage({
      userId,
      withHidden: options.withHidden ?? false,
      limit: options.limit ?? 50,
      offset: 0,
      searchName: options.name,
      minimumFaceCount: options.minimumFaceCount ?? 1,
    });

    return this.hydrateAccessiblePeople({
      userId,
      identityIds: rows.map((row) => row.identityId),
      withHidden: options.withHidden ?? false,
    });
  }

  @GenerateSql({ params: [DummyValue.UUID, { limit: 100 }] })
  async getAccessiblePersonFilterSuggestions(
    userId: string,
    options: { limit?: number; minimumFaceCount?: number } = {},
  ): Promise<{ people: Array<{ id: string; name: string }>; hasUnnamedPeople: boolean }> {
    const people = await this.searchAccessiblePeople(userId, {
      name: '',
      withHidden: false,
      limit: options.limit ?? 100,
      minimumFaceCount: options.minimumFaceCount,
    });

    return {
      people: people
        .filter((person) => person.name !== '')
        .map((person) => ({ id: person.filterId ?? `person:${person.id}`, name: person.name })),
      hasUnnamedPeople: people.some((person) => person.name === ''),
    };
  }

  async getAccessiblePeople(userId: string, options: AccessiblePeopleOptions): Promise<PeopleResponseDto> {
    const page = Math.max(1, options.page);
    const size = Math.max(1, options.size);
    const minimumFaceCount = options.minimumFaceCount ?? 1;
    const rows = await this.getAccessiblePeopleIdentityPage({
      userId,
      withHidden: options.withHidden,
      limit: size + 1,
      offset: (page - 1) * size,
      minimumFaceCount,
    });
    const pageRows = rows.slice(0, size);
    const people = await this.hydrateAccessiblePeople({
      userId,
      identityIds: pageRows.map((row) => row.identityId),
      withHidden: options.withHidden,
    });
    const counts = await this.getAccessiblePeopleCounts(userId, minimumFaceCount);

    return {
      total: Number(counts.total ?? 0),
      hidden: Number(counts.hidden ?? 0),
      hasNextPage: rows.length > size,
      people,
    };
  }

  @GenerateSql({ params: [DummyValue.UUID, { minimumFaceCount: 3 }] })
  async getAccessiblePeopleStatistics(
    userId: string,
    options: { minimumFaceCount?: number },
  ): Promise<{ total: number; hidden: number; detectedFaceCount: number }> {
    const minimumFaceCount = options.minimumFaceCount ?? 1;
    const result = await sql<AccessiblePeopleStatisticsRow>`
      WITH timeline_spaces AS (
        SELECT "spaceId"
        FROM shared_space_member
        WHERE "userId" = ${userId}
          AND "showInTimeline" = true
      ),
      accessible_detected_faces AS (
        SELECT
          asset_face.id AS "assetFaceId",
          asset_face."assetId"
        FROM asset_face
        INNER JOIN asset ON asset.id = asset_face."assetId"
        WHERE asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
          AND asset."deletedAt" IS NULL
          AND asset."isOffline" = false
          AND asset.visibility IN (${sql.join(peopleAssetVisibilities)})
          AND (
            asset."ownerId" = ${userId}
            OR EXISTS (
              SELECT 1
              FROM shared_space_asset
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_asset."spaceId"
              WHERE shared_space_asset."assetId" = asset.id
            )
            OR EXISTS (
              SELECT 1
              FROM shared_space_library
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_library."spaceId"
              WHERE shared_space_library."libraryId" = asset."libraryId"
            )
          )
      ),
      accessible_faces AS (
        SELECT
          face_identity_face."identityId",
          accessible_detected_faces."assetId"
        FROM accessible_detected_faces
        INNER JOIN face_identity_face ON face_identity_face."assetFaceId" = accessible_detected_faces."assetFaceId"
      ),
      identity_counts AS (
        SELECT
          accessible_faces."identityId",
          COUNT(DISTINCT accessible_faces."assetId") AS "visibleAssetCount"
        FROM accessible_faces
        GROUP BY accessible_faces."identityId"
      ),
      accessible_profiles AS (
        SELECT person."identityId", person."isHidden", person.name
        FROM person
        WHERE person."ownerId" = ${userId}
          AND person."identityId" IS NOT NULL
          AND EXISTS (SELECT 1 FROM accessible_faces WHERE accessible_faces."identityId" = person."identityId")
        UNION ALL
        SELECT
          shared_space_person."identityId",
          shared_space_person."isHidden",
          COALESCE(NULLIF(shared_space_person_alias.alias, ''), shared_space_person.name, '') AS name
        FROM shared_space_person
        INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_person."spaceId"
        LEFT JOIN shared_space_person_alias
          ON shared_space_person_alias."personId" = shared_space_person.id
          AND shared_space_person_alias."userId" = ${userId}
        WHERE shared_space_person."identityId" IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM shared_space_person_face
            INNER JOIN asset_face AS profile_face
              ON profile_face.id = shared_space_person_face."assetFaceId"
            WHERE shared_space_person_face."personId" = shared_space_person.id
              AND profile_face."deletedAt" IS NULL
              AND profile_face."isVisible" = true
          )
          AND EXISTS (
            SELECT 1 FROM accessible_faces WHERE accessible_faces."identityId" = shared_space_person."identityId"
          )
      ),
      identity_visibility AS (
        SELECT
          "identityId",
          bool_or("isHidden" = false) AS "hasVisibleProfile",
          bool_or(NULLIF(name, '') IS NOT NULL) AS "hasNamedProfile"
        FROM accessible_profiles
        GROUP BY "identityId"
      ),
      eligible_identities AS (
        SELECT
          identity_visibility."identityId",
          identity_visibility."hasVisibleProfile"
        FROM identity_visibility
        INNER JOIN identity_counts ON identity_counts."identityId" = identity_visibility."identityId"
        WHERE identity_visibility."hasNamedProfile" = true
          OR identity_counts."visibleAssetCount" >= ${minimumFaceCount}
      )
      SELECT
        (SELECT COUNT(*) FROM eligible_identities) AS total,
        (SELECT COUNT(*) FROM eligible_identities WHERE "hasVisibleProfile" = false) AS hidden,
        (SELECT COUNT(DISTINCT "assetFaceId") FROM accessible_detected_faces) AS "detectedFaceCount"
    `.execute(this.db);

    const row = result.rows[0];
    return {
      total: Number(row?.total ?? 0),
      hidden: Number(row?.hidden ?? 0),
      detectedFaceCount: Number(row?.detectedFaceCount ?? 0),
    };
  }

  @GenerateSql({ params: [DummyValue.UUID, { minimumFaceCount: 3 }] })
  async getAccessiblePeopleFaceStatistics(
    userId: string,
    options: { minimumFaceCount?: number },
  ): Promise<PeopleFaceStatistics> {
    const minimumFaceCount = options.minimumFaceCount ?? 1;
    const result = await sql<PeopleFaceStatistics>`
      WITH timeline_spaces AS (
        SELECT "spaceId"
        FROM shared_space_member
        WHERE "userId" = ${userId}
          AND "showInTimeline" = true
      ),
      accessible_detected_faces AS (
        SELECT
          asset_face.id AS "assetFaceId",
          asset_face."assetId"
        FROM asset_face
        INNER JOIN asset ON asset.id = asset_face."assetId"
        WHERE asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
          AND asset."deletedAt" IS NULL
          AND asset."isOffline" = false
          AND asset.visibility IN (${sql.join(peopleAssetVisibilities)})
          AND (
            asset."ownerId" = ${userId}
            OR EXISTS (
              SELECT 1
              FROM shared_space_asset
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_asset."spaceId"
              WHERE shared_space_asset."assetId" = asset.id
            )
            OR EXISTS (
              SELECT 1
              FROM shared_space_library
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_library."spaceId"
              WHERE shared_space_library."libraryId" = asset."libraryId"
            )
          )
      ),
      accessible_faces AS (
        SELECT DISTINCT
          face_identity_face."identityId",
          accessible_detected_faces."assetFaceId",
          accessible_detected_faces."assetId"
        FROM accessible_detected_faces
        INNER JOIN face_identity_face ON face_identity_face."assetFaceId" = accessible_detected_faces."assetFaceId"
      ),
      identity_counts AS (
        SELECT
          accessible_faces."identityId",
          COUNT(DISTINCT accessible_faces."assetId") AS "visibleAssetCount"
        FROM accessible_faces
        GROUP BY accessible_faces."identityId"
      ),
      accessible_profiles AS (
        SELECT person."identityId", person."isHidden", person.name
        FROM person
        WHERE person."ownerId" = ${userId}
          AND person."identityId" IS NOT NULL
          AND EXISTS (SELECT 1 FROM accessible_faces WHERE accessible_faces."identityId" = person."identityId")
        UNION ALL
        SELECT
          shared_space_person."identityId",
          shared_space_person."isHidden",
          COALESCE(NULLIF(shared_space_person_alias.alias, ''), shared_space_person.name, '') AS name
        FROM shared_space_person
        INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_person."spaceId"
        LEFT JOIN shared_space_person_alias
          ON shared_space_person_alias."personId" = shared_space_person.id
          AND shared_space_person_alias."userId" = ${userId}
        WHERE shared_space_person."identityId" IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM shared_space_person_face
            INNER JOIN asset_face AS profile_face
              ON profile_face.id = shared_space_person_face."assetFaceId"
            WHERE shared_space_person_face."personId" = shared_space_person.id
              AND profile_face."deletedAt" IS NULL
              AND profile_face."isVisible" = true
          )
          AND EXISTS (
            SELECT 1 FROM accessible_faces WHERE accessible_faces."identityId" = shared_space_person."identityId"
          )
      ),
      identity_visibility AS (
        SELECT
          "identityId",
          bool_or("isHidden" = false) AS "hasVisibleProfile",
          bool_or("isHidden" = true) AS "hasHiddenProfile",
          bool_or(NULLIF(BTRIM(name), '') IS NOT NULL) AS "hasNamedProfile",
          bool_or("isHidden" = false AND NULLIF(BTRIM(name), '') IS NOT NULL) AS "hasNamedVisibleProfile"
        FROM accessible_profiles
        GROUP BY "identityId"
      ),
      eligible_identities AS (
        SELECT
          identity_visibility."identityId",
          identity_visibility."hasVisibleProfile",
          identity_visibility."hasHiddenProfile",
          identity_visibility."hasNamedVisibleProfile"
        FROM identity_visibility
        INNER JOIN identity_counts ON identity_counts."identityId" = identity_visibility."identityId"
        WHERE identity_visibility."hasNamedProfile" = true
          OR identity_counts."visibleAssetCount" >= ${minimumFaceCount}
      ),
      face_classification AS (
        SELECT
          accessible_detected_faces."assetFaceId",
          bool_or(COALESCE(eligible_identities."hasVisibleProfile", false)) AS "isAssignedVisible",
          bool_or(COALESCE(eligible_identities."hasHiddenProfile", false)) AS "isAssignedHidden"
        FROM accessible_detected_faces
        LEFT JOIN accessible_faces ON accessible_faces."assetFaceId" = accessible_detected_faces."assetFaceId"
        LEFT JOIN eligible_identities ON eligible_identities."identityId" = accessible_faces."identityId"
        GROUP BY accessible_detected_faces."assetFaceId"
      )
      SELECT
        COUNT(DISTINCT "assetFaceId")::int AS "detectedFaceCount",
        COUNT(DISTINCT "assetFaceId") FILTER (WHERE "isAssignedVisible" = true)::int AS "assignedVisibleFaceCount",
        (SELECT COUNT(*)::int FROM eligible_identities WHERE "hasNamedVisibleProfile" = true) AS "namedVisiblePersonCount",
        COUNT(DISTINCT "assetFaceId") FILTER (
          WHERE "isAssignedVisible" = false AND "isAssignedHidden" = true
        )::int AS "assignedHiddenFaceCount",
        COUNT(DISTINCT "assetFaceId") FILTER (
          WHERE "isAssignedVisible" = false AND "isAssignedHidden" = false
        )::int AS "unassignedFaceCount"
      FROM face_classification
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

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async getAccessiblePersonStatistics(userId: string, identityId: string): Promise<PersonStatistics> {
    const result = await sql<PersonStatistics>`
      WITH timeline_spaces AS (
        SELECT "spaceId"
        FROM shared_space_member
        WHERE "userId" = ${userId}
          AND "showInTimeline" = true
      ),
      selected_faces AS (
        SELECT DISTINCT
          asset_face.id AS "faceId",
          asset_face."assetId"
        FROM face_identity_face
        INNER JOIN asset_face ON asset_face.id = face_identity_face."assetFaceId"
        INNER JOIN asset ON asset.id = asset_face."assetId"
        WHERE face_identity_face."identityId" = ${identityId}
          AND asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
          AND asset."deletedAt" IS NULL
          AND asset."isOffline" = false
          AND asset.visibility = ${AssetVisibility.Timeline}
          AND (
            asset."ownerId" = ${userId}
            OR EXISTS (
              SELECT 1
              FROM shared_space_asset
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_asset."spaceId"
              WHERE shared_space_asset."assetId" = asset.id
            )
            OR EXISTS (
              SELECT 1
              FROM shared_space_library
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_library."spaceId"
              WHERE shared_space_library."libraryId" = asset."libraryId"
            )
          )
      )
      SELECT
        COUNT(DISTINCT "assetId")::int AS assets,
        COUNT(DISTINCT "faceId")::int AS faces
      FROM selected_faces
    `.execute(this.db);

    const row = result.rows[0];
    return {
      assets: Number(row?.assets ?? 0),
      faces: Number(row?.faces ?? 0),
    };
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async getAccessibleProfileIdentityId(userId: string, profileId: string): Promise<string | undefined> {
    const result = await sql<{ identityId: string }>`
      SELECT shared_space_person."identityId"
      FROM shared_space_person
      INNER JOIN shared_space_member
        ON shared_space_member."spaceId" = shared_space_person."spaceId"
        AND shared_space_member."userId" = ${userId}
        AND shared_space_member."showInTimeline" = true
      WHERE shared_space_person.id = ${profileId}
        AND shared_space_person."identityId" IS NOT NULL
        AND shared_space_person."isHidden" = false
        AND EXISTS (
          SELECT 1
          FROM shared_space_person_face
          INNER JOIN asset_face AS profile_face
            ON profile_face.id = shared_space_person_face."assetFaceId"
          WHERE shared_space_person_face."personId" = shared_space_person.id
            AND profile_face."deletedAt" IS NULL
            AND profile_face."isVisible" = true
        )
      LIMIT 1
    `.execute(this.db);

    return result.rows[0]?.identityId ?? undefined;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async getAccessiblePersonByProfileId(userId: string, profileId: string): Promise<PersonResponseDto | undefined> {
    const result = await sql<{ identityId: string }>`
      SELECT shared_space_person."identityId"
      FROM shared_space_person
      INNER JOIN shared_space_member
        ON shared_space_member."spaceId" = shared_space_person."spaceId"
        AND shared_space_member."userId" = ${userId}
        AND shared_space_member."showInTimeline" = true
      WHERE shared_space_person.id = ${profileId}
        AND shared_space_person."identityId" IS NOT NULL
        AND shared_space_person."isHidden" = false
        AND EXISTS (
          SELECT 1
          FROM shared_space_person_face
          INNER JOIN asset_face AS profile_face
            ON profile_face.id = shared_space_person_face."assetFaceId"
          WHERE shared_space_person_face."personId" = shared_space_person.id
            AND profile_face."deletedAt" IS NULL
            AND profile_face."isVisible" = true
        )
      LIMIT 1
    `.execute(this.db);

    const identityId = result.rows[0]?.identityId;
    if (!identityId) {
      return;
    }

    const people = await this.hydrateAccessiblePeople({ userId, identityIds: [identityId], withHidden: false });
    return people[0];
  }

  async resolveRepairRefs(actorUserId: string, dto: MergeScopedPeopleDto): Promise<RepairRefsResolution> {
    const refs = [dto.target, ...dto.sources];
    const profiles: RepairProfile[] = [];

    for (const ref of refs) {
      const profile = await this.resolveRepairProfile(actorUserId, ref);
      if (!profile) {
        return { accessible: false, reason: 'not-found-or-no-access' };
      }
      profiles.push(profile);
    }

    const target = profiles[0];
    if (profiles.some((profile) => profile.identityType !== target.identityType)) {
      return { accessible: false, reason: 'incompatible-type' };
    }

    const sourceIdentityIds = [
      ...new Set(
        profiles
          .slice(1)
          .map((profile) => profile.identityId)
          .filter((id) => id !== target.identityId),
      ),
    ];
    const identityIds = [...new Set([target.identityId, ...sourceIdentityIds])];
    const [allAttachedProfilesRepairable, hasScopedProfileConflict] = await Promise.all([
      this.areAttachedProfilesRepairable(actorUserId, identityIds),
      this.hasRepairProfileConflict(target.identityId, sourceIdentityIds),
    ]);

    return {
      accessible: true,
      targetIdentityId: target.identityId,
      sourceIdentityIds,
      type: target.identityType,
      allAttachedProfilesRepairable,
      hasScopedProfileConflict,
    };
  }

  async resolveDetachRef(actorUserId: string, profileRef: ScopedPersonProfileRefDto): Promise<DetachRefResolution> {
    const profile = await this.resolveRepairProfile(actorUserId, profileRef);
    if (!profile) {
      return { accessible: false, reason: 'not-found-or-no-access' };
    }

    return {
      accessible: true,
      identityId: profile.identityId,
      type: profile.identityType,
      allBackingFacesRepairable: await this.areProfileBackingFacesRepairable(actorUserId, profileRef),
    };
  }

  async detachScopedProfile(profileRef: ScopedPersonProfileRefDto): Promise<string> {
    return this.db.transaction().execute(async (trx) => {
      const profile = await this.getProfileForDetach(profileRef, trx);
      const identity = await trx
        .insertInto('face_identity')
        .values({
          type: profile.identityType,
          representativeFaceId: profile.representativeFaceId,
        } satisfies Insertable<FaceIdentityTable>)
        .returningAll()
        .executeTakeFirstOrThrow();

      await (
        profileRef.type === 'person'
          ? trx.updateTable('person').set({ identityId: identity.id }).where('id', '=', profileRef.id)
          : trx
              .updateTable('shared_space_person')
              .set({ identityId: identity.id })
              .where('id', '=', profileRef.id)
              .where('spaceId', '=', profileRef.spaceId!)
      ).execute();

      const faceIds = await this.getScopedProfileFaceIds(profileRef, trx);
      if (faceIds.length > 0) {
        await trx
          .updateTable('face_identity_face')
          .set({ identityId: identity.id, source: 'manual' })
          .where('assetFaceId', 'in', faceIds)
          .execute();

        if (profile.representativeFaceId && faceIds.includes(profile.representativeFaceId)) {
          const replacement = await trx
            .selectFrom('face_identity_face')
            .select('assetFaceId')
            .where('identityId', '=', profile.identityId)
            .orderBy('updatedAt', 'desc')
            .executeTakeFirst();

          await trx
            .updateTable('face_identity')
            .set({ representativeFaceId: replacement?.assetFaceId ?? null })
            .where('id', '=', profile.identityId)
            .execute();
        }
      }

      return identity.id;
    });
  }

  private isRepairRole(role: string | null | undefined): boolean {
    return role === SharedSpaceRole.Owner || role === SharedSpaceRole.Editor;
  }

  private async resolveRepairProfile(
    actorUserId: string,
    ref: ScopedPersonProfileRefDto,
  ): Promise<RepairProfile | null> {
    if (ref.type === 'person') {
      const row = await this.db
        .selectFrom('person')
        .innerJoin('face_identity', 'face_identity.id', 'person.identityId')
        .select([
          'person.id',
          'person.identityId',
          'person.faceAssetId as representativeFaceId',
          'face_identity.type as identityType',
        ])
        .where('person.id', '=', ref.id)
        .where('person.ownerId', '=', actorUserId)
        .executeTakeFirst();

      return row?.identityId
        ? {
            type: 'person',
            id: row.id,
            spaceId: null,
            identityId: row.identityId,
            identityType: row.identityType,
            representativeFaceId: row.representativeFaceId,
          }
        : null;
    }

    if (!ref.spaceId) {
      return null;
    }

    const row = await this.db
      .selectFrom('shared_space_person')
      .innerJoin('face_identity', 'face_identity.id', 'shared_space_person.identityId')
      .innerJoin('shared_space_member', (join) =>
        join
          .onRef('shared_space_member.spaceId', '=', 'shared_space_person.spaceId')
          .on('shared_space_member.userId', '=', actorUserId),
      )
      .select([
        'shared_space_person.id',
        'shared_space_person.spaceId',
        'shared_space_person.identityId',
        'shared_space_person.representativeFaceId',
        'shared_space_member.role',
        'face_identity.type as identityType',
      ])
      .where('shared_space_person.id', '=', ref.id)
      .where('shared_space_person.spaceId', '=', ref.spaceId)
      .executeTakeFirst();

    return row?.identityId && this.isRepairRole(row.role)
      ? {
          type: 'space-person',
          id: row.id,
          spaceId: row.spaceId,
          identityId: row.identityId,
          identityType: row.identityType,
          representativeFaceId: row.representativeFaceId,
        }
      : null;
  }

  private async areAttachedProfilesRepairable(actorUserId: string, identityIds: string[]): Promise<boolean> {
    if (identityIds.length === 0) {
      return false;
    }

    const inaccessiblePersonal = await this.db
      .selectFrom('person')
      .select('id')
      .where('identityId', 'in', identityIds)
      .where('ownerId', '!=', actorUserId)
      .limit(1)
      .executeTakeFirst();
    if (inaccessiblePersonal) {
      return false;
    }

    const spaceRows = await this.db
      .selectFrom('shared_space_person')
      .leftJoin('shared_space_member', (join) =>
        join
          .onRef('shared_space_member.spaceId', '=', 'shared_space_person.spaceId')
          .on('shared_space_member.userId', '=', actorUserId),
      )
      .select(['shared_space_person.id', 'shared_space_member.role'])
      .where('shared_space_person.identityId', 'in', identityIds)
      .execute();

    return spaceRows.every((row) => this.isRepairRole(row.role));
  }

  private async hasRepairProfileConflict(targetIdentityId: string, sourceIdentityIds: string[]): Promise<boolean> {
    if (sourceIdentityIds.length === 0) {
      return false;
    }

    const personalConflict = await this.db
      .selectFrom('person as source_person')
      .innerJoin('person as target_person', (join) =>
        join
          .onRef('target_person.ownerId', '=', 'source_person.ownerId')
          .on('target_person.identityId', '=', targetIdentityId),
      )
      .select('source_person.id')
      .where('source_person.identityId', 'in', sourceIdentityIds)
      .limit(1)
      .executeTakeFirst();
    if (personalConflict) {
      return true;
    }

    const spaceConflict = await this.db
      .selectFrom('shared_space_person as source_person')
      .innerJoin('shared_space_person as target_person', (join) =>
        join
          .onRef('target_person.spaceId', '=', 'source_person.spaceId')
          .on('target_person.identityId', '=', targetIdentityId),
      )
      .select('source_person.id')
      .where('source_person.identityId', 'in', sourceIdentityIds)
      .limit(1)
      .executeTakeFirst();

    return !!spaceConflict;
  }

  private async getProfileForDetach(
    profileRef: ScopedPersonProfileRefDto,
    db: Kysely<DB> = this.db,
  ): Promise<RepairProfile> {
    if (profileRef.type === 'person') {
      const row = await db
        .selectFrom('person')
        .innerJoin('face_identity', 'face_identity.id', 'person.identityId')
        .select([
          'person.id',
          'person.identityId',
          'person.faceAssetId as representativeFaceId',
          'face_identity.type as identityType',
        ])
        .where('person.id', '=', profileRef.id)
        .executeTakeFirstOrThrow();

      return {
        type: 'person',
        id: row.id,
        spaceId: null,
        identityId: row.identityId!,
        identityType: row.identityType,
        representativeFaceId: row.representativeFaceId,
      };
    }

    const row = await db
      .selectFrom('shared_space_person')
      .innerJoin('face_identity', 'face_identity.id', 'shared_space_person.identityId')
      .select([
        'shared_space_person.id',
        'shared_space_person.spaceId',
        'shared_space_person.identityId',
        'shared_space_person.representativeFaceId',
        'face_identity.type as identityType',
      ])
      .where('shared_space_person.id', '=', profileRef.id)
      .where('shared_space_person.spaceId', '=', profileRef.spaceId!)
      .executeTakeFirstOrThrow();

    return {
      type: 'space-person',
      id: row.id,
      spaceId: row.spaceId,
      identityId: row.identityId!,
      identityType: row.identityType,
      representativeFaceId: row.representativeFaceId,
    };
  }

  private async getScopedProfileFaceIds(profileRef: ScopedPersonProfileRefDto, db: Kysely<DB> = this.db) {
    if (profileRef.type === 'person') {
      const rows = await db.selectFrom('asset_face').select('id').where('personId', '=', profileRef.id).execute();
      return rows.map((row) => row.id);
    }

    const rows = await db
      .selectFrom('shared_space_person_face')
      .select('assetFaceId')
      .where('personId', '=', profileRef.id)
      .execute();
    return rows.map((row) => row.assetFaceId);
  }

  private async areProfileBackingFacesRepairable(
    actorUserId: string,
    profileRef: ScopedPersonProfileRefDto,
  ): Promise<boolean> {
    const faceIds = await this.getScopedProfileFaceIds(profileRef);
    if (faceIds.length === 0) {
      return true;
    }

    const inaccessiblePersonal = await this.db
      .selectFrom('asset_face')
      .innerJoin('person', 'person.id', 'asset_face.personId')
      .select('asset_face.id')
      .where('asset_face.id', 'in', faceIds)
      .$if(profileRef.type === 'person', (qb) => qb.where('person.id', '!=', profileRef.id))
      .where('person.ownerId', '!=', actorUserId)
      .limit(1)
      .executeTakeFirst();
    if (inaccessiblePersonal) {
      return false;
    }

    const spaceRows = await this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('shared_space_person', 'shared_space_person.id', 'shared_space_person_face.personId')
      .leftJoin('shared_space_member', (join) =>
        join
          .onRef('shared_space_member.spaceId', '=', 'shared_space_person.spaceId')
          .on('shared_space_member.userId', '=', actorUserId),
      )
      .select(['shared_space_person.id', 'shared_space_member.role'])
      .where('shared_space_person_face.assetFaceId', 'in', faceIds)
      .$if(profileRef.type === 'space-person', (qb) => qb.where('shared_space_person.id', '!=', profileRef.id))
      .execute();

    return spaceRows.every((row) => this.isRepairRole(row.role));
  }

  @GenerateSql({
    params: [{ userId: DummyValue.UUID, withHidden: true, limit: 51, offset: 0, minimumFaceCount: 3 }],
  })
  async getAccessiblePeopleIdentityPage(input: {
    userId: string;
    withHidden: boolean;
    limit: number;
    offset: number;
    minimumFaceCount: number;
    searchName?: string;
  }): Promise<AccessiblePeopleIdentityPageRow[]> {
    const searchName = input.searchName ?? '';
    const result = await sql<AccessiblePeopleIdentityPageRow>`
      WITH timeline_spaces AS (
        SELECT "spaceId"
        FROM shared_space_member
        WHERE "userId" = ${input.userId}
          AND "showInTimeline" = true
      ),
      accessible_faces AS (
        SELECT
          face_identity_face."identityId",
          asset_face."assetId"
        FROM face_identity_face
        INNER JOIN asset_face ON asset_face.id = face_identity_face."assetFaceId"
        INNER JOIN asset ON asset.id = asset_face."assetId"
        WHERE asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
          AND asset."deletedAt" IS NULL
          AND asset."isOffline" = false
          AND asset.visibility = ${AssetVisibility.Timeline}
          AND (
            asset."ownerId" = ${input.userId}
            OR EXISTS (
              SELECT 1
              FROM shared_space_asset
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_asset."spaceId"
              WHERE shared_space_asset."assetId" = asset.id
            )
            OR EXISTS (
              SELECT 1
              FROM shared_space_library
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_library."spaceId"
              WHERE shared_space_library."libraryId" = asset."libraryId"
            )
          )
      ),
      accessible_profiles AS (
        SELECT
          person."identityId",
          person.name,
          person."isHidden",
          person."isFavorite",
          person."updatedAt",
          person.id AS "profileId",
          0 AS "profileRank"
        FROM person
        WHERE person."ownerId" = ${input.userId}
          AND person."identityId" IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM accessible_faces WHERE accessible_faces."identityId" = person."identityId"
          )
        UNION ALL
        SELECT
          shared_space_person."identityId",
          COALESCE(NULLIF(shared_space_person_alias.alias, ''), shared_space_person.name, '') AS name,
          shared_space_person."isHidden",
          NULL::boolean AS "isFavorite",
          shared_space_person."updatedAt",
          shared_space_person.id AS "profileId",
          CASE WHEN NULLIF(shared_space_person_alias.alias, '') IS NULL THEN 2 ELSE 1 END AS "profileRank"
        FROM shared_space_person
        INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_person."spaceId"
        LEFT JOIN shared_space_person_alias
          ON shared_space_person_alias."personId" = shared_space_person.id
          AND shared_space_person_alias."userId" = ${input.userId}
        WHERE shared_space_person."identityId" IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM shared_space_person_face
            INNER JOIN asset_face AS profile_face
              ON profile_face.id = shared_space_person_face."assetFaceId"
            WHERE shared_space_person_face."personId" = shared_space_person.id
              AND profile_face."deletedAt" IS NULL
              AND profile_face."isVisible" = true
          )
          AND EXISTS (
            SELECT 1 FROM accessible_faces WHERE accessible_faces."identityId" = shared_space_person."identityId"
          )
      ),
      eligible_profiles AS (
        SELECT *
        FROM accessible_profiles
        WHERE (${input.withHidden}::boolean OR "isHidden" = false)
          AND (${searchName} = '' OR name ILIKE ${`%${searchName}%`})
      ),
      identity_counts AS (
        SELECT
          accessible_faces."identityId",
          COUNT(DISTINCT accessible_faces."assetId") AS "visibleAssetCount"
        FROM accessible_faces
        WHERE EXISTS (
          SELECT 1 FROM eligible_profiles WHERE eligible_profiles."identityId" = accessible_faces."identityId"
        )
        GROUP BY accessible_faces."identityId"
      ),
      best_profiles AS (
        SELECT DISTINCT ON ("identityId")
          "identityId",
          name
        FROM eligible_profiles
        ORDER BY
          "identityId",
          NULLIF(BTRIM(name), '') IS NULL,
          "profileRank",
          lower(NULLIF(BTRIM(name), '')),
          "updatedAt" DESC,
          "profileId"
      ),
      identity_favorites AS (
        SELECT
          "identityId",
          bool_or(COALESCE("isFavorite", false)) AS "isFavorite"
        FROM eligible_profiles
        GROUP BY "identityId"
      )
      SELECT
        identity_counts."identityId",
        identity_counts."visibleAssetCount"
      FROM identity_counts
      INNER JOIN best_profiles ON best_profiles."identityId" = identity_counts."identityId"
      INNER JOIN identity_favorites ON identity_favorites."identityId" = identity_counts."identityId"
      WHERE NULLIF(BTRIM(best_profiles.name), '') IS NOT NULL
        OR identity_counts."visibleAssetCount" >= ${input.minimumFaceCount}
      ORDER BY
        COALESCE(identity_favorites."isFavorite", false) DESC,
        NULLIF(BTRIM(best_profiles.name), '') IS NULL,
        lower(NULLIF(BTRIM(best_profiles.name), '')) ASC NULLS LAST,
        CASE
          WHEN NULLIF(BTRIM(best_profiles.name), '') IS NULL THEN identity_counts."visibleAssetCount"
        END DESC NULLS LAST,
        identity_counts."identityId"
      LIMIT ${input.limit}
      OFFSET ${input.offset}
    `.execute(this.db);

    return result.rows;
  }

  async getAccessiblePeopleCounts(
    userId: string,
    minimumFaceCount: number,
  ): Promise<{ total: number; hidden: number }> {
    const result = await sql<AccessiblePeopleCountRow>`
      WITH timeline_spaces AS (
        SELECT "spaceId"
        FROM shared_space_member
        WHERE "userId" = ${userId}
          AND "showInTimeline" = true
      ),
      accessible_faces AS (
        SELECT
          face_identity_face."identityId",
          asset_face."assetId"
        FROM face_identity_face
        INNER JOIN asset_face ON asset_face.id = face_identity_face."assetFaceId"
        INNER JOIN asset ON asset.id = asset_face."assetId"
        WHERE asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
          AND asset."deletedAt" IS NULL
          AND asset."isOffline" = false
          AND asset.visibility = ${AssetVisibility.Timeline}
          AND (
            asset."ownerId" = ${userId}
            OR EXISTS (
              SELECT 1
              FROM shared_space_asset
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_asset."spaceId"
              WHERE shared_space_asset."assetId" = asset.id
            )
            OR EXISTS (
              SELECT 1
              FROM shared_space_library
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_library."spaceId"
              WHERE shared_space_library."libraryId" = asset."libraryId"
            )
          )
      ),
      identity_counts AS (
        SELECT
          accessible_faces."identityId",
          COUNT(DISTINCT accessible_faces."assetId") AS "visibleAssetCount"
        FROM accessible_faces
        GROUP BY accessible_faces."identityId"
      ),
      accessible_profiles AS (
        SELECT person."identityId", person."isHidden", person.name
        FROM person
        WHERE person."ownerId" = ${userId}
          AND person."identityId" IS NOT NULL
          AND EXISTS (SELECT 1 FROM accessible_faces WHERE accessible_faces."identityId" = person."identityId")
        UNION ALL
        SELECT
          shared_space_person."identityId",
          shared_space_person."isHidden",
          COALESCE(NULLIF(shared_space_person_alias.alias, ''), shared_space_person.name, '') AS name
        FROM shared_space_person
        INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_person."spaceId"
        LEFT JOIN shared_space_person_alias
          ON shared_space_person_alias."personId" = shared_space_person.id
          AND shared_space_person_alias."userId" = ${userId}
        WHERE shared_space_person."identityId" IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM shared_space_person_face
            INNER JOIN asset_face AS profile_face
              ON profile_face.id = shared_space_person_face."assetFaceId"
            WHERE shared_space_person_face."personId" = shared_space_person.id
              AND profile_face."deletedAt" IS NULL
              AND profile_face."isVisible" = true
          )
          AND EXISTS (
            SELECT 1 FROM accessible_faces WHERE accessible_faces."identityId" = shared_space_person."identityId"
          )
      ),
      identity_visibility AS (
        SELECT
          "identityId",
          bool_or("isHidden" = false) AS "hasVisibleProfile",
          bool_or(NULLIF(name, '') IS NOT NULL) AS "hasNamedProfile"
        FROM accessible_profiles
        GROUP BY "identityId"
      )
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE "hasVisibleProfile" = false) AS hidden
      FROM identity_visibility
      INNER JOIN identity_counts ON identity_counts."identityId" = identity_visibility."identityId"
      WHERE identity_visibility."hasNamedProfile" = true
        OR identity_counts."visibleAssetCount" >= ${minimumFaceCount}
    `.execute(this.db);

    const row = result.rows[0];
    return { total: Number(row?.total ?? 0), hidden: Number(row?.hidden ?? 0) };
  }

  @GenerateSql({
    params: [{ userId: DummyValue.UUID, identityIds: [DummyValue.UUID], withHidden: true }],
  })
  async hydrateAccessiblePeople(input: {
    userId: string;
    identityIds: string[];
    withHidden: boolean;
  }): Promise<PersonResponseDto[]> {
    if (input.identityIds.length === 0) {
      return [];
    }

    const identityIds = sql`array[${sql.join(input.identityIds)}]::uuid[]`;
    const result = await sql<HydratedAccessiblePersonRow>`
      WITH requested_identities AS (
        SELECT *
        FROM unnest(${identityIds}) WITH ORDINALITY AS requested("identityId", ord)
      ),
      timeline_spaces AS (
        SELECT "spaceId"
        FROM shared_space_member
        WHERE "userId" = ${input.userId}
          AND "showInTimeline" = true
      ),
      accessible_faces AS (
        SELECT
          face_identity_face."identityId",
          asset_face."assetId"
        FROM face_identity_face
        INNER JOIN requested_identities ON requested_identities."identityId" = face_identity_face."identityId"
        INNER JOIN asset_face ON asset_face.id = face_identity_face."assetFaceId"
        INNER JOIN asset ON asset.id = asset_face."assetId"
        WHERE asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
          AND asset."deletedAt" IS NULL
          AND asset."isOffline" = false
          AND asset.visibility = ${AssetVisibility.Timeline}
          AND (
            asset."ownerId" = ${input.userId}
            OR EXISTS (
              SELECT 1
              FROM shared_space_asset
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_asset."spaceId"
              WHERE shared_space_asset."assetId" = asset.id
            )
            OR EXISTS (
              SELECT 1
              FROM shared_space_library
              INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_library."spaceId"
              WHERE shared_space_library."libraryId" = asset."libraryId"
            )
          )
      ),
      asset_counts AS (
        SELECT
          "identityId",
          COUNT(DISTINCT "assetId") AS "numberOfAssets"
        FROM accessible_faces
        GROUP BY "identityId"
      ),
      profiles AS (
        SELECT
          'user-person'::text AS "profileType",
          person.id AS "profileId",
          NULL::uuid AS "spaceId",
          person."identityId",
          person.name,
          person."birthDate",
          person."thumbnailPath",
          person."isHidden",
          person."isFavorite",
          person.color,
          person."updatedAt",
          person.type,
          person.species,
          0 AS "profileRank"
        FROM person
        INNER JOIN requested_identities ON requested_identities."identityId" = person."identityId"
        WHERE person."ownerId" = ${input.userId}
          AND (${input.withHidden}::boolean OR person."isHidden" = false)
        UNION ALL
        SELECT
          'space-person'::text AS "profileType",
          shared_space_person.id AS "profileId",
          shared_space_person."spaceId",
          shared_space_person."identityId",
          COALESCE(NULLIF(shared_space_person_alias.alias, ''), shared_space_person.name, '') AS name,
          shared_space_person."birthDate",
          ''::text AS "thumbnailPath",
          shared_space_person."isHidden",
          NULL::boolean AS "isFavorite",
          NULL::text AS color,
          shared_space_person."updatedAt",
          shared_space_person.type,
          NULL::text AS species,
          CASE WHEN NULLIF(shared_space_person_alias.alias, '') IS NULL THEN 2 ELSE 1 END AS "profileRank"
        FROM shared_space_person
        INNER JOIN requested_identities ON requested_identities."identityId" = shared_space_person."identityId"
        INNER JOIN timeline_spaces ON timeline_spaces."spaceId" = shared_space_person."spaceId"
        LEFT JOIN shared_space_person_alias
          ON shared_space_person_alias."personId" = shared_space_person.id
          AND shared_space_person_alias."userId" = ${input.userId}
        WHERE (${input.withHidden}::boolean OR shared_space_person."isHidden" = false)
          AND EXISTS (
            SELECT 1
            FROM shared_space_person_face
            INNER JOIN asset_face AS profile_face
              ON profile_face.id = shared_space_person_face."assetFaceId"
            WHERE shared_space_person_face."personId" = shared_space_person.id
              AND profile_face."deletedAt" IS NULL
              AND profile_face."isVisible" = true
          )
      ),
      ranked_profiles AS (
        SELECT
          profiles.*,
          row_number() OVER (
            PARTITION BY profiles."identityId"
            ORDER BY
              NULLIF(profiles.name, '') IS NULL,
              profiles."profileRank",
              lower(profiles.name),
              profiles."updatedAt" DESC,
              profiles."profileId"
          ) AS display_rn,
          row_number() OVER (
            PARTITION BY profiles."identityId"
            ORDER BY
              CASE
                WHEN profiles."profileType" = 'user-person' THEN 0
                ELSE profiles."profileRank"
              END,
              NULLIF(profiles.name, '') IS NULL,
              lower(profiles.name),
              profiles."updatedAt" DESC,
              profiles."profileId"
          ) AS primary_rn
        FROM profiles
        WHERE EXISTS (SELECT 1 FROM accessible_faces WHERE accessible_faces."identityId" = profiles."identityId")
      )
      SELECT
        primary_profiles."profileType",
        primary_profiles."profileId",
        primary_profiles."spaceId",
        COALESCE(NULLIF(display_profiles.name, ''), primary_profiles.name, '') AS name,
        COALESCE(display_profiles."birthDate", primary_profiles."birthDate") AS "birthDate",
        primary_profiles."thumbnailPath",
        primary_profiles."isHidden",
        primary_profiles."isFavorite",
        primary_profiles.color,
        primary_profiles."updatedAt",
        primary_profiles.type,
        primary_profiles.species,
        asset_counts."numberOfAssets"
      FROM requested_identities
      INNER JOIN ranked_profiles AS primary_profiles
        ON primary_profiles."identityId" = requested_identities."identityId"
        AND primary_profiles.primary_rn = 1
      INNER JOIN ranked_profiles AS display_profiles
        ON display_profiles."identityId" = requested_identities."identityId"
        AND display_profiles.display_rn = 1
      LEFT JOIN asset_counts ON asset_counts."identityId" = requested_identities."identityId"
      ORDER BY requested_identities.ord
    `.execute(this.db);

    return result.rows.map((row) => this.mapAccessiblePerson(row));
  }

  private mapAccessiblePerson(row: HydratedAccessiblePersonRow): PersonResponseDto {
    const primaryProfile =
      row.profileType === 'space-person'
        ? { type: row.profileType, id: row.profileId, spaceId: row.spaceId ?? undefined }
        : { type: row.profileType, id: row.profileId };

    return {
      id: row.profileId,
      name: row.name ?? '',
      birthDate: asBirthDateString(row.birthDate),
      thumbnailPath: row.profileType === 'user-person' ? (row.thumbnailPath ?? '') : '',
      isHidden: row.isHidden,
      isFavorite: row.isFavorite ?? undefined,
      color: row.color ?? undefined,
      updatedAt: asDateString(row.updatedAt) ?? undefined,
      primaryProfile,
      filterId: `${row.profileType === 'space-person' ? 'space-person' : 'person'}:${row.profileId}`,
      numberOfAssets: Number(row.numberOfAssets ?? 0),
      type: row.type ?? 'person',
      species: row.species,
    };
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async ensurePersonIdentity(personId: string): Promise<FaceIdentity> {
    return this.db.transaction().execute(async (trx) => {
      const person = await trx
        .selectFrom('person')
        .select(['id', 'identityId', 'type', 'faceAssetId'])
        .where('id', '=', personId)
        .executeTakeFirstOrThrow();

      if (person.identityId) {
        return trx
          .selectFrom('face_identity')
          .selectAll()
          .where('id', '=', person.identityId)
          .executeTakeFirstOrThrow();
      }

      const identity = await trx
        .insertInto('face_identity')
        .values({
          type: person.type,
          representativeFaceId: person.faceAssetId,
        } satisfies Insertable<FaceIdentityTable>)
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx.updateTable('person').set({ identityId: identity.id }).where('id', '=', person.id).execute();

      return identity;
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async ensureSpacePersonIdentity(spacePersonId: string): Promise<FaceIdentity> {
    return this.db.transaction().execute(async (trx) => {
      const person = await trx
        .selectFrom('shared_space_person')
        .select(['id', 'identityId', 'type', 'representativeFaceId'])
        .where('id', '=', spacePersonId)
        .executeTakeFirstOrThrow();

      if (person.identityId) {
        return trx
          .selectFrom('face_identity')
          .selectAll()
          .where('id', '=', person.identityId)
          .executeTakeFirstOrThrow();
      }

      const identity = await trx
        .insertInto('face_identity')
        .values({
          type: person.type,
          representativeFaceId: person.representativeFaceId,
        } satisfies Insertable<FaceIdentityTable>)
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .updateTable('shared_space_person')
        .set({ identityId: identity.id })
        .where('id', '=', person.id)
        .execute();

      return identity;
    });
  }

  @GenerateSql({
    params: [{ assetFaceId: DummyValue.UUID, identityId: DummyValue.UUID, source: 'owner-person' }],
  })
  async linkFace(input: LinkFaceInput): Promise<FaceIdentityFace> {
    return this.replaceFaceIdentity(input);
  }

  @GenerateSql({
    params: [{ assetFaceId: DummyValue.UUID, identityId: DummyValue.UUID, source: 'manual' }],
  })
  async replaceFaceIdentity(input: LinkFaceInput): Promise<FaceIdentityFace> {
    return this.db
      .insertInto('face_identity_face')
      .values({
        assetFaceId: input.assetFaceId,
        identityId: input.identityId,
        source: input.source,
        confidence: input.confidence ?? null,
      })
      .onConflict((oc) =>
        oc.column('assetFaceId').doUpdateSet({
          identityId: input.identityId,
          source: input.source,
          confidence: input.confidence ?? null,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [{ personId: DummyValue.UUID, identityId: DummyValue.UUID, source: 'manual' }] })
  async linkPersonFaces(input: LinkPersonFacesInput): Promise<void> {
    await this.db
      .insertInto('face_identity_face')
      .columns(['assetFaceId', 'identityId', 'source', 'confidence'])
      .expression((eb) =>
        eb
          .selectFrom('asset_face')
          .innerJoin('asset', 'asset.id', 'asset_face.assetId')
          .leftJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
          .select((eb) => [
            'asset_face.id as assetFaceId',
            eb.val(input.identityId).as('identityId'),
            eb.val(input.source).as('source'),
            eb.val(null).as('confidence'),
          ])
          .where('asset_face.personId', '=', input.personId)
          .where('asset_face.deletedAt', 'is', null)
          .where('asset_face.isVisible', '=', true)
          .where('asset.deletedAt', 'is', null)
          .where((eb) =>
            eb.or([
              eb('face_identity_face.identityId', 'is', null),
              eb('face_identity_face.identityId', '!=', input.identityId),
            ]),
          ),
      )
      .onConflict((oc) =>
        oc.column('assetFaceId').doUpdateSet({
          identityId: input.identityId,
          source: input.source,
          confidence: null,
        }),
      )
      .execute();
  }

  @GenerateSql({ params: [{ identityId: DummyValue.UUID, assetFaceId: DummyValue.UUID }] })
  async updateRepresentativeFace(input: { identityId: string; assetFaceId: string }): Promise<void> {
    await this.db
      .updateTable('face_identity')
      .set({ representativeFaceId: input.assetFaceId })
      .where('id', '=', input.identityId)
      .execute();

    await this.replaceFaceIdentity({
      identityId: input.identityId,
      assetFaceId: input.assetFaceId,
      source: 'manual',
    });
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  async unlinkFaces(assetFaceIds: string[]): Promise<void> {
    if (assetFaceIds.length === 0) {
      return;
    }
    await this.db.deleteFrom('face_identity_face').where('assetFaceId', 'in', assetFaceIds).execute();
  }

  @GenerateSql({ params: [SourceType.MachineLearning] })
  async unlinkFacesBySourceType(sourceType: SourceType): Promise<void> {
    await this.db
      .deleteFrom('face_identity_face')
      .where('assetFaceId', 'in', this.db.selectFrom('asset_face').select('id').where('sourceType', '=', sourceType))
      .execute();
  }

  async deleteUnreferencedIdentities(): Promise<void> {
    await this.db
      .deleteFrom('face_identity')
      .where(({ not, exists, selectFrom, ref }) =>
        not(
          exists(
            selectFrom('person')
              .select(sql`1`.as('one'))
              .whereRef('person.identityId', '=', ref('face_identity.id')),
          ),
        ),
      )
      .where(({ not, exists, selectFrom, ref }) =>
        not(
          exists(
            selectFrom('shared_space_person')
              .select(sql`1`.as('one'))
              .whereRef('shared_space_person.identityId', '=', ref('face_identity.id')),
          ),
        ),
      )
      .where(({ not, exists, selectFrom, ref }) =>
        not(
          exists(
            selectFrom('face_identity_face')
              .select(sql`1`.as('one'))
              .whereRef('face_identity_face.identityId', '=', ref('face_identity.id')),
          ),
        ),
      )
      .execute();
  }

  async backfillPersonalIdentities(input: { cursor?: string; limit: number }): Promise<BackfillResult> {
    const people = await this.db
      .selectFrom('person')
      .select(['id', 'ownerId', 'identityId'])
      .$if(!!input.cursor, (qb) => qb.where('id', '>', input.cursor!))
      .orderBy('id')
      .limit(input.limit + 1)
      .execute();

    const page = people.slice(0, input.limit);
    const affectedSpaceAssets: SharedSpaceFaceMatchBackfillTarget[] = [];
    for (const person of page) {
      const faces = await this.db
        .selectFrom('asset_face')
        .innerJoin('asset', 'asset.id', 'asset_face.assetId')
        .leftJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
        .select('asset_face.id')
        .where('asset_face.personId', '=', person.id)
        .where('asset_face.deletedAt', 'is', null)
        .where('asset_face.isVisible', '=', true)
        .where('asset.deletedAt', 'is', null)
        .where('face_identity_face.assetFaceId', 'is', null)
        .execute();

      const personAssetFaceIds = faces.map((face) => face.id);
      affectedSpaceAssets.push(
        ...(await this.addPendingSharedSpaceFaceMatchBackfillTargetsForAssetFaces(personAssetFaceIds)),
      );

      const identity = await this.ensurePersonIdentity(person.id);
      for (const face of faces) {
        await this.linkFace({ assetFaceId: face.id, identityId: identity.id, source: 'backfill' });
      }

      affectedSpaceAssets.push(...(await this.repairPersonalIdentityAssignments(person)));
    }

    return {
      processed: page.length,
      nextCursor: people.length > input.limit ? page.at(-1)?.id : undefined,
      affectedSpaceAssets: this.dedupeSharedSpaceFaceMatchBackfillTargets(affectedSpaceAssets),
    };
  }

  private async repairPersonalIdentityAssignments(
    person: PersonalBackfillRow,
  ): Promise<SharedSpaceFaceMatchBackfillTarget[]> {
    const groups = await this.getPersonalBackfillIdentityGroups(person);
    const affectedAssetFaceIds = new Set<string>();

    for (const group of groups) {
      const targetPerson = await this.getPersonByIdentity(person.ownerId, group.identityId, person.id);
      if (!targetPerson) {
        continue;
      }

      const assetFaceIds = await this.getPersonalBackfillAssetFaceIdsForIdentity(person.id, group.identityId);
      if (assetFaceIds.length === 0) {
        continue;
      }

      await this.db
        .updateTable('asset_face')
        .set({ personId: targetPerson.id })
        .where('personId', '=', person.id)
        .where('id', 'in', assetFaceIds)
        .execute();

      for (const assetFaceId of assetFaceIds) {
        affectedAssetFaceIds.add(assetFaceId);
      }
    }

    return this.addPendingSharedSpaceFaceMatchBackfillTargetsForAssetFaces([...affectedAssetFaceIds]);
  }

  private getPersonalBackfillIdentityGroups(person: PersonalBackfillRow): Promise<PersonalBackfillIdentityGroup[]> {
    return this.db
      .selectFrom('asset_face')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .innerJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
      .select('face_identity_face.identityId')
      .where('asset_face.personId', '=', person.id)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true)
      .where('asset.deletedAt', 'is', null)
      .$if(!!person.identityId, (qb) => qb.where('face_identity_face.identityId', '!=', person.identityId!))
      .groupBy('face_identity_face.identityId')
      .$castTo<PersonalBackfillIdentityGroup>()
      .execute();
  }

  private async getPersonalBackfillAssetFaceIdsForIdentity(personId: string, identityId: string): Promise<string[]> {
    const rows = await this.db
      .selectFrom('asset_face')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .innerJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
      .select('asset_face.id')
      .where('asset_face.personId', '=', personId)
      .where('face_identity_face.identityId', '=', identityId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true)
      .where('asset.deletedAt', 'is', null)
      .execute();

    return rows.map((row) => row.id);
  }

  private getPersonByIdentity(ownerId: string, identityId: string, excludePersonId?: string) {
    return this.db
      .selectFrom('person')
      .select(['id'])
      .where('ownerId', '=', ownerId)
      .where('identityId', '=', identityId)
      .$if(!!excludePersonId, (qb) => qb.where('id', '!=', excludePersonId!))
      .executeTakeFirst();
  }

  async backfillSpacePersonIdentities(input: { cursor?: string; limit: number }): Promise<SpacePersonBackfillResult> {
    const people = await this.db
      .selectFrom('shared_space_person')
      .select(['id', 'spaceId', 'identityId', 'representativeFaceId', 'representativeFaceSource', 'type'])
      .$if(!!input.cursor, (qb) => qb.where('id', '>', input.cursor!))
      .orderBy('id')
      .limit(input.limit + 1)
      .execute();

    const page = people.slice(0, input.limit);
    const affectedSpaceAssets: SharedSpaceFaceMatchBackfillTarget[] = [];
    for (const person of page) {
      affectedSpaceAssets.push(...(await this.repairSpacePersonIdentityAssignments(person)));
    }

    return {
      processed: page.length,
      conflictCount: 0,
      ...(people.length > input.limit ? { nextCursor: page.at(-1)?.id } : {}),
      affectedSpaceAssets: this.dedupeSharedSpaceFaceMatchBackfillTargets(affectedSpaceAssets),
    };
  }

  private async repairSpacePersonIdentityAssignments(
    person: SpacePersonBackfillRow,
  ): Promise<SharedSpaceFaceMatchBackfillTarget[]> {
    const groups = await this.getSpacePersonBackfillIdentityGroups(person.id);
    if (groups.length === 0) {
      return [];
    }

    let currentIdentityId = person.identityId;
    const affectedPersonIds = new Set<string>([person.id]);
    const affectedSpaceAssets: SharedSpaceFaceMatchBackfillTarget[] = [];

    for (const group of groups) {
      const groupAssetFaceIds = await this.getSpacePersonBackfillAssetFaceIdsForIdentity(person.id, group.identityId);

      let targetPersonId: string | undefined;
      let didMutateSpacePerson = false;

      if (currentIdentityId === group.identityId) {
        targetPersonId = person.id;
      } else {
        const existingPerson = await this.getSpacePersonByIdentity(person.spaceId, group.identityId, person.id);
        if (existingPerson) {
          targetPersonId = existingPerson.id;
          didMutateSpacePerson = true;
        } else if (currentIdentityId) {
          const createdPerson = await this.db
            .insertInto('shared_space_person')
            .values({
              spaceId: person.spaceId,
              identityId: group.identityId,
              representativeFaceId: group.representativeFaceId,
              type: group.type,
            })
            .returning(['id'])
            .executeTakeFirstOrThrow();
          targetPersonId = createdPerson.id;
          didMutateSpacePerson = true;
        } else {
          const update: { identityId: string; type: string; representativeFaceId?: string } = {
            identityId: group.identityId,
            type: group.type,
          };
          if (person.representativeFaceSource !== 'manual' || !person.representativeFaceId) {
            update.representativeFaceId = group.representativeFaceId;
          }
          await this.db.updateTable('shared_space_person').set(update).where('id', '=', person.id).execute();
          currentIdentityId = group.identityId;
          targetPersonId = person.id;
          didMutateSpacePerson = true;
        }
      }

      affectedPersonIds.add(targetPersonId);
      if (targetPersonId !== person.id) {
        await this.moveSpacePersonFacesForIdentity({
          fromPersonId: person.id,
          toPersonId: targetPersonId,
          identityId: group.identityId,
        });
      }
      if (didMutateSpacePerson) {
        affectedSpaceAssets.push(
          ...(await this.addPendingSharedSpaceFaceMatchBackfillTargetsForAssetFaces(groupAssetFaceIds)),
        );
      }
    }

    await this.recountSpacePersons([...affectedPersonIds]);
    await this.deleteOrphanedSpacePersons([...affectedPersonIds]);

    return this.dedupeSharedSpaceFaceMatchBackfillTargets(affectedSpaceAssets);
  }

  private getSpacePersonBackfillIdentityGroups(personId: string): Promise<SpacePersonBackfillIdentityGroup[]> {
    return this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .innerJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
      .innerJoin('face_identity', 'face_identity.id', 'face_identity_face.identityId')
      .select(['face_identity_face.identityId', 'face_identity.type'])
      .select(() => [
        sql<number>`count(*)::int`.as('faceCount'),
        sql<string>`min(asset_face.id::text)::uuid`.as('representativeFaceId'),
      ])
      .where('shared_space_person_face.personId', '=', personId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true)
      .groupBy(['face_identity_face.identityId', 'face_identity.type'])
      .orderBy(sql`count(*)`, 'desc')
      .$castTo<SpacePersonBackfillIdentityGroup>()
      .execute();
  }

  private async getSpacePersonBackfillAssetFaceIdsForIdentity(personId: string, identityId: string): Promise<string[]> {
    const rows = await this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .innerJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
      .select('asset_face.id')
      .where('shared_space_person_face.personId', '=', personId)
      .where('face_identity_face.identityId', '=', identityId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true)
      .execute();

    return rows.map((row) => row.id);
  }

  private getSpacePersonByIdentity(spaceId: string, identityId: string, excludePersonId?: string) {
    return this.db
      .selectFrom('shared_space_person')
      .select(['id'])
      .where('spaceId', '=', spaceId)
      .where('identityId', '=', identityId)
      .$if(!!excludePersonId, (qb) => qb.where('id', '!=', excludePersonId!))
      .executeTakeFirst();
  }

  private async moveSpacePersonFacesForIdentity(input: {
    fromPersonId: string;
    toPersonId: string;
    identityId: string;
  }): Promise<void> {
    const identityFaceIds = this.db
      .selectFrom('shared_space_person_face')
      .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
      .innerJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
      .select('shared_space_person_face.assetFaceId')
      .where('shared_space_person_face.personId', '=', input.fromPersonId)
      .where('face_identity_face.identityId', '=', input.identityId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', '=', true);

    await this.db
      .deleteFrom('shared_space_person_face')
      .where('personId', '=', input.fromPersonId)
      .where('assetFaceId', 'in', identityFaceIds)
      .where(
        'assetFaceId',
        'in',
        this.db.selectFrom('shared_space_person_face').select('assetFaceId').where('personId', '=', input.toPersonId),
      )
      .execute();

    await this.db
      .updateTable('shared_space_person_face')
      .set({ personId: input.toPersonId })
      .where('personId', '=', input.fromPersonId)
      .where('assetFaceId', 'in', identityFaceIds)
      .execute();
  }

  private async recountSpacePersons(personIds: string[]): Promise<void> {
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

  private async deleteOrphanedSpacePersons(personIds: string[]): Promise<void> {
    if (personIds.length === 0) {
      return;
    }

    await this.db
      .deleteFrom('shared_space_person')
      .where('id', 'in', personIds)
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom('shared_space_person_face')
              .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id'),
          ),
        ),
      )
      .execute();
  }

  async mergeIdentities(input: {
    targetIdentityId: string;
    sourceIdentityIds: string[];
    source: FaceIdentityFaceSource;
  }): Promise<MergeIdentitiesResult> {
    const sourceIdentityIds = [...new Set(input.sourceIdentityIds)].filter((id) => id !== input.targetIdentityId);
    if (sourceIdentityIds.length === 0) {
      return { personalProfileConflictCount: 0, spaceProfileConflictCount: 0 };
    }

    return this.db.transaction().execute(async (trx) => {
      const identities = await trx
        .selectFrom('face_identity')
        .select(['id', 'type'])
        .where('id', 'in', [input.targetIdentityId, ...sourceIdentityIds])
        .execute();
      const targetIdentity = identities.find((identity) => identity.id === input.targetIdentityId);
      if (!targetIdentity) {
        throw new Error('Target face identity not found');
      }
      const incompatible = identities.some(
        (identity) => identity.id !== input.targetIdentityId && identity.type !== targetIdentity.type,
      );
      if (incompatible) {
        throw new Error('Cannot merge face identities with different types');
      }

      const { personalProfileConflictCount, spaceProfileConflictCount } = await this.countMergeConflicts(trx, {
        targetIdentityId: input.targetIdentityId,
        sourceIdentityIds,
      });
      if (personalProfileConflictCount > 0 || spaceProfileConflictCount > 0) {
        return {
          personalProfileConflictCount,
          spaceProfileConflictCount,
        };
      }

      await trx
        .updateTable('face_identity_face')
        .set({ identityId: input.targetIdentityId, source: input.source })
        .where('identityId', 'in', sourceIdentityIds)
        .execute();

      await trx
        .updateTable('person')
        .set({ identityId: input.targetIdentityId })
        .where('identityId', 'in', sourceIdentityIds)
        .where(({ not, exists, selectFrom, ref }) =>
          not(
            exists(
              selectFrom('person as target_person')
                .select(sql`1`.as('one'))
                .where('target_person.identityId', '=', input.targetIdentityId)
                .whereRef('target_person.ownerId', '=', ref('person.ownerId')),
            ),
          ),
        )
        .execute();

      await trx
        .updateTable('shared_space_person')
        .set({ identityId: input.targetIdentityId })
        .where('identityId', 'in', sourceIdentityIds)
        .where(({ not, exists, selectFrom, ref }) =>
          not(
            exists(
              selectFrom('shared_space_person as target_person')
                .select(sql`1`.as('one'))
                .where('target_person.identityId', '=', input.targetIdentityId)
                .whereRef('target_person.spaceId', '=', ref('shared_space_person.spaceId')),
            ),
          ),
        )
        .execute();

      const deletable = await trx
        .selectFrom('face_identity')
        .leftJoin('person', 'person.identityId', 'face_identity.id')
        .leftJoin('shared_space_person', 'shared_space_person.identityId', 'face_identity.id')
        .leftJoin('face_identity_face', 'face_identity_face.identityId', 'face_identity.id')
        .select('face_identity.id')
        .where('face_identity.id', 'in', sourceIdentityIds)
        .where('person.id', 'is', null)
        .where('shared_space_person.id', 'is', null)
        .where('face_identity_face.assetFaceId', 'is', null)
        .execute();

      const deletableIds = deletable.map((identity) => identity.id);
      if (deletableIds.length > 0) {
        await trx.deleteFrom('face_identity').where('id', 'in', deletableIds).execute();
      }

      return {
        personalProfileConflictCount,
        spaceProfileConflictCount,
      };
    });
  }

  private async countMergeConflicts(
    db: Kysely<DB> | Transaction<DB>,
    input: {
      targetIdentityId: string;
      sourceIdentityIds: string[];
    },
  ): Promise<MergeIdentitiesResult> {
    const sourceIdentityIds = [...new Set(input.sourceIdentityIds)].filter((id) => id !== input.targetIdentityId);
    if (sourceIdentityIds.length === 0) {
      return { personalProfileConflictCount: 0, spaceProfileConflictCount: 0 };
    }

    const [personalConflicts, spaceConflicts] = await Promise.all([
      db
        .selectFrom('person as source_person')
        .innerJoin('person as target_person', (join) =>
          join
            .onRef('target_person.ownerId', '=', 'source_person.ownerId')
            .on('target_person.identityId', '=', input.targetIdentityId),
        )
        .select('source_person.id')
        .where('source_person.identityId', 'in', sourceIdentityIds)
        .execute(),
      db
        .selectFrom('shared_space_person as source_person')
        .innerJoin('shared_space_person as target_person', (join) =>
          join
            .onRef('target_person.spaceId', '=', 'source_person.spaceId')
            .on('target_person.identityId', '=', input.targetIdentityId),
        )
        .select('source_person.id')
        .where('source_person.identityId', 'in', sourceIdentityIds)
        .execute(),
    ]);

    return {
      personalProfileConflictCount: personalConflicts.length,
      spaceProfileConflictCount: spaceConflicts.length,
    };
  }

  async getMergeConflicts(input: {
    targetIdentityId: string;
    sourceIdentityIds: string[];
  }): Promise<MergeIdentitiesResult> {
    return this.countMergeConflicts(this.db, input);
  }
}
