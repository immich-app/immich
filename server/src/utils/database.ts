import { createPostgres, DatabaseConnectionParams } from '@immich/sql-tools';
import {
  AliasedRawBuilder,
  DeduplicateJoinsPlugin,
  Expression,
  ExpressionBuilder,
  Kysely,
  KyselyConfig,
  NotNull,
  Selectable,
  SelectQueryBuilder,
  ShallowDehydrateObject,
  sql,
  SqlBool,
} from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { Notice, PostgresError } from 'postgres';
import { columns, lockableProperties, LockableProperty, Person } from 'src/database';
import { DummyValue, GenerateSqlQueries } from 'src/decorators';
import { AssetEditActionItem } from 'src/dtos/editing.dto';
import {
  DateFilter,
  DateFilterNullable,
  IdFilter,
  IdFilterNullable,
  IdsFilter,
  NumberFilter,
  NumberFilterNullable,
  SearchFilter,
  SearchFilterBranch,
  StringFilter,
  StringFilterNullable,
  StringPatternFilter,
} from 'src/dtos/search.dto';
import {
  AssetFileType,
  AssetOrder,
  AssetOrderBy,
  AssetType,
  AssetVisibility,
  DatabaseExtension,
  ExifOrientation,
  SearchOrderField,
} from 'src/enum';
import { AssetSearchBuilderOptions, AssetSearchBuilderV3Options } from 'src/repositories/search.repository';
import { DB } from 'src/schema';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import { AudioStreamInfo, VectorExtension, VideoFormat, VideoPacketInfo, VideoStreamInfo } from 'src/types';
import { fromChecksum } from 'src/utils/request';

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

export const asUuid = (id: string | Expression<string>) => sql<string>`${id}::uuid`;

export const anyUuid = (ids: string[]) => sql<string>`any(${`{${ids}}`}::uuid[])`;

export const asVector = (embedding: number[]) => sql<string>`${`[${embedding}]`}::vector`;

export const unnest = (array: string[]) => sql<Record<string, string>>`unnest(array[${sql.join(array)}]::text[])`;

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

export function withDefaultVisibility<O>(qb: SelectQueryBuilder<DB, 'asset', O>) {
  return qb.where('asset.visibility', 'in', [sql.lit(AssetVisibility.Archive), sql.lit(AssetVisibility.Timeline)]);
}

// TODO come up with a better query that only selects the fields we need
export function withExif<O>(qb: SelectQueryBuilder<DB, 'asset', O>) {
  return qb
    .leftJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
    .select((eb) =>
      eb.fn
        .toJson(eb.table('asset_exif'))
        .$castTo<ShallowDehydrateObject<Selectable<AssetExifTable>> | null>()
        .as('exifInfo'),
    );
}

export function withExifInner<O>(qb: SelectQueryBuilder<DB, 'asset', O>) {
  return qb
    .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
    .select((eb) => eb.fn.toJson(eb.table('asset_exif')).as('exifInfo'))
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
      .select(['asset_video.formatName', 'asset_video.formatLongName', 'asset.duration', 'asset_video.bitrate'])
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

export function withFacesAndPeople(
  eb: ExpressionBuilder<DB, 'asset'>,
  withHidden?: boolean,
  withDeletedFace?: boolean,
) {
  return jsonArrayFrom(
    eb
      .selectFrom('asset_face')
      .leftJoinLateral(
        (eb) =>
          eb.selectFrom('person').selectAll('person').whereRef('asset_face.personId', '=', 'person.id').as('person'),
        (join) => join.onTrue(),
      )
      .selectAll('asset_face')
      .select((eb) => eb.table('person').$castTo<ShallowDehydrateObject<Person>>().as('person'))
      .whereRef('asset_face.assetId', '=', 'asset.id')
      .$if(!withDeletedFace, (qb) => qb.where('asset_face.deletedAt', 'is', null))
      .$if(!withHidden, (qb) => qb.where('asset_face.isVisible', 'is', true)),
  ).as('faces');
}

export function hasPeople<O>(qb: SelectQueryBuilder<DB, 'asset', O>, personIds: string[]) {
  return qb.innerJoin(
    (eb) =>
      eb
        .selectFrom('asset_face')
        .select('assetId')
        .where('personId', '=', anyUuid(personIds!))
        .where('deletedAt', 'is', null)
        .where('isVisible', 'is', true)
        .groupBy('assetId')
        .having((eb) => eb.fn.count('personId').distinct(), '=', personIds.length)
        .as('has_people'),
    (join) => join.onRef('has_people.assetId', '=', 'asset.id'),
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

export function withTags(eb: ExpressionBuilder<DB, 'asset'>) {
  return jsonArrayFrom(
    eb
      .selectFrom('tag')
      .select(columns.tag)
      .innerJoin('tag_asset', 'tag.id', 'tag_asset.tagId')
      .whereRef('asset.id', '=', 'tag_asset.assetId'),
  ).as('tags');
}

export function truncatedDate<O>(order: AssetOrderBy = AssetOrderBy.TakenAt, size?: 'DAY' | 'MONTH') {
  return sql<O>`date_trunc(${sql.lit(size ?? 'MONTH')}, ${sql.ref(order === AssetOrderBy.CreatedAt ? 'asset.createdAt' : 'localDateTime')} AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'`;
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
    .$if(!!options.visibility, (qb) =>
      options.visibility === 'not-locked'
        ? qb.where('asset.visibility', '!=', AssetVisibility.Locked)
        : qb.where('asset.visibility', '=', options.visibility!),
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
      qb.where(sql`f_unaccent(asset."originalPath")`, 'ilike', sql`'%' || f_unaccent(${options.originalPath}) || '%'`),
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
    .$if(!!(options.withFaces || options.withPeople), (qb) => qb.select(withFacesAndPeople))
    .$if(!options.withDeleted, (qb) => qb.where('asset.deletedAt', 'is', null));
}

type ExifFilterField = Extract<
  keyof SearchFilterBranch,
  'city' | 'state' | 'country' | 'make' | 'model' | 'lensModel' | 'description' | 'rating' | 'fileSizeInBytes'
>;

const EXIF_FILTER_FIELDS: ReadonlySet<string> = new Set<ExifFilterField>([
  'city',
  'state',
  'country',
  'make',
  'model',
  'lensModel',
  'description',
  'rating',
  'fileSizeInBytes',
]);

type ExifOrderField = SearchOrderField.FileSizeInBytes | SearchOrderField.Rating;

const EXIF_ORDER_FIELDS: ReadonlySet<SearchOrderField> = new Set<ExifOrderField>([
  SearchOrderField.FileSizeInBytes,
  SearchOrderField.Rating,
]);

// the asset_exif join is only added when a filter or the order actually references an exif column
function exifJoinRequired(filter: SearchFilter, orderField: SearchOrderField): boolean {
  const branches = [filter, ...(filter.or ?? [])];
  return (
    EXIF_ORDER_FIELDS.has(orderField) ||
    branches.some((branch) => Object.keys(branch).some((key) => EXIF_FILTER_FIELDS.has(key)))
  );
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

function albumIdsPredicates(eb: AssetExpressionBuilder, { any, all, none }: IdsFilter = {}) {
  const predicates: Expression<SqlBool>[] = [];
  if (any) {
    predicates.push(eb.exists(albumAssets(eb).where('album_asset.albumId', '=', anyUuid(any))));
  }
  if (all) {
    predicates.push(
      all.length === 1
        ? eb.exists(albumAssets(eb).where('album_asset.albumId', '=', anyUuid(all)))
        : eb.exists(
            albumAssets(eb)
              .select('album_asset.assetId')
              .where('album_asset.albumId', '=', anyUuid(all))
              .groupBy('album_asset.assetId')
              .having((eb) => eb.fn.count('album_asset.albumId').distinct(), '=', all.length),
          ),
    );
  }
  if (none) {
    predicates.push(eb.not(eb.exists(albumAssets(eb).where('album_asset.albumId', '=', anyUuid(none)))));
  }
  return predicates;
}

function personIdsPredicates(eb: AssetExpressionBuilder, { any, all, none }: IdsFilter = {}) {
  const predicates: Expression<SqlBool>[] = [];
  if (any) {
    predicates.push(eb.exists(visibleFaces(eb).where('asset_face.personId', '=', anyUuid(any))));
  }
  if (all) {
    predicates.push(
      all.length === 1
        ? eb.exists(visibleFaces(eb).where('asset_face.personId', '=', anyUuid(all)))
        : eb.exists(
            visibleFaces(eb)
              .select('asset_face.assetId')
              .where('asset_face.personId', '=', anyUuid(all))
              .groupBy('asset_face.assetId')
              .having((eb) => eb.fn.count('asset_face.personId').distinct(), '=', all.length),
          ),
    );
  }
  if (none) {
    predicates.push(eb.not(eb.exists(visibleFaces(eb).where('asset_face.personId', '=', anyUuid(none)))));
  }
  return predicates;
}

function tagIdsPredicates(eb: AssetExpressionBuilder, { any, all, none }: IdsFilter = {}) {
  const descendantTagAssets = (ids: string[]) =>
    tagAssets(eb)
      .innerJoin('tag_closure', 'tag_asset.tagId', 'tag_closure.id_descendant')
      .where('tag_closure.id_ancestor', '=', anyUuid(ids));
  const predicates: Expression<SqlBool>[] = [];
  if (any) {
    predicates.push(eb.exists(descendantTagAssets(any)));
  }
  if (all) {
    predicates.push(
      all.length === 1
        ? eb.exists(descendantTagAssets(all))
        : eb.exists(
            descendantTagAssets(all)
              .select('tag_asset.assetId')
              .groupBy('tag_asset.assetId')
              .having((eb) => eb.fn.count('tag_closure.id_ancestor').distinct(), '>=', all.length),
          ),
    );
  }
  if (none) {
    predicates.push(eb.not(eb.exists(descendantTagAssets(none))));
  }
  return predicates;
}

function idPredicates(
  eb: AssetExpressionBuilder,
  column: 'asset.id' | 'asset.libraryId',
  filter: IdFilter | IdFilterNullable = {},
) {
  const predicates: Expression<SqlBool>[] = [];
  if (filter.eq !== undefined) {
    predicates.push(filter.eq === null ? eb(column, 'is', null) : eb(column, '=', filter.eq));
  }
  if (filter.ne !== undefined) {
    predicates.push(filter.ne === null ? eb(column, 'is not', null) : eb(column, '!=', filter.ne));
  }
  return predicates;
}

function typePredicates(
  eb: AssetExpressionBuilder,
  filter: { eq?: AssetType; ne?: AssetType; in?: AssetType[]; notIn?: AssetType[] } = {},
) {
  const predicates: Expression<SqlBool>[] = [];
  if (filter.eq !== undefined) {
    predicates.push(eb('asset.type', '=', filter.eq));
  }
  if (filter.ne !== undefined) {
    predicates.push(eb('asset.type', '!=', filter.ne));
  }
  if (filter.in !== undefined) {
    predicates.push(eb('asset.type', 'in', filter.in));
  }
  if (filter.notIn !== undefined) {
    predicates.push(eb('asset.type', 'not in', filter.notIn));
  }
  return predicates;
}

function visibilityPredicates(
  eb: AssetExpressionBuilder,
  filter: { eq?: AssetVisibility; ne?: AssetVisibility; in?: AssetVisibility[]; notIn?: AssetVisibility[] } = {},
) {
  const predicates: Expression<SqlBool>[] = [];
  if (filter.eq !== undefined) {
    predicates.push(eb('asset.visibility', '=', filter.eq));
  }
  if (filter.ne !== undefined) {
    predicates.push(eb('asset.visibility', '!=', filter.ne));
  }
  if (filter.in !== undefined) {
    predicates.push(eb('asset.visibility', 'in', filter.in));
  }
  if (filter.notIn !== undefined) {
    predicates.push(eb('asset.visibility', 'not in', filter.notIn));
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

function stringEqNeInPredicates(
  eb: AssetExpressionBuilder,
  column: StringColumn,
  filter: StringFilterNullable | StringPatternFilter = {},
) {
  const predicates: Expression<SqlBool>[] = [];
  if (filter.eq !== undefined) {
    predicates.push(filter.eq === null ? eb(column, 'is', null) : eb(column, '=', filter.eq));
  }
  if (filter.ne !== undefined) {
    predicates.push(filter.ne === null ? eb(column, 'is not', null) : eb(column, '!=', filter.ne));
  }
  if (filter.in !== undefined) {
    predicates.push(eb(column, 'in', filter.in));
  }
  if (filter.notIn !== undefined) {
    predicates.push(eb(column, 'not in', filter.notIn));
  }
  return predicates;
}

function stringPatternPredicates(eb: AssetExpressionBuilder, column: StringColumn, filter: StringPatternFilter = {}) {
  const ref = sql.ref(column);
  const predicates = stringEqNeInPredicates(eb, column, filter);
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

type NumberColumn = 'asset_exif.rating' | 'asset_exif.fileSizeInByte';

function numberPredicates(
  eb: AssetExpressionBuilder,
  column: NumberColumn,
  filter: NumberFilter | NumberFilterNullable = {},
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

type DateColumn = 'asset.fileCreatedAt' | 'asset.createdAt' | 'asset.updatedAt' | 'asset.deletedAt';

function datePredicates(eb: AssetExpressionBuilder, column: DateColumn, filter: DateFilter | DateFilterNullable = {}) {
  const predicates: Expression<SqlBool>[] = [];
  if (filter.eq !== undefined) {
    predicates.push(filter.eq === null ? eb(column, 'is', null) : eb(column, '=', filter.eq));
  }
  if (filter.ne !== undefined) {
    predicates.push(filter.ne === null ? eb(column, 'is not', null) : eb(column, '!=', filter.ne));
  }
  if (filter.gt !== undefined) {
    predicates.push(eb(column, '>', filter.gt));
  }
  if (filter.gte !== undefined) {
    predicates.push(eb(column, '>=', filter.gte));
  }
  if (filter.lt !== undefined) {
    predicates.push(eb(column, '<', filter.lt));
  }
  if (filter.lte !== undefined) {
    predicates.push(eb(column, '<=', filter.lte));
  }
  return predicates;
}

function checksumPredicates(eb: AssetExpressionBuilder, filter: StringFilter = {}) {
  const predicates: Expression<SqlBool>[] = [];
  if (filter.eq !== undefined) {
    predicates.push(eb('asset.checksum', '=', fromChecksum(filter.eq)));
  }
  if (filter.ne !== undefined) {
    predicates.push(eb('asset.checksum', '!=', fromChecksum(filter.ne)));
  }
  if (filter.in !== undefined) {
    predicates.push(
      eb(
        'asset.checksum',
        'in',
        filter.in.map((checksum) => fromChecksum(checksum)),
      ),
    );
  }
  if (filter.notIn !== undefined) {
    predicates.push(
      eb(
        'asset.checksum',
        'not in',
        filter.notIn.map((checksum) => fromChecksum(checksum)),
      ),
    );
  }
  return predicates;
}

// predicates are collected as expressions rather than chained `where` calls so the same
// helpers can build each `or` branch, which must compose into eb.and/eb.or
function branchPredicates(eb: AssetExpressionBuilder, branch: SearchFilterBranch) {
  const { encodedVideoPath } = branch;
  const albumExists = eb.exists(albumAssets(eb));
  const personExists = eb.exists(visibleFaces(eb));
  const tagExists = eb.exists(tagAssets(eb));
  const encodedVideoExists = eb.exists(
    eb
      .selectFrom('asset_file')
      .whereRef('asset_file.assetId', '=', 'asset.id')
      .where('asset_file.type', '=', AssetFileType.EncodedVideo),
  );
  return [
    ...idPredicates(eb, 'asset.id', branch.id),
    ...idPredicates(eb, 'asset.libraryId', branch.libraryId),
    ...typePredicates(eb, branch.type),
    ...visibilityPredicates(eb, branch.visibility),
    ...(branch.isFavorite ? [eb('asset.isFavorite', '=', branch.isFavorite.eq)] : []),
    ...(branch.isOffline ? [eb('asset.isOffline', '=', branch.isOffline.eq)] : []),
    ...(branch.isMotion ? [eb('asset.livePhotoVideoId', branch.isMotion.eq ? 'is not' : 'is', null)] : []),
    ...(branch.isEncoded ? [branch.isEncoded.eq ? encodedVideoExists : eb.not(encodedVideoExists)] : []),
    ...(branch.hasAlbums ? [branch.hasAlbums.eq ? albumExists : eb.not(albumExists)] : []),
    ...(branch.hasPeople ? [branch.hasPeople.eq ? personExists : eb.not(personExists)] : []),
    ...(branch.hasTags ? [branch.hasTags.eq ? tagExists : eb.not(tagExists)] : []),
    ...stringEqNeInPredicates(eb, 'asset_exif.city', branch.city),
    ...stringEqNeInPredicates(eb, 'asset_exif.state', branch.state),
    ...stringEqNeInPredicates(eb, 'asset_exif.country', branch.country),
    ...stringEqNeInPredicates(eb, 'asset_exif.make', branch.make),
    ...stringEqNeInPredicates(eb, 'asset_exif.model', branch.model),
    ...stringEqNeInPredicates(eb, 'asset_exif.lensModel', branch.lensModel),
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
    ...numberPredicates(eb, 'asset_exif.rating', branch.rating),
    ...numberPredicates(eb, 'asset_exif.fileSizeInByte', branch.fileSizeInBytes),
    ...datePredicates(eb, 'asset.fileCreatedAt', branch.takenAt),
    ...datePredicates(eb, 'asset.createdAt', branch.createdAt),
    ...datePredicates(eb, 'asset.updatedAt', branch.updatedAt),
    ...datePredicates(eb, 'asset.deletedAt', branch.trashedAt),
    ...albumIdsPredicates(eb, branch.albumIds),
    ...personIdsPredicates(eb, branch.personIds),
    ...tagIdsPredicates(eb, branch.tagIds),
    ...checksumPredicates(eb, branch.checksum),
    ...(encodedVideoPath
      ? [
          eb.exists(
            eb
              .selectFrom('asset_file')
              .whereRef('asset_file.assetId', '=', 'asset.id')
              .where('asset_file.type', '=', AssetFileType.EncodedVideo)
              .where('asset_file.isEdited', '=', false)
              .$if(encodedVideoPath.eq !== undefined, (qb) => qb.where('asset_file.path', '=', encodedVideoPath.eq!))
              .$if(encodedVideoPath.ne !== undefined, (qb) => qb.where('asset_file.path', '!=', encodedVideoPath.ne!))
              .$if(encodedVideoPath.in !== undefined, (qb) => qb.where('asset_file.path', 'in', encodedVideoPath.in!))
              .$if(encodedVideoPath.notIn !== undefined, (qb) =>
                qb.where('asset_file.path', 'not in', encodedVideoPath.notIn!),
              ),
          ),
        ]
      : []),
  ];
}

function applySearchOrder<O>(
  qb: SelectQueryBuilder<DB, 'asset' | 'asset_exif', O>,
  field: SearchOrderField,
  direction: AssetOrder,
) {
  switch (field) {
    case SearchOrderField.FileCreatedAt: {
      return qb.orderBy('asset.fileCreatedAt', direction);
    }
    case SearchOrderField.LocalDateTime: {
      return qb.orderBy('asset.localDateTime', direction);
    }
    case SearchOrderField.FileSizeInBytes: {
      return qb.orderBy('asset_exif.fileSizeInByte', direction);
    }
    case SearchOrderField.Rating: {
      return qb.orderBy('asset_exif.rating', direction);
    }
  }
}

export function searchAssetBuilder(kysely: Kysely<DB>, options: AssetSearchBuilderV3Options) {
  const filter = options.filter ?? {};
  const orderField = options.order?.field ?? SearchOrderField.FileCreatedAt;
  const orderDirection = options.order?.direction ?? AssetOrder.Desc;
  const needsExifJoin = exifJoinRequired(filter, orderField);

  return kysely
    .withPlugin(joinDeduplicationPlugin)
    .selectFrom('asset')
    .$if(needsExifJoin && !options.withExif, (qb) => qb.innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId'))
    .$if(!!options.withExif && needsExifJoin, withExifInner)
    .$if(!!options.withExif && !needsExifJoin, withExif)
    .$if(!!options.userIds && options.userIds.length > 0, (qb) =>
      qb.where('asset.ownerId', '=', anyUuid(options.userIds!)),
    )
    .$if(!!(options.withFaces || options.withPeople), (qb) => qb.select(withFacesAndPeople))
    .$if(options.withStacked === false, (qb) => qb.where('asset.stackId', 'is', null))
    .where((eb) => {
      const predicates = branchPredicates(eb, filter);
      if (filter.or && filter.or.length > 0) {
        predicates.push(eb.or(filter.or.map((branch) => eb.and(branchPredicates(eb, branch)))));
      }
      return predicates.length > 0 ? eb.and(predicates) : eb.lit(true);
    })
    .$call((qb) =>
      // cast: `.$if(needsExifJoin, ...)` doesn't carry the join into the type; `exifJoinRequired` guarantees it at runtime.
      applySearchOrder(qb as SelectQueryBuilder<DB, 'asset' | 'asset_exif', unknown>, orderField, orderDirection),
    );
}

export const searchMetadataV3Examples: GenerateSqlQueries[] = [
  { name: 'baseline', params: [{ size: 100 }, { userIds: [DummyValue.UUID] }] },
  { name: 'empty', params: [{ size: 100 }, {}] },
  {
    name: 'or-exif-only',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { or: [{ city: { eq: DummyValue.STRING } }] } }],
  },
  {
    name: 'string-eq-null',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { city: { eq: null } } }],
  },
  {
    name: 'string-pattern-like',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { description: { like: DummyValue.STRING } } }],
  },
  {
    name: 'string-pattern-notLike',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { description: { notLike: DummyValue.STRING } } }],
  },
  {
    name: 'string-pattern-startsWith',
    params: [
      { size: 100 },
      { userIds: [DummyValue.UUID], filter: { originalFileName: { startsWith: DummyValue.STRING } } },
    ],
  },
  {
    name: 'string-similarity-ocr',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { ocr: { matches: DummyValue.STRING } } }],
  },
  {
    name: 'ids-any',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { albumIds: { any: [DummyValue.UUID] } } }],
  },
  {
    name: 'ids-all',
    params: [
      { size: 100 },
      { userIds: [DummyValue.UUID], filter: { personIds: { all: [DummyValue.UUID, DummyValue.UUID] } } },
    ],
  },
  {
    name: 'ids-all-single',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { albumIds: { all: [DummyValue.UUID] } } }],
  },
  {
    name: 'ids-none',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { tagIds: { none: [DummyValue.UUID] } } }],
  },
  {
    name: 'ids-tags-all',
    params: [
      { size: 100 },
      { userIds: [DummyValue.UUID], filter: { tagIds: { all: [DummyValue.UUID, DummyValue.UUID] } } },
    ],
  },
  {
    name: 'has-albums-false',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { hasAlbums: { eq: false } } }],
  },
  {
    name: 'is-encoded',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { isEncoded: { eq: true } } }],
  },
  {
    name: 'number-range',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { fileSizeInBytes: { gte: 100, lte: 1000 } } }],
  },
  {
    name: 'date-eq',
    params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { takenAt: { eq: DummyValue.DATE } } }],
  },
  {
    name: 'date-range',
    params: [
      { size: 100 },
      {
        userIds: [DummyValue.UUID],
        filter: { takenAt: { gte: DummyValue.DATE, lt: DummyValue.DATE } },
      },
    ],
  },
  {
    name: 'order-fileSize-noExif',
    params: [
      { size: 100 },
      {
        userIds: [DummyValue.UUID],
        order: { field: SearchOrderField.FileSizeInBytes, direction: AssetOrder.Desc },
        withExif: false,
      },
    ],
  },
  {
    name: 'order-rating-withExif',
    params: [
      { size: 100 },
      {
        userIds: [DummyValue.UUID],
        order: { field: SearchOrderField.Rating, direction: AssetOrder.Asc },
        withExif: true,
      },
    ],
  },
  {
    name: 'or-branches',
    params: [
      { size: 100 },
      {
        userIds: [DummyValue.UUID],
        filter: {
          or: [{ isFavorite: { eq: true } }, { personIds: { any: [DummyValue.UUID] } }],
        },
      },
    ],
  },
  {
    name: 'or-with-top-level',
    params: [
      { size: 100 },
      {
        userIds: [DummyValue.UUID],
        filter: {
          takenAt: { gte: DummyValue.DATE, lt: DummyValue.DATE },
          or: [{ isFavorite: { eq: true } }, { albumIds: { any: [DummyValue.UUID] } }],
        },
      },
    ],
  },
];

export const searchStatisticsV3Examples: GenerateSqlQueries[] = [
  { name: 'baseline', params: [{ userIds: [DummyValue.UUID] }] },
  {
    name: 'with-filter',
    params: [
      {
        userIds: [DummyValue.UUID],
        filter: {
          takenAt: { gte: DummyValue.DATE, lt: DummyValue.DATE },
          fileSizeInBytes: { gte: 100 },
        },
      },
    ],
  },
  {
    name: 'with-or',
    params: [
      {
        userIds: [DummyValue.UUID],
        filter: {
          or: [{ isFavorite: { eq: true } }, { hasAlbums: { eq: false } }],
        },
      },
    ],
  },
];

export type ReindexVectorIndexOptions = { indexName: string; lists?: number };

type VectorIndexQueryOptions = { table: string; vectorExtension: VectorExtension } & ReindexVectorIndexOptions;

export function vectorIndexQuery({ vectorExtension, table, indexName, lists }: VectorIndexQueryOptions): string {
  switch (vectorExtension) {
    case DatabaseExtension.VectorChord: {
      return `
        CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} USING vchordrq (embedding vector_cosine_ops) WITH (options = $$
        residual_quantization = false
        [build.internal]
        lists = [${lists ?? 1}]
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
