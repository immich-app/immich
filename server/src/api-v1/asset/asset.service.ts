import { BadRequestException, Injectable, Logger, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AssetEntity, AssetType } from './entities/asset.entity';
import _ from 'lodash';
import { GetAllAssetQueryDto } from './dto/get-all-asset-query.dto';
import { GetAllAssetReponseDto } from './dto/get-all-asset-response.dto';
import { createReadStream, stat } from 'fs';
import { ServeFileDto } from './dto/serve-file.dto';
import { Response as Res } from 'express';
import { promisify } from 'util';
import { DeleteAssetDto } from './dto/delete-asset.dto';
import { SearchAssetDto } from './dto/search-asset.dto';
import path from 'path';

const fileInfo = promisify(stat);

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

  public async updateThumbnailInfo(assetId: string, path: string) {
    return await this.assetRepository.update(assetId, {
      resizePath: path,
    });
  }

  public async createUserAsset(authUser: AuthUserDto, assetInfo: CreateAssetDto, path: string, mimeType: string) {
    const asset = new AssetEntity();
    asset.deviceAssetId = assetInfo.deviceAssetId;
    asset.userId = authUser.id;
    asset.deviceId = assetInfo.deviceId;
    asset.type = assetInfo.assetType || AssetType.OTHER;
    asset.originalPath = path;
    asset.createdAt = assetInfo.createdAt;
    asset.modifiedAt = assetInfo.modifiedAt;
    asset.isFavorite = assetInfo.isFavorite;
    asset.mimeType = mimeType;
    asset.duration = assetInfo.duration;

    try {
      return await this.assetRepository.save(asset);
    } catch (e) {
      Logger.error(`Error Create New Asset ${e}`, 'createUserAsset');
    }
  }

  public async getUserAssetsByDeviceId(authUser: AuthUserDto, deviceId: string) {
    const rows = await this.assetRepository.find({
      where: {
        userId: authUser.id,
        deviceId: deviceId,
      },
      select: ['deviceAssetId'],
    });

    const res = [];
    rows.forEach((v) => res.push(v.deviceAssetId));
    return res;
  }

  public async getAllAssetsNoPagination(authUser: AuthUserDto) {
    try {
      return await this.assetRepository
        .createQueryBuilder('a')
        .where('a."userId" = :userId', { userId: authUser.id })
        .orderBy('a."createdAt"::date', 'DESC')
        .getMany();
    } catch (e) {
      Logger.error(e, 'getAllAssets');
    }
  }

  public async findOne(authUser: AuthUserDto, deviceId: string, assetId: string): Promise<AssetEntity> {
    const rows = await this.assetRepository.query(
      'SELECT * FROM assets a WHERE a."deviceAssetId" = $1 AND a."userId" = $2 AND a."deviceId" = $3',
      [assetId, authUser.id, deviceId],
    );

    if (rows.lengh == 0) {
      throw new BadRequestException('Not Found');
    }

    return rows[0] as AssetEntity;
  }

  public async getAssetById(authUser: AuthUserDto, assetId: string) {
    return await this.assetRepository.findOne({
      where: {
        userId: authUser.id,
        id: assetId,
      },
      relations: ['exifInfo'],
    });
  }

  public async downloadFile(authUser: AuthUserDto, query: ServeFileDto, res: Res) {
    let file = null;
    const asset = await this.findOne(authUser, query.did, query.aid);

    if (query.isThumb === 'false' || !query.isThumb) {
      file = createReadStream(asset.originalPath);
    } else {
      file = createReadStream(asset.resizePath);
    }

    return new StreamableFile(file);
  }

  public async serveFile(authUser: AuthUserDto, query: ServeFileDto, res: Res, headers: any) {
    let file = null;
    const asset = await this.findOne(authUser, query.did, query.aid);

    if (!asset) {
      throw new BadRequestException('Asset does not exist');
    }
    // Handle Sending Images
    if (asset.type == AssetType.IMAGE || query.isThumb == 'true') {
      res.set({
        'Content-Type': asset.mimeType,
      });

      if (query.isThumb === 'false' || !query.isThumb) {
        file = createReadStream(asset.originalPath);
      } else {
        file = createReadStream(asset.resizePath);
      }

      file.on('error', (error) => {
        Logger.log(`Cannot create read stream ${error}`);
        return new BadRequestException('Cannot Create Read Stream');
      });
      return new StreamableFile(file);
    } else if (asset.type == AssetType.VIDEO) {
      // Handle Handling Video
      const { size } = await fileInfo(asset.originalPath);
      const range = headers.range;

      if (range) {
        /** Extracting Start and End value from Range Header */
        let [start, end] = range.replace(/bytes=/, '').split('-');
        start = parseInt(start, 10);
        end = end ? parseInt(end, 10) : size - 1;

        if (!isNaN(start) && isNaN(end)) {
          start = start;
          end = size - 1;
        }
        if (isNaN(start) && !isNaN(end)) {
          start = size - end;
          end = size - 1;
        }

        // Handle unavailable range request
        if (start >= size || end >= size) {
          console.error('Bad Request');
          // Return the 416 Range Not Satisfiable.
          res.status(416).set({
            'Content-Range': `bytes */${size}`,
          });

          throw new BadRequestException('Bad Request Range');
        }

        /** Sending Partial Content With HTTP Code 206 */

        res.status(206).set({
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': asset.mimeType,
        });

        const videoStream = createReadStream(asset.originalPath, { start: start, end: end });

        return new StreamableFile(videoStream);
      } else {
        res.set({
          'Content-Type': asset.mimeType,
        });

        return new StreamableFile(createReadStream(asset.originalPath));
      }
    }
  }

  public async deleteAssetById(authUser: AuthUserDto, assetIds: DeleteAssetDto) {
    const result = [];

    const target = assetIds.ids;
    for (const assetId of target) {
      const res = await this.assetRepository.delete({
        id: assetId,
        userId: authUser.id,
      });

      if (res.affected) {
        result.push({
          id: assetId,
          status: 'success',
        });
      } else {
        result.push({
          id: assetId,
          status: 'failed',
        });
      }
    }

    return result;
  }

  async getAssetSearchTerm(authUser: AuthUserDto): Promise<string[]> {
    const possibleSearchTerm = new Set<string>();
    const rows = await this.assetRepository.query(
      `
      select distinct si.tags, si.objects, e.orientation, e."lensModel", e.make, e.model , a.type, e.city, e.state, e.country
      from assets a
      left join exif e on a.id = e."assetId"
      left join smart_info si on a.id = si."assetId"
      where a."userId" = $1;
      `,
      [authUser.id],
    );

    rows.forEach((row) => {
      // tags
      row['tags']?.map((tag) => possibleSearchTerm.add(tag?.toLowerCase()));

      // objects
      row['objects']?.map((object) => possibleSearchTerm.add(object?.toLowerCase()));

      // asset's tyoe
      possibleSearchTerm.add(row['type']?.toLowerCase());

      // image orientation
      possibleSearchTerm.add(row['orientation']?.toLowerCase());

      // Lens model
      possibleSearchTerm.add(row['lensModel']?.toLowerCase());

      // Make and model
      possibleSearchTerm.add(row['make']?.toLowerCase());
      possibleSearchTerm.add(row['model']?.toLowerCase());

      // Location
      possibleSearchTerm.add(row['city']?.toLowerCase());
      possibleSearchTerm.add(row['state']?.toLowerCase());
      possibleSearchTerm.add(row['country']?.toLowerCase());
    });

    return Array.from(possibleSearchTerm).filter((x) => x != null);
  }

  async searchAsset(authUser: AuthUserDto, searchAssetDto: SearchAssetDto) {
    const query = `
    SELECT a.*
    FROM assets a
             LEFT JOIN smart_info si ON a.id = si."assetId"
             LEFT JOIN exif e ON a.id = e."assetId"

    WHERE a."userId" = $1
       AND 
       (
         TO_TSVECTOR('english', ARRAY_TO_STRING(si.tags, ',')) @@ PLAINTO_TSQUERY('english', $2) OR
         TO_TSVECTOR('english', ARRAY_TO_STRING(si.objects, ',')) @@ PLAINTO_TSQUERY('english', $2) OR
         e.exif_text_searchable_column @@ PLAINTO_TSQUERY('english', $2)
        );
    `;

    return await this.assetRepository.query(query, [authUser.id, searchAssetDto.searchTerm]);
  }

  async getCuratedLocation(authUser: AuthUserDto) {
    return await this.assetRepository.query(
      `
        select distinct on (e.city) a.id, e.city, a."resizePath", a."deviceAssetId", a."deviceId"
        from assets a
        left join exif e on a.id = e."assetId"
        where a."userId" = $1 
        and e.city is not null
        and a.type = 'IMAGE';
      `,
      [authUser.id],
    );
  }

  async getCuratedObject(authUser: AuthUserDto) {
    return await this.assetRepository.query(
      `
        select distinct on (unnest(si.objects)) a.id, unnest(si.objects) as "object", a."resizePath", a."deviceAssetId", a."deviceId"
        from assets a
        left join smart_info si on a.id = si."assetId"
        where a."userId" = $1 
        and si.objects is not null
      `,
      [authUser.id],
    );
  }
}
