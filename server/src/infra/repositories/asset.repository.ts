import {
  AssetSearchOptions,
  IAssetRepository,
  LivePhotoSearchOptions,
  MapMarker,
  MapMarkerSearchOptions,
  Paginated,
  PaginationOptions,
  WithoutProperty,
  WithProperty,
} from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { FindOptionsRelations, FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { AssetEntity, AssetType } from '../entities';
import OptionalBetween from '../utils/optional-between.util';
import { paginate } from '../utils/pagination.util';

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(@InjectRepository(AssetEntity) private repository: Repository<AssetEntity>) {}

  getByDate(ownerId: string, date: Date): Promise<AssetEntity[]> {
    // For reference of a correct approach although slower

    // let builder = this.repository
    //   .createQueryBuilder('asset')
    //   .leftJoin('asset.exifInfo', 'exifInfo')
    //   .where('asset.ownerId = :ownerId', { ownerId })
    //   .andWhere(
    //     `coalesce(date_trunc('day', asset."fileCreatedAt", "exifInfo"."timeZone") at TIME ZONE "exifInfo"."timeZone", date_trunc('day', asset."fileCreatedAt")) IN (:date)`,
    //     { date },
    //   )
    //   .andWhere('asset.isVisible = true')
    //   .andWhere('asset.isArchived = false')
    //   .orderBy('asset.fileCreatedAt', 'DESC');

    // return builder.getMany();

    return this.repository.find({
      where: {
        ownerId,
        isVisible: true,
        isArchived: false,
        fileCreatedAt: OptionalBetween(date, DateTime.fromJSDate(date).plus({ day: 1 }).toJSDate()),
      },
      relations: {
        exifInfo: true,
      },
      order: {
        fileCreatedAt: 'DESC',
      },
    });
  }

  getByIds(ids: string[]): Promise<AssetEntity[]> {
    return this.repository.find({
      where: { id: In(ids) },
      relations: {
        exifInfo: true,
        smartInfo: true,
        tags: true,
        faces: {
          person: true,
        },
      },
    });
  }
  async deleteAll(ownerId: string): Promise<void> {
    await this.repository.delete({ ownerId });
  }

  getAll(pagination: PaginationOptions, options: AssetSearchOptions = {}): Paginated<AssetEntity> {
    return paginate(this.repository, pagination, {
      where: {
        isVisible: options.isVisible,
        type: options.type,
      },
      relations: {
        exifInfo: true,
        smartInfo: true,
        tags: true,
        faces: {
          person: true,
        },
      },
      order: {
        // Ensures correct order when paginating
        createdAt: 'ASC',
      },
    });
  }

  async save(asset: Partial<AssetEntity>): Promise<AssetEntity> {
    const { id } = await this.repository.save(asset);
    return this.repository.findOneOrFail({
      where: { id },
      relations: {
        exifInfo: true,
        owner: true,
        smartInfo: true,
        tags: true,
        faces: true,
      },
    });
  }

  findLivePhotoMatch(options: LivePhotoSearchOptions): Promise<AssetEntity | null> {
    const { ownerId, otherAssetId, livePhotoCID, type } = options;

    return this.repository.findOne({
      where: {
        id: Not(otherAssetId),
        ownerId,
        type,
        exifInfo: {
          livePhotoCID,
        },
      },
      relations: {
        exifInfo: true,
      },
    });
  }

  getWithout(pagination: PaginationOptions, property: WithoutProperty): Paginated<AssetEntity> {
    let relations: FindOptionsRelations<AssetEntity> = {};
    let where: FindOptionsWhere<AssetEntity> | FindOptionsWhere<AssetEntity>[] = {};

    switch (property) {
      case WithoutProperty.THUMBNAIL:
        where = [
          { resizePath: IsNull(), isVisible: true },
          { resizePath: '', isVisible: true },
          { webpPath: IsNull(), isVisible: true },
          { webpPath: '', isVisible: true },
        ];
        break;

      case WithoutProperty.ENCODED_VIDEO:
        where = [
          { type: AssetType.VIDEO, encodedVideoPath: IsNull() },
          { type: AssetType.VIDEO, encodedVideoPath: '' },
        ];
        break;

      case WithoutProperty.EXIF:
        relations = {
          exifInfo: true,
        };
        where = {
          isVisible: true,
          exifInfo: {
            assetId: IsNull(),
          },
        };
        break;

      case WithoutProperty.CLIP_ENCODING:
        relations = {
          smartInfo: true,
        };
        where = {
          isVisible: true,
          resizePath: Not(IsNull()),
          smartInfo: {
            clipEmbedding: IsNull(),
          },
        };
        break;

      case WithoutProperty.OBJECT_TAGS:
        relations = {
          smartInfo: true,
        };
        where = {
          resizePath: Not(IsNull()),
          isVisible: true,
          smartInfo: {
            tags: IsNull(),
          },
        };
        break;

      case WithoutProperty.FACES:
        relations = {
          faces: true,
        };
        where = {
          resizePath: Not(IsNull()),
          isVisible: true,
          faces: {
            assetId: IsNull(),
            personId: IsNull(),
          },
        };
        break;

      case WithoutProperty.SIDECAR:
        where = [
          { sidecarPath: IsNull(), isVisible: true },
          { sidecarPath: '', isVisible: true },
        ];
        break;

      default:
        throw new Error(`Invalid getWithout property: ${property}`);
    }

    return paginate(this.repository, pagination, {
      relations,
      where,
      order: {
        // Ensures correct order when paginating
        createdAt: 'ASC',
      },
    });
  }

  getWith(pagination: PaginationOptions, property: WithProperty): Paginated<AssetEntity> {
    let where: FindOptionsWhere<AssetEntity> | FindOptionsWhere<AssetEntity>[] = {};

    switch (property) {
      case WithProperty.SIDECAR:
        where = [{ sidecarPath: Not(IsNull()), isVisible: true }];
        break;

      default:
        throw new Error(`Invalid getWith property: ${property}`);
    }

    return paginate(this.repository, pagination, {
      where,
      order: {
        // Ensures correct order when paginating
        createdAt: 'ASC',
      },
    });
  }

  getFirstAssetForAlbumId(albumId: string): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: { albums: { id: albumId } },
      order: { fileCreatedAt: 'DESC' },
    });
  }

  async getMapMarkers(ownerId: string, options: MapMarkerSearchOptions = {}): Promise<MapMarker[]> {
    const { isFavorite, fileCreatedAfter, fileCreatedBefore } = options;

    const assets = await this.repository.find({
      select: {
        id: true,
        exifInfo: {
          latitude: true,
          longitude: true,
        },
      },
      where: {
        ownerId,
        isVisible: true,
        isArchived: false,
        exifInfo: {
          latitude: Not(IsNull()),
          longitude: Not(IsNull()),
        },
        isFavorite,
        fileCreatedAt: OptionalBetween(fileCreatedAfter, fileCreatedBefore),
      },
      relations: {
        exifInfo: true,
      },
      order: {
        fileCreatedAt: 'DESC',
      },
    });

    return assets.map((asset) => ({
      id: asset.id,

      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      lat: asset.exifInfo!.latitude!,

      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      lon: asset.exifInfo!.longitude!,
    }));
  }
}
