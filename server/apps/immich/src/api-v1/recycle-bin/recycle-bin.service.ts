import { ImmichConfigService } from '@app/immich-config';
import { AssetEntity } from '@app/infra';
import { StorageService } from '@app/storage';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { RestoreAssetsDto } from '../album/dto/restore-assets.dto';
import { IAssetRepository } from '../asset/asset-repository';
import { AssetCountByUserIdResponseDto } from '../asset/response-dto/asset-count-by-user-id-response.dto';
import { AssetResponseDto, mapAsset } from '../asset/response-dto/asset-response.dto';
import { DeleteAssetResponseDto, DeleteAssetStatusEnum } from '../asset/response-dto/delete-asset-response.dto';
import { ShareCore } from '../share/share.core';
import { ISharedLinkRepository } from '../share/shared-link.repository';
import { RecycleBinConfigResponseDto } from './response-dto/recycle-bin-config-response.dto';

@Injectable()
export class RecycleBinService {
  readonly logger = new Logger(RecycleBinService.name);
  private shareCore: ShareCore;

  constructor(
    @Inject(IAssetRepository) private _assetRepository: IAssetRepository,

    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    private storageService: StorageService,
    @Inject(ISharedLinkRepository) sharedLinkRepository: ISharedLinkRepository,

    private immichConfigService: ImmichConfigService,

    private backgroundTaskService: BackgroundTaskService,
  ) {
    this.shareCore = new ShareCore(sharedLinkRepository);
  }

  public async getAllUserDeletedAssets(authUser: AuthUserDto): Promise<AssetResponseDto[]> {
    const config = await this.immichConfigService.getConfig();

    if (config.recycleBin.enabled) {
      const assets = await this._assetRepository.getAllDeletedByUserId(authUser.id);
      return assets.map((asset) => mapAsset(asset));
    }

    return [];
  }

  public async deleteAllAssetsInRecycleBin(authUser: AuthUserDto): Promise<DeleteAssetResponseDto[]> {
    const deletedAssets = await this._assetRepository.getAllDeletedByUserId(authUser.id);
    const deleteAssetList: AssetResponseDto[] = [];
    const result: DeleteAssetResponseDto[] = [];

    for (const asset of deletedAssets) {
      if (asset.livePhotoVideoId) {
        const livePhotoVideo = await this.getAssetById(asset.livePhotoVideoId);
        await this.deleteAsset(livePhotoVideo.id, result);
        if (result[result.length - 1].status == DeleteAssetStatusEnum.SUCCESS) {
          deleteAssetList.push(livePhotoVideo);
        }
      }

      await this.deleteAsset(asset.id, result);
      if (result[result.length - 1].status == DeleteAssetStatusEnum.SUCCESS) {
        deleteAssetList.push(mapAsset(asset));
      }
    }

    await this.backgroundTaskService.deleteFileOnDisk(deleteAssetList);

    return result;
  }

  public async deleteAssetsInRecycleBin(authUser: AuthUserDto, assetIds: string[]): Promise<DeleteAssetResponseDto[]> {
    const result: DeleteAssetResponseDto[] = [];
    const deleteAssetList: AssetResponseDto[] = [];

    for (const assetId of assetIds) {
      const asset = await this._assetRepository.getById(assetId);

      if (asset.livePhotoVideoId) {
        const livePhotoVideo = await this.getAssetById(asset.livePhotoVideoId);
        await this.deleteAsset(livePhotoVideo.id, result);
        if (result[result.length - 1].status == DeleteAssetStatusEnum.SUCCESS) {
          deleteAssetList.push(livePhotoVideo);
        }
      }

      await this.deleteAsset(asset.id, result);
      if (result[result.length - 1].status == DeleteAssetStatusEnum.SUCCESS) {
        deleteAssetList.push(mapAsset(asset));
      }
    }

    await this.backgroundTaskService.deleteFileOnDisk(deleteAssetList);

    return result;
  }

  async deleteAsset(assetId: string, result: DeleteAssetResponseDto[]): Promise<void> {
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
      this.logger.error(`Failed to delete asset ${assetId}`);
    }
  }

  public async restoreDeletedAssets(authUser: AuthUserDto, restoreDto: RestoreAssetsDto): Promise<AssetResponseDto[]> {
    const restore = await this._assetRepository.restoreDeleted(authUser.id, restoreDto);

    if (restore.affected !== restoreDto.assetIds.length) {
      throw new BadRequestException('Some assets were not found in the bin');
    }

    return await this.getAllUserDeletedAssets(authUser);
  }

  public async getAssetById(assetId: string): Promise<AssetResponseDto> {
    const asset = await this._assetRepository.getById(assetId);

    return mapAsset(asset);
  }

  getDeletedAssetCountByUserId(authUser: AuthUserDto): Promise<AssetCountByUserIdResponseDto> {
    return this._assetRepository.getDeletedAssetCountByUserId(authUser.id);
  }

  async getConfig(): Promise<RecycleBinConfigResponseDto> {
    const config = await this.immichConfigService.getConfig();
    return config.recycleBin;
  }
}
