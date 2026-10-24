import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthDto } from 'src/dtos/auth.dto.js';
import {
  CreateLockedAlbumDto,
  GetLockedAlbumAssetsDto,
  LockedAlbumAssetsDto,
  LockedAlbumAssetsResponseDto,
  LockedAlbumResponseDto,
  UpdateLockedAlbumDto,
} from 'src/dtos/locked-album.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Auth, Authenticated } from 'src/middleware/auth.guard.js';
import { LockedAlbumService } from 'src/services/locked-album.service.js';
import { PrivateRequest } from 'src/utils/private-request.js';
import { UUIDParamDto } from 'src/validation.js';

const PrivateAlbumOperation = (summary: string) =>
  ApiOperation({
    summary,
    description: "Experimental. Requires the owner's PIN-elevated session. API keys and shared links are rejected.",
    security: [{ bearer: [] }, { cookie: [] }],
  });

@ApiTags(ApiTag.Albums)
@Controller('locked-albums')
@PrivateRequest(true)
export class LockedAlbumController {
  constructor(private service: LockedAlbumService) {}

  @Get()
  @PrivateAlbumOperation('List private groups')
  @Header('Cache-Control', 'no-store')
  @Authenticated({ permission: Permission.AlbumRead })
  getAllLockedAlbums(@Auth() auth: AuthDto): Promise<LockedAlbumResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Post()
  @PrivateAlbumOperation('Create a private group')
  @Header('Cache-Control', 'no-store')
  @Authenticated({ permission: Permission.AlbumCreate })
  createLockedAlbum(@Auth() auth: AuthDto, @Body() dto: CreateLockedAlbumDto): Promise<LockedAlbumResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get(':id')
  @PrivateAlbumOperation('Read a private group')
  @Header('Cache-Control', 'no-store')
  @Authenticated({ permission: Permission.AlbumRead })
  getLockedAlbum(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<LockedAlbumResponseDto> {
    return this.service.get(auth, id);
  }

  @Patch(':id')
  @PrivateAlbumOperation('Rename a private group')
  @Header('Cache-Control', 'no-store')
  @Authenticated({ permission: Permission.AlbumUpdate })
  updateLockedAlbum(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateLockedAlbumDto,
  ): Promise<LockedAlbumResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @PrivateAlbumOperation('Delete a private grouping without deleting its photos')
  @Header('Cache-Control', 'no-store')
  @Authenticated({ permission: Permission.AlbumDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteLockedAlbum(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Get(':id/assets')
  @PrivateAlbumOperation('List locked assets in a private group')
  @Header('Cache-Control', 'no-store')
  @Authenticated({ permission: Permission.AlbumRead })
  getLockedAlbumAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query() dto: GetLockedAlbumAssetsDto,
  ): Promise<LockedAlbumAssetsResponseDto> {
    return this.service.getAssets(auth, id, dto);
  }

  @Put(':id/assets')
  @PrivateAlbumOperation('Add locked assets to a private group')
  @Header('Cache-Control', 'no-store')
  @Authenticated({ permission: Permission.AlbumAssetCreate })
  @HttpCode(HttpStatus.NO_CONTENT)
  addLockedAlbumAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: LockedAlbumAssetsDto,
  ): Promise<void> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @PrivateAlbumOperation('Remove membership without deleting or unlocking photos')
  @Header('Cache-Control', 'no-store')
  @Authenticated({ permission: Permission.AlbumAssetDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeLockedAlbumAssets(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: LockedAlbumAssetsDto,
  ): Promise<void> {
    return this.service.removeAssets(auth, id, dto);
  }
}
