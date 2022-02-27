import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  UseGuards,
  Get,
  Param,
  ValidationPipe,
  StreamableFile,
  Query,
  Response,
  Headers,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AssetService } from './asset.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerOption } from '../../config/multer-option.config';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { CreateAssetDto } from './dto/create-asset.dto';
import { ServeFileDto } from './dto/serve-file.dto';
import { AssetOptimizeService } from '../../modules/image-optimize/image-optimize.service';
import { AssetEntity, AssetType } from './entities/asset.entity';
import { GetAllAssetQueryDto } from './dto/get-all-asset-query.dto';
import { Response as Res } from 'express';
import { GetNewAssetQueryDto } from './dto/get-new-asset-query.dto';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { DeleteAssetDto } from './dto/delete-asset.dto';

@UseGuards(JwtAuthGuard)
@Controller('asset')
export class AssetController {
  constructor(
    private assetService: AssetService,
    private assetOptimizeService: AssetOptimizeService,
    private backgroundTaskService: BackgroundTaskService,
  ) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 30, multerOption))
  async uploadFile(
    @GetAuthUser() authUser,
    @UploadedFiles() files: Express.Multer.File[],
    @Body(ValidationPipe) assetInfo: CreateAssetDto,
  ) {
    files.forEach(async (file) => {
      const savedAsset = await this.assetService.createUserAsset(authUser, assetInfo, file.path, file.mimetype);

      if (savedAsset && savedAsset.type == AssetType.IMAGE) {
        await this.assetOptimizeService.resizeImage(savedAsset);
        await this.backgroundTaskService.extractExif(savedAsset, file.originalname, file.size);
      }

      if (savedAsset && savedAsset.type == AssetType.VIDEO) {
        await this.assetOptimizeService.getVideoThumbnail(savedAsset, file.originalname);
      }
    });

    return 'ok';
  }

  @Get('/file')
  async serveFile(
    @Headers() headers,
    @GetAuthUser() authUser: AuthUserDto,
    @Response({ passthrough: true }) res: Res,
    @Query(ValidationPipe) query: ServeFileDto,
  ): Promise<StreamableFile> {
    return this.assetService.serveFile(authUser, query, res, headers);
  }

  @Get('/searchTerm')
  async getAssetSearchTerm(@GetAuthUser() authUser: AuthUserDto) {
    return this.assetService.getAssetSearchTerm(authUser);
  }

  @Get('/new')
  async getNewAssets(@GetAuthUser() authUser: AuthUserDto, @Query(ValidationPipe) query: GetNewAssetQueryDto) {
    return await this.assetService.getNewAssets(authUser, query.latestDate);
  }

  @Get('/all')
  async getAllAssets(@GetAuthUser() authUser: AuthUserDto, @Query(ValidationPipe) query: GetAllAssetQueryDto) {
    return await this.assetService.getAllAssets(authUser, query);
  }

  @Get('/')
  async getAllAssetsNoPagination(@GetAuthUser() authUser: AuthUserDto) {
    return await this.assetService.getAllAssetsNoPagination(authUser);
  }

  @Get('/:deviceId')
  async getUserAssetsByDeviceId(@GetAuthUser() authUser: AuthUserDto, @Param('deviceId') deviceId: string) {
    return await this.assetService.getUserAssetsByDeviceId(authUser, deviceId);
  }

  @Get('/assetById/:assetId')
  async getAssetById(@GetAuthUser() authUser: AuthUserDto, @Param('assetId') assetId) {
    return this.assetService.getAssetById(authUser, assetId);
  }

  @Delete('/')
  async deleteAssetById(@GetAuthUser() authUser: AuthUserDto, @Body(ValidationPipe) assetIds: DeleteAssetDto) {
    const deleteAssetList: AssetEntity[] = [];

    assetIds.ids.forEach(async (id) => {
      const assets = await this.assetService.getAssetById(authUser, id);
      deleteAssetList.push(assets);
    });

    const result = await this.assetService.deleteAssetById(authUser, assetIds);

    result.forEach((res) => {
      deleteAssetList.filter((a) => a.id == res.id && res.status == 'success');
    });

    await this.backgroundTaskService.deleteFileOnDisk(deleteAssetList);

    return result;
  }
}
