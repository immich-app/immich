import {
  AccessCore,
  AssetResponseDto,
  AuthDto,
  CacheControl,
  IAccessRepository,
  IAssetRepository,
  IJobRepository,
  ILibraryRepository,
  IUserRepository,
  ImmichFileResponse,
  JobName,
  Permission,
  UploadFile,
  getLivePhotoMotionFilename,
  mapAsset,
  mimeTypes,
} from '@app/domain';
import { ASSET_CHECKSUM_CONSTRAINT, AssetEntity, AssetType, LibraryType } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { parse } from 'node:path';
import { QueryFailedError } from 'typeorm';
import { IAssetRepositoryV1 } from './asset-repository';
import { AssetBulkUploadCheckDto } from './dto/asset-check.dto';
import { AssetSearchDto } from './dto/asset-search.dto';
import { CheckExistingAssetsDto } from './dto/check-existing-assets.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { GetAssetThumbnailDto, GetAssetThumbnailFormatEnum } from './dto/get-asset-thumbnail.dto';
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

@Injectable()
export class AssetService {
  readonly logger = new ImmichLogger(AssetService.name);
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepositoryV1) private assetRepositoryV1: IAssetRepositoryV1,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILibraryRepository) private libraryRepository: ILibraryRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  public async uploadFile(
    auth: AuthDto,
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
      const libraryId = await this.getLibraryId(auth, dto.libraryId);
      await this.access.requirePermission(auth, Permission.ASSET_UPLOAD, libraryId);
      this.requireQuota(auth, file.size);
      if (livePhotoFile) {
        const livePhotoDto = { ...dto, assetType: AssetType.VIDEO, isVisible: false, libraryId };
        livePhotoAsset = await this.create(auth, livePhotoDto, livePhotoFile);
      }

      const asset = await this.create(auth, { ...dto, libraryId }, file, livePhotoAsset?.id, sidecarFile?.originalPath);

      await this.userRepository.updateUsage(auth.user.id, (livePhotoFile?.size || 0) + file.size);

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
        const [duplicate] = await this.assetRepositoryV1.getAssetsByChecksums(auth.user.id, checksums);
        return { id: duplicate.id, duplicate: true };
      }

      this.logger.error(`Error uploading file ${error}`, error?.stack);
      throw error;
    }
  }

  public async getAllAssets(auth: AuthDto, dto: AssetSearchDto): Promise<AssetResponseDto[]> {
    const userId = dto.userId || auth.user.id;
    await this.access.requirePermission(auth, Permission.TIMELINE_READ, userId);
    const assets = await this.assetRepositoryV1.getAllByUserId(userId, dto);
    return assets.map((asset) => mapAsset(asset, { withStack: true }));
  }

  async serveThumbnail(auth: AuthDto, assetId: string, dto: GetAssetThumbnailDto): Promise<ImmichFileResponse> {
    await this.access.requirePermission(auth, Permission.ASSET_VIEW, assetId);

    const asset = await this.assetRepositoryV1.get(assetId);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const filepath = this.getThumbnailPath(asset, dto.format);

    return new ImmichFileResponse({
      path: filepath,
      contentType: mimeTypes.lookup(filepath),
      cacheControl: CacheControl.PRIVATE_WITH_CACHE,
    });
  }

  public async serveFile(auth: AuthDto, assetId: string, dto: ServeFileDto): Promise<ImmichFileResponse> {
    // this is not quite right as sometimes this returns the original still
    await this.access.requirePermission(auth, Permission.ASSET_VIEW, assetId);

    const asset = await this.assetRepository.getById(assetId);
    if (!asset) {
      throw new NotFoundException('Asset does not exist');
    }

    const allowOriginalFile = !!(!auth.sharedLink || auth.sharedLink?.allowDownload);

    const filepath =
      asset.type === AssetType.IMAGE
        ? this.getServePath(asset, dto, allowOriginalFile)
        : asset.encodedVideoPath || asset.originalPath;

    return new ImmichFileResponse({
      path: filepath,
      contentType: mimeTypes.lookup(filepath),
      cacheControl: CacheControl.PRIVATE_WITH_CACHE,
    });
  }

  async getAssetSearchTerm(auth: AuthDto): Promise<string[]> {
    const possibleSearchTerm = new Set<string>();

    const rows = await this.assetRepositoryV1.getSearchPropertiesByUserId(auth.user.id);

    for (const row of rows) {
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
    }

    return [...possibleSearchTerm].filter((x) => x != null && x != '');
  }

  async getCuratedLocation(auth: AuthDto): Promise<CuratedLocationsResponseDto[]> {
    return this.assetRepositoryV1.getLocationsByUserId(auth.user.id);
  }

  async getCuratedObject(auth: AuthDto): Promise<CuratedObjectsResponseDto[]> {
    return this.assetRepositoryV1.getDetectedObjectsByUserId(auth.user.id);
  }

  async checkExistingAssets(
    auth: AuthDto,
    checkExistingAssetsDto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    return {
      existingIds: await this.assetRepositoryV1.getExistingAssets(auth.user.id, checkExistingAssetsDto),
    };
  }

  async bulkUploadCheck(auth: AuthDto, dto: AssetBulkUploadCheckDto): Promise<AssetBulkUploadCheckResponseDto> {
    // support base64 and hex checksums
    for (const asset of dto.assets) {
      if (asset.checksum.length === 28) {
        asset.checksum = Buffer.from(asset.checksum, 'base64').toString('hex');
      }
    }

    const checksums: Buffer[] = dto.assets.map((asset) => Buffer.from(asset.checksum, 'hex'));
    const results = await this.assetRepositoryV1.getAssetsByChecksums(auth.user.id, checksums);
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

  private getThumbnailPath(asset: AssetEntity, format: GetAssetThumbnailFormatEnum) {
    switch (format) {
      case GetAssetThumbnailFormatEnum.WEBP: {
        if (asset.webpPath) {
          return asset.webpPath;
        }
        this.logger.warn(`WebP thumbnail requested but not found for asset ${asset.id}, falling back to JPEG`);
      }
      case GetAssetThumbnailFormatEnum.JPEG: {
        if (!asset.resizePath) {
          throw new NotFoundException(`No thumbnail found for asset ${asset.id}`);
        }
        return asset.resizePath;
      }
    }
  }

  private getServePath(asset: AssetEntity, dto: ServeFileDto, allowOriginalFile: boolean): string {
    const mimeType = mimeTypes.lookup(asset.originalPath);

    /**
     * Serve file viewer on the web
     */
    if (dto.isWeb && mimeType != 'image/gif') {
      if (!asset.resizePath) {
        this.logger.error('Error serving IMAGE asset for web');
        throw new InternalServerErrorException(`Failed to serve image asset for web`, 'ServeFile');
      }

      return asset.resizePath;
    }

    /**
     * Serve thumbnail image for both web and mobile app
     */
    if ((!dto.isThumb && allowOriginalFile) || (dto.isWeb && mimeType === 'image/gif')) {
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

  private async getLibraryId(auth: AuthDto, libraryId?: string) {
    if (libraryId) {
      return libraryId;
    }

    let library = await this.libraryRepository.getDefaultUploadLibrary(auth.user.id);
    if (!library) {
      library = await this.libraryRepository.create({
        ownerId: auth.user.id,
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

  private async create(
    auth: AuthDto,
    dto: CreateAssetDto & { libraryId: string },
    file: UploadFile,
    livePhotoAssetId?: string,
    sidecarPath?: string,
  ): Promise<AssetEntity> {
    const asset = await this.assetRepository.create({
      ownerId: auth.user.id,
      libraryId: dto.libraryId,

      checksum: file.checksum,
      originalPath: file.originalPath,

      deviceAssetId: dto.deviceAssetId,
      deviceId: dto.deviceId,

      fileCreatedAt: dto.fileCreatedAt,
      fileModifiedAt: dto.fileModifiedAt,
      localDateTime: dto.fileCreatedAt,
      deletedAt: null,

      type: mimeTypes.assetType(file.originalPath),
      isFavorite: dto.isFavorite,
      isArchived: dto.isArchived ?? false,
      duration: dto.duration || null,
      isVisible: dto.isVisible ?? true,
      livePhotoVideo: livePhotoAssetId === null ? null : ({ id: livePhotoAssetId } as AssetEntity),
      resizePath: null,
      webpPath: null,
      thumbhash: null,
      encodedVideoPath: null,
      tags: [],
      sharedLinks: [],
      originalFileName: parse(file.originalName).name,
      faces: [],
      sidecarPath: sidecarPath || null,
      isReadOnly: dto.isReadOnly ?? false,
      isExternal: dto.isExternal ?? false,
      isOffline: dto.isOffline ?? false,
    });

    await this.assetRepository.upsertExif({ assetId: asset.id, fileSizeInByte: file.size });
    await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: asset.id, source: 'upload' } });

    return asset;
  }

  private requireQuota(auth: AuthDto, size: number) {
    if (auth.user.quotaSizeInBytes && auth.user.quotaSizeInBytes < auth.user.quotaUsageInBytes + size) {
      throw new BadRequestException('Quota has been exceeded!');
    }
  }
}
