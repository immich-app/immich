import { Body, Controller, Delete, Get, Put, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { Authenticated } from '../../decorators/authenticated.decorator';
import { RestoreAssetsDto } from '../album/dto/restore-assets.dto';
import { DeleteAssetDto } from '../asset/dto/delete-asset.dto';
import { AssetCountByUserIdResponseDto } from '../asset/response-dto/asset-count-by-user-id-response.dto';
import { AssetResponseDto } from '../asset/response-dto/asset-response.dto';
import { DeleteAssetResponseDto } from '../asset/response-dto/delete-asset-response.dto';
import { RecycleBinService } from './recycle-bin.service';
import { RecycleBinConfigResponseDto } from './response-dto/recycle-bin-config-response.dto';

@ApiBearerAuth()
@ApiTags('Recycle Bin')
@Controller('bin')
export class RecycleBinController {
  constructor(private readonly recycleBinService: RecycleBinService) {}

  /**
   * Get all AssetEntity deleted by user
   */
  @Authenticated()
  @Get()
  async getAllDeletedAssets(@GetAuthUser() authUser: AuthUserDto): Promise<AssetResponseDto[]> {
    const assets = await this.recycleBinService.getAllUserDeletedAssets(authUser);
    return assets;
  }

  /**
   * Empty out bin for User
   */
  @Authenticated()
  @Delete('/')
  async emptyBin(@GetAuthUser() authUser: AuthUserDto): Promise<DeleteAssetResponseDto[]> {
    return await this.recycleBinService.deleteAllAssetsInRecycleBin(authUser);
  }

  @Authenticated()
  @Get('/count-by-user-id')
  async getRecycleBinCountByUserId(@GetAuthUser() authUser: AuthUserDto): Promise<AssetCountByUserIdResponseDto> {
    return this.recycleBinService.getDeletedAssetCountByUserId(authUser);
  }

  @Authenticated()
  @Get('/config')
  async getRecycleBinConfig(): Promise<RecycleBinConfigResponseDto> {
    return this.recycleBinService.getConfig();
  }

  /**
   * Restore deleted Assets by User
   */
  @Authenticated()
  @Put('/assets')
  async restoreDeletedAssets(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) restoreDto: RestoreAssetsDto,
  ): Promise<AssetResponseDto[]> {
    return await this.recycleBinService.restoreDeletedAssets(authUser, restoreDto);
  }

  /**
   * Permenantly delete Assets
   */
  @Authenticated()
  @Delete('/assets')
  async deleteRecyleBinAssets(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) assetIds: DeleteAssetDto,
  ): Promise<DeleteAssetResponseDto[]> {
    return await this.recycleBinService.deleteAssetsInRecycleBin(authUser, assetIds.ids);
  }
}
