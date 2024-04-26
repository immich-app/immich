import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserDto, UserResponseDto, mapPublicUser } from 'src/dtos/user.dto';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { CacheControl, ImmichFileResponse } from 'src/utils/file';

@Injectable()
export class PublicUserService {
  constructor(
    @Inject(IUserRepository) private repository: IUserRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(PublicUserService.name);
  }

  async getAll(): Promise<UserDto[] | UserResponseDto[]> {
    const users = await this.repository.getList({ withDeleted: false });
    return users.map((user) => mapPublicUser(user));
  }

  async get(id: string): Promise<UserDto> {
    const user = await this.findOrFail(id);
    return mapPublicUser(user);
  }

  async getProfileImage(id: string): Promise<ImmichFileResponse> {
    const user = await this.findOrFail(id);
    if (!user.profileImagePath) {
      throw new NotFoundException('User does not have a profile image');
    }

    return new ImmichFileResponse({
      path: user.profileImagePath,
      contentType: 'image/jpeg',
      cacheControl: CacheControl.NONE,
    });
  }

  async findOrFail(id: string) {
    const user = await this.repository.get(id, { withDeleted: false });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
}
