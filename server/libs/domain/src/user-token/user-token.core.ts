import { UserEntity } from '@app/infra/db/entities';
import { Injectable } from '@nestjs/common';
import { ICryptoRepository } from '../auth';
import { IUserTokenRepository } from './user-token.repository';

@Injectable()
export class UserTokenCore {
  constructor(private crypto: ICryptoRepository, private repository: IUserTokenRepository) {}

  public async getUserByToken(tokenValue: string): Promise<UserEntity | null> {
    const token = await this.repository.get(tokenValue);
    if (token?.user) {
      return token.user;
    }
    return null;
  }

  public async createToken(user: UserEntity): Promise<string> {
    const key = this.crypto.randomBytes(32).toString('base64').replace(/\W/g, '');
    const token = this.crypto.hashSha256(key);
    await this.repository.create({
      token,
      user,
    });

    return key;
  }
}
