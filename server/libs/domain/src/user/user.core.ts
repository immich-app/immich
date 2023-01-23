import { UserEntity } from '@app/infra/db/entities';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { constants, createReadStream, ReadStream } from 'fs';
import fs from 'fs/promises';
import { AuthUserDto } from '../auth';
import { CreateAdminDto, CreateUserDto, CreateUserOAuthDto } from './dto/create-user.dto';
import { IUserRepository, UserListFilter } from './user.repository';

const SALT_ROUNDS = 10;

export class UserCore {
  constructor(private userRepository: IUserRepository) {}

  async updateUser(authUser: AuthUserDto, id: string, dto: Partial<UserEntity>): Promise<UserEntity> {
    if (!(authUser.isAdmin || authUser.id === id)) {
      throw new ForbiddenException('You are not allowed to update this user');
    }

    if (dto.isAdmin && authUser.isAdmin && authUser.id !== id) {
      throw new BadRequestException('Admin user exists');
    }

    if (dto.email) {
      const duplicate = await this.userRepository.getByEmail(dto.email);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Email already in user by another account');
      }
    }

    try {
      if (dto.password) {
        dto.password = await hash(dto.password, SALT_ROUNDS);
      }

      return this.userRepository.update(id, dto);
    } catch (e) {
      Logger.error(e, 'Failed to update user info');
      throw new InternalServerErrorException('Failed to update user info');
    }
  }

  async createUser(createUserDto: CreateUserDto | CreateAdminDto | CreateUserOAuthDto): Promise<UserEntity> {
    const user = await this.userRepository.getByEmail(createUserDto.email);
    if (user) {
      throw new BadRequestException('User exists');
    }

    if (!(createUserDto as CreateAdminDto).isAdmin) {
      const localAdmin = await this.userRepository.getAdmin();
      if (!localAdmin) {
        throw new BadRequestException('The first registered account must the administrator.');
      }
    }

    try {
      const payload: Partial<UserEntity> = { ...createUserDto };
      if (payload.password) {
        payload.password = await hash(payload.password, SALT_ROUNDS);
      }
      return this.userRepository.create(payload);
    } catch (e) {
      Logger.error(e, 'Create new user');
      throw new InternalServerErrorException('Failed to register new user');
    }
  }

  async get(userId: string, withDeleted?: boolean): Promise<UserEntity | null> {
    return this.userRepository.get(userId, withDeleted);
  }

  async getAdmin(): Promise<UserEntity | null> {
    return this.userRepository.getAdmin();
  }

  async getByEmail(email: string, withPassword?: boolean): Promise<UserEntity | null> {
    return this.userRepository.getByEmail(email, withPassword);
  }

  async getByOAuthId(oauthId: string): Promise<UserEntity | null> {
    return this.userRepository.getByOAuthId(oauthId);
  }

  async getUserProfileImage(user: UserEntity): Promise<ReadStream> {
    if (!user.profileImagePath) {
      throw new NotFoundException('User does not have a profile image');
    }
    await fs.access(user.profileImagePath, constants.R_OK | constants.W_OK);
    return createReadStream(user.profileImagePath);
  }

  async getList(filter?: UserListFilter): Promise<UserEntity[]> {
    return this.userRepository.getList(filter);
  }

  async createProfileImage(authUser: AuthUserDto, filePath: string): Promise<UserEntity> {
    // TODO: do we need to do this? Maybe we can trust the authUser
    const user = await this.userRepository.get(authUser.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      return this.userRepository.update(user.id, { profileImagePath: filePath });
    } catch (e) {
      Logger.error(e, 'Create User Profile Image');
      throw new InternalServerErrorException('Failed to create new user profile image');
    }
  }

  async restoreUser(authUser: AuthUserDto, userToRestore: UserEntity): Promise<UserEntity> {
    // TODO: do we need to do this? Maybe we can trust the authUser
    const requestor = await this.userRepository.get(authUser.id);
    if (!requestor) {
      throw new UnauthorizedException('Requestor not found');
    }
    if (!requestor.isAdmin) {
      throw new ForbiddenException('Unauthorized');
    }
    try {
      return this.userRepository.restore(userToRestore);
    } catch (e) {
      Logger.error(e, 'Failed to restore deleted user');
      throw new InternalServerErrorException('Failed to restore deleted user');
    }
  }

  async deleteUser(authUser: AuthUserDto, userToDelete: UserEntity): Promise<UserEntity> {
    // TODO: do we need to do this? Maybe we can trust the authUser
    const requestor = await this.userRepository.get(authUser.id);
    if (!requestor) {
      throw new UnauthorizedException('Requestor not found');
    }
    if (!requestor.isAdmin) {
      throw new ForbiddenException('Unauthorized');
    }

    if (userToDelete.isAdmin) {
      throw new ForbiddenException('Cannot delete admin user');
    }

    try {
      return this.userRepository.delete(userToDelete);
    } catch (e) {
      Logger.error(e, 'Failed to delete user');
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}
