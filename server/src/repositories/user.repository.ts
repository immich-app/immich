import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetEntity } from 'src/entities/asset.entity';
import { LibraryType } from 'src/entities/library.entity';
import { UserEntity } from 'src/entities/user.entity';
import {
  IUserRepository,
  UserFindOptions,
  UserListFilter,
  UserStatsQueryResponse,
} from 'src/interfaces/user.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { IsNull, Not, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
  ) {}

  async get(userId: string, options: UserFindOptions): Promise<UserEntity | null> {
    options = options || {};
    return this.userRepository.findOne({
      where: { id: userId },
      withDeleted: options.withDeleted,
    });
  }

  @GenerateSql()
  async getAdmin(): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { isAdmin: true } });
  }

  @GenerateSql()
  async hasAdmin(): Promise<boolean> {
    return this.userRepository.exists({ where: { isAdmin: true } });
  }

  @GenerateSql({ params: [DummyValue.EMAIL] })
  async getByEmail(email: string, withPassword?: boolean): Promise<UserEntity | null> {
    const builder = this.userRepository.createQueryBuilder('user').where({ email });

    if (withPassword) {
      builder.addSelect('user.password');
    }

    return builder.getOne();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  async getByStorageLabel(storageLabel: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { storageLabel } });
  }

  @GenerateSql({ params: [DummyValue.STRING] })
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
    return hard ? this.userRepository.remove(user) : this.userRepository.softRemove(user);
  }

  @GenerateSql()
  async getUserStats(): Promise<UserStatsQueryResponse[]> {
    const stats = await this.userRepository
      .createQueryBuilder('users')
      .select('users.id', 'userId')
      .addSelect('users.name', 'userName')
      .addSelect(`COUNT(assets.id) FILTER (WHERE assets.type = 'IMAGE' AND assets.isVisible)`, 'photos')
      .addSelect(`COUNT(assets.id) FILTER (WHERE assets.type = 'VIDEO' AND assets.isVisible)`, 'videos')
      .addSelect('COALESCE(SUM(exif.fileSizeInByte), 0)', 'usage')
      .addSelect('users.quotaSizeInBytes', 'quotaSizeInBytes')
      .leftJoin('users.assets', 'assets')
      .leftJoin('assets.exifInfo', 'exif')
      .groupBy('users.id')
      .orderBy('users.createdAt', 'ASC')
      .getRawMany();

    for (const stat of stats) {
      stat.photos = Number(stat.photos);
      stat.videos = Number(stat.videos);
      stat.usage = Number(stat.usage);
      stat.quotaSizeInBytes = stat.quotaSizeInBytes;
    }

    return stats;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.NUMBER] })
  async updateUsage(id: string, delta: number): Promise<void> {
    await this.userRepository.increment({ id }, 'quotaUsageInBytes', delta);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async syncUsage(id?: string) {
    // we can't use parameters with getQuery, hence the template string
    const subQuery = this.assetRepository
      .createQueryBuilder('assets')
      .select('COALESCE(SUM(exif."fileSizeInByte"), 0)')
      .leftJoin('assets.library', 'library')
      .leftJoin('assets.exifInfo', 'exif')
      .where('assets.ownerId = users.id')
      .andWhere(`library.type = '${LibraryType.UPLOAD}'`)
      .withDeleted();

    const query = this.userRepository
      .createQueryBuilder('users')
      .leftJoin('users.assets', 'assets')
      .update()
      .set({ quotaUsageInBytes: () => `(${subQuery.getQuery()})` });

    if (id) {
      query.where('users.id = :id', { id });
    }

    await query.execute();
  }

  private async save(user: Partial<UserEntity>) {
    const { id } = await this.userRepository.save(user);
    return this.userRepository.findOneOrFail({ where: { id }, withDeleted: true });
  }
}
