import { IUserTokenRepository } from '@app/domain/user-token';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTokenEntity } from '../entities';

@Injectable()
export class UserTokenRepository implements IUserTokenRepository {
  constructor(@InjectRepository(UserTokenEntity) private repository: Repository<UserTokenEntity>) {}

  getByToken(token: string): Promise<UserTokenEntity | null> {
    return this.repository.findOne({ where: { token }, relations: { user: true } });
  }

  getAll(userId: string): Promise<UserTokenEntity[]> {
    return this.repository.find({
      where: {
        userId,
      },
      relations: {
        user: true,
      },
      order: {
        updatedAt: 'desc',
        createdAt: 'desc',
      },
    });
  }

  create(userToken: Partial<UserTokenEntity>): Promise<UserTokenEntity> {
    return this.repository.save(userToken);
  }

  save(userToken: Partial<UserTokenEntity>): Promise<UserTokenEntity> {
    return this.repository.save(userToken);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.repository.delete({ userId, id });
  }
}
