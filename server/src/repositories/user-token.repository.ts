import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DummyValue, GenerateSql } from 'src/decorators';
import { UserTokenEntity } from 'src/entities/user-token.entity';
import { IUserTokenRepository } from 'src/interfaces/user-token.repository';
import { Instrumentation } from 'src/utils/instrumentation';
import { Repository } from 'typeorm';

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
