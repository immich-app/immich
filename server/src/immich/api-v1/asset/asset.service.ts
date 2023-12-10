import {
  AccessCore,
  AssetResponseDto,
  AuthUserDto,
  getLivePhotoMotionFilename,
  IAccessRepository,
  IJobRepository,
  ILibraryRepository,
  isConnectionAborted,
  JobName,
  mapAsset,
  mimeTypes,
  Permission,
  SanitizedAssetResponseDto,
  UploadFile,
} from '@app/domain';
import { ASSET_CHECKSUM_CONSTRAINT, AssetEntity, AssetType, LibraryType } from '@app/infra/entities';
import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Response as Res, Response } from 'express';
import { constants } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { QueryFailedError } from 'typeorm';
import { promisify } from 'util';
import { IAssetRepository } from './asset-repository';
import { AssetCore } from './asset.core';
import { AssetBulkUploadCheckDto } from './dto/asset-check.dto';
import { AssetSearchDto } from './dto/asset-search.dto';
import { CheckExistingAssetsDto } from './dto/check-existing-assets.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { GetAssetThumbnailDto, GetAssetThumbnailFormatEnum } from './dto/get-asset-thumbnail.dto';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { ServeFileDto } from './dto/serve-file.dto';
import {
  AssetBulkUploadCheckResponseDto,
  AssetRejectReason,
  AssetUploadAction,
} from './response-dto/asset-check-response.dto';
import { AssetFileUploadResponseDto } from './response-dto/asset-file-upload-response.dto';
import { CheckExistingAssetsResponseDto } from './response-dto/check-existing-assets-response.dto';
import { CuratedLocationsResponseDto } from './response-dto/curated-locations-response.dto';
import { CuratedObjectsResponseDto } from './response-dto/curated-objects-response.dto';

type SendFile = Parameters<Response['sendFile']>;
type SendFileOptions = SendFile[1];

// TODO: move file sending logic to an interceptor
const sendFile = (res: Response, path: string, options: SendFileOptions) =>
  promisify<string, SendFileOptions>(res.sendFile).bind(res)(path, options);

@Injectable()
export class AssetService {
  readonly logger = new Logger(AssetService.name);
  private assetCore: AssetCore;
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private _assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILibraryRepository) private libraryRepository: ILibraryRepository,
  ) {
    this.assetCore = new AssetCore(_assetRepository, jobRepository);
    this.access = AccessCore.create(accessRepository);
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
      const libraryId = await this.getLibraryId(authUser, dto.libraryId);
      await this.access.requirePermission(authUser, Permission.ASSET_UPLOAD, libraryId);
      if (livePhotoFile) {
        const livePhotoDto = { ...dto, assetType: AssetType.VIDEO, isVisible: false, libraryId };
        livePhotoAsset = await this.assetCore.create(authUser, livePhotoDto, livePhotoFile);
      }

      const asset = await this.assetCore.create(
        authUser,
        { ...dto, libraryId },
        file,
        livePhotoAsset?.id,
        sidecarFile?.originalPath,
      );

      return { id: asset.id, duplicate: false };
    } catch (error: any) {
      // clean up files
      await this.jobRepository.queue({
        name: JobName.DELETE_FILES,
        data: { files: [file.originalPath, livePhotoFile?.originalPath, sidecarFile?.originalPath] },
      });

      // handle duplicates with a success response
      if (error instanceof QueryFailedError && (error as any).constraint === ASSET_CHECKSUM_CONSTRAINT) {
        const checksums = [file.checksum, livePhotoFile?.checksum].filter((checksum): checksum is Buffer => !!checksum);
        const [duplicate] = await this._assetRepository.getAssetsByChecksums(authUser.id, checksums);
        return { id: duplicate.id, duplicate: true };
      }

      this.logger.error(`Error uploading file ${error}`, error?.stack);
      throw error;
    }
  }

  public async getUserAssetsByDeviceId(authUser: AuthUserDto, deviceId: string) {
    return this._assetRepository.getAllByDeviceId(authUser.id, deviceId);
  }

  public async getAllAssets(authUser: AuthUserDto, dto: AssetSearchDto): Promise<AssetResponseDto[]> {
    const userId = dto.userId || authUser.id;
    await this.access.requirePermission(authUser, Permission.TIMELINE_READ, userId);
    const assets = await this._assetRepository.getAllByUserId(userId, dto);
    return assets.map((asset) => mapAsset(asset));
  }

  public async getAssetById(
    authUser: AuthUserDto,
    assetId: string,
  ): Promise<AssetResponseDto | SanitizedAssetResponseDto> {
    await this.access.requirePermission(authUser, Permission.ASSET_READ, assetId);

    const includeMetadata = this.getExifPermission(authUser);
    const asset = await this._assetRepository.getById(assetId);
    if (includeMetadata) {
      const data = mapAsset(asset, { withStack: true });

      if (data.ownerId !== authUser.id) {
        data.people = [];
      }

      if (authUser.isPublicUser) {
        delete data.owner;
      }

      return data;
    } else {
      return mapAsset(asset, { stripMetadata: true, withStack: true });
    }
  }

  async serveThumbnail(authUser: AuthUserDto, assetId: string, query: GetAssetThumbnailDto, res: Res) {
    await this.access.requirePermission(authUser, Permission.ASSET_VIEW, assetId);

    const asset = await this._assetRepository.get(assetId);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    try {
      await this.sendFile(res, this.getThumbnailPath(asset, query.format));
    } catch (e) {
      res.header('Cache-Control', 'none');
      this.logger.error(`Cannot create read stream for asset ${asset.id}`, 'getAssetThumbnail');
      throw new InternalServerErrorException(
        `Cannot read thumbnail file for asset ${asset.id} - contact your administrator`,
        { cause: e as Error },
      );
    }
  }

  public async serveFile(authUser: AuthUserDto, assetId: string, query: ServeFileDto, res: Res) {
    // this is not quite right as sometimes this returns the original still
    await this.access.requirePermission(authUser, Permission.ASSET_VIEW, assetId);

    const asset = await this._assetRepository.getById(assetId);
    if (!asset) {
      throw new NotFoundException('Asset does not exist');
    }

    const allowOriginalFile = !!(!authUser.isPublicUser || authUser.isAllowDownload);

    const filepath =
      asset.type === AssetType.IMAGE
        ? this.getServePath(asset, query, allowOriginalFile)
        : asset.encodedVideoPath || asset.originalPath;

    await this.sendFile(res, filepath);
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

  async getCuratedLocation(authUser: AuthUserDto): Promise<CuratedLocationsResponseDto[]> {
    return this._assetRepository.getLocationsByUserId(authUser.id);
  }

  async getCuratedObject(authUser: AuthUserDto): Promise<CuratedObjectsResponseDto[]> {
    return this._assetRepository.getDetectedObjectsByUserId(authUser.id);
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

  getExifPermission(authUser: AuthUserDto) {
    return !authUser.isPublicUser || authUser.isShowMetadata;
  }

  private getThumbnailPath(asset: AssetEntity, format: GetAssetThumbnailFormatEnum) {
    switch (format) {
      case GetAssetThumbnailFormatEnum.WEBP:
        if (asset.webpPath) {
          return asset.webpPath;
        }
        this.logger.warn(`WebP thumbnail requested but not found for asset ${asset.id}, falling back to JPEG`);

      case GetAssetThumbnailFormatEnum.JPEG:
      default:
        if (!asset.resizePath) {
          throw new NotFoundException(`No thumbnail found for asset ${asset.id}`);
        }
        return asset.resizePath;
    }
  }

  private getServePath(asset: AssetEntity, query: ServeFileDto, allowOriginalFile: boolean): string {
    const mimeType = mimeTypes.lookup(asset.originalPath);

    /**
     * Serve file viewer on the web
     */
    if (query.isWeb && mimeType != 'image/gif') {
      if (!asset.resizePath) {
        this.logger.error('Error serving IMAGE asset for web');
        throw new InternalServerErrorException(`Failed to serve image asset for web`, 'ServeFile');
      }

      return asset.resizePath;
    }

    /**
     * Serve thumbnail image for both web and mobile app
     */
    if ((!query.isThumb && allowOriginalFile) || (query.isWeb && mimeType === 'image/gif')) {
      return asset.originalPath;
    }

    if (asset.webpPath && asset.webpPath.length > 0) {
      return asset.webpPath;
    }

    if (!asset.resizePath) {
      throw new Error('resizePath not set');
    }

    return asset.resizePath;
  }

  private async sendFile(res: Res, filepath: string): Promise<void> {
    await fs.access(filepath, constants.R_OK);
    const options: SendFileOptions = { dotfiles: 'allow' };
    if (!path.isAbsolute(filepath)) {
      options.root = process.cwd();
    }

    res.set('Cache-Control', 'private, max-age=86400, no-transform');
    res.header('Content-Type', mimeTypes.lookup(filepath));

    try {
      await sendFile(res, filepath, options);
    } catch (error: Error | any) {
      if (!isConnectionAborted(error)) {
        this.logger.error(`Unable to send file: ${error.name}`, error.stack);
      }
      // throwing closes the connection and prevents `Error: write EPIPE`
      throw error;
    }
  }

  private async getLibraryId(authUser: AuthUserDto, libraryId?: string) {
    if (libraryId) {
      return libraryId;
    }

    let library = await this.libraryRepository.getDefaultUploadLibrary(authUser.id);
    if (!library) {
      library = await this.libraryRepository.create({
        ownerId: authUser.id,
        name: 'Default Library',
        assets: [],
        type: LibraryType.UPLOAD,
        importPaths: [],
        exclusionPatterns: [],
        isVisible: true,
      });
    }

    return library.id;
  }
}
