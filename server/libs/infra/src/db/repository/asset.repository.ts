import { AssetSearchOptions, IAssetRepository, WithoutProperty } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { AssetEntity, AssetType } from '../entities';

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(@InjectRepository(AssetEntity) private repository: Repository<AssetEntity>) {}

  getByIds(ids: string[]): Promise<AssetEntity[]> {
    return this.repository.find({
      where: { id: In(ids) },
      relations: {
        exifInfo: true,
        smartInfo: true,
        tags: true,
      },
    });
  }

  async deleteAll(ownerId: string): Promise<void> {
    await this.repository.delete({ ownerId });
  }

  getAll(options?: AssetSearchOptions | undefined): Promise<AssetEntity[]> {
    options = options || {};

    return this.repository.find({
      where: {
        isVisible: options.isVisible,
      },
      relations: {
        exifInfo: true,
        smartInfo: true,
        tags: true,
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
      },
    });
  }

  findLivePhotoMatch(livePhotoCID: string, otherAssetId: string, type: AssetType): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: {
        id: Not(otherAssetId),
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

  getWithout(property: WithoutProperty): Promise<AssetEntity[]> {
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
          resizePath: Not(IsNull()),
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
          resizePath: IsNull(),
          isVisible: true,
          smartInfo: {
            tags: IsNull(),
          },
        };
        break;

      default:
        throw new Error(`Invalid getWithout property: ${property}`);
    }

    return this.repository.find({
      relations,
      where,
    });
  }

  getFirstAssetForAlbumId(albumId: string): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: { albums: { id: albumId } },
      order: { fileCreatedAt: 'DESC' },
    });
  }
}
