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
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AssetService } from './asset.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerOption } from '../../config/multer-option.config';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { CreateAssetDto } from './dto/create-asset.dto';
import { createReadStream } from 'fs';
import { ServeFileDto } from './dto/serve-file.dto';
import { AssetOptimizeService } from '../../modules/image-optimize/image-optimize.service';
import { AssetType } from './entities/asset.entity';
import { GetAllAssetQueryDto } from './dto/get-all-asset-query.dto';
import { Response as Res } from 'express';
import { promisify } from 'util';
import { stat } from 'fs';
import { pipeline } from 'stream';
import { GetNewAssetQueryDto } from './dto/get-new-asset-query.dto';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';

const fileInfo = promisify(stat);

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
    let file = null;
    const asset = await this.assetService.findOne(authUser, query.did, query.aid);

    // Handle Sending Images
    if (asset.type == AssetType.IMAGE || query.isThumb == 'true') {
      res.set({
        'Content-Type': asset.mimeType,
      });

      if (query.isThumb === 'false' || !query.isThumb) {
        file = createReadStream(asset.originalPath);
      } else {
        file = createReadStream(asset.resizePath);
      }

      return new StreamableFile(file);
    } else if (asset.type == AssetType.VIDEO) {
      // Handle Handling Video
      const { size } = await fileInfo(asset.originalPath);
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
          'Content-Type': asset.mimeType,
        });

        const videoStream = createReadStream(asset.originalPath, { start: start, end: end });

        return new StreamableFile(videoStream);
      } else {
        res.set({
          'Content-Type': asset.mimeType,
        });

        return new StreamableFile(createReadStream(asset.originalPath));
      }
    }

    console.log('SHOULD NOT BE HERE');
  }

  @Get('/new')
  async getNewAssets(@GetAuthUser() authUser: AuthUserDto, @Query(ValidationPipe) query: GetNewAssetQueryDto) {
    return await this.assetService.getNewAssets(authUser, query.latestDate);
  }

  @Get('/all')
  async getAllAssets(@GetAuthUser() authUser: AuthUserDto, @Query(ValidationPipe) query: GetAllAssetQueryDto) {
    return await this.assetService.getAllAssets(authUser, query);
  }

  @Get('/:deviceId')
  async getUserAssetsByDeviceId(@GetAuthUser() authUser: AuthUserDto, @Param('deviceId') deviceId: string) {
    return await this.assetService.getUserAssetsByDeviceId(authUser, deviceId);
  }

  @Get('/assetById/:assetId')
  async getAssetById(@GetAuthUser() authUser: AuthUserDto, @Param('assetId') assetId) {
    return this.assetService.getAssetById(authUser, assetId);
  }
}
