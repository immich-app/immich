import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import { constants, createReadStream, ReadStream, stat } from 'fs';
import { ServeFileDto } from './dto/serve-file.dto';
import { Response as Res } from 'express';
import { promisify } from 'util';
import { DeleteAssetDto } from './dto/delete-asset.dto';
import { SearchAssetDto } from './dto/search-asset.dto';
import fs from 'fs/promises';

const fileInfo = promisify(stat);

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

  public async updateThumbnailInfo(asset: AssetEntity, thumbnailPath: string): Promise<AssetEntity> {
    const updatedAsset = await this.assetRepository
      .createQueryBuilder('assets')
      .update<AssetEntity>(AssetEntity, { ...asset, resizePath: thumbnailPath })
      .where('assets.id = :id', { id: asset.id })
      .returning('*')
      .updateEntity(true)
      .execute();

    return updatedAsset.raw[0];
  }

  public async createUserAsset(
    authUser: AuthUserDto,
    assetInfo: CreateAssetDto,
    path: string,
    mimeType: string,
  ): Promise<AssetEntity | undefined> {
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
    asset.duration = assetInfo.duration || null;

    try {
      const createdAsset = await this.assetRepository.save(asset);
      if (!createdAsset) {
        throw new Error('Asset not created');
      }
      return createdAsset;
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

    const res: string[] = [];
    rows.forEach((v) => res.push(v.deviceAssetId));
    return res;
  }

  public async getAllAssets(authUser: AuthUserDto) {
    try {
      return await this.assetRepository.find({
        where: {
          userId: authUser.id,
          resizePath: Not(IsNull()),
        },
        relations: ['exifInfo'],
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (e) {
      Logger.error(e, 'getAllAssets');
    }
  }

  public async findOne(deviceId: string, assetId: string): Promise<AssetEntity> {
    const rows = await this.assetRepository.query(
      'SELECT * FROM assets a WHERE a."deviceAssetId" = $1 AND a."deviceId" = $2',
      [assetId, deviceId],
    );

    if (rows.lengh == 0) {
      throw new BadRequestException('Not Found');
    }

    return rows[0] as AssetEntity;
  }

  public async getAssetById(authUser: AuthUserDto, assetId: string) {
    return await this.assetRepository.findOne({
      where: {
        id: assetId,
      },
      relations: ['exifInfo'],
    });
  }

  public async downloadFile(query: ServeFileDto, res: Res) {
    try {
      let fileReadStream = null;
      const asset = await this.findOne(query.did, query.aid);

      if (query.isThumb === 'false' || !query.isThumb) {
        const { size } = await fileInfo(asset.originalPath);
        res.set({
          'Content-Type': asset.mimeType,
          'Content-Length': size,
        });

        await fs.access(asset.originalPath, constants.R_OK | constants.W_OK);
        fileReadStream = createReadStream(asset.originalPath);
      } else {
        if (!asset.resizePath) {
          throw new NotFoundException('resizePath not set');
        }
        const { size } = await fileInfo(asset.resizePath);
        res.set({
          'Content-Type': 'image/jpeg',
          'Content-Length': size,
        });

        await fs.access(asset.resizePath, constants.R_OK | constants.W_OK);
        fileReadStream = createReadStream(asset.resizePath);
      }

      return new StreamableFile(fileReadStream);
    } catch (e) {
      Logger.error(`Error download asset`, 'downloadFile');
      throw new InternalServerErrorException(`Failed to download asset ${e}`, 'DownloadFile');
    }
  }

  public async getAssetThumbnail(assetId: string) {
    let fileReadStream: ReadStream;

    const asset = await this.assetRepository.findOne({ where: { id: assetId } });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    try {
      if (asset.webpPath && asset.webpPath.length > 0) {
        await fs.access(asset.webpPath, constants.R_OK | constants.W_OK);
        fileReadStream = createReadStream(asset.webpPath);
      } else {
        if (!asset.resizePath) {
          return new NotFoundException('resizePath not set');
        }

        await fs.access(asset.resizePath, constants.R_OK | constants.W_OK);
        fileReadStream = createReadStream(asset.resizePath);
      }

      return new StreamableFile(fileReadStream);
    } catch (e) {
      Logger.error(`Cannot create read stream for asset ${asset.id}`, 'getAssetThumbnail');
      throw new InternalServerErrorException(
        e,
        `Cannot read thumbnail file for asset ${asset.id} - contact your administrator`,
      );
    }
  }

  public async serveFile(authUser: AuthUserDto, query: ServeFileDto, res: Res, headers: any) {
    let fileReadStream: ReadStream;
    const asset = await this.findOne(query.did, query.aid);

    if (!asset) {
      throw new NotFoundException('Asset does not exist');
    }

    // Handle Sending Images
    if (asset.type == AssetType.IMAGE || query.isThumb == 'true') {
      try {
        /**
         * Serve file viewer on the web
         */
        if (query.isWeb) {
          res.set({
            'Content-Type': 'image/jpeg',
          });
          if (!asset.resizePath) {
            Logger.error('Error serving IMAGE asset for web', 'ServeFile');
            throw new InternalServerErrorException(`Failed to serve image asset for web`, 'ServeFile');
          }
          await fs.access(asset.resizePath, constants.R_OK | constants.W_OK);
          fileReadStream = createReadStream(asset.resizePath);

          return new StreamableFile(fileReadStream);
        }

        /**
         * Serve thumbnail image for both web and mobile app
         */
        if (query.isThumb === 'false' || !query.isThumb) {
          res.set({
            'Content-Type': asset.mimeType,
          });

          await fs.access(asset.originalPath, constants.R_OK | constants.W_OK);
          fileReadStream = createReadStream(asset.originalPath);
        } else {
          if (asset.webpPath && asset.webpPath.length > 0) {
            res.set({
              'Content-Type': 'image/webp',
            });

            await fs.access(asset.webpPath, constants.R_OK | constants.W_OK);
            fileReadStream = createReadStream(asset.webpPath);
          } else {
            res.set({
              'Content-Type': 'image/jpeg',
            });

            if (!asset.resizePath) {
              throw new Error('resizePath not set');
            }

            await fs.access(asset.resizePath, constants.R_OK | constants.W_OK);
            fileReadStream = createReadStream(asset.resizePath);
          }
        }

        return new StreamableFile(fileReadStream);
      } catch (e) {
        Logger.error(`Cannot create read stream for asset ${asset.id}`, 'serveFile[IMAGE]');
        throw new InternalServerErrorException(
          e,
          `Cannot read thumbnail file for asset ${asset.id} - contact your administrator`,
        );
      }
    } else if (asset.type == AssetType.VIDEO) {
      try {
        // Handle Video
        let videoPath = asset.originalPath;
        let mimeType = asset.mimeType;

        await fs.access(videoPath, constants.R_OK | constants.W_OK);

        if (query.isWeb && asset.mimeType == 'video/quicktime') {
          videoPath = asset.encodedVideoPath == '' ? asset.originalPath : asset.encodedVideoPath;
          mimeType = asset.encodedVideoPath == '' ? asset.mimeType : 'video/mp4';
        }

        const { size } = await fileInfo(videoPath);
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
            'Content-Type': mimeType,
          });

          const videoStream = createReadStream(videoPath, { start: start, end: end });

          return new StreamableFile(videoStream);
        } else {
          res.set({
            'Content-Type': mimeType,
          });

          return new StreamableFile(createReadStream(videoPath));
        }
      } catch (e) {
        Logger.error(`Error serving VIDEO asset id ${asset.id}`, 'serveFile[VIDEO]');
        throw new InternalServerErrorException(`Failed to serve video asset ${e}`, 'ServeFile');
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
    // TODO: should use query builder
    const rows = await this.assetRepository.query(
      `
      SELECT DISTINCT si.tags, si.objects, e.orientation, e."lensModel", e.make, e.model , a.type, e.city, e.state, e.country
      FROM assets a
      LEFT JOIN exif e ON a.id = e."assetId"
      LEFT JOIN smart_info si ON a.id = si."assetId"
      WHERE a."userId" = $1;
      `,
      [authUser.id],
    );

    rows.forEach((row: { [x: string]: any }) => {
      // tags
      row['tags']?.map((tag: string) => possibleSearchTerm.add(tag?.toLowerCase()));

      // objects
      row['objects']?.map((object: string) => possibleSearchTerm.add(object?.toLowerCase()));

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
         e."exifTextSearchableColumn" @@ PLAINTO_TSQUERY('english', $2)
        );
    `;

    return await this.assetRepository.query(query, [authUser.id, searchAssetDto.searchTerm]);
  }

  async getCuratedLocation(authUser: AuthUserDto) {
    return await this.assetRepository.query(
      `
        SELECT DISTINCT ON (e.city) a.id, e.city, a."resizePath", a."deviceAssetId", a."deviceId"
        FROM assets a
        LEFT JOIN exif e ON a.id = e."assetId"
        WHERE a."userId" = $1
        AND e.city IS NOT NULL
        AND a.type = 'IMAGE';
      `,
      [authUser.id],
    );
  }

  async getCuratedObject(authUser: AuthUserDto) {
    return await this.assetRepository.query(
      `
        SELECT DISTINCT ON (unnest(si.objects)) a.id, unnest(si.objects) as "object", a."resizePath", a."deviceAssetId", a."deviceId"
        FROM assets a
        LEFT JOIN smart_info si ON a.id = si."assetId"
        WHERE a."userId" = $1
        AND si.objects IS NOT NULL
      `,
      [authUser.id],
    );
  }

  async checkDuplicatedAsset(authUser: AuthUserDto, deviceAssetId: string) {
    const res = await this.assetRepository.findOne({
      where: {
        deviceAssetId,
        userId: authUser.id,
      },
    });

    return res ? true : false;
  }
}
