import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUserDto, ICryptoRepository } from '../auth';
import { IUserRepository, UserCore } from '../user';
import { EditSharedLinkDto } from './dto';
import { mapSharedLink, mapSharedLinkWithNoExif, SharedLinkResponseDto } from './response-dto';
import { ShareCore } from './share.core';
import { ISharedLinkRepository } from './shared-link.repository';

@Injectable()
export class ShareService {
  readonly logger = new Logger(ShareService.name);
  private shareCore: ShareCore;
  private userCore: UserCore;

  constructor(
    @Inject(ICryptoRepository) cryptoRepository: ICryptoRepository,
    @Inject(ISharedLinkRepository) sharedLinkRepository: ISharedLinkRepository,
    @Inject(IUserRepository) userRepository: IUserRepository,
  ) {
    this.shareCore = new ShareCore(sharedLinkRepository, cryptoRepository);
    this.userCore = new UserCore(userRepository, cryptoRepository);
  }

  async validate(key: string): Promise<AuthUserDto> {
    const link = await this.shareCore.getByKey(key);
    if (link) {
      if (!link.expiresAt || new Date(link.expiresAt) > new Date()) {
        const user = await this.userCore.get(link.userId);
        if (user) {
          return {
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
            isPublicUser: true,
            sharedLinkId: link.id,
            isAllowUpload: link.allowUpload,
            isAllowDownload: link.allowDownload,
            isShowExif: link.showExif,
          };
        }
      }
    }
    throw new UnauthorizedException();
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

  async getByKey(key: string): Promise<SharedLinkResponseDto> {
    const link = await this.shareCore.getByKey(key);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }
    return mapSharedLink(link);
  }

  async remove(authUser: AuthUserDto, id: string): Promise<void> {
    await this.shareCore.remove(authUser.id, id);
  }

  async edit(authUser: AuthUserDto, id: string, dto: EditSharedLinkDto) {
    const link = await this.shareCore.save(authUser.id, id, dto);
    return mapSharedLink(link);
  }
}
