import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ReadStream } from 'fs';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserCountDto } from './dto/user-count.dto';
import {
  CreateProfileImageResponseDto,
  mapCreateProfileImageResponse,
} from './response-dto/create-profile-image-response.dto';
import { mapUserCountResponse, UserCountResponseDto } from './response-dto/user-count-response.dto';
import { mapUser, UserResponseDto } from './response-dto/user-response.dto';
import { IUserRepository } from './user-repository';
import { UserCore } from './user.core';

@Injectable()
export class UserService {
  private userCore: UserCore;
  constructor(@Inject(IUserRepository) userRepository: IUserRepository) {
    this.userCore = new UserCore(userRepository);
  }

  async getAllUsers(authUser: AuthUserDto, isAll: boolean): Promise<UserResponseDto[]> {
    if (isAll) {
      const allUsers = await this.userCore.getList();
      return allUsers.map(mapUser);
    }

    const allUserExceptRequestedUser = await this.userCore.getList({ excludeId: authUser.id });
    return allUserExceptRequestedUser.map(mapUser);
  }

  async getUserById(userId: string, withDeleted = false): Promise<UserResponseDto> {
    const user = await this.userCore.get(userId, withDeleted);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return mapUser(user);
  }

  async getUserInfo(authUser: AuthUserDto): Promise<UserResponseDto> {
    const user = await this.userCore.get(authUser.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return mapUser(user);
  }

  async getUserCount(dto: UserCountDto): Promise<UserCountResponseDto> {
    let users = await this.userCore.getList();

    if (dto.admin) {
      users = users.filter((user) => user.isAdmin);
    }

    return mapUserCountResponse(users.length);
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const createdUser = await this.userCore.createUser(createUserDto);
    return mapUser(createdUser);
  }

  async updateUser(authUser: AuthUserDto, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userCore.get(dto.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updatedUser = await this.userCore.updateUser(authUser, dto.id, dto);
    return mapUser(updatedUser);
  }

  async deleteUser(authUser: AuthUserDto, userId: string): Promise<UserResponseDto> {
    const user = await this.userCore.get(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const deletedUser = await this.userCore.deleteUser(authUser, user);
    return mapUser(deletedUser);
  }

  async restoreUser(authUser: AuthUserDto, userId: string): Promise<UserResponseDto> {
    const user = await this.userCore.get(userId, true);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const updatedUser = await this.userCore.restoreUser(authUser, user);
    return mapUser(updatedUser);
  }

  async createProfileImage(
    authUser: AuthUserDto,
    fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    const updatedUser = await this.userCore.createProfileImage(authUser, fileInfo.path);
    return mapCreateProfileImageResponse(updatedUser.id, updatedUser.profileImagePath);
  }

  async getUserProfileImage(userId: string): Promise<ReadStream> {
    const user = await this.userCore.get(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userCore.getUserProfileImage(user);
  }
}
