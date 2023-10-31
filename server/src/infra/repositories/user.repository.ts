import { IUserRepository, UserFindOptions, UserListFilter, UserStatsQueryResponse } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { UserEntity } from '../entities';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@InjectRepository(UserEntity) private userRepository: Repository<UserEntity>) {}

  async get(userId: string, options: UserFindOptions): Promise<UserEntity | null> {
    options = options || {};
    return this.userRepository.findOne({
      where: { id: userId },
      withDeleted: options.withDeleted,
    });
  }

  async getAdmin(): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { isAdmin: true } });
  }

  async hasAdmin(): Promise<boolean> {
    return this.userRepository.exist({ where: { isAdmin: true } });
  }

  async getByEmail(email: string, withPassword?: boolean): Promise<UserEntity | null> {
    let builder = this.userRepository.createQueryBuilder('user').where({ email });

    if (withPassword) {
      builder = builder.addSelect('user.password');
    }

    return builder.getOne();
  }

  async getByStorageLabel(storageLabel: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { storageLabel } });
  }

  async getByOAuthId(oauthId: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { oauthId } });
  }

  async getDeletedUsers(): Promise<UserEntity[]> {
    return this.userRepository.find({ withDeleted: true, where: { deletedAt: Not(IsNull()) } });
  }

  async getList({ withDeleted }: UserListFilter = {}): Promise<UserEntity[]> {
    return this.userRepository.find({
      withDeleted,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  create(user: Partial<UserEntity>): Promise<UserEntity> {
    return this.save(user);
  }

  // TODO change to (user: Partial<UserEntity>)
  update(id: string, user: Partial<UserEntity>): Promise<UserEntity> {
    return this.save({ ...user, id });
  }

  async delete(user: UserEntity, hard?: boolean): Promise<UserEntity> {
    if (hard) {
      return this.userRepository.remove(user);
    } else {
      return this.userRepository.softRemove(user);
    }
  }

  async restore(user: UserEntity): Promise<UserEntity> {
    return this.userRepository.recover(user);
  }

  async getUserStats(): Promise<UserStatsQueryResponse[]> {
    const stats = await this.userRepository
      .createQueryBuilder('users')
      .select('users.id', 'userId')
      .addSelect('users.firstName', 'userFirstName')
      .addSelect('users.lastName', 'userLastName')
      .addSelect(`COUNT(assets.id) FILTER (WHERE assets.type = 'IMAGE' AND assets.isVisible)`, 'photos')
      .addSelect(`COUNT(assets.id) FILTER (WHERE assets.type = 'VIDEO' AND assets.isVisible)`, 'videos')
      .addSelect('COALESCE(SUM(exif.fileSizeInByte), 0)', 'usage')
      .leftJoin('users.assets', 'assets')
      .leftJoin('assets.exifInfo', 'exif')
      .groupBy('users.id')
      .orderBy('users.createdAt', 'ASC')
      .getRawMany();

    for (const stat of stats) {
      stat.photos = Number(stat.photos);
      stat.videos = Number(stat.videos);
      stat.usage = Number(stat.usage);
    }

    return stats;
  }

  private async save(user: Partial<UserEntity>) {
    const { id } = await this.userRepository.save(user);
    return this.userRepository.findOneByOrFail({ id });
  }
}
