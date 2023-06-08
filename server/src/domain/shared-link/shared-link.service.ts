import { SharedLinkEntity } from '@app/infra/entities';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { EditSharedLinkDto } from './dto';
import { mapSharedLink, mapSharedLinkWithNoExif, SharedLinkResponseDto } from './response-dto';
import { ISharedLinkRepository } from './shared-link.repository';

@Injectable()
export class SharedLinkService {
  constructor(@Inject(ISharedLinkRepository) private repository: ISharedLinkRepository) {}

  async getAll(authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    return this.repository.getAll(authUser.id).then((links) => links.map(mapSharedLink));
  }

  async getMine(authUser: AuthUserDto): Promise<SharedLinkResponseDto> {
    const { sharedLinkId: id, isPublicUser, isShowExif } = authUser;

    if (!isPublicUser || !id) {
      throw new ForbiddenException();
    }

    const sharedLink = await this.findOrFail(authUser, id);

    return this.map(sharedLink, { withExif: isShowExif ?? true });
  }

  async get(authUser: AuthUserDto, id: string): Promise<SharedLinkResponseDto> {
    const sharedLink = await this.findOrFail(authUser, id);
    return this.map(sharedLink, { withExif: true });
  }

  async update(authUser: AuthUserDto, id: string, dto: EditSharedLinkDto) {
    await this.findOrFail(authUser, id);
    const sharedLink = await this.repository.update({
      id,
      userId: authUser.id,
      description: dto.description,
      expiresAt: dto.expiresAt,
      allowUpload: dto.allowUpload,
      allowDownload: dto.allowDownload,
      showExif: dto.showExif,
    });
    return this.map(sharedLink, { withExif: true });
  }

  async remove(authUser: AuthUserDto, id: string): Promise<void> {
    const sharedLink = await this.findOrFail(authUser, id);
    await this.repository.remove(sharedLink);
  }

  private async findOrFail(authUser: AuthUserDto, id: string) {
    const sharedLink = await this.repository.get(authUser.id, id);
    if (!sharedLink) {
      throw new BadRequestException('Shared link not found');
    }
    return sharedLink;
  }

  private map(sharedLink: SharedLinkEntity, { withExif }: { withExif: boolean }) {
    return withExif ? mapSharedLink(sharedLink) : mapSharedLinkWithNoExif(sharedLink);
  }
}
