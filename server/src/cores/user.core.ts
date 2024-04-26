import { BadRequestException } from '@nestjs/common';
import sanitize from 'sanitize-filename';
import { SALT_ROUNDS } from 'src/constants';
import { LibraryType } from 'src/entities/library.entity';
import { UserEntity } from 'src/entities/user.entity';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { IUserRepository } from 'src/interfaces/user.interface';

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

    const payload: Partial<UserEntity> = { ...dto };
    if (payload.password) {
      payload.password = await this.cryptoRepository.hashBcrypt(payload.password, SALT_ROUNDS);
    }
    if (payload.storageLabel) {
      payload.storageLabel = sanitize(payload.storageLabel.replaceAll('.', ''));
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
  }
}
