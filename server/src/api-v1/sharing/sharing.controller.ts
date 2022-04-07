import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SharingService } from './sharing.service';
import { CreateSharedAlbumDto } from './dto/create-shared-album.dto';
import { JwtAuthGuard } from '../../modules/immich-jwt/guards/jwt-auth.guard';
import { GetAuthUser } from '../../decorators/auth-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('shared')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post('/createAlbum')
  async create(@GetAuthUser() authUser, @Body() createSharedAlbumDto: CreateSharedAlbumDto) {
    return await this.sharingService.create(authUser, createSharedAlbumDto);
  }

  @Post('/addUsers')
  async addUsers() {}

  @Get('/allSharedAlbums')
  async getAllSharedAlbums(@GetAuthUser() authUser) {
    return await this.sharingService.getAllSharedAlbums(authUser);
  }
}
