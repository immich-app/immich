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
  Logger,
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
      try {
        const savedAsset = await this.assetService.createUserAsset(authUser, assetInfo, file.path, file.mimetype);

        if (uploadFiles.thumbnailData != null && savedAsset) {
          await this.assetService.updateThumbnailInfo(savedAsset.id, uploadFiles.thumbnailData[0].path);
          await this.backgroundTaskService.tagImage(uploadFiles.thumbnailData[0].path, savedAsset);
          await this.backgroundTaskService.detectObject(uploadFiles.thumbnailData[0].path, savedAsset);
        }

        await this.backgroundTaskService.extractExif(savedAsset, file.originalname, file.size);

        this.wsCommunicateionGateway.server.to(savedAsset.userId).emit('on_upload_success', JSON.stringify(savedAsset));
      } catch (e) {
        Logger.error(`Error receiving upload file ${e}`);
      }
    }

    return 'ok';
  }

  @Get('/download')
  async downloadFile(
    @GetAuthUser() authUser: AuthUserDto,
    @Response({ passthrough: true }) res: Res,
    @Query(ValidationPipe) query: ServeFileDto,
  ) {
    return this.assetService.downloadFile(query, res);
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

  @Get('/thumbnail/:assetId')
  async getAssetThumbnail(@Param('assetId') assetId: string): Promise<StreamableFile> {
    return await this.assetService.getAssetThumbnail(assetId);
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

  @Get('/')
  async getAllAssets(@GetAuthUser() authUser: AuthUserDto) {
    return await this.assetService.getAllAssetsNoPagination(authUser);
  }

  @Get('/:deviceId')
  async getUserAssetsByDeviceId(@GetAuthUser() authUser: AuthUserDto, @Param('deviceId') deviceId: string) {
    return await this.assetService.getUserAssetsByDeviceId(authUser, deviceId);
  }

  @Get('/assetById/:assetId')
  async getAssetById(@GetAuthUser() authUser: AuthUserDto, @Param('assetId') assetId) {
    return await this.assetService.getAssetById(authUser, assetId);
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
