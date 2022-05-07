import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe, Put } from '@nestjs/common';
import { AlbumService } from './album.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { AuthUserDto, GetAuthUser } from '../../decorators/auth-user.decorator';
import { AddAssetsDto } from './dto/add-assets.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

@UseGuards(JwtAuthGuard)
@Controller('album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Post()
  async create(@GetAuthUser() authUser: AuthUserDto, @Body(ValidationPipe) createSharedAlbumDto: CreateAlbumDto) {
    return this.albumService.create(authUser, createSharedAlbumDto);
  }

  @Put('/:albumId/users')
  async addUsers(@Body(ValidationPipe) addUsersDto: AddUsersDto, @Param('albumId') albumId: string) {
    return this.albumService.addUsersToAlbum(addUsersDto, albumId);
  }

  @Put('/:albumId/assets')
  async addAssets(@Body(ValidationPipe) addAssetsDto: AddAssetsDto, @Param('albumId') albumId: string) {
    return this.albumService.addAssetsToAlbum(addAssetsDto, albumId);
  }

  @Get()
  async getAllSharedAlbums(@GetAuthUser() authUser: AuthUserDto) {
    return this.albumService.getAllSharedAlbums(authUser);
  }

  @Get('/:albumId')
  async getAlbumInfo(@GetAuthUser() authUser: AuthUserDto, @Param('albumId') albumId: string) {
    return this.albumService.getAlbumInfo(authUser, albumId);
  }

  @Delete('/:albumId/assets')
  async removeAssetFromAlbum(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) removeAssetsDto: RemoveAssetsDto,
    @Param('albumId') albumId: string,
  ) {
    return this.albumService.removeAssetsFromAlbum(authUser, removeAssetsDto, albumId);
  }

  @Delete('/:albumId')
  async deleteAlbum(@GetAuthUser() authUser: AuthUserDto, @Param('albumId') albumId: string) {
    return this.albumService.deleteAlbum(authUser, albumId);
  }

  @Delete('/:albumId/user/:userId')
  async leaveAlbum(@GetAuthUser() authUser: AuthUserDto, @Param('albumId') albumId: string) {
    return this.albumService.leaveAlbum(authUser, albumId);
  }

  @Patch('/:albumId')
  async updateAlbumInfo(
    @GetAuthUser() authUser: AuthUserDto,
    @Body(ValidationPipe) updateAlbumInfoDto: UpdateAlbumDto,
    @Param('albumId') albumId: string,
  ) {
    return this.albumService.updateAlbumTitle(authUser, updateAlbumInfoDto, albumId);
  }
}
