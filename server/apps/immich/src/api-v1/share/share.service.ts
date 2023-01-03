import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
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

  async validateSharedLink(key: string) {
    this.logger.debug(`Validating shared link with key: ${key}`);

    // const mock = new AuthUserDto();
    // mock.id = 'a28e00a2-6905-4416-af7c-55c7ce9ac115';
    // mock.email = 'testuser@email.com';
    // mock.isAdmin = true;
    return 'ok';
  }
}
