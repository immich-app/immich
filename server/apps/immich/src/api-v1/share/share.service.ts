import { Inject, Injectable } from '@nestjs/common';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateSharedLinkDto } from './dto/create-shared-link.dto';
import { mapSharedLinkToResponseDto, SharedLinkResponseDto } from './response-dto/shared-link-response.dto';
import { ShareCore } from './share.core';
import { ISharedLinkRepository } from './shared-link.repository';

@Injectable()
export class ShareService {
  private shareCore: ShareCore;

  constructor(
    @Inject(ISharedLinkRepository)
    sharedLinkRepository: ISharedLinkRepository,
  ) {
    this.shareCore = new ShareCore(sharedLinkRepository);
  }

  async createSharedLink(authUser: AuthUserDto, dto: CreateSharedLinkDto): Promise<SharedLinkResponseDto> {
    const createdSharedLink = await this.shareCore.createSharedLink(authUser.id, dto);
    return mapSharedLinkToResponseDto(createdSharedLink);
  }

  async findAll(authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    const links = await this.shareCore.getSharedLinks(authUser.id);
    return links.map(mapSharedLinkToResponseDto);
  }

  async findOne(id: string): Promise<SharedLinkResponseDto> {
    const link = await this.shareCore.getSharedLinkById(id);
    return mapSharedLinkToResponseDto(link);
  }

  async remove(id: string) {
    const removedLink = await this.shareCore.removeSharedLink(id);
    return mapSharedLinkToResponseDto(removedLink);
  }
}
