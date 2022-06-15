import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe, Query } from '@nestjs/common';
import { SharingService } from './sharing.service';
import { CreateSharedAlbumDto } from './dto/create-shared-album.dto';
import { ImmichAuthGuard } from '../../modules/immich-auth/guards/immich-auth.guard';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { AddAssetsDto } from './dto/add-assets.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { UpdateShareAlbumDto } from './dto/update-shared-album.dto';

@UseGuards(ImmichAuthGuard)
@Controller('shared')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post('/createAlbum')
  async create(@GetAuthUser() authUser, @Body(ValidationPipe) createSharedAlbumDto: CreateSharedAlbumDto) {
    return await this.sharingService.create(authUser, createSharedAlbumDto);
  }

  @Post('/addUsers')
  async addUsers(@Body(ValidationPipe) addUsersDto: AddUsersDto) {
    return await this.sharingService.addUsersToAlbum(addUsersDto);
  }

  @Post('/addAssets')
  async addAssets(@Body(ValidationPipe) addAssetsDto: AddAssetsDto) {
    return await this.sharingService.addAssetsToAlbum(addAssetsDto);
  }

  @Get('/allSharedAlbums')
  async getAllSharedAlbums(@GetAuthUser() authUser) {
    return await this.sharingService.getAllSharedAlbums(authUser);
  }

  @Get('/:albumId')
  async getAlbumInfo(@GetAuthUser() authUser, @Param('albumId') albumId: string) {
    return await this.sharingService.getAlbumInfo(authUser, albumId);
  }

  @Delete('/removeAssets')
  async removeAssetFromAlbum(@GetAuthUser() authUser, @Body(ValidationPipe) removeAssetsDto: RemoveAssetsDto) {
    console.log('removeAssets');
    return await this.sharingService.removeAssetsFromAlbum(authUser, removeAssetsDto);
  }

  @Delete('/:albumId')
  async deleteAlbum(@GetAuthUser() authUser, @Param('albumId') albumId: string) {
    return await this.sharingService.deleteAlbum(authUser, albumId);
  }

  @Delete('/leaveAlbum/:albumId')
  async leaveAlbum(@GetAuthUser() authUser, @Param('albumId') albumId: string) {
    return await this.sharingService.leaveAlbum(authUser, albumId);
  }

  @Patch('/updateInfo')
  async updateAlbumInfo(@GetAuthUser() authUser, @Body(ValidationPipe) updateAlbumInfoDto: UpdateShareAlbumDto) {
    return await this.sharingService.updateAlbumTitle(authUser, updateAlbumInfoDto);
  }
}
