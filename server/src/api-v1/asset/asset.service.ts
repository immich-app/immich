import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetEntity, AssetType } from './entities/asset.entity';
import _ from 'lodash';
import { GetAllAssetQueryDto } from './dto/get-all-asset-query.dto';
import { GetAllAssetReponseDto } from './dto/get-all-asset-response.dto';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

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
    asset.lat = assetInfo.lat;
    asset.lon = assetInfo.lon;
    asset.mimeType = mimeType;
    try {
      const res = await this.assetRepository.save(asset);

      return res;
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

  public async getAllAssets(authUser: AuthUserDto, query: GetAllAssetQueryDto): Promise<GetAllAssetReponseDto> {
    // Each page will take 100 images.

    try {
      const assets = await this.assetRepository
        .createQueryBuilder('a')
        .where('a."userId" = :userId', { userId: authUser.id })
        .andWhere('a."createdAt" < :lastQueryCreatedAt', {
          lastQueryCreatedAt: query.nextPageKey || new Date().toISOString(),
        })
        .orderBy('a."createdAt"::date', 'DESC')
        .take(10000)
        .getMany();

      if (assets.length > 0) {
        const data = _.groupBy(assets, (a) => new Date(a.createdAt).toISOString().slice(0, 10));
        const formattedData = [];
        Object.keys(data).forEach((v) => formattedData.push({ date: v, assets: data[v] }));

        const response = new GetAllAssetReponseDto();
        response.count = assets.length;
        response.data = formattedData;
        response.nextPageKey = assets[assets.length - 1].createdAt;

        return response;
      } else {
        const response = new GetAllAssetReponseDto();
        response.count = 0;
        response.data = [];
        response.nextPageKey = 'null';

        return response;
      }
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
}
