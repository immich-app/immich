import { AssetSearchBuilderOptions, Paginated, PaginationOptions } from '@app/domain';
import _ from 'lodash';
import {
  Between,
  Brackets,
  FindManyOptions,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { PaginatedBuilderOptions, PaginationMode, PaginationResult, chunks, setUnion } from '../domain/domain.util';
import { AssetEntity } from './entities';
import { DATABASE_PARAMETER_CHUNK_SIZE } from './infra.util';

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

export const isValidInteger = (value: number, options: { min?: number; max?: number }): value is number => {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;
  return Number.isInteger(value) && value >= min && value <= max;
};

function paginationHelper<Entity extends ObjectLiteral>(items: Entity[], take: number): PaginationResult<Entity> {
  const hasNextPage = items.length > take;
  items.splice(take);

  return { items, hasNextPage };
}

export async function paginate<Entity extends ObjectLiteral>(
  repository: Repository<Entity>,
  { take, skip }: PaginationOptions,
  searchOptions?: FindManyOptions<Entity>,
): Paginated<Entity> {
  const items = await repository.find(
    _.omitBy(
      {
        ...searchOptions,
        // Take one more item to check if there's a next page
        take: take + 1,
        skip,
      },
      _.isUndefined,
    ),
  );

  return paginationHelper(items, take);
}

export async function paginatedBuilder<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  { take, skip, mode }: PaginatedBuilderOptions,
): Paginated<Entity> {
  if (mode === PaginationMode.LIMIT_OFFSET) {
    qb.limit(take + 1).offset(skip);
  } else {
    qb.take(take + 1).skip(skip);
  }

  const items = await qb.getMany();
  return paginationHelper(items, take);
}

export const asVector = (embedding: number[], quote = false) =>
  quote ? `'[${embedding.join(',')}]'` : `[${embedding.join(',')}]`;

/**
 * Wraps a method that takes a collection of parameters and sequentially calls it with chunks of the collection,
 * to overcome the maximum number of parameters allowed by the database driver.
 *
 * @param options.paramIndex The index of the function parameter to chunk. Defaults to 0.
 * @param options.flatten Whether to flatten the results. Defaults to false.
 */
export function Chunked(options: { paramIndex?: number; mergeFn?: (results: any) => any } = {}): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const parameterIndex = options.paramIndex ?? 0;
    descriptor.value = async function (...arguments_: any[]) {
      const argument = arguments_[parameterIndex];

      // Early return if argument length is less than or equal to the chunk size.
      if (
        (Array.isArray(argument) && argument.length <= DATABASE_PARAMETER_CHUNK_SIZE) ||
        (argument instanceof Set && argument.size <= DATABASE_PARAMETER_CHUNK_SIZE)
      ) {
        return await originalMethod.apply(this, arguments_);
      }

      return Promise.all(
        chunks(argument, DATABASE_PARAMETER_CHUNK_SIZE).map(async (chunk) => {
          await Reflect.apply(originalMethod, this, [
            ...arguments_.slice(0, parameterIndex),
            chunk,
            ...arguments_.slice(parameterIndex + 1),
          ]);
        }),
      ).then((results) => (options.mergeFn ? options.mergeFn(results) : results));
    };
  };
}

export function ChunkedArray(options?: { paramIndex?: number }): MethodDecorator {
  return Chunked({ ...options, mergeFn: _.flatten });
}

export function ChunkedSet(options?: { paramIndex?: number }): MethodDecorator {
  return Chunked({ ...options, mergeFn: setUnion });
}

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

  const path = _.pick(options, ['encodedVideoPath', 'originalFileName', 'originalPath', 'resizePath', 'webpPath']);
  builder.andWhere(_.omitBy(path, _.isUndefined));

  const status = _.pick(options, ['isExternal', 'isFavorite', 'isOffline', 'isReadOnly', 'isVisible', 'type']);
  const { isArchived, isEncoded, isMotion, withArchived } = options;
  builder.andWhere(
    _.omitBy(
      {
        ...status,
        isArchived: isArchived ?? withArchived,
        encodedVideoPath: isEncoded ? Not(IsNull()) : undefined,
        livePhotoVideoId: isMotion ? Not(IsNull()) : undefined,
      },
      _.isUndefined,
    ),
  );

  if (options.isNotInAlbum) {
    builder
      .leftJoin(`${builder.alias}.albums`, 'albums')
      .andWhere('albums.id IS NULL')
      .andWhere(`${builder.alias}.isVisible = true`);
  }

  if (options.withFaces || options.withPeople) {
    builder.leftJoinAndSelect(`${builder.alias}.faces`, 'faces');
  }

  if (options.withPeople) {
    builder.leftJoinAndSelect(`${builder.alias}.person`, 'person');
  }

  if (options.withSmartInfo) {
    builder.leftJoinAndSelect(`${builder.alias}.smartInfo`, 'smartInfo');
  }

  if (options.personIds && options.personIds.length > 0) {
    builder
      .leftJoin(`${builder.alias}.faces`, 'faces')
      .andWhere('faces.personId IN (:...personIds)', { personIds: options.personIds })
      .addGroupBy(`${builder.alias}.id`)
      .having('COUNT(faces.id) = :personCount', { personCount: options.personIds.length });

    if (options.withExif) {
      builder.addGroupBy('exifInfo.assetId');
    }
  }

  if (options.withStacked) {
    builder
      .leftJoinAndSelect(`${builder.alias}.stack`, 'stack')
      .leftJoinAndSelect('stack.assets', 'stackedAssets')
      .andWhere(
        new Brackets((qb) => qb.where(`stack.primaryAssetId = ${builder.alias}.id`).orWhere('asset.stackId IS NULL')),
      );
  }

  const withDeleted =
    options.withDeleted ?? (options.trashedAfter !== undefined || options.trashedBefore !== undefined);
  if (withDeleted) {
    builder.withDeleted();
  }

  return builder;
}
