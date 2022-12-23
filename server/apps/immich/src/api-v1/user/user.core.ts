import { UserEntity } from '@app/database/entities/user.entity';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { genSalt, hash } from 'bcrypt';
import { createReadStream, constants, ReadStream } from 'fs';
import fs from 'fs/promises';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateAdminDto, CreateUserDto, CreateUserOAuthDto } from './dto/create-user.dto';
import { IUserRepository, UserListFilter } from './user-repository';

export class UserCore {
  constructor(private userRepository: IUserRepository) {}

  private async generateSalt(): Promise<string> {
    return genSalt();
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return hash(password, salt);
  }

  async updateUser(authUser: AuthUserDto, userToUpdate: UserEntity, data: Partial<UserEntity>): Promise<UserEntity> {
    if (!authUser.isAdmin && (authUser.id !== userToUpdate.id || userToUpdate.id != data.id)) {
      throw new ForbiddenException('You are not allowed to update this user');
    }

    // TODO: can this happen? If so we should implement a test case, otherwise remove it (also from DTO)
    if (userToUpdate.isAdmin) {
      const adminUser = await this.userRepository.getAdmin();
      if (adminUser && adminUser.id !== userToUpdate.id) {
        throw new BadRequestException('Admin user exists');
      }
    }

    try {
      const payload: Partial<UserEntity> = { ...data };
      if (payload.password) {
        const salt = await this.generateSalt();
        payload.salt = salt;
        payload.password = await this.hashPassword(payload.password, salt);
      }
      return this.userRepository.update(userToUpdate.id, payload);
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
        const salt = await this.generateSalt();
        payload.salt = salt;
        payload.password = await this.hashPassword(payload.password, salt);
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
