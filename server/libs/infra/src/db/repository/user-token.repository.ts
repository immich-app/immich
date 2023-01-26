import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTokenEntity } from '@app/infra/db/entities/user-token.entity';
import { IUserTokenRepository } from '@app/domain/user-token';

@Injectable()
export class UserTokenRepository implements IUserTokenRepository {
  constructor(
    @InjectRepository(UserTokenEntity)
    private userTokenRepository: Repository<UserTokenEntity>,
  ) {}

  async get(userToken: string): Promise<UserTokenEntity | null> {
    return this.userTokenRepository.findOne({ where: { token: userToken }, relations: { user: true } });
  }

  async create(userToken: Partial<UserTokenEntity>): Promise<UserTokenEntity> {
    return this.userTokenRepository.save(userToken);
  }

  async delete(userToken: string): Promise<void> {
    await this.userTokenRepository.delete(userToken);
  }
}
