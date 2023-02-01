import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { IKeyRepository } from './api-key.repository';

@Injectable()
export class APIKeyCore {
  constructor(private crypto: ICryptoRepository, private repository: IKeyRepository) {}

  async validate(token: string): Promise<AuthUserDto | null> {
    const hashedToken = this.crypto.hashSha256(token);
    const keyEntity = await this.repository.getKey(hashedToken);
    if (keyEntity?.user) {
      const user = keyEntity.user;

      return {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        isPublicUser: false,
        isAllowUpload: true,
      };
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
