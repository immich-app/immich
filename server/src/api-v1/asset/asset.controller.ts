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
  Response,
  Query,
  Logger,
  UploadedFile,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AssetService } from './asset.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerOption } from '../../config/multer-option.config';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { CreateAssetDto } from './dto/create-asset.dto';
import { createReadStream } from 'fs';
import { ServeFileDto } from './dto/serve-file.dto';
import { ImageOptimizeService } from '../../modules/image-optimize/image-optimize.service';
import { AssetType } from './entities/asset.entity';
import { GetAllAssetQueryDto } from './dto/get-all-asset-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('asset')
export class AssetController {
  constructor(
    private readonly assetService: AssetService,
    private readonly imageOptimizeService: ImageOptimizeService,
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
        await this.imageOptimizeService.resizeImage(savedAsset);
      }
    });

    return 'ok';
  }

  @Get('/file')
  async serveFile(
    @GetAuthUser() authUser: AuthUserDto,
    @Response({ passthrough: true }) res,
    @Query(ValidationPipe) query: ServeFileDto,
  ): Promise<StreamableFile> {
    let file = null;
    const asset = await this.assetService.findOne(authUser, query.did, query.aid);
    res.set({
      'Content-Type': asset.mimeType,
    });

    if (query.isThumb === 'false' || !query.isThumb) {
      file = createReadStream(asset.originalPath);
    } else {
      file = createReadStream(asset.resizePath);
    }

    return new StreamableFile(file);
  }

  @Get('/all')
  async getAllAssets(@GetAuthUser() authUser: AuthUserDto, @Query(ValidationPipe) query: GetAllAssetQueryDto) {
    return await this.assetService.getAllAssets(authUser, query);
  }

  @Get('/:deviceId')
  async getUserAssetsByDeviceId(@GetAuthUser() authUser: AuthUserDto, @Param('deviceId') deviceId: string) {
    return await this.assetService.getUserAssetsByDeviceId(authUser, deviceId);
  }
}
