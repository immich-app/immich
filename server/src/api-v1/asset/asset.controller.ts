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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { multerOption } from '../../config/multer-option.config';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { CreateAssetDto } from './dto/create-asset.dto';
import { ServeFileDto } from './dto/serve-file.dto';
import { AssetEntity } from './entities/asset.entity';
import { GetAllAssetQueryDto } from './dto/get-all-asset-query.dto';
import { Response as Res } from 'express';
import { GetNewAssetQueryDto } from './dto/get-new-asset-query.dto';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { DeleteAssetDto } from './dto/delete-asset.dto';
import { SearchAssetDto } from './dto/search-asset.dto';
import { CommunicationGateway } from '../communication/communication.gateway';

@UseGuards(JwtAuthGuard)
@Controller('asset')
export class AssetController {
  constructor(
    private wsCommunicateionGateway: CommunicationGateway,
    private assetService: AssetService,
    private backgroundTaskService: BackgroundTaskService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'assetData', maxCount: 1 },
        { name: 'thumbnailData', maxCount: 1 },
      ],
      multerOption,
    ),
  )
  async uploadFile(
    @GetAuthUser() authUser,
    @UploadedFiles() uploadFiles: { assetData: Express.Multer.File[]; thumbnailData?: Express.Multer.File[] },
    @Body(ValidationPipe) assetInfo: CreateAssetDto,
  ) {
    for (const file of uploadFiles.assetData) {
      const savedAsset = await this.assetService.createUserAsset(authUser, assetInfo, file.path, file.mimetype);

      if (uploadFiles.thumbnailData != null) {
        await this.assetService.updateThumbnailInfo(savedAsset.id, uploadFiles.thumbnailData[0].path);
        await this.backgroundTaskService.tagImage(uploadFiles.thumbnailData[0].path, savedAsset);
        await this.backgroundTaskService.detectObject(uploadFiles.thumbnailData[0].path, savedAsset);
      }

      await this.backgroundTaskService.extractExif(savedAsset, file.originalname, file.size);

      this.wsCommunicateionGateway.server.to(savedAsset.userId).emit('on_upload_success', JSON.stringify(savedAsset));
    }

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

  @Get('/allObjects')
  async getCuratedObject(@GetAuthUser() authUser: AuthUserDto) {
    return this.assetService.getCuratedObject(authUser);
  }

  @Get('/allLocation')
  async getCuratedLocation(@GetAuthUser() authUser: AuthUserDto) {
    return this.assetService.getCuratedLocation(authUser);
  }

  @Get('/searchTerm')
  async getAssetSearchTerm(@GetAuthUser() authUser: AuthUserDto) {
    return this.assetService.getAssetSearchTerm(authUser);
  }

  @Post('/search')
  async searchAsset(@GetAuthUser() authUser: AuthUserDto, @Body(ValidationPipe) searchAssetDto: SearchAssetDto) {
    return this.assetService.searchAsset(authUser, searchAssetDto);
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

    for (const id of assetIds.ids) {
      const assets = await this.assetService.getAssetById(authUser, id);
      deleteAssetList.push(assets);
    }

    const result = await this.assetService.deleteAssetById(authUser, assetIds);

    result.forEach((res) => {
      deleteAssetList.filter((a) => a.id == res.id && res.status == 'success');
    });

    await this.backgroundTaskService.deleteFileOnDisk(deleteAssetList);

    return result;
  }
}
