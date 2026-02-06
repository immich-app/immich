import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import { UserAdminResponseDto, UserResponseDto, UserUpdateMeDto, mapUser, mapUserAdmin } from 'src/dtos/user.dto';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class UserService extends BaseService {
  async search(auth: AuthDto): Promise<UserResponseDto[]> {
    const users = await this.userRepository.getList({ withDeleted: false });
    return users.map((user) => mapUser(user));
  }

  async getMe(auth: AuthDto): Promise<UserAdminResponseDto> {
    const user = await this.userRepository.getAdmin(auth.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return mapUserAdmin(user);
  }

  async get(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.get(id, { withDeleted: false });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return mapUser(user);
  }

  async updateMe(auth: AuthDto, dto: UserUpdateMeDto): Promise<UserAdminResponseDto> {
    const user = await this.userRepository.update(auth.user.id, dto);
    return mapUserAdmin(user);
  }
}
