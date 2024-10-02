import { BadRequestException } from '@nestjs/common';
import sanitize from 'sanitize-filename';
import { SALT_ROUNDS } from 'src/constants';
import { UserEntity } from 'src/entities/user.entity';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IUserRepository } from 'src/interfaces/user.interface';

type RepoDeps = { userRepo: IUserRepository; cryptoRepo: ICryptoRepository };

export const createUser = async (
  { userRepo, cryptoRepo }: RepoDeps,
  dto: Partial<UserEntity> & { email: string },
): Promise<UserEntity> => {
  const user = await userRepo.getByEmail(dto.email);
  if (user) {
    throw new BadRequestException('User exists');
  }

  if (!dto.isAdmin) {
    const localAdmin = await userRepo.getAdmin();
    if (!localAdmin) {
      throw new BadRequestException('The first registered account must the administrator.');
    }
  }

  const payload: Partial<UserEntity> = { ...dto };
  if (payload.password) {
    payload.password = await cryptoRepo.hashBcrypt(payload.password, SALT_ROUNDS);
  }
  if (payload.storageLabel) {
    payload.storageLabel = sanitize(payload.storageLabel.replaceAll('.', ''));
  }

  return userRepo.create(payload);
};
