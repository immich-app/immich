import { DatabaseConnectionParams, createPostgres } from '@immich/sql-tools';
import {
  AliasedRawBuilder,
  DeduplicateJoinsPlugin,
  Expression,
  ExpressionBuilder,
  Kysely,
  KyselyConfig,
  NotNull,
  OperandValueExpression,
  ReferenceExpression,
  SafeNullComparisonPlugin,
  SelectQueryBuilder,
  Selectable,
  ShallowDehydrateObject,
  SqlBool,
  expressionBuilder,
  sql,
} from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { Notice, PostgresError } from 'postgres';
import { LockableProperty, Person, columns, lockableProperties } from 'src/database.js';
import { DummyValue, GenerateSqlQueries } from 'src/decorators.js';
import { AssetEditActionItem } from 'src/dtos/editing.dto.js';
import {
  DEFAULT_SEARCH_ORDER,
  IdsFilter,
  SearchFilterBranch,
  SearchOrder,
  StringFilter,
  StringPatternFilter,
  isAlbumConfined,
} from 'src/dtos/search.dto.js';
import {
  AssetFileType,
  AssetOrder,
  AssetOrderBy,
  AssetVisibility,
  DatabaseExtension,
  ExifOrientation,
  SearchOrderField,
} from 'src/enum.js';
import {
  AssetSearchBuilderOptions,
  AssetSearchBuilderV3Options,
  AssetSearchScope,
} from 'src/repositories/search.repository.js';
import { DB } from 'src/schema/index.js';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table.js';
import type { AudioStreamInfo, VectorExtension, VideoFormat, VideoPacketInfo, VideoStreamInfo } from 'src/types.js';
import { fromChecksum } from 'src/utils/request.js';

export const getKyselyConfig = (connection: DatabaseConnectionParams): KyselyConfig => {
  return {
    dialect: new PostgresJSDialect({
      postgres: createPostgres({
        connection,
        onNotice: (notice: Notice) => {
          if (notice['severity'] !== 'NOTICE') {
            console.warn('Postgres notice:', notice);
          }
        },
      }),
    }),
    plugins: [new SafeNullComparisonPlugin()],
    log(event) {
      if (event.level !== 'error') {
        return;
      }

      if (isAssetChecksumConstraint(event.error)) {
        return;
      }

      console.error('Query failed :', {
        durationMs: event.queryDurationMillis,
        error: event.error,
        sql: event.query.sql,
        params: event.query.parameters,
      });
    },
  };
};

const uniqueIds = (ids: string[]) => [...new Set(ids)];

export const asUuid = (id: string | Expression<string>) => sql<string>`${id}::uuid`;

export const anyUuid = (ids: string[]) => sql<string>`any(${`{${ids}}`}::uuid[])`;

export const removeUndefinedKeys = <T extends object>(update: T, template: unknown) => {
  for (const key in update) {
    if ((template as T)[key] === undefined) {
      delete update[key];
    }
  }

  return update;
};

export const ASSET_CHECKSUM_CONSTRAINT = 'UQ_assets_owner_checksum';
export const VIDEO_STREAM_SESSION_PK_CONSTRAINT = 'video_stream_session_pkey';

export const isAssetChecksumConstraint = (error: unknown) =>
  (error as PostgresError)?.constraint_name === ASSET_CHECKSUM_CONSTRAINT;

export const isVideoStreamSessionPkConstraint = (error: unknown) =>
  (error as PostgresError)?.constraint_name === VIDEO_STREAM_SESSION_PK_CONSTRAINT;

export type PrivateTagAccessOptions = {
  includePrivate?: boolean;
  privateOwnerId?: string;
  albumUserId?: string;
  albumId?: Expression<unknown>;
  albumIds?: string[];
  sharedLinkId?: string | Expression<unknown>;
};

export function withPrivateTagAccess<O>(qb: SelectQueryBuilder<DB, 'asset', O>, options: PrivateTagAccessOptions = {}) {
  return qb.where((eb) => isAssetVisible(eb.ref('asset.id'), options));
}

export function withDefaultVisibility<O>(
  qb: SelectQueryBuilder<DB, 'asset', O>,
  options: PrivateTagAccessOptions = {},
) {
  return qb
    .where('asset.visibility', 'in', [sql.lit(AssetVisibility.Archive), sql.lit(AssetVisibility.Timeline)])
    .$call((qb) => withPrivateTagAccess(qb, options));
}

export function withLockedVisibilityCompatibility<O>(qb: SelectQueryBuilder<DB, 'asset', O>, ownerId?: string) {
  if (!ownerId) {
    return qb.where((eb) => eb.lit(false));
  }

  return qb
    .where('asset.ownerId', '=', asUuid(ownerId))
    .where('asset.visibility', '!=', AssetVisibility.Hidden)
    .where((eb) =>
      eb.or([eb('asset.visibility', '=', AssetVisibility.Locked), hasLockedFolderTag(eb.ref('asset.id'))]),
    );
}

const selectExifInfo = (eb: AssetExpressionBuilder) =>
  eb.fn
    .toJson(eb.table('asset_exif'))
    .$castTo<ShallowDehydrateObject<Selectable<AssetExifTable>> | null>()
    .as('exifInfo');

// TODO come up with a better query that only selects the fields we need
export function withExif<O>(qb: SelectQueryBuilder<DB, 'asset', O>) {
  return qb.leftJoin('asset_exif', 'asset.id', 'asset_exif.assetId').select(selectExifInfo);
}

const selectReturnedExifInfo = (eb: ExpressionBuilder<DB, 'asset'>) =>
  jsonObjectFrom(eb.selectFrom('asset_exif').select(columns.exif).whereRef('asset_exif.assetId', '=', 'asset.id')).as(
    'exifInfo',
  );

export function withExifInner<O>(qb: SelectQueryBuilder<DB, 'asset', O>) {
  return qb
    .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
    .select(selectReturnedExifInfo)
    .$narrowType<{ exifInfo: NotNull }>();
}

export const dummy = sql`(select 1)`.as('dummy');

export function withAudioStream(eb: ExpressionBuilder<DB, 'asset_exif' | 'asset_audio'>) {
  return jsonObjectFrom(
    eb
      .selectFrom(dummy)
      .select(['asset_audio.index', 'asset_audio.codecName', 'asset_audio.profile', 'asset_audio.bitrate'])
      .where('asset_audio.assetId', 'is not', sql.lit(null))
      .$castTo<AudioStreamInfo | null>(),
  );
}

export function withVideoStream(eb: ExpressionBuilder<DB, 'asset_exif' | 'asset_video'>) {
  return jsonObjectFrom(
    eb
      .selectFrom(dummy)
      .select((eb) => [
        'asset_video.index',
        'asset_video.codecName',
        'asset_video.profile',
        'asset_video.level',
        'asset_video.bitrate',
        'asset_exif.exifImageWidth as width',
        'asset_exif.exifImageHeight as height',
        'asset_video.pixelFormat',
        'asset_video.frameCount',
        'asset_exif.fps as frameRate',
        'asset_video.timeBase',
        eb
          .case()
          .when('asset_exif.orientation', '=', sql.lit(ExifOrientation.Rotate90CW.toString()))
          .then(sql.lit(-90))
          .when('asset_exif.orientation', '=', sql.lit(ExifOrientation.Rotate270CW.toString()))
          .then(sql.lit(90))
          .when('asset_exif.orientation', '=', sql.lit(ExifOrientation.Rotate180.toString()))
          .then(sql.lit(180))
          .else(0)
          .end()
          .as('rotation'),
        'asset_video.colorPrimaries',
        'asset_video.colorMatrix',
        'asset_video.colorTransfer',
        'asset_video.dvProfile',
        'asset_video.dvLevel',
        'asset_video.dvBlSignalCompatibilityId',
      ])
      .where('asset_video.assetId', 'is not', sql.lit(null)),
  ).$castTo<(VideoStreamInfo & { timeBase: number }) | null>();
}

export function withVideoFormat(eb: ExpressionBuilder<DB, 'asset' | 'asset_video'>) {
  return jsonObjectFrom(
    eb
      .selectFrom(dummy)
      .select([
        'asset_video.formatName',
        'asset_video.formatLongName',
        'asset.duration',
        'asset_video.bitrate',
        'asset_video.isFragmented',
      ])
      .where('asset_video.assetId', 'is not', sql.lit(null)),
  ).$castTo<VideoFormat | null>();
}

export function withVideoPackets(eb: ExpressionBuilder<DB, 'asset' | 'asset_keyframe'>) {
  return jsonObjectFrom(
    eb
      .selectFrom(dummy)
      .where('asset_keyframe.assetId', 'is not', sql.lit(null))
      .select([
        'asset_keyframe.pts as keyframePts',
        'asset_keyframe.accDuration as keyframeAccDuration',
        'asset_keyframe.ownDuration as keyframeOwnDuration',
        'asset_keyframe.totalDuration',
        'asset_keyframe.packetCount',
        'asset_keyframe.outputFrames',
      ]),
  ).$castTo<VideoPacketInfo | null>();
}

export function withSmartSearch<O>(qb: SelectQueryBuilder<DB, 'asset', O>) {
  return qb
    .leftJoin('smart_search', 'asset.id', 'smart_search.assetId')
    .select((eb) => jsonObjectFrom(eb.table('smart_search')).as('smartSearch'));
}

export function withFaces(eb: ExpressionBuilder<DB, 'asset'>, withHidden?: boolean, withDeletedFace?: boolean) {
  return jsonArrayFrom(
    eb
      .selectFrom('asset_face')
      .selectAll('asset_face')
      .whereRef('asset_face.assetId', '=', 'asset.id')
      .$if(!withDeletedFace, (qb) => qb.where('asset_face.deletedAt', 'is', null))
      .$if(!withHidden, (qb) => qb.where('asset_face.isVisible', '=', true)),
  ).as('faces');
}

export function withFiles(eb: ExpressionBuilder<DB, 'asset'>, type?: AssetFileType) {
  return jsonArrayFrom(
    eb
      .selectFrom('asset_file')
      .select(columns.assetFiles)
      .whereRef('asset_file.assetId', '=', 'asset.id')
      .$if(!!type, (qb) => qb.where('asset_file.type', '=', type!)),
  ).as('files');
}

export function withFilePath(eb: ExpressionBuilder<DB, 'asset'>, type: AssetFileType, isEdited = false) {
  return eb
    .selectFrom('asset_file')
    .select('asset_file.path')
    .whereRef('asset_file.assetId', '=', 'asset.id')
    .where('asset_file.type', '=', sql.lit(type))
    .where('asset_file.isEdited', '=', sql.lit(isEdited));
}

export type WithFacesAndPeopleOptions = {
  /** whose version of the person to select */
  viewingUserId?: string;
  withHidden?: boolean;
  withDeletedFace?: boolean;
};

export function withFacesAndPeople({ viewingUserId, withHidden, withDeletedFace }: WithFacesAndPeopleOptions) {
  return (eb: ExpressionBuilder<DB, 'asset'>) =>
    jsonArrayFrom(
      eb
        .selectFrom('asset_face')
        .leftJoinLateral(
          (eb) =>
            eb
              .selectFrom('person')
              .selectAll('person')
              .whereRef('person.personGroupId', '=', 'asset_face.personGroupId')
              .$if(!viewingUserId, (qb) => qb.whereRef('person.ownerId', '=', 'asset.ownerId'))
              .$if(!!viewingUserId, (qb) => qb.where('person.ownerId', '=', viewingUserId!))
              .as('person'),
          (join) => join.onTrue(),
        )
        .selectAll('asset_face')
        .select((eb) => eb.table('person').$castTo<ShallowDehydrateObject<Person>>().as('person'))
        .whereRef('asset_face.assetId', '=', 'asset.id')
        .$if(!withDeletedFace, (qb) => qb.where('asset_face.deletedAt', 'is', null))
        .$if(!withHidden, (qb) => qb.where('asset_face.isVisible', 'is', true)),
    ).as('faces');
}

export function hasPeople<O>(qb: SelectQueryBuilder<DB, 'asset', O>, personGroupIds: string[]) {
  return qb.innerJoin(
    (eb) =>
      eb
        .selectFrom('asset_face')
        .select('assetId')
        .where('personGroupId', '=', anyUuid(personGroupIds!))
        .where('deletedAt', 'is', null)
        .where('isVisible', 'is', true)
        .groupBy('assetId')
        .having((eb) => eb.fn.count('personGroupId').distinct(), '=', personGroupIds.length)
        .as('has_people'),
    (join) => join.onRef('has_people.assetId', '=', 'asset.id'),
  );
}

export function inSharedAlbum(userId: string, assetId: 'asset.id' | 'asset_face.assetId') {
  const eb = expressionBuilder<DB, 'asset' | 'asset_face'>();
  return eb.exists(
    eb
      .selectFrom('album_asset')
      .select(sql.lit(1).as('exists'))
      .innerJoin('album', (join) =>
        join.onRef('album.id', '=', 'album_asset.albumId').on('album.deletedAt', 'is', null),
      )
      .innerJoin('album_user', (join) =>
        join.onRef('album_user.albumId', '=', 'album.id').on('album_user.userId', '=', userId),
      )
      .whereRef('album_asset.assetId', '=', assetId),
  );
}

export function inAlbums<O>(qb: SelectQueryBuilder<DB, 'asset', O>, albumIds: string[]) {
  return qb.innerJoin(
    (eb) =>
      eb
        .selectFrom('album_asset')
        .select('assetId')
        .where('albumId', '=', anyUuid(albumIds!))
        .groupBy('assetId')
        .having((eb) => eb.fn.count('albumId').distinct(), '=', albumIds.length)
        .as('has_album'),
    (join) => join.onRef('has_album.assetId', '=', 'asset.id'),
  );
}

export function hasTags<O>(qb: SelectQueryBuilder<DB, 'asset', O>, tagIds: string[]) {
  return qb.innerJoin(
    (eb) =>
      eb
        .selectFrom('tag_asset')
        .select('assetId')
        .innerJoin('tag_closure', 'tag_asset.tagId', 'tag_closure.id_descendant')
        .where('tag_closure.id_ancestor', '=', anyUuid(tagIds))
        .groupBy('assetId')
        .having((eb) => eb.fn.count('tag_closure.id_ancestor').distinct(), '>=', tagIds.length)
        .as('has_tags'),
    (join) => join.onRef('has_tags.assetId', '=', 'asset.id'),
  );
}

export function withOwner(eb: ExpressionBuilder<DB, 'asset'>) {
  return jsonObjectFrom(eb.selectFrom('user').select(columns.user).whereRef('user.id', '=', 'asset.ownerId')).as(
    'owner',
  );
}

export function withLibrary(eb: ExpressionBuilder<DB, 'asset'>) {
  return jsonObjectFrom(
    eb.selectFrom('library').selectAll('library').whereRef('library.id', '=', 'asset.libraryId'),
  ).as('library');
}

export function withTags(eb: ExpressionBuilder<DB, 'asset'>, privateOwnerId?: string | null) {
  return jsonArrayFrom(
    eb
      .selectFrom('tag')
      .select(columns.tag)
      .innerJoin('tag_asset', 'tag.id', 'tag_asset.tagId')
      .$if(privateOwnerId !== undefined, (qb) =>
        qb.where((eb) =>
          privateOwnerId
            ? eb.or([eb.not(hasPrivateTagAncestor(eb.ref('tag.id'))), eb('tag.userId', '=', privateOwnerId)])
            : eb.not(hasPrivateTagAncestor(eb.ref('tag.id'))),
        ),
      )
      .whereRef('asset.id', '=', 'tag_asset.assetId'),
  ).as('tags');
}

export const hasPrivateAssetTag = (assetId: Expression<unknown>) => sql<SqlBool>`
  exists (
    select 1 from tag_asset
    join tag_closure on tag_closure.id_descendant = tag_asset."tagId"
    join tag on tag.id = tag_closure.id_ancestor
    where tag_asset."assetId" = ${assetId}
      and tag."isPrivate" = true
  )
`;

export const hasPrivateTagAncestor = (tagId: Expression<unknown>) => sql<SqlBool>`
  exists (
    select 1 from tag_closure
    join tag as ancestor on ancestor.id = tag_closure.id_ancestor
    where tag_closure.id_descendant = ${tagId} and ancestor."isPrivate" = true
  )
`;

export const hasLockedFolderTag = (assetId: Expression<unknown>) => sql<SqlBool>`
  exists (
    select 1 from tag_asset
    join tag on tag.id = tag_asset."tagId"
    where tag_asset."assetId" = ${assetId}
      and tag."isPrivate" and tag."systemKey" = 'locked'
  )
`;

export const isPrivateAsset = (assetId: Expression<unknown>) => sql<boolean>`
  (${hasPrivateAssetTag(assetId)} or exists (
    select 1 from asset as private_asset
    where private_asset.id = ${assetId} and private_asset.visibility = 'locked'
  ) or exists (
    select 1 from asset as still
    where still."livePhotoVideoId" = ${assetId}
      and (still.visibility = 'locked' or ${hasPrivateAssetTag(sql.ref('still.id'))})
  ))
`;

export const hasAccessibleStackPrimary = (
  stackId: Expression<string | null>,
  excludedId: Expression<string> | null,
  { includePrivate, privateOwnerId }: { includePrivate?: boolean; privateOwnerId?: string },
) => sql<SqlBool>`
  exists (
    select 1 from stack
    join asset as primary_asset on primary_asset.id = stack."primaryAssetId"
    where stack.id = ${stackId}
      ${excludedId ? sql`and primary_asset.id != ${excludedId}` : sql``}
      and (not ${isPrivateAsset(sql.ref('primary_asset.id'))}
        ${includePrivate && privateOwnerId ? sql`or primary_asset."ownerId" = ${asUuid(privateOwnerId)}` : sql``})
  )
`;

export const hasPrivateAlbumAccess = (
  assetId: Expression<unknown>,
  userId: string,
  albumId?: Expression<unknown>,
  albumIds?: string[],
) =>
  sql<boolean>`exists (
    select 1
    from asset as granted_asset
    join asset as granted_target on granted_target.id = ${assetId}
      and granted_target."ownerId" = granted_asset."ownerId"
    join album_asset as granted_membership on granted_membership."assetId" = granted_asset.id
    join album as granted_album on granted_album.id = granted_membership."albumId"
    join album_user as granted_owner on granted_owner."albumId" = granted_album.id
      and granted_owner.role = 'owner' and granted_owner."userId" = granted_asset."ownerId"
    join album_user as granted_viewer on granted_viewer."albumId" = granted_album.id
      and granted_viewer."userId" = ${userId}
    where granted_album."includePrivateAssets" and granted_album."deletedAt" is null
      and granted_asset."deletedAt" is null and granted_target."deletedAt" is null
      and granted_asset."ownerId" != ${userId}
      and (granted_asset.id = ${assetId} or granted_asset."livePhotoVideoId" = ${assetId})
      ${albumId ? sql`and granted_album.id = ${albumId}` : sql``}
      ${albumIds ? sql`and granted_album.id = any(${albumIds}::uuid[])` : sql``}
  )`;

export const hasPrivateSharedLinkAccess = (assetId: Expression<unknown>, sharedLinkId: string | Expression<unknown>) =>
  sql<boolean>`exists (
    select 1 from shared_link as granted_link
    join asset as granted_asset on granted_asset."ownerId" = granted_link."userId"
    join asset as granted_target on granted_target.id = ${assetId}
      and granted_target."ownerId" = granted_asset."ownerId"
    where granted_link.id = ${sharedLinkId} and granted_link."includePrivateAssets"
      and (granted_link."expiresAt" is null or granted_link."expiresAt" > now())
      and granted_asset."deletedAt" is null and granted_target."deletedAt" is null
      and (granted_asset.id = ${assetId} or granted_asset."livePhotoVideoId" = ${assetId})
      and (exists (
        select 1 from shared_link_asset as granted_membership
        where granted_membership."sharedLinkId" = granted_link.id
          and granted_membership."assetId" = granted_asset.id
      ) or exists (
        select 1 from album_asset as granted_membership
        join album as granted_album on granted_album.id = granted_membership."albumId"
        where granted_membership."albumId" = granted_link."albumId"
          and granted_membership."assetId" = granted_asset.id and granted_album."deletedAt" is null
      ))
  )`;

export const isAssetVisible = (assetId: Expression<unknown>, options: PrivateTagAccessOptions = {}) => {
  const grants: Expression<boolean>[] = [sql<boolean>`not ${isPrivateAsset(assetId)}`];
  if (options.includePrivate && options.privateOwnerId) {
    grants.push(sql<boolean>`exists (
      select 1 from asset as owned_asset
      where owned_asset.id = ${assetId} and owned_asset."ownerId" = ${options.privateOwnerId}
    )`);
  }
  if (options.sharedLinkId) {
    grants.push(hasPrivateSharedLinkAccess(assetId, options.sharedLinkId));
  } else if (options.albumUserId) {
    grants.push(hasPrivateAlbumAccess(assetId, options.albumUserId, options.albumId, options.albumIds));
  }
  return sql<boolean>`(${sql.join(grants, sql` or `)})`;
};

export const visibleAlbumThumbnail = (
  albumId: Expression<string>,
  assetId: Expression<string | null>,
  options: PrivateTagAccessOptions = {},
) =>
  sql<string | null>`
    case when ${assetId} is null or not ${isAssetVisible(assetId, { ...options, albumId })} then (
      select candidate.id
      from album_asset
      join asset as candidate on candidate.id = album_asset."assetId"
      where album_asset."albumId" = ${albumId}
        and candidate."deletedAt" is null
        and ${isAssetVisible(sql.ref('candidate.id'), { ...options, albumId })}
      order by candidate."fileCreatedAt" desc, candidate.id
      limit 1
    ) else ${assetId} end
  `;

export async function resetAssetPrivacySync(tx: Kysely<DB>, ownerId: string, assetIds: string[]) {
  if (assetIds.length === 0) {
    return [];
  }

  const viewers = await tx
    .selectFrom('album_asset')
    .innerJoin('album_user', 'album_user.albumId', 'album_asset.albumId')
    .select('album_user.userId')
    .where((eb) =>
      eb.or([
        eb('album_asset.assetId', '=', anyUuid(assetIds)),
        eb(
          'album_asset.assetId',
          'in',
          eb.selectFrom('asset').select('asset.livePhotoVideoId').where('asset.id', '=', anyUuid(assetIds)),
        ),
      ]),
    )
    .union(tx.selectFrom('partner').select('partner.sharedWithId as userId').where('sharedById', '=', ownerId))
    .union(
      tx
        .selectFrom('user')
        .select('user.id as userId')
        .where('clusterGroupId', '=', (eb) =>
          eb.selectFrom('user as owner').select('clusterGroupId').where('id', '=', ownerId),
        )
        .where((eb) => eb.exists(eb.selectFrom('asset_face').select('id').where('assetId', '=', anyUuid(assetIds)))),
    )
    .union(
      tx
        .selectFrom('shared_link_asset')
        .innerJoin('shared_link', 'shared_link.id', 'shared_link_asset.sharedLinkId')
        .select('shared_link.userId')
        .where('shared_link_asset.assetId', '=', anyUuid(assetIds)),
    )
    .execute();
  const userIds = [...new Set([ownerId, ...viewers.map(({ userId }) => userId)])];
  await tx.updateTable('session').set({ isPendingSyncReset: true }).where('userId', '=', anyUuid(userIds)).execute();
  return userIds;
}

export const compatibilityVisibility = (visibility: Expression<AssetVisibility>, locked: Expression<SqlBool>) =>
  sql<AssetVisibility>`case when ${visibility} != 'hidden' and ${locked} then 'locked' else ${visibility} end`;

export function truncatedDate<O>(order: AssetOrderBy = AssetOrderBy.TakenAt, size: 'DAY' | 'MONTH' = 'MONTH') {
  return sql<O>`date_trunc(${sql.lit(size)}, ${sql.ref(order === AssetOrderBy.CreatedAt ? 'asset.createdAt' : 'localDateTime')} AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'`;
}

export function withTagId<O>(qb: SelectQueryBuilder<DB, 'asset', O>, tagId: string) {
  return qb.where((eb) =>
    eb.exists(
      eb
        .selectFrom('tag_closure')
        .innerJoin('tag_asset', 'tag_asset.tagId', 'tag_closure.id_descendant')
        .whereRef('tag_asset.assetId', '=', 'asset.id')
        .where('tag_closure.id_ancestor', '=', tagId),
    ),
  );
}

export function withCoordinatesFilter<O>(qb: SelectQueryBuilder<DB, 'asset', O>, hasCoordinates: boolean) {
  return qb.where((eb) =>
    eb.exists(
      eb
        .selectFrom('asset_exif')
        .whereRef('asset_exif.assetId', '=', 'asset.id')
        .where((eb) =>
          hasCoordinates
            ? eb.and([eb('asset_exif.latitude', 'is not', null), eb('asset_exif.longitude', 'is not', null)])
            : eb.or([eb('asset_exif.latitude', 'is', null), eb('asset_exif.longitude', 'is', null)]),
        ),
    ),
  );
}

const isCJK = (c: number): boolean =>
  (c >= 0x4e_00 && c <= 0x9f_ff) ||
  (c >= 0xac_00 && c <= 0xd7_af) ||
  (c >= 0x30_40 && c <= 0x30_9f) ||
  (c >= 0x30_a0 && c <= 0x30_ff) ||
  (c >= 0x34_00 && c <= 0x4d_bf);

export const tokenizeForSearch = (text: string): string[] => {
  /* eslint-disable unicorn/prefer-code-point */
  const tokens: string[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text.charCodeAt(i);
    if (c <= 32) {
      i++;
      continue;
    }

    const start = i;
    if (isCJK(c)) {
      while (i < text.length && isCJK(text.charCodeAt(i))) {
        i++;
      }
      if (i - start === 1) {
        tokens.push(text[start]);
      } else {
        for (let k = start; k < i - 1; k++) {
          tokens.push(text[k] + text[k + 1]);
        }
      }
    } else {
      while (i < text.length && text.charCodeAt(i) > 32 && !isCJK(text.charCodeAt(i))) {
        i++;
      }
      tokens.push(text.slice(start, i));
    }
  }
  return tokens;
};

// needed to properly type the return with the EditActionItem discriminated union type
type AliasedEditActions = AliasedRawBuilder<AssetEditActionItem[], 'edits'>;
export function withEdits(eb: ExpressionBuilder<DB, 'asset'>): AliasedEditActions {
  return jsonArrayFrom(
    eb
      .selectFrom('asset_edit')
      .select(['asset_edit.action', 'asset_edit.parameters'])
      .whereRef('asset_edit.assetId', '=', 'asset.id'),
  ).as('edits') as AliasedEditActions;
}

const joinDeduplicationPlugin = new DeduplicateJoinsPlugin();
/** TODO: This should only be used for search-related queries, not as a general purpose query builder */

export function searchAssetBuilderLegacy(kysely: Kysely<DB>, options: AssetSearchBuilderOptions) {
  options.withDeleted ||= !!(options.trashedAfter || options.trashedBefore || options.isOffline);

  return kysely
    .withPlugin(joinDeduplicationPlugin)
    .selectFrom('asset')
    .$if(options.visibility === undefined, (qb) =>
      withPrivateTagAccess(qb, {
        ...options,
        albumUserId: options.albumIds?.length ? options.albumUserId : undefined,
      }),
    )
    .$if(!!options.visibility, (qb) =>
      options.visibility === 'not-locked'
        ? withPrivateTagAccess(qb, {
            ...options,
            includePrivate: false,
            albumUserId: options.albumIds?.length ? options.albumUserId : undefined,
          })
        : options.visibility === AssetVisibility.Locked
          ? withLockedVisibilityCompatibility(qb, options.privateOwnerId)
          : qb.where('asset.visibility', '=', options.visibility!).$call((qb) =>
              withPrivateTagAccess(qb, {
                ...options,
              }),
            ),
    )
    .$if(!!options.viewingUserId, (qb) =>
      qb.where((eb) =>
        eb.or([eb('asset.visibility', '!=', AssetVisibility.Locked), eb('asset.ownerId', '=', options.viewingUserId!)]),
      ),
    )
    .$if(!!options.albumIds && options.albumIds.length > 0, (qb) => inAlbums(qb, options.albumIds!))
    .$if(!!options.tagIds && options.tagIds.length > 0, (qb) => hasTags(qb, options.tagIds!))
    .$if(options.tagIds === null, (qb) =>
      qb.where((eb) => eb.not(eb.exists((eb) => eb.selectFrom('tag_asset').whereRef('assetId', '=', 'asset.id')))),
    )
    .$if(!!options.personIds && options.personIds.length > 0, (qb) => hasPeople(qb, options.personIds!))
    .$if(!!options.createdBefore, (qb) => qb.where('asset.createdAt', '<=', options.createdBefore!))
    .$if(!!options.createdAfter, (qb) => qb.where('asset.createdAt', '>=', options.createdAfter!))
    .$if(!!options.updatedBefore, (qb) => qb.where('asset.updatedAt', '<=', options.updatedBefore!))
    .$if(!!options.updatedAfter, (qb) => qb.where('asset.updatedAt', '>=', options.updatedAfter!))
    .$if(!!options.trashedBefore, (qb) => qb.where('asset.deletedAt', '<=', options.trashedBefore!))
    .$if(!!options.trashedAfter, (qb) => qb.where('asset.deletedAt', '>=', options.trashedAfter!))
    .$if(!!options.takenBefore, (qb) => qb.where('asset.fileCreatedAt', '<=', options.takenBefore!))
    .$if(!!options.takenAfter, (qb) => qb.where('asset.fileCreatedAt', '>=', options.takenAfter!))
    .$if(options.city !== undefined, (qb) =>
      qb
        .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
        .where('asset_exif.city', options.city === null ? 'is' : '=', options.city!),
    )
    .$if(options.state !== undefined, (qb) =>
      qb
        .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
        .where('asset_exif.state', options.state === null ? 'is' : '=', options.state!),
    )
    .$if(options.country !== undefined, (qb) =>
      qb
        .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
        .where('asset_exif.country', options.country === null ? 'is' : '=', options.country!),
    )
    .$if(options.make !== undefined, (qb) =>
      qb
        .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
        .where('asset_exif.make', options.make === null ? 'is' : '=', options.make!),
    )
    .$if(options.model !== undefined, (qb) =>
      qb
        .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
        .where('asset_exif.model', options.model === null ? 'is' : '=', options.model!),
    )
    .$if(options.lensModel !== undefined, (qb) =>
      qb
        .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
        .where('asset_exif.lensModel', options.lensModel === null ? 'is' : '=', options.lensModel!),
    )
    .$if(options.rating !== undefined, (qb) =>
      qb
        .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
        .where('asset_exif.rating', options.rating === null ? 'is' : '=', options.rating!),
    )
    .$if(!!options.checksum, (qb) => qb.where('asset.checksum', '=', options.checksum!))
    .$if(!!options.id, (qb) => qb.where('asset.id', '=', asUuid(options.id!)))
    .$if(!!options.libraryId, (qb) => qb.where('asset.libraryId', '=', asUuid(options.libraryId!)))
    .$if(!!options.userIds, (qb) => qb.where('asset.ownerId', '=', anyUuid(options.userIds!)))
    .$if(!!options.encodedVideoPath, (qb) =>
      qb
        .innerJoin('asset_file', (join) =>
          join
            .onRef('asset.id', '=', 'asset_file.assetId')
            .on('asset_file.type', '=', AssetFileType.EncodedVideo)
            .on('asset_file.isEdited', '=', false),
        )
        .where('asset_file.path', '=', options.encodedVideoPath!),
    )
    .$if(!!options.originalPath, (qb) =>
      qb.where(
        sql`f_unaccent(asset."originalPath") collate "default"`,
        'ilike',
        sql`'%' || f_unaccent(${options.originalPath}) || '%'`,
      ),
    )
    .$if(!!options.originalFileName, (qb) =>
      qb.where(
        sql`f_unaccent(asset."originalFileName")`,
        'ilike',
        sql`'%' || f_unaccent(${options.originalFileName}) || '%'`,
      ),
    )
    .$if(!!options.description, (qb) =>
      qb
        .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
        .where(sql`f_unaccent(asset_exif.description)`, 'ilike', sql`'%' || f_unaccent(${options.description}) || '%'`),
    )
    .$if(!!options.ocr, (qb) =>
      qb
        .innerJoin('ocr_search', 'asset.id', 'ocr_search.assetId')
        .where(() => sql`f_unaccent(ocr_search.text) %>> f_unaccent(${tokenizeForSearch(options.ocr!).join(' ')})`),
    )
    .$if(!!options.type, (qb) => qb.where('asset.type', '=', options.type!))
    .$if(options.isFavorite !== undefined, (qb) => qb.where('asset.isFavorite', '=', options.isFavorite!))
    .$if(options.isOffline !== undefined, (qb) => qb.where('asset.isOffline', '=', options.isOffline!))
    .$if(options.isEncoded !== undefined, (qb) =>
      qb.where((eb) => {
        const exists = eb.exists((eb) =>
          eb
            .selectFrom('asset_file')
            .whereRef('assetId', '=', 'asset.id')
            .where('type', '=', AssetFileType.EncodedVideo),
        );
        return options.isEncoded ? exists : eb.not(exists);
      }),
    )
    .$if(options.isMotion !== undefined, (qb) =>
      qb.where('asset.livePhotoVideoId', options.isMotion ? 'is not' : 'is', null),
    )
    .$if(!!options.isNotInAlbum && (!options.albumIds || options.albumIds.length === 0), (qb) =>
      qb.where((eb) => eb.not(eb.exists((eb) => eb.selectFrom('album_asset').whereRef('assetId', '=', 'asset.id')))),
    )
    .$if(options.withStacked === false, (qb) => qb.where('asset.stackId', 'is', null))
    .$if(!!options.withExif, withExifInner)
    .$if(!!(options.withFaces || options.withPeople), (qb) =>
      qb.select(withFacesAndPeople({ viewingUserId: options.viewingUserId! })),
    )
    .$if(!options.withDeleted, (qb) => qb.where('asset.deletedAt', 'is', null));
}

type AssetExpressionBuilder = ExpressionBuilder<DB, 'asset' | 'asset_exif'>;

const albumAssets = (eb: AssetExpressionBuilder) =>
  eb.selectFrom('album_asset').whereRef('album_asset.assetId', '=', 'asset.id');

const visibleFaces = (eb: AssetExpressionBuilder) =>
  eb
    .selectFrom('asset_face')
    .whereRef('asset_face.assetId', '=', 'asset.id')
    .where('asset_face.deletedAt', 'is', null)
    .where('asset_face.isVisible', '=', true);

const tagAssets = (eb: AssetExpressionBuilder) =>
  eb.selectFrom('tag_asset').whereRef('tag_asset.assetId', '=', 'asset.id');

// shared any/all/none mechanics; `matchesAll` only receives deduplicated multi-id lists,
// so its `count(distinct id) = ids.length` check stays satisfiable
function idsPredicates(
  eb: AssetExpressionBuilder,
  { any, all, none }: IdsFilter = {},
  ops: {
    matchesAny: (ids: string[]) => Expression<SqlBool>;
    matchesAll: (ids: string[]) => Expression<SqlBool>;
  },
) {
  const predicates: Expression<SqlBool>[] = [];
  if (any) {
    predicates.push(ops.matchesAny(any));
  }
  if (all) {
    const ids = uniqueIds(all);
    predicates.push(ids.length === 1 ? ops.matchesAny(ids) : ops.matchesAll(ids));
  }
  if (none) {
    predicates.push(eb.not(ops.matchesAny(none)));
  }
  return predicates;
}

function albumIdsPredicates(eb: AssetExpressionBuilder, filter?: IdsFilter) {
  const matching = (ids: string[]) => albumAssets(eb).where('album_asset.albumId', '=', anyUuid(ids));
  return idsPredicates(eb, filter, {
    matchesAny: (ids) => eb.exists(matching(ids)),
    matchesAll: (ids) =>
      eb.exists(
        matching(ids)
          .select('album_asset.assetId')
          .groupBy('album_asset.assetId')
          .having((eb) => eb.fn.count('album_asset.albumId').distinct(), '=', ids.length),
      ),
  });
}

function personIdsPredicates(eb: AssetExpressionBuilder, filter?: IdsFilter) {
  const matching = (ids: string[]) => visibleFaces(eb).where('asset_face.personGroupId', '=', anyUuid(ids));
  return idsPredicates(eb, filter, {
    matchesAny: (ids) => eb.exists(matching(ids)),
    matchesAll: (ids) =>
      eb.exists(
        matching(ids)
          .select('asset_face.assetId')
          .groupBy('asset_face.assetId')
          .having((eb) => eb.fn.count('asset_face.personGroupId').distinct(), '=', ids.length),
      ),
  });
}

function tagIdsPredicates(eb: AssetExpressionBuilder, filter?: IdsFilter) {
  const matching = (ids: string[]) =>
    tagAssets(eb)
      .innerJoin('tag_closure', 'tag_asset.tagId', 'tag_closure.id_descendant')
      .where('tag_closure.id_ancestor', '=', anyUuid(ids));
  return idsPredicates(eb, filter, {
    matchesAny: (ids) => eb.exists(matching(ids)),
    matchesAll: (ids) =>
      eb.exists(
        matching(ids)
          .select('tag_asset.assetId')
          .groupBy('tag_asset.assetId')
          .having((eb) => eb.fn.count('tag_closure.id_ancestor').distinct(), '=', ids.length),
      ),
  });
}

type ComparisonFilter<T> = {
  eq?: T | null;
  ne?: T | null;
  lt?: T;
  lte?: T;
  gt?: T;
  gte?: T;
  in?: T[];
  notIn?: T[];
};

// one operator dispatch for every filter shape; the DTO schemas constrain which
// operators (and null literals) each filter can actually carry
function comparisonPredicates<TB extends keyof DB, RE extends ReferenceExpression<DB, TB>>(
  eb: ExpressionBuilder<DB, TB>,
  column: RE,
  filter: ComparisonFilter<OperandValueExpression<DB, TB, RE>> = {},
) {
  const predicates: Expression<SqlBool>[] = [];
  if (filter.eq !== undefined) {
    predicates.push(filter.eq === null ? eb(column, 'is', null) : eb(column, '=', filter.eq));
  }
  if (filter.ne !== undefined) {
    predicates.push(filter.ne === null ? eb(column, 'is not', null) : eb(column, '!=', filter.ne));
  }
  if (filter.lt !== undefined) {
    predicates.push(eb(column, '<', filter.lt));
  }
  if (filter.lte !== undefined) {
    predicates.push(eb(column, '<=', filter.lte));
  }
  if (filter.gt !== undefined) {
    predicates.push(eb(column, '>', filter.gt));
  }
  if (filter.gte !== undefined) {
    predicates.push(eb(column, '>=', filter.gte));
  }
  if (filter.in !== undefined) {
    predicates.push(eb(column, 'in', filter.in));
  }
  if (filter.notIn !== undefined) {
    predicates.push(eb(column, 'not in', filter.notIn));
  }
  return predicates;
}

type StringColumn =
  | 'asset_exif.city'
  | 'asset_exif.state'
  | 'asset_exif.country'
  | 'asset_exif.make'
  | 'asset_exif.model'
  | 'asset_exif.lensModel'
  | 'asset_exif.description'
  | 'asset.originalFileName'
  | 'asset.originalPath';

function stringPatternPredicates(eb: AssetExpressionBuilder, column: StringColumn, filter: StringPatternFilter = {}) {
  const ref = sql.ref(column);
  const predicates = comparisonPredicates(eb, column, filter);
  if (filter.like !== undefined) {
    predicates.push(sql<SqlBool>`f_unaccent(${ref}) ilike ('%' || f_unaccent(${filter.like}) || '%')`);
  }
  if (filter.notLike !== undefined) {
    predicates.push(sql<SqlBool>`f_unaccent(${ref}) not ilike ('%' || f_unaccent(${filter.notLike}) || '%')`);
  }
  if (filter.startsWith !== undefined) {
    predicates.push(sql<SqlBool>`f_unaccent(${ref}) ilike (f_unaccent(${filter.startsWith}) || '%')`);
  }
  if (filter.endsWith !== undefined) {
    predicates.push(sql<SqlBool>`f_unaccent(${ref}) ilike ('%' || f_unaccent(${filter.endsWith}))`);
  }
  return predicates;
}

function checksumPredicates(eb: AssetExpressionBuilder, filter: StringFilter = {}) {
  return comparisonPredicates(eb, 'asset.checksum', {
    eq: filter.eq === undefined ? undefined : fromChecksum(filter.eq),
    ne: filter.ne === undefined ? undefined : fromChecksum(filter.ne),
    in: filter.in?.map((checksum) => fromChecksum(checksum)),
    notIn: filter.notIn?.map((checksum) => fromChecksum(checksum)),
  });
}

const encodedVideoFiles = (eb: AssetExpressionBuilder) =>
  eb
    .selectFrom('asset_file')
    .whereRef('asset_file.assetId', '=', 'asset.id')
    .where('asset_file.type', '=', AssetFileType.EncodedVideo);

function existsPredicates(
  eb: AssetExpressionBuilder,
  filter: { eq: boolean } | undefined,
  subquery: () => Expression<unknown>,
): Expression<SqlBool>[] {
  if (!filter) {
    return [];
  }
  const exists = eb.exists(subquery());
  return [filter.eq ? exists : eb.not(exists)];
}

// predicates are collected as expressions rather than chained `where` calls so the same
// helpers can build each `or` branch, which must compose into eb.and/eb.or
function branchPredicates(eb: AssetExpressionBuilder, branch: SearchFilterBranch) {
  const { encodedVideoPath } = branch;
  return [
    ...comparisonPredicates(eb, 'asset.id', branch.id),
    ...comparisonPredicates(eb, 'asset.libraryId', branch.libraryId),
    ...comparisonPredicates(eb, 'asset.type', branch.type),
    ...comparisonPredicates(
      eb,
      compatibilityVisibility(eb.ref('asset.visibility'), hasLockedFolderTag(eb.ref('asset.id'))),
      branch.visibility,
    ),
    ...(branch.isFavorite ? [eb('asset.isFavorite', '=', branch.isFavorite.eq)] : []),
    ...(branch.isOffline ? [eb('asset.isOffline', '=', branch.isOffline.eq)] : []),
    ...(branch.isMotion ? [eb('asset.livePhotoVideoId', branch.isMotion.eq ? 'is not' : 'is', null)] : []),
    ...existsPredicates(eb, branch.isEncoded, () => encodedVideoFiles(eb)),
    ...existsPredicates(eb, branch.hasAlbums, () => albumAssets(eb)),
    ...existsPredicates(eb, branch.hasPeople, () => visibleFaces(eb)),
    ...existsPredicates(eb, branch.hasTags, () => tagAssets(eb)),
    ...comparisonPredicates(eb, 'asset_exif.city', branch.city),
    ...comparisonPredicates(eb, 'asset_exif.state', branch.state),
    ...comparisonPredicates(eb, 'asset_exif.country', branch.country),
    ...comparisonPredicates(eb, 'asset_exif.make', branch.make),
    ...comparisonPredicates(eb, 'asset_exif.model', branch.model),
    ...comparisonPredicates(eb, 'asset_exif.lensModel', branch.lensModel),
    ...stringPatternPredicates(eb, 'asset_exif.description', branch.description),
    ...stringPatternPredicates(eb, 'asset.originalFileName', branch.originalFileName),
    ...stringPatternPredicates(eb, 'asset.originalPath', branch.originalPath),
    ...(branch.ocr
      ? [
          eb.exists(
            eb
              .selectFrom('ocr_search')
              .whereRef('ocr_search.assetId', '=', 'asset.id')
              .where(
                sql<SqlBool>`f_unaccent(ocr_search.text) %>> f_unaccent(${tokenizeForSearch(branch.ocr.matches).join(' ')})`,
              ),
          ),
        ]
      : []),
    ...comparisonPredicates(eb, 'asset_exif.rating', branch.rating),
    ...comparisonPredicates(eb, 'asset_exif.fileSizeInByte', branch.fileSizeInBytes),
    ...comparisonPredicates(eb, 'asset.fileCreatedAt', branch.takenAt),
    ...comparisonPredicates(eb, 'asset.createdAt', branch.createdAt),
    ...comparisonPredicates(eb, 'asset.updatedAt', branch.updatedAt),
    ...comparisonPredicates(eb, 'asset.deletedAt', branch.trashedAt),
    ...albumIdsPredicates(eb, branch.albumIds),
    ...personIdsPredicates(eb, branch.personIds),
    ...tagIdsPredicates(eb, branch.tagIds),
    ...checksumPredicates(eb, branch.checksum),
    ...(encodedVideoPath
      ? [
          eb.exists(
            encodedVideoFiles(eb)
              .where('asset_file.isEdited', '=', false)
              .where((eb) => eb.and(comparisonPredicates(eb, 'asset_file.path', encodedVideoPath))),
          ),
        ]
      : []),
  ];
}

// ordering is deliberately left to the caller so aggregate-only consumers (counts, stats)
// can compose the same filters without stripping an order by
export function searchAssetBuilder(kysely: Kysely<DB>, options: AssetSearchBuilderV3Options, scope: AssetSearchScope) {
  const filter = options.filter ?? {};
  const branches = filter.or ?? [];
  const ownershipPredicate = (eb: AssetExpressionBuilder) => eb('asset.ownerId', '=', anyUuid(scope.userIds));
  // search universe: own+partner assets unless album-confined, which searches the albums instead;
  // ownership lands nowhere (top level confined), per unconfined branch, or hoisted globally
  const topConfined = isAlbumConfined(filter);
  const anyBranchConfined = branches.some((branch) => isAlbumConfined(branch));
  const scopePerBranch = !topConfined && anyBranchConfined;
  const scopeGlobally = !topConfined && !anyBranchConfined;

  return (
    kysely
      .withPlugin(joinDeduplicationPlugin)
      .selectFrom('asset')
      // postgres eliminates the left join when no exif column is referenced, so unused joins are free
      .leftJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .$if(!!options.withExif, (qb) => qb.select(selectReturnedExifInfo))
      .$if(scopeGlobally, (qb) => qb.where(ownershipPredicate))
      .where((eb) =>
        isAssetVisible(eb.ref('asset.id'), {
          includePrivate: scope.includePrivate,
          privateOwnerId: scope.lockedOwnerId,
          albumUserId: scope.albumIds?.length ? scope.viewingUserId : undefined,
          albumIds: scope.albumIds,
          sharedLinkId: scope.sharedLinkId,
        }),
      )
      .$if(!!(options.withFaces || options.withPeople), (qb) =>
        qb.select(withFacesAndPeople({ viewingUserId: scope.viewingUserId! })),
      )
      .$if(options.withStacked === false, (qb) => qb.where('asset.stackId', 'is', null))
      .where((eb) => {
        const predicates = branchPredicates(eb, filter);
        if (branches.length > 0) {
          predicates.push(
            eb.or(
              branches.map((branch) =>
                eb.and([
                  ...branchPredicates(eb, branch),
                  ...(scopePerBranch && !isAlbumConfined(branch) ? [ownershipPredicate(eb)] : []),
                ]),
              ),
            ),
          );
        }
        return predicates.length > 0 ? eb.and(predicates) : eb.lit(true);
      })
  );
}

const searchOrderColumns = {
  [SearchOrderField.FileCreatedAt]: { column: 'asset.fileCreatedAt', nullable: false },
  [SearchOrderField.LocalDateTime]: { column: 'asset.localDateTime', nullable: false },
  [SearchOrderField.FileSizeInBytes]: { column: 'asset_exif.fileSizeInByte', nullable: true },
  [SearchOrderField.Rating]: { column: 'asset_exif.rating', nullable: true },
} as const;

export function withSearchOrder(qb: ReturnType<typeof searchAssetBuilder>, order?: SearchOrder) {
  const { field, direction } = order ?? DEFAULT_SEARCH_ORDER;
  const { column, nullable } = searchOrderColumns[field];
  return (
    qb
      .orderBy(column, (ob) => {
        const ordered = direction === AssetOrder.Asc ? ob.asc() : ob.desc();
        // nulls last: assets without an asset_exif row would otherwise lead descending results
        return nullable ? ordered.nullsLast() : ordered;
      })
      // id tie-break for deterministic pagination
      .orderBy('asset.id', direction)
  );
}

const scopeExample: AssetSearchScope = {
  userIds: [DummyValue.UUID],
  lockedOwnerId: DummyValue.UUID,
  includePrivate: false,
};

export const searchMetadataV3Examples: GenerateSqlQueries[] = [
  { name: 'baseline', params: [{ take: 100 }, {}, scopeExample] },
  {
    name: 'or-mixed-scope',
    params: [
      { take: 100 },
      {
        filter: { or: [{ albumIds: { any: [DummyValue.UUID] } }, { city: { eq: DummyValue.STRING } }] },
      },
      scopeExample,
    ],
  },
  {
    name: 'or-exif-only',
    params: [
      { take: 100 },
      {
        filter: { or: [{ city: { eq: DummyValue.STRING } }] },
      },
      scopeExample,
    ],
  },
  {
    name: 'string-eq-null',
    params: [{ take: 100 }, { filter: { city: { eq: null } } }, scopeExample],
  },
  {
    name: 'string-pattern-like',
    params: [
      { take: 100 },
      {
        filter: { description: { like: DummyValue.STRING } },
      },
      scopeExample,
    ],
  },
  {
    name: 'string-pattern-notLike',
    params: [
      { take: 100 },
      {
        filter: { description: { notLike: DummyValue.STRING } },
      },
      scopeExample,
    ],
  },
  {
    name: 'string-pattern-startsWith',
    params: [
      { take: 100 },
      {
        filter: { originalFileName: { startsWith: DummyValue.STRING } },
      },
      scopeExample,
    ],
  },
  {
    name: 'string-similarity-ocr',
    params: [{ take: 100 }, { filter: { ocr: { matches: DummyValue.STRING } } }, scopeExample],
  },
  {
    name: 'ids-any',
    params: [{ take: 100 }, { filter: { albumIds: { any: [DummyValue.UUID] } } }, scopeExample],
  },
  {
    name: 'ids-all',
    params: [
      { take: 100 },
      {
        filter: { personIds: { all: [DummyValue.UUID, DummyValue.UUID_1] } },
      },
      scopeExample,
    ],
  },
  {
    name: 'ids-all-single',
    params: [{ take: 100 }, { filter: { albumIds: { all: [DummyValue.UUID] } } }, scopeExample],
  },
  {
    name: 'ids-none',
    params: [{ take: 100 }, { filter: { tagIds: { none: [DummyValue.UUID] } } }, scopeExample],
  },
  {
    name: 'ids-tags-all',
    params: [
      { take: 100 },
      {
        filter: { tagIds: { all: [DummyValue.UUID, DummyValue.UUID_1] } },
      },
      scopeExample,
    ],
  },
  {
    name: 'has-albums-false',
    params: [{ take: 100 }, { filter: { hasAlbums: { eq: false } } }, scopeExample],
  },
  {
    name: 'is-encoded',
    params: [{ take: 100 }, { filter: { isEncoded: { eq: true } } }, scopeExample],
  },
  {
    name: 'number-range',
    params: [
      { take: 100 },
      {
        filter: { fileSizeInBytes: { gte: 100, lte: 1000 } },
      },
      scopeExample,
    ],
  },
  {
    name: 'date-eq',
    params: [{ take: 100 }, { filter: { takenAt: { eq: DummyValue.DATE } } }, scopeExample],
  },
  {
    name: 'date-range',
    params: [
      { take: 100 },
      {
        filter: { takenAt: { gte: DummyValue.DATE, lt: DummyValue.DATE } },
      },
      scopeExample,
    ],
  },
  {
    name: 'order-fileSize-noExif',
    params: [
      { take: 100 },
      {
        order: { field: SearchOrderField.FileSizeInBytes, direction: AssetOrder.Desc },
        withExif: false,
      },
      scopeExample,
    ],
  },
  {
    name: 'order-rating-withExif',
    params: [
      { take: 100 },
      {
        order: { field: SearchOrderField.Rating, direction: AssetOrder.Asc },
        withExif: true,
      },
      scopeExample,
    ],
  },
  {
    name: 'or-branches',
    params: [
      { take: 100 },
      {
        filter: {
          or: [{ isFavorite: { eq: true } }, { personIds: { any: [DummyValue.UUID] } }],
        },
      },
      scopeExample,
    ],
  },
  {
    name: 'or-with-top-level',
    params: [
      { take: 100 },
      {
        filter: {
          takenAt: { gte: DummyValue.DATE, lt: DummyValue.DATE },
          or: [{ isFavorite: { eq: true } }, { albumIds: { any: [DummyValue.UUID] } }],
        },
      },
      scopeExample,
    ],
  },
  {
    name: 'cursor-offset',
    params: [{ take: 100, skip: 100 }, { filter: { isFavorite: { eq: true } } }, scopeExample],
  },
];

export const searchRandomV3Examples: GenerateSqlQueries[] = [
  { name: 'baseline', params: [100, {}, scopeExample] },
  {
    name: 'with-filter',
    params: [100, { filter: { isFavorite: { eq: true } } }, scopeExample],
  },
];

export const searchSmartV3Examples: GenerateSqlQueries[] = [
  {
    name: 'baseline',
    params: [{ take: 100 }, { embedding: DummyValue.VECTOR }, scopeExample],
  },
  {
    name: 'with-filter',
    params: [
      { take: 100 },
      {
        embedding: DummyValue.VECTOR,
        filter: { takenAt: { gte: DummyValue.DATE, lt: DummyValue.DATE } },
      },
      scopeExample,
    ],
  },
  {
    name: 'cursor-offset',
    params: [{ take: 100, skip: 100 }, { embedding: DummyValue.VECTOR }, scopeExample],
  },
];

export const searchStatisticsV3Examples: GenerateSqlQueries[] = [
  { name: 'baseline', params: [{}, scopeExample] },
  {
    name: 'with-filter',
    params: [
      {
        filter: {
          takenAt: { gte: DummyValue.DATE, lt: DummyValue.DATE },
          fileSizeInBytes: { gte: 100 },
        },
      },
      scopeExample,
    ],
  },
  {
    name: 'with-or',
    params: [
      {
        filter: {
          or: [{ isFavorite: { eq: true } }, { hasAlbums: { eq: false } }],
        },
      },
      scopeExample,
    ],
  },
];

export type ReindexVectorIndexOptions = { indexName: string; lists?: number };

type VectorIndexQueryOptions = { table: string; vectorExtension: VectorExtension } & ReindexVectorIndexOptions;

export function vectorIndexQuery({ vectorExtension, table, indexName, lists = 1 }: VectorIndexQueryOptions): string {
  switch (vectorExtension) {
    case DatabaseExtension.VectorChord: {
      return `
        CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} USING vchordrq (embedding vector_cosine_ops) WITH (options = $$
        residual_quantization = false
        [build.internal]
        lists = [${lists}]
        spherical_centroids = true
        build_threads = 4
        sampling_factor = 1024
        $$)`;
    }
    case DatabaseExtension.Vector: {
      return `
        CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}
        USING hnsw (embedding vector_cosine_ops)
        WITH (ef_construction = 300, m = 16)`;
    }
    default: {
      throw new Error(`Unsupported vector extension: '${vectorExtension}'`);
    }
  }
}

export const updateLockedColumns = <T extends Record<string, unknown> & { lockedProperties?: LockableProperty[] }>(
  exif: T,
) => {
  exif.lockedProperties = lockableProperties.filter((property) => Object.hasOwn(exif, property));
  return exif;
};
