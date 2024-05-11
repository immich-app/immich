import _ from 'lodash';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetSearchBuilderOptions } from 'src/interfaces/search.interface';
import { Between, IsNull, LessThanOrEqual, MoreThanOrEqual, Not, SelectQueryBuilder } from 'typeorm';

/**
 * Allows optional values unlike the regular Between and uses MoreThanOrEqual
 * or LessThanOrEqual when only one parameter is specified.
 */
export function OptionalBetween<T>(from?: T, to?: T) {
  if (from && to) {
    return Between(from, to);
  } else if (from) {
    return MoreThanOrEqual(from);
  } else if (to) {
    return LessThanOrEqual(to);
  }
}

export const asVector = (embedding: number[], quote = false) =>
  quote ? `'[${embedding.join(',')}]'` : `[${embedding.join(',')}]`;

export function searchAssetBuilder(
  builder: SelectQueryBuilder<AssetEntity>,
  options: AssetSearchBuilderOptions,
): SelectQueryBuilder<AssetEntity> {
  builder.andWhere(
    _.omitBy(
      {
        createdAt: OptionalBetween(options.createdAfter, options.createdBefore),
        updatedAt: OptionalBetween(options.updatedAfter, options.updatedBefore),
        deletedAt: OptionalBetween(options.trashedAfter, options.trashedBefore),
        fileCreatedAt: OptionalBetween(options.takenAfter, options.takenBefore),
      },
      _.isUndefined,
    ),
  );

  const exifInfo = _.omitBy(_.pick(options, ['city', 'country', 'lensModel', 'make', 'model', 'state']), _.isUndefined);
  const hasExifQuery = Object.keys(exifInfo).length > 0;

  if (options.withExif && !hasExifQuery) {
    builder.leftJoinAndSelect(`${builder.alias}.exifInfo`, 'exifInfo');
  }

  if (hasExifQuery) {
    options.withExif
      ? builder.leftJoinAndSelect(`${builder.alias}.exifInfo`, 'exifInfo')
      : builder.leftJoin(`${builder.alias}.exifInfo`, 'exifInfo');

    builder.andWhere({ exifInfo });
  }

  const id = _.pick(options, ['checksum', 'deviceAssetId', 'deviceId', 'id', 'libraryId']);
  builder.andWhere(_.omitBy(id, _.isUndefined));

  if (options.userIds) {
    builder.andWhere(`${builder.alias}.ownerId IN (:...userIds)`, { userIds: options.userIds });
  }

  const path = _.pick(options, ['encodedVideoPath', 'originalPath', 'previewPath', 'thumbnailPath']);
  builder.andWhere(_.omitBy(path, _.isUndefined));

  if (options.originalFileName) {
    builder.andWhere(`f_unaccent(${builder.alias}.originalFileName) ILIKE f_unaccent(:originalFileName)`, {
      originalFileName: `%${options.originalFileName}%`,
    });
  }

  const status = _.pick(options, ['isFavorite', 'isOffline', 'isVisible', 'type']);
  const {
    isArchived,
    isEncoded,
    isMotion,
    withArchived,
    isNotInAlbum,
    withFaces,
    withPeople,
    withSmartInfo,
    personIds,
    withExif,
    withStacked,
    trashedAfter,
    trashedBefore,
  } = options;
  builder.andWhere(
    _.omitBy(
      {
        ...status,
        isArchived: isArchived ?? (withArchived ? undefined : false),
        encodedVideoPath: isEncoded ? Not(IsNull()) : undefined,
        livePhotoVideoId: isMotion ? Not(IsNull()) : undefined,
      },
      _.isUndefined,
    ),
  );

  if (isNotInAlbum) {
    builder
      .leftJoin(`${builder.alias}.albums`, 'albums')
      .andWhere('albums.id IS NULL')
      .andWhere(`${builder.alias}.isVisible = true`);
  }

  if (withFaces || withPeople) {
    builder.leftJoinAndSelect(`${builder.alias}.faces`, 'faces');
  }

  if (withPeople) {
    builder.leftJoinAndSelect(`${builder.alias}.person`, 'person');
  }

  if (withSmartInfo) {
    builder.leftJoinAndSelect(`${builder.alias}.smartInfo`, 'smartInfo');
  }

  if (personIds && personIds.length > 0) {
    builder
      .leftJoin(`${builder.alias}.faces`, 'faces')
      .andWhere('faces.personId IN (:...personIds)', { personIds })
      .addGroupBy(`${builder.alias}.id`)
      .having('COUNT(DISTINCT faces.personId) = :personCount', { personCount: personIds.length });

    if (withExif) {
      builder.addGroupBy('exifInfo.assetId');
    }
  }

  if (withStacked) {
    builder.leftJoinAndSelect(`${builder.alias}.stack`, 'stack').leftJoinAndSelect('stack.assets', 'stackedAssets');
  }

  const withDeleted = options.withDeleted ?? (trashedAfter !== undefined || trashedBefore !== undefined);
  if (withDeleted) {
    builder.withDeleted();
  }

  return builder;
}
