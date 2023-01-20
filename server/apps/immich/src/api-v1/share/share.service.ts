import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '@app/domain';
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
    private userService: UserService,
  ) {
    this.shareCore = new ShareCore(sharedLinkRepository);
  }

  async validate(key: string): Promise<AuthUserDto> {
    const link = await this.shareCore.getSharedLinkByKey(key);
    if (link) {
      if (!link.expiresAt || new Date(link.expiresAt) > new Date()) {
        const user = await this.userService.getUserById(link.userId).catch(() => null);
        if (user) {
          return {
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
            isPublicUser: true,
            sharedLinkId: link.id,
            isAllowUpload: link.allowUpload,
          };
        }
      }
    }
    throw new UnauthorizedException();
  }

  async getAll(authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    const links = await this.shareCore.getSharedLinks(authUser.id);
    return links.map(mapSharedLinkToResponseDto);
  }

  async getMine(authUser: AuthUserDto): Promise<SharedLinkResponseDto> {
    if (!authUser.isPublicUser || !authUser.sharedLinkId) {
      throw new ForbiddenException();
    }

    return this.getById(authUser.sharedLinkId);
  }

  async getById(id: string): Promise<SharedLinkResponseDto> {
    const link = await this.shareCore.getSharedLinkById(id);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }
    return mapSharedLinkToResponseDto(link);
  }

  async remove(id: string, userId: string): Promise<string> {
    await this.shareCore.removeSharedLink(id, userId);
    return id;
  }

  async getByKey(key: string): Promise<SharedLinkResponseDto> {
    const link = await this.shareCore.getSharedLinkByKey(key);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }
    return mapSharedLinkToResponseDto(link);
  }

  async edit(id: string, authUser: AuthUserDto, dto: EditSharedLinkDto) {
    const link = await this.shareCore.updateSharedLink(id, authUser.id, dto);
    return mapSharedLinkToResponseDto(link);
  }
}
