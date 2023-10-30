import { LibraryType, UserEntity } from '@app/infra/entities';
import { BadRequestException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import path from 'path';
import sanitize from 'sanitize-filename';
import { AuthUserDto } from '../auth';
import { ICryptoRepository, ILibraryRepository, IUserRepository } from '../repositories';

const SALT_ROUNDS = 10;

let instance: UserCore | null;

export class UserCore {
  private constructor(
    private cryptoRepository: ICryptoRepository,
    private libraryRepository: ILibraryRepository,
    private userRepository: IUserRepository,
  ) {}

  static create(
    cryptoRepository: ICryptoRepository,
    libraryRepository: ILibraryRepository,
    userRepository: IUserRepository,
  ) {
    if (!instance) {
      instance = new UserCore(cryptoRepository, libraryRepository, userRepository);
    }

    return instance;
  }

  static reset() {
    instance = null;
  }

  async updateUser(authUser: AuthUserDto, id: string, dto: Partial<UserEntity>): Promise<UserEntity> {
    if (!authUser.isAdmin && authUser.id !== id) {
      throw new ForbiddenException('You are not allowed to update this user');
    }

    if (!authUser.isAdmin) {
      // Users can never update the isAdmin property.
      delete dto.isAdmin;
      delete dto.storageLabel;
      delete dto.externalPath;
    } else if (dto.isAdmin && authUser.id !== id) {
      // Admin cannot create another admin.
      throw new BadRequestException('The server already has an admin');
    }

    if (dto.email) {
      const duplicate = await this.userRepository.getByEmail(dto.email);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Email already in use by another account');
      }
    }

    if (dto.storageLabel) {
      const duplicate = await this.userRepository.getByStorageLabel(dto.storageLabel);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Storage label already in use by another account');
      }
    }

    try {
      if (dto.password) {
        dto.password = await this.cryptoRepository.hashBcrypt(dto.password, SALT_ROUNDS);
      }

      if (dto.storageLabel === '') {
        dto.storageLabel = null;
      }

      if (dto.externalPath === '') {
        dto.externalPath = null;
      } else if (dto.externalPath) {
        dto.externalPath = path.normalize(dto.externalPath);
      }

      return this.userRepository.update(id, dto);
    } catch (e) {
      Logger.error(e, 'Failed to update user info');
      throw new InternalServerErrorException('Failed to update user info');
    }
  }

  async createUser(dto: Partial<UserEntity> & { email: string }): Promise<UserEntity> {
    const user = await this.userRepository.getByEmail(dto.email);
    if (user) {
      throw new BadRequestException('User exists');
    }

    if (!dto.isAdmin) {
      const localAdmin = await this.userRepository.getAdmin();
      if (!localAdmin) {
        throw new BadRequestException('The first registered account must the administrator.');
      }
    }

    try {
      const payload: Partial<UserEntity> = { ...dto };
      if (payload.password) {
        payload.password = await this.cryptoRepository.hashBcrypt(payload.password, SALT_ROUNDS);
      }
      if (payload.storageLabel) {
        payload.storageLabel = sanitize(payload.storageLabel);
      }

      const userEntity = await this.userRepository.create(payload);
      await this.libraryRepository.create({
        owner: { id: userEntity.id } as UserEntity,
        name: 'Default Library',
        assets: [],
        type: LibraryType.UPLOAD,
        importPaths: [],
        exclusionPatterns: [],
        isVisible: true,
      });

      return userEntity;
    } catch (e) {
      Logger.error(e, 'Create new user');
      throw new InternalServerErrorException('Failed to register new user');
    }
  }

  async createProfileImage(authUser: AuthUserDto, filePath: string): Promise<UserEntity> {
    try {
      return this.userRepository.update(authUser.id, { profileImagePath: filePath });
    } catch (e) {
      Logger.error(e, 'Create User Profile Image');
      throw new InternalServerErrorException('Failed to create new user profile image');
    }
  }

  async restoreUser(authUser: AuthUserDto, userToRestore: UserEntity): Promise<UserEntity> {
    if (!authUser.isAdmin) {
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
    if (!authUser.isAdmin) {
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
