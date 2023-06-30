import {
  AccessCore,
  AssetResponseDto,
  AuthUserDto,
  getLivePhotoMotionFilename,
  IAccessRepository,
  ICryptoRepository,
  IJobRepository,
  isSupportedFileType,
  IStorageRepository,
  JobName,
  mapAsset,
  mapAssetWithoutExif,
  Permission,
} from '@app/domain';
import { AssetEntity, AssetType } from '@app/infra/entities';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response as Res } from 'express';
import { constants, createReadStream, stat } from 'fs';
import fs from 'fs/promises';
import mime from 'mime-types';
import path from 'path';
import { QueryFailedError, Repository } from 'typeorm';
import { promisify } from 'util';
import { IAssetRepository } from './asset-repository';
import { AssetCore } from './asset.core';
import { AssetBulkUploadCheckDto } from './dto/asset-check.dto';
import { AssetSearchDto } from './dto/asset-search.dto';
import { CheckDuplicateAssetDto } from './dto/check-duplicate-asset.dto';
import { CheckExistingAssetsDto } from './dto/check-existing-assets.dto';
import { CreateAssetDto, ImportAssetDto, UploadFile } from './dto/create-asset.dto';
import { DeleteAssetDto } from './dto/delete-asset.dto';
import { GetAssetByTimeBucketDto } from './dto/get-asset-by-time-bucket.dto';
import { GetAssetCountByTimeBucketDto } from './dto/get-asset-count-by-time-bucket.dto';
import { GetAssetThumbnailDto, GetAssetThumbnailFormatEnum } from './dto/get-asset-thumbnail.dto';
import { SearchAssetDto } from './dto/search-asset.dto';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { ServeFileDto } from './dto/serve-file.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import {
  AssetBulkUploadCheckResponseDto,
  AssetRejectReason,
  AssetUploadAction,
} from './response-dto/asset-check-response.dto';
import {
  AssetCountByTimeBucketResponseDto,
  mapAssetCountByTimeBucket,
} from './response-dto/asset-count-by-time-group-response.dto';
import { AssetCountByUserIdResponseDto } from './response-dto/asset-count-by-user-id-response.dto';
import { AssetFileUploadResponseDto } from './response-dto/asset-file-upload-response.dto';
import { CheckDuplicateAssetResponseDto } from './response-dto/check-duplicate-asset-response.dto';
import { CheckExistingAssetsResponseDto } from './response-dto/check-existing-assets-response.dto';
import { CuratedLocationsResponseDto } from './response-dto/curated-locations-response.dto';
import { CuratedObjectsResponseDto } from './response-dto/curated-objects-response.dto';
import { DeleteAssetResponseDto, DeleteAssetStatusEnum } from './response-dto/delete-asset-response.dto';

const fileInfo = promisify(stat);

interface ServableFile {
  filepath: string;
  contentType: string;
}

@Injectable()
export class AssetService {
  readonly logger = new Logger(AssetService.name);
  private assetCore: AssetCore;
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private _assetRepository: IAssetRepository,
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {
    this.assetCore = new AssetCore(_assetRepository, jobRepository);
    this.access = new AccessCore(accessRepository);
  }

  public async uploadFile(
    authUser: AuthUserDto,
    dto: CreateAssetDto,
    file: UploadFile,
    livePhotoFile?: UploadFile,
    sidecarFile?: UploadFile,
  ): Promise<AssetFileUploadResponseDto> {
    if (livePhotoFile) {
      livePhotoFile = {
        ...livePhotoFile,
        originalName: getLivePhotoMotionFilename(file.originalName, livePhotoFile.originalName),
      };
    }

    let livePhotoAsset: AssetEntity | null = null;

    try {
      if (livePhotoFile) {
        const livePhotoDto = { ...dto, assetType: AssetType.VIDEO, isVisible: false };
        livePhotoAsset = await this.assetCore.create(authUser, livePhotoDto, livePhotoFile);
      }

      const asset = await this.assetCore.create(authUser, dto, file, livePhotoAsset?.id, sidecarFile?.originalPath);

      return { id: asset.id, duplicate: false };
    } catch (error: any) {
      // clean up files
      await this.jobRepository.queue({
        name: JobName.DELETE_FILES,
        data: { files: [file.originalPath, livePhotoFile?.originalPath, sidecarFile?.originalPath] },
      });

      // handle duplicates with a success response
      if (error instanceof QueryFailedError && (error as any).constraint === 'UQ_userid_checksum') {
        const checksums = [file.checksum, livePhotoFile?.checksum].filter((checksum): checksum is Buffer => !!checksum);
        const [duplicate] = await this._assetRepository.getAssetsByChecksums(authUser.id, checksums);
        return { id: duplicate.id, duplicate: true };
      }

      this.logger.error(`Error uploading file ${error}`, error?.stack);
      throw new BadRequestException(`Error uploading file`, `${error}`);
    }
  }

  public async importFile(authUser: AuthUserDto, dto: ImportAssetDto): Promise<AssetFileUploadResponseDto> {
    dto = {
      ...dto,
      assetPath: path.resolve(dto.assetPath),
      sidecarPath: dto.sidecarPath ? path.resolve(dto.sidecarPath) : undefined,
    };

    const assetPathType = mime.lookup(dto.assetPath) as string;
    if (!isSupportedFileType(assetPathType)) {
      throw new BadRequestException(`Unsupported file type ${assetPathType}`);
    }

    if (dto.sidecarPath) {
      if (path.extname(dto.sidecarPath).toLowerCase() !== '.xmp') {
        throw new BadRequestException(`Unsupported sidecar file type`);
      }
    }

    for (const filepath of [dto.assetPath, dto.sidecarPath]) {
      if (!filepath) {
        continue;
      }

      const exists = await this.storageRepository.checkFileExists(filepath, constants.R_OK);
      if (!exists) {
        throw new BadRequestException('File does not exist');
      }
    }

    if (!authUser.externalPath || !dto.assetPath.match(new RegExp(`^${authUser.externalPath}`))) {
      throw new BadRequestException("File does not exist within user's external path");
    }

    const assetFile: UploadFile = {
      checksum: await this.cryptoRepository.hashFile(dto.assetPath),
      mimeType: assetPathType,
      originalPath: dto.assetPath,
      originalName: path.parse(dto.assetPath).name,
    };

    try {
      const asset = await this.assetCore.create(authUser, dto, assetFile, undefined, dto.sidecarPath);
      return { id: asset.id, duplicate: false };
    } catch (error: QueryFailedError | Error | any) {
      // handle duplicates with a success response
      if (error instanceof QueryFailedError && (error as any).constraint === 'UQ_userid_checksum') {
        const [duplicate] = await this._assetRepository.getAssetsByChecksums(authUser.id, [assetFile.checksum]);
        return { id: duplicate.id, duplicate: true };
      }

      if (error instanceof QueryFailedError && (error as any).constraint === 'UQ_4ed4f8052685ff5b1e7ca1058ba') {
        const duplicate = await this._assetRepository.getByOriginalPath(dto.assetPath);
        if (duplicate) {
          if (duplicate.ownerId === authUser.id) {
            return { id: duplicate.id, duplicate: true };
          }

          throw new BadRequestException('Path in use by another user');
        }
      }

      this.logger.error(`Error importing file ${error}`, error?.stack);
      throw new BadRequestException(`Error importing file`, `${error}`);
    }
  }

  public async getUserAssetsByDeviceId(authUser: AuthUserDto, deviceId: string) {
    return this._assetRepository.getAllByDeviceId(authUser.id, deviceId);
  }

  public async getAllAssets(authUser: AuthUserDto, dto: AssetSearchDto): Promise<AssetResponseDto[]> {
    const userId = dto.userId || authUser.id;
    await this.access.requirePermission(authUser, Permission.LIBRARY_READ, userId);
    const assets = await this._assetRepository.getAllByUserId(userId, dto);
    return assets.map((asset) => mapAsset(asset));
  }

  public async getAssetByTimeBucket(authUser: AuthUserDto, dto: GetAssetByTimeBucketDto): Promise<AssetResponseDto[]> {
    const userId = dto.userId || authUser.id;
    await this.access.requirePermission(authUser, Permission.LIBRARY_READ, userId);
    const assets = await this._assetRepository.getAssetByTimeBucket(userId, dto);
    return assets.map((asset) => mapAsset(asset));
  }

  public async getAssetById(authUser: AuthUserDto, assetId: string): Promise<AssetResponseDto> {
    await this.access.requirePermission(authUser, Permission.ASSET_READ, assetId);

    const allowExif = this.getExifPermission(authUser);
    const asset = await this._assetRepository.getById(assetId);

    if (allowExif) {
      return mapAsset(asset);
    } else {
      return mapAssetWithoutExif(asset);
    }
  }

  public async updateAsset(authUser: AuthUserDto, assetId: string, dto: UpdateAssetDto): Promise<AssetResponseDto> {
    await this.access.requirePermission(authUser, Permission.ASSET_UPDATE, assetId);

    const asset = await this._assetRepository.getById(assetId);
    if (!asset) {
      throw new BadRequestException('Asset not found');
    }

    const updatedAsset = await this._assetRepository.update(authUser.id, asset, dto);

    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids: [assetId] } });

    return mapAsset(updatedAsset);
  }

  async getAssetThumbnail(
    authUser: AuthUserDto,
    assetId: string,
    query: GetAssetThumbnailDto,
    res: Res,
    headers: Record<string, string>,
  ) {
    await this.access.requirePermission(authUser, Permission.ASSET_VIEW, assetId);

    const asset = await this._assetRepository.get(assetId);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    try {
      const thumbnailPath = this.getThumbnailPath(asset, query.format);
      return this.streamFile(thumbnailPath, res, headers);
    } catch (e) {
      res.header('Cache-Control', 'none');
      Logger.error(`Cannot create read stream for asset ${asset.id}`, 'getAssetThumbnail');
      throw new InternalServerErrorException(
        `Cannot read thumbnail file for asset ${asset.id} - contact your administrator`,
        { cause: e as Error },
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
    // this is not quite right as sometimes this returns the original still
    await this.access.requirePermission(authUser, Permission.ASSET_VIEW, assetId);

    const allowOriginalFile = !!(!authUser.isPublicUser || authUser.isAllowDownload);

    const asset = await this._assetRepository.getById(assetId);
    if (!asset) {
      throw new NotFoundException('Asset does not exist');
    }

    // Handle Sending Images
    if (asset.type == AssetType.IMAGE) {
      try {
        const { filepath, contentType } = this.getServePath(asset, query, allowOriginalFile);
        return this.streamFile(filepath, res, headers, contentType);
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

        await fs.access(videoPath, constants.R_OK);

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
            res.status(416).set({ 'Content-Range': `bytes */${size}` });

            throw new BadRequestException('Bad Request Range');
          }

          /** Sending Partial Content With HTTP Code 206 */
          res.status(206).set({
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            'Content-Type': mimeType,
          });

          const videoStream = createReadStream(videoPath, { start, end });

          return new StreamableFile(videoStream);
        }

        return this.streamFile(videoPath, res, headers, mimeType);
      } catch (e: Error | any) {
        this.logger.error(`Error serving VIDEO asset=${asset.id}`, e?.stack);
        throw new InternalServerErrorException(`Failed to serve video asset ${e}`, 'ServeFile');
      }
    }
  }

  public async deleteAll(authUser: AuthUserDto, dto: DeleteAssetDto): Promise<DeleteAssetResponseDto[]> {
    const deleteQueue: Array<string | null> = [];
    const result: DeleteAssetResponseDto[] = [];

    const ids = dto.ids.slice();
    for (const id of ids) {
      const hasAccess = await this.access.hasPermission(authUser, Permission.ASSET_DELETE, id);
      if (!hasAccess) {
        result.push({ id, status: DeleteAssetStatusEnum.FAILED });
        continue;
      }

      const asset = await this._assetRepository.get(id);
      if (!asset) {
        result.push({ id, status: DeleteAssetStatusEnum.FAILED });
        continue;
      }

      try {
        if (asset.faces) {
          await Promise.all(
            asset.faces.map(({ assetId, personId }) =>
              this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_FACE, data: { assetId, personId } }),
            ),
          );
        }

        await this._assetRepository.remove(asset);
        await this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_ASSET, data: { ids: [id] } });

        result.push({ id, status: DeleteAssetStatusEnum.SUCCESS });

        if (!asset.isReadOnly) {
          deleteQueue.push(
            asset.originalPath,
            asset.webpPath,
            asset.resizePath,
            asset.encodedVideoPath,
            asset.sidecarPath,
          );
        }

        // TODO refactor this to use cascades
        if (asset.livePhotoVideoId && !ids.includes(asset.livePhotoVideoId)) {
          ids.push(asset.livePhotoVideoId);
        }
      } catch {
        result.push({ id, status: DeleteAssetStatusEnum.FAILED });
      }
    }

    if (deleteQueue.length > 0) {
      await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files: deleteQueue } });
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

    WHERE a."ownerId" = $1
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
        ownerId: authUser.id,
      },
    });

    const isDuplicated = res ? true : false;

    return new CheckDuplicateAssetResponseDto(isDuplicated, res?.id);
  }

  async checkExistingAssets(
    authUser: AuthUserDto,
    checkExistingAssetsDto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    return {
      existingIds: await this._assetRepository.getExistingAssets(authUser.id, checkExistingAssetsDto),
    };
  }

  async bulkUploadCheck(authUser: AuthUserDto, dto: AssetBulkUploadCheckDto): Promise<AssetBulkUploadCheckResponseDto> {
    // support base64 and hex checksums
    for (const asset of dto.assets) {
      if (asset.checksum.length === 28) {
        asset.checksum = Buffer.from(asset.checksum, 'base64').toString('hex');
      }
    }

    const checksums: Buffer[] = dto.assets.map((asset) => Buffer.from(asset.checksum, 'hex'));
    const results = await this._assetRepository.getAssetsByChecksums(authUser.id, checksums);
    const checksumMap: Record<string, string> = {};

    for (const { id, checksum } of results) {
      checksumMap[checksum.toString('hex')] = id;
    }

    return {
      results: dto.assets.map(({ id, checksum }) => {
        const duplicate = checksumMap[checksum];
        if (duplicate) {
          return {
            id,
            assetId: duplicate,
            action: AssetUploadAction.REJECT,
            reason: AssetRejectReason.DUPLICATE,
          };
        }

        // TODO mime-check

        return {
          id,
          action: AssetUploadAction.ACCEPT,
        };
      }),
    };
  }

  async getAssetCountByTimeBucket(
    authUser: AuthUserDto,
    dto: GetAssetCountByTimeBucketDto,
  ): Promise<AssetCountByTimeBucketResponseDto> {
    const userId = dto.userId || authUser.id;
    await this.access.requirePermission(authUser, Permission.LIBRARY_READ, userId);
    const result = await this._assetRepository.getAssetCountByTimeBucket(userId, dto);
    return mapAssetCountByTimeBucket(result);
  }

  getAssetCountByUserId(authUser: AuthUserDto): Promise<AssetCountByUserIdResponseDto> {
    return this._assetRepository.getAssetCountByUserId(authUser.id);
  }

  getArchivedAssetCountByUserId(authUser: AuthUserDto): Promise<AssetCountByUserIdResponseDto> {
    return this._assetRepository.getArchivedAssetCountByUserId(authUser.id);
  }

  getExifPermission(authUser: AuthUserDto) {
    return !authUser.isPublicUser || authUser.isShowExif;
  }

  private getThumbnailPath(asset: AssetEntity, format: GetAssetThumbnailFormatEnum) {
    switch (format) {
      case GetAssetThumbnailFormatEnum.WEBP:
        if (asset.webpPath && asset.webpPath.length > 0) {
          return asset.webpPath;
        }

      case GetAssetThumbnailFormatEnum.JPEG:
      default:
        if (!asset.resizePath) {
          throw new NotFoundException('resizePath not set');
        }
        return asset.resizePath;
    }
  }

  private getServePath(asset: AssetEntity, query: ServeFileDto, allowOriginalFile: boolean): ServableFile {
    /**
     * Serve file viewer on the web
     */
    if (query.isWeb && asset.mimeType != 'image/gif') {
      if (!asset.resizePath) {
        this.logger.error('Error serving IMAGE asset for web');
        throw new InternalServerErrorException(`Failed to serve image asset for web`, 'ServeFile');
      }

      return { filepath: asset.resizePath, contentType: 'image/jpeg' };
    }

    /**
     * Serve thumbnail image for both web and mobile app
     */
    if ((!query.isThumb && allowOriginalFile) || (query.isWeb && asset.mimeType === 'image/gif')) {
      return { filepath: asset.originalPath, contentType: asset.mimeType as string };
    }

    if (asset.webpPath && asset.webpPath.length > 0) {
      return { filepath: asset.webpPath, contentType: 'image/webp' };
    }

    if (!asset.resizePath) {
      throw new Error('resizePath not set');
    }

    return { filepath: asset.resizePath, contentType: 'image/jpeg' };
  }

  private async streamFile(filepath: string, res: Res, headers: Record<string, string>, contentType?: string | null) {
    if (contentType) {
      res.header('Content-Type', contentType);
    }

    // etag
    const { size, mtimeNs } = await fs.stat(filepath, { bigint: true });
    const etag = `W/"${size}-${mtimeNs}"`;
    res.setHeader('ETag', etag);
    if (etag === headers['if-none-match']) {
      res.status(304);
      return;
    }

    await fs.access(filepath, constants.R_OK);

    return new StreamableFile(createReadStream(filepath));
  }
}
