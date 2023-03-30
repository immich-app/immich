import { UserEntity } from '@app/infra/entities';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ICryptoRepository } from '../crypto';
import { IUserTokenRepository } from './user-token.repository';

@Injectable()
export class UserTokenCore {
  constructor(private crypto: ICryptoRepository, private repository: IUserTokenRepository) {}

  async validate(tokenValue: string) {
    const hashedToken = this.crypto.hashSha256(tokenValue);
    const token = await this.repository.get(hashedToken);

    if (token?.user) {
      return {
        ...token.user,
        isPublicUser: false,
        isAllowUpload: true,
        isAllowDownload: true,
        isShowExif: true,
        accessTokenId: token.id,
      };
    }

    throw new UnauthorizedException('Invalid user token');
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

  public async deleteToken(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
