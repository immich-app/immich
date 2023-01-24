import { CuratedLocationsResponseDto } from './response-dto/curated-locations-response.dto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { AssetEntity, AssetType, SharedLinkType } from '@app/infra';
import { constants, createReadStream, ReadStream, stat } from 'fs';
import { ServeFileDto } from './dto/serve-file.dto';
import { Response as Res } from 'express';
import { promisify } from 'util';
import { DeleteAssetDto } from './dto/delete-asset.dto';
import { SearchAssetDto } from './dto/search-asset.dto';
import fs from 'fs/promises';
import { CheckDuplicateAssetDto } from './dto/check-duplicate-asset.dto';
import { CuratedObjectsResponseDto } from './response-dto/curated-objects-response.dto';
import { AssetResponseDto, mapAsset, mapAssetWithoutExif } from './response-dto/asset-response.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { DeleteAssetResponseDto, DeleteAssetStatusEnum } from './response-dto/delete-asset-response.dto';
import { GetAssetThumbnailDto, GetAssetThumbnailFormatEnum } from './dto/get-asset-thumbnail.dto';
import { CheckDuplicateAssetResponseDto } from './response-dto/check-duplicate-asset-response.dto';
import { IAssetRepository } from './asset-repository';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import {
  AssetCountByTimeBucketResponseDto,
  mapAssetCountByTimeBucket,
} from './response-dto/asset-count-by-time-group-response.dto';
import { GetAssetCountByTimeBucketDto } from './dto/get-asset-count-by-time-bucket.dto';
import { GetAssetByTimeBucketDto } from './dto/get-asset-by-time-bucket.dto';
import { AssetCountByUserIdResponseDto } from './response-dto/asset-count-by-user-id-response.dto';
import { timeUtils } from '@app/common/utils';
import { CheckExistingAssetsDto } from './dto/check-existing-assets.dto';
import { CheckExistingAssetsResponseDto } from './response-dto/check-existing-assets-response.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetFileUploadResponseDto } from './response-dto/asset-file-upload-response.dto';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { IJobRepository, JobName } from '@app/domain';
import { DownloadService } from '../../modules/download/download.service';
import { DownloadDto } from './dto/download-library.dto';
import { IAlbumRepository } from '../album/album-repository';
import { StorageService } from '@app/storage';
import { ShareCore } from '../share/share.core';
import { ISharedLinkRepository } from '../share/shared-link.repository';
import { DownloadFilesDto } from './dto/download-files.dto';
import { CreateAssetsShareLinkDto } from './dto/create-asset-shared-link.dto';
import { mapSharedLink, SharedLinkResponseDto } from '../share/response-dto/shared-link-response.dto';
import { UpdateAssetsToSharedLinkDto } from './dto/add-assets-to-shared-link.dto';
import { AssetSearchDto } from './dto/asset-search.dto';

const fileInfo = promisify(stat);

@Injectable()
export class AssetService {
  readonly logger = new Logger(AssetService.name);
  private shareCore: ShareCore;

  constructor(
    @Inject(IAssetRepository) private _assetRepository: IAssetRepository,
    @Inject(IAlbumRepository) private _albumRepository: IAlbumRepository,
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
    private backgroundTaskService: BackgroundTaskService,
    private downloadService: DownloadService,
    private storageService: StorageService,
    @Inject(ISharedLinkRepository) sharedLinkRepository: ISharedLinkRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.shareCore = new ShareCore(sharedLinkRepository);
  }

  public async handleUploadedAsset(
    authUser: AuthUserDto,
    createAssetDto: CreateAssetDto,
    res: Res,
    originalAssetData: Express.Multer.File,
    livePhotoAssetData?: Express.Multer.File,
  ) {
    const checksum = await this.calculateChecksum(originalAssetData.path);
    const isLivePhoto = livePhotoAssetData !== undefined;
    let livePhotoAssetEntity: AssetEntity | undefined;

    try {
      if (isLivePhoto) {
        const livePhotoChecksum = await this.calculateChecksum(livePhotoAssetData.path);
        livePhotoAssetEntity = await this.createUserAsset(
          authUser,
          createAssetDto,
          livePhotoAssetData.path,
          livePhotoAssetData.mimetype,
          livePhotoChecksum,
          false,
        );

        if (!livePhotoAssetEntity) {
          await this.backgroundTaskService.deleteFileOnDisk([
            {
              originalPath: livePhotoAssetData.path,
            } as any,
          ]);
          throw new BadRequestException('Asset not created');
        }

        await this.storageService.moveAsset(livePhotoAssetEntity, originalAssetData.originalname);

        await this.jobRepository.add({ name: JobName.VIDEO_CONVERSION, data: { asset: livePhotoAssetEntity } });
      }

      const assetEntity = await this.createUserAsset(
        authUser,
        createAssetDto,
        originalAssetData.path,
        originalAssetData.mimetype,
        checksum,
        true,
        livePhotoAssetEntity,
      );

      if (!assetEntity) {
        await this.backgroundTaskService.deleteFileOnDisk([
          {
            originalPath: originalAssetData.path,
          } as any,
        ]);
        throw new BadRequestException('Asset not created');
      }

      const movedAsset = await this.storageService.moveAsset(assetEntity, originalAssetData.originalname);

      await this.jobRepository.add({
        name: JobName.ASSET_UPLOADED,
        data: { asset: movedAsset, fileName: originalAssetData.originalname },
      });

      return new AssetFileUploadResponseDto(movedAsset.id);
    } catch (err) {
      await this.backgroundTaskService.deleteFileOnDisk([
        {
          originalPath: originalAssetData.path,
        } as any,
      ]); // simulate asset to make use of delete queue (or use fs.unlink instead)

      if (isLivePhoto) {
        await this.backgroundTaskService.deleteFileOnDisk([
          {
            originalPath: livePhotoAssetData.path,
          } as any,
        ]);
      }

      if (err instanceof QueryFailedError && (err as any).constraint === 'UQ_userid_checksum') {
        const existedAsset = await this.getAssetByChecksum(authUser.id, checksum);
        res.status(200); // normal POST is 201. we use 200 to indicate the asset already exists
        return new AssetFileUploadResponseDto(existedAsset.id);
      }

      Logger.error(`Error uploading file ${err}`);
      throw new BadRequestException(`Error uploading file`, `${err}`);
    }
  }

  public async createUserAsset(
    authUser: AuthUserDto,
    createAssetDto: CreateAssetDto,
    originalPath: string,
    mimeType: string,
    checksum: Buffer,
    isVisible: boolean,
    livePhotoAssetEntity?: AssetEntity,
  ): Promise<AssetEntity> {
    if (!timeUtils.checkValidTimestamp(createAssetDto.createdAt)) {
      createAssetDto.createdAt = new Date().toISOString();
    }

    if (!timeUtils.checkValidTimestamp(createAssetDto.modifiedAt)) {
      createAssetDto.modifiedAt = new Date().toISOString();
    }

    const assetEntity = await this._assetRepository.create(
      createAssetDto,
      authUser.id,
      originalPath,
      mimeType,
      isVisible,
      checksum,
      livePhotoAssetEntity,
    );

    return assetEntity;
  }

  public async getUserAssetsByDeviceId(authUser: AuthUserDto, deviceId: string) {
    return this._assetRepository.getAllByDeviceId(authUser.id, deviceId);
  }

  public async getAllAssets(authUser: AuthUserDto, dto: AssetSearchDto): Promise<AssetResponseDto[]> {
    const assets = await this._assetRepository.getAllByUserId(authUser.id, dto);

    return assets.map((asset) => mapAsset(asset));
  }

  public async getAssetByTimeBucket(
    authUser: AuthUserDto,
    getAssetByTimeBucketDto: GetAssetByTimeBucketDto,
  ): Promise<AssetResponseDto[]> {
    const assets = await this._assetRepository.getAssetByTimeBucket(authUser.id, getAssetByTimeBucketDto);

    return assets.map((asset) => mapAsset(asset));
  }

  public async getAssetById(authUser: AuthUserDto, assetId: string): Promise<AssetResponseDto> {
    const allowExif = this.getExifPermission(authUser);
    const asset = await this._assetRepository.getById(assetId);

    if (allowExif) {
      return mapAsset(asset);
    } else {
      return mapAssetWithoutExif(asset);
    }
  }

  public async updateAsset(authUser: AuthUserDto, assetId: string, dto: UpdateAssetDto): Promise<AssetResponseDto> {
    const asset = await this._assetRepository.getById(assetId);
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    const updatedAsset = await this._assetRepository.update(authUser.id, asset, dto);

    return mapAsset(updatedAsset);
  }

  public async downloadLibrary(user: AuthUserDto, dto: DownloadDto) {
    const assets = await this._assetRepository.getAllByUserId(user.id, dto);

    return this.downloadService.downloadArchive(dto.name || `library`, assets);
  }

  public async downloadFiles(dto: DownloadFilesDto) {
    const assetToDownload = [];

    for (const assetId of dto.assetIds) {
      const asset = await this._assetRepository.getById(assetId);
      assetToDownload.push(asset);

      // Get live photo asset
      if (asset.livePhotoVideoId) {
        const livePhotoAsset = await this._assetRepository.getById(asset.livePhotoVideoId);
        assetToDownload.push(livePhotoAsset);
      }
    }

    const now = new Date().toISOString();
    return this.downloadService.downloadArchive(`immich-${now}`, assetToDownload);
  }

  public async downloadFile(query: ServeFileDto, assetId: string, res: Res) {
    try {
      let fileReadStream = null;
      const asset = await this._assetRepository.getById(assetId);

      // Download Video
      if (asset.type === AssetType.VIDEO) {
        const { size } = await fileInfo(asset.originalPath);

        res.set({
          'Content-Type': asset.mimeType,
          'Content-Length': size,
        });

        await fs.access(asset.originalPath, constants.R_OK | constants.W_OK);
        fileReadStream = createReadStream(asset.originalPath);
      } else {
        // Download Image
        if (!query.isThumb) {
          /**
           * Download Image Original File
           */
          const { size } = await fileInfo(asset.originalPath);

          res.set({
            'Content-Type': asset.mimeType,
            'Content-Length': size,
          });

          await fs.access(asset.originalPath, constants.R_OK | constants.W_OK);
          fileReadStream = createReadStream(asset.originalPath);
        } else {
          /**
           * Download Image Resize File
           */
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
      }

      return new StreamableFile(fileReadStream);
    } catch (e) {
      Logger.error(`Error download asset ${e}`, 'downloadFile');
      throw new InternalServerErrorException(`Failed to download asset ${e}`, 'DownloadFile');
    }
  }

  public async getAssetThumbnail(
    assetId: string,
    query: GetAssetThumbnailDto,
    res: Res,
    headers: Record<string, string>,
  ) {
    let fileReadStream: ReadStream;

    const asset = await this.assetRepository.findOne({ where: { id: assetId } });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    try {
      if (query.format == GetAssetThumbnailFormatEnum.WEBP && asset.webpPath && asset.webpPath.length > 0) {
        if (await processETag(asset.webpPath, res, headers)) {
          return;
        }
        await fs.access(asset.webpPath, constants.R_OK);
        fileReadStream = createReadStream(asset.webpPath);
      } else {
        if (!asset.resizePath) {
          throw new NotFoundException('resizePath not set');
        }
        if (await processETag(asset.resizePath, res, headers)) {
          return;
        }
        await fs.access(asset.resizePath, constants.R_OK);
        fileReadStream = createReadStream(asset.resizePath);
      }
      return new StreamableFile(fileReadStream);
    } catch (e) {
      res.header('Cache-Control', 'none');
      Logger.error(`Cannot create read stream for asset ${asset.id}`, 'getAssetThumbnail');
      throw new InternalServerErrorException(
        e,
        `Cannot read thumbnail file for asset ${asset.id} - contact your administrator`,
      );
    }
  }

  public async serveFile(
    authUser: AuthUserDto,
    assetId: string,
    query: ServeFileDto,
    res: Res,
    headers: Record<string, string>,
  ) {
    const allowOriginalFile = !authUser.isPublicUser || authUser.isAllowDownload;

    let fileReadStream: ReadStream;
    const asset = await this._assetRepository.getById(assetId);

    if (!asset) {
      throw new NotFoundException('Asset does not exist');
    }

    // Handle Sending Images
    if (asset.type == AssetType.IMAGE) {
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
          if (await processETag(asset.resizePath, res, headers)) {
            return;
          }
          await fs.access(asset.resizePath, constants.R_OK | constants.W_OK);
          fileReadStream = createReadStream(asset.resizePath);

          return new StreamableFile(fileReadStream);
        }

        /**
         * Serve thumbnail image for both web and mobile app
         */
        if (!query.isThumb && allowOriginalFile) {
          res.set({
            'Content-Type': asset.mimeType,
          });
          if (await processETag(asset.originalPath, res, headers)) {
            return;
          }
          await fs.access(asset.originalPath, constants.R_OK | constants.W_OK);
          fileReadStream = createReadStream(asset.originalPath);
        } else {
          if (asset.webpPath && asset.webpPath.length > 0) {
            res.set({
              'Content-Type': 'image/webp',
            });
            if (await processETag(asset.webpPath, res, headers)) {
              return;
            }
            await fs.access(asset.webpPath, constants.R_OK | constants.W_OK);
            fileReadStream = createReadStream(asset.webpPath);
          } else {
            res.set({
              'Content-Type': 'image/jpeg',
            });

            if (!asset.resizePath) {
              throw new Error('resizePath not set');
            }
            if (await processETag(asset.resizePath, res, headers)) {
              return;
            }

            await fs.access(asset.resizePath, constants.R_OK | constants.W_OK);
            fileReadStream = createReadStream(asset.resizePath);
          }
        }

        return new StreamableFile(fileReadStream);
      } catch (e) {
        Logger.error(`Cannot create read stream for asset ${asset.id} ${JSON.stringify(e)}`, 'serveFile[IMAGE]');
        throw new InternalServerErrorException(
          e,
          `Cannot read thumbnail file for asset ${asset.id} - contact your administrator`,
        );
      }
    } else {
      try {
        // Handle Video
        let videoPath = asset.originalPath;

        let mimeType = asset.mimeType;

        await fs.access(videoPath, constants.R_OK | constants.W_OK);

        if (asset.encodedVideoPath) {
          videoPath = asset.encodedVideoPath == '' ? String(asset.originalPath) : String(asset.encodedVideoPath);
          mimeType = asset.encodedVideoPath == '' ? asset.mimeType : 'video/mp4';
        }

        const { size } = await fileInfo(videoPath);
        const range = headers.range;

        if (range) {
          /** Extracting Start and End value from Range Header */
          const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
          let start = parseInt(startStr, 10);
          let end = endStr ? parseInt(endStr, 10) : size - 1;

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
          if (await processETag(asset.originalPath, res, headers)) {
            return;
          }
          return new StreamableFile(createReadStream(videoPath));
        }
      } catch (e) {
        Logger.error(`Error serving VIDEO asset id ${asset.id}`, 'serveFile[VIDEO]');
        throw new InternalServerErrorException(`Failed to serve video asset ${e}`, 'ServeFile');
      }
    }
  }

  public async deleteAssetById(assetIds: DeleteAssetDto): Promise<DeleteAssetResponseDto[]> {
    const result: DeleteAssetResponseDto[] = [];

    const target = assetIds.ids;
    for (const assetId of target) {
      const res = await this.assetRepository.delete({
        id: assetId,
      });

      if (res.affected) {
        result.push({
          id: assetId,
          status: DeleteAssetStatusEnum.SUCCESS,
        });
      } else {
        result.push({
          id: assetId,
          status: DeleteAssetStatusEnum.FAILED,
        });
      }
    }

    return result;
  }

  async getAssetSearchTerm(authUser: AuthUserDto): Promise<string[]> {
    const possibleSearchTerm = new Set<string>();

    const rows = await this._assetRepository.getSearchPropertiesByUserId(authUser.id);
    rows.forEach((row: SearchPropertiesDto) => {
      // tags
      row.tags?.map((tag: string) => possibleSearchTerm.add(tag?.toLowerCase()));

      // objects
      row.objects?.map((object: string) => possibleSearchTerm.add(object?.toLowerCase()));

      // asset's tyoe
      possibleSearchTerm.add(row.assetType?.toLowerCase() || '');

      // image orientation
      possibleSearchTerm.add(row.orientation?.toLowerCase() || '');

      // Lens model
      possibleSearchTerm.add(row.lensModel?.toLowerCase() || '');

      // Make and model
      possibleSearchTerm.add(row.make?.toLowerCase() || '');
      possibleSearchTerm.add(row.model?.toLowerCase() || '');

      // Location
      possibleSearchTerm.add(row.city?.toLowerCase() || '');
      possibleSearchTerm.add(row.state?.toLowerCase() || '');
      possibleSearchTerm.add(row.country?.toLowerCase() || '');
    });

    return Array.from(possibleSearchTerm).filter((x) => x != null && x != '');
  }

  async searchAsset(authUser: AuthUserDto, searchAssetDto: SearchAssetDto): Promise<AssetResponseDto[]> {
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

    const searchResults: AssetEntity[] = await this.assetRepository.query(query, [
      authUser.id,
      searchAssetDto.searchTerm,
    ]);

    return searchResults.map((asset) => mapAsset(asset));
  }

  async getCuratedLocation(authUser: AuthUserDto): Promise<CuratedLocationsResponseDto[]> {
    return this._assetRepository.getLocationsByUserId(authUser.id);
  }

  async getCuratedObject(authUser: AuthUserDto): Promise<CuratedObjectsResponseDto[]> {
    return this._assetRepository.getDetectedObjectsByUserId(authUser.id);
  }

  async checkDuplicatedAsset(
    authUser: AuthUserDto,
    checkDuplicateAssetDto: CheckDuplicateAssetDto,
  ): Promise<CheckDuplicateAssetResponseDto> {
    const res = await this.assetRepository.findOne({
      where: {
        deviceAssetId: checkDuplicateAssetDto.deviceAssetId,
        deviceId: checkDuplicateAssetDto.deviceId,
        userId: authUser.id,
      },
    });

    const isDuplicated = res ? true : false;

    return new CheckDuplicateAssetResponseDto(isDuplicated, res?.id);
  }

  async checkExistingAssets(
    authUser: AuthUserDto,
    checkExistingAssetsDto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    return this._assetRepository.getExistingAssets(authUser.id, checkExistingAssetsDto);
  }

  async getAssetCountByTimeBucket(
    authUser: AuthUserDto,
    getAssetCountByTimeBucketDto: GetAssetCountByTimeBucketDto,
  ): Promise<AssetCountByTimeBucketResponseDto> {
    const result = await this._assetRepository.getAssetCountByTimeBucket(
      authUser.id,
      getAssetCountByTimeBucketDto.timeGroup,
    );

    return mapAssetCountByTimeBucket(result);
  }

  getAssetByChecksum(userId: string, checksum: Buffer) {
    return this._assetRepository.getAssetByChecksum(userId, checksum);
  }

  calculateChecksum(filePath: string): Promise<Buffer> {
    const fileReadStream = createReadStream(filePath);
    const sha1Hash = createHash('sha1');
    const deferred = new Promise<Buffer>((resolve, reject) => {
      sha1Hash.once('error', (err) => reject(err));
      sha1Hash.once('finish', () => resolve(sha1Hash.read()));
    });

    fileReadStream.pipe(sha1Hash);
    return deferred;
  }

  getAssetCountByUserId(authUser: AuthUserDto): Promise<AssetCountByUserIdResponseDto> {
    return this._assetRepository.getAssetCountByUserId(authUser.id);
  }

  async checkAssetsAccess(authUser: AuthUserDto, assetIds: string[], mustBeOwner = false) {
    for (const assetId of assetIds) {
      // Step 1: Check if asset is part of a public shared
      if (authUser.sharedLinkId) {
        const canAccess = await this.shareCore.hasAssetAccess(authUser.sharedLinkId, assetId);
        if (!canAccess) {
          throw new ForbiddenException();
        }
      }

      // Step 2: Check if user owns asset
      if ((await this._assetRepository.countByIdAndUser(assetId, authUser.id)) == 1) {
        continue;
      }

      // Avoid additional checks if ownership is required
      if (!mustBeOwner) {
        // Step 2: Check if asset is part of an album shared with me
        if ((await this._albumRepository.getSharedWithUserAlbumCount(authUser.id, assetId)) > 0) {
          continue;
        }
      }
      throw new ForbiddenException();
    }
  }

  checkDownloadAccess(authUser: AuthUserDto) {
    this.shareCore.checkDownloadAccess(authUser);
  }

  async createAssetsSharedLink(authUser: AuthUserDto, dto: CreateAssetsShareLinkDto): Promise<SharedLinkResponseDto> {
    const assets = [];

    await this.checkAssetsAccess(authUser, dto.assetIds);
    for (const assetId of dto.assetIds) {
      const asset = await this._assetRepository.getById(assetId);
      assets.push(asset);
    }

    const sharedLink = await this.shareCore.createSharedLink(authUser.id, {
      sharedType: SharedLinkType.INDIVIDUAL,
      expiredAt: dto.expiredAt,
      allowUpload: dto.allowUpload,
      assets: assets,
      description: dto.description,
      allowDownload: dto.allowDownload,
      showExif: dto.showExif,
    });

    return mapSharedLink(sharedLink);
  }

  async updateAssetsInSharedLink(
    authUser: AuthUserDto,
    dto: UpdateAssetsToSharedLinkDto,
  ): Promise<SharedLinkResponseDto> {
    if (!authUser.sharedLinkId) throw new ForbiddenException();
    const assets = [];

    for (const assetId of dto.assetIds) {
      const asset = await this._assetRepository.getById(assetId);
      assets.push(asset);
    }

    const updatedLink = await this.shareCore.updateAssetsInSharedLink(authUser.sharedLinkId, assets);
    return mapSharedLink(updatedLink);
  }

  getExifPermission(authUser: AuthUserDto) {
    return !authUser.isPublicUser || authUser.isShowExif;
  }
}

async function processETag(path: string, res: Res, headers: Record<string, string>): Promise<boolean> {
  const { size, mtimeNs } = await fs.stat(path, { bigint: true });
  const etag = `W/"${size}-${mtimeNs}"`;
  res.setHeader('ETag', etag);
  if (etag === headers['if-none-match']) {
    res.status(304);
    return true;
  }
  return false;
}
