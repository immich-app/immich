import { Inject, Injectable } from '@nestjs/common';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { ALBUM_REPOSITORY, IAlbumRepository } from '../album/album-repository';
import { ASSET_REPOSITORY, IAssetRepository } from '../asset/asset-repository';
import { CreateSharedLinkDto } from './dto/create-shared-link.dto';
import { UpdateShareDto } from './dto/update-share.dto';
import { ShareCore } from './share.core';
import { ISharedLinkRepository, SHARED_LINK_REPOSITORY } from './shared-link.repository';

@Injectable()
export class ShareService {
  private shareCore: ShareCore;

  constructor(
    @Inject(SHARED_LINK_REPOSITORY)
    sharedLinkRepository: ISharedLinkRepository,

    @Inject(ASSET_REPOSITORY)
    assetRepository: IAssetRepository,

    @Inject(ALBUM_REPOSITORY)
    albumRepository: IAlbumRepository,
  ) {
    this.shareCore = new ShareCore(sharedLinkRepository, assetRepository, albumRepository);
  }

  async createSharedLink(authUser: AuthUserDto, dto: CreateSharedLinkDto) {
    const createdSharedLink = await this.shareCore.createSharedLink(authUser.id, dto);

    // return mapdto
  }

  findAll() {
    return `This action returns all share`;
  }

  findOne(id: number) {
    return `This action returns a #${id} share`;
  }

  update(id: number, updateShareDto: UpdateShareDto) {
    return `This action updates a #${id} share`;
  }

  remove(id: number) {
    return `This action removes a #${id} share`;
  }
}
