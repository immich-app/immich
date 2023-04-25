import { UserEntity, UserTokenEntity } from '@app/infra/entities';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { LoginDetails } from '../auth';
import { ICryptoRepository } from '../crypto';
import { IUserTokenRepository } from './user-token.repository';

@Injectable()
export class UserTokenCore {
  constructor(private crypto: ICryptoRepository, private repository: IUserTokenRepository) {}

  async validate(tokenValue: string) {
    const hashedToken = this.crypto.hashSha256(tokenValue);
    let token = await this.repository.getByToken(hashedToken);

    if (token?.user) {
      const now = DateTime.now();
      const updatedAt = DateTime.fromJSDate(token.updatedAt);
      const diff = now.diff(updatedAt, ['hours']);
      if (diff.hours > 1) {
        token = await this.repository.save({ ...token, updatedAt: new Date() });
      }

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

  async create(user: UserEntity, loginDetails: LoginDetails): Promise<string> {
    const key = this.crypto.randomBytes(32).toString('base64').replace(/\W/g, '');
    const token = this.crypto.hashSha256(key);
    await this.repository.create({
      token,
      user,
      deviceOS: loginDetails.deviceOS,
      deviceType: loginDetails.deviceType,
    });

    return key;
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.repository.delete(userId, id);
  }

  getAll(userId: string): Promise<UserTokenEntity[]> {
    return this.repository.getAll(userId);
  }
}
