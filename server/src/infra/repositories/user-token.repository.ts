import { IUserTokenRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTokenEntity } from '../entities';
import { DummyValue, GenerateSql } from '../infra.util';
import { Instrumentation } from '../instrumentation';

@Instrumentation()
@Injectable()
export class UserTokenRepository implements IUserTokenRepository {
  constructor(@InjectRepository(UserTokenEntity) private repository: Repository<UserTokenEntity>) {}

  @GenerateSql({ params: [DummyValue.STRING] })
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

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
