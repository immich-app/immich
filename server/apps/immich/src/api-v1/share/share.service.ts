import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { EditSharedLinkDto } from './dto/edit-shared-link.dto';
import { mapSharedLinkToResponseDto, SharedLinkResponseDto } from './response-dto/shared-link-response.dto';
import { ShareCore } from './share.core';
import { ISharedLinkRepository } from './shared-link.repository';

@Injectable()
export class ShareService {
  readonly logger = new Logger(ShareService.name);
  private shareCore: ShareCore;

  constructor(
    @Inject(ISharedLinkRepository)
    sharedLinkRepository: ISharedLinkRepository,
  ) {
    this.shareCore = new ShareCore(sharedLinkRepository);
  }
  async getAll(authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    const links = await this.shareCore.getSharedLinks(authUser.id);
    return links.map(mapSharedLinkToResponseDto);
  }

  async getMine(authUser: AuthUserDto): Promise<SharedLinkResponseDto> {
    if (!authUser.isPublicUser || !authUser.sharedLinkId) {
      throw new ForbiddenException();
    }

    const link = await this.shareCore.getSharedLinkById(authUser.sharedLinkId);

    return mapSharedLinkToResponseDto(link);
  }

  async getById(id: string): Promise<SharedLinkResponseDto> {
    const link = await this.shareCore.getSharedLinkById(id);
    return mapSharedLinkToResponseDto(link);
  }

  async remove(id: string, userId: string): Promise<string> {
    await this.shareCore.removeSharedLink(id, userId);
    return id;
  }

  async getByKey(key: string): Promise<SharedLinkResponseDto> {
    const link = await this.shareCore.getSharedLinkByKey(key);
    return mapSharedLinkToResponseDto(link);
  }

  async edit(id: string, authUser: AuthUserDto, dto: EditSharedLinkDto) {
    const link = await this.shareCore.updateSharedLink(id, authUser.id, dto);

    return mapSharedLinkToResponseDto(link);
  }
}
