import { UserEntity } from '@app/infra/db/entities';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ICryptoRepository } from '../crypto';
import { IUserTokenRepository } from './user-token.repository';

@Injectable()
export class UserTokenCore {
  constructor(private crypto: ICryptoRepository, private repository: IUserTokenRepository) {}

  async validate(tokenValue: string) {
    const hashedToken = this.crypto.hashSha256(tokenValue);
    const user = await this.getUserByToken(hashedToken);
    if (user) {
      return {
        ...user,
        isPublicUser: false,
        isAllowUpload: true,
        isAllowDownload: true,
        isShowExif: true,
      };
    }

    throw new UnauthorizedException('Invalid user token');
  }

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
