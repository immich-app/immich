import { BadRequestException, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { EditSharedLinkDto } from './dto';
import { mapSharedLink, mapSharedLinkWithNoExif, SharedLinkResponseDto } from './response-dto';
import { ShareCore } from './share.core';
import { ISharedLinkRepository } from './shared-link.repository';

@Injectable()
export class ShareService {
  readonly logger = new Logger(ShareService.name);
  private shareCore: ShareCore;

  constructor(
    @Inject(ICryptoRepository) cryptoRepository: ICryptoRepository,
    @Inject(ISharedLinkRepository) sharedLinkRepository: ISharedLinkRepository,
  ) {
    this.shareCore = new ShareCore(sharedLinkRepository, cryptoRepository);
  }

  async getAll(authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    const links = await this.shareCore.getAll(authUser.id);
    return links.map(mapSharedLink);
  }

  async getMine(authUser: AuthUserDto): Promise<SharedLinkResponseDto> {
    if (!authUser.isPublicUser || !authUser.sharedLinkId) {
      throw new ForbiddenException();
    }

    let allowExif = true;
    if (authUser.isShowExif != undefined) {
      allowExif = authUser.isShowExif;
    }

    return this.getById(authUser, authUser.sharedLinkId, allowExif);
  }

  async getById(authUser: AuthUserDto, id: string, allowExif: boolean): Promise<SharedLinkResponseDto> {
    const link = await this.shareCore.get(authUser.id, id);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    if (allowExif) {
      return mapSharedLink(link);
    } else {
      return mapSharedLinkWithNoExif(link);
    }
  }

  async remove(authUser: AuthUserDto, id: string): Promise<void> {
    await this.shareCore.remove(authUser.id, id);
  }

  async edit(authUser: AuthUserDto, id: string, dto: EditSharedLinkDto) {
    const link = await this.shareCore.save(authUser.id, id, dto);
    return mapSharedLink(link);
  }
}
