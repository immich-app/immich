import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthUserDto } from 'apps/immich/src/decorators/auth-user.decorator';
import { IStrategyOptions, Strategy } from 'passport-http-header-strategy';
import { APIKeyService } from '../../../api-v1/api-key/api-key.service';

export const API_KEY_STRATEGY = 'api-key';

const options: IStrategyOptions = {
  header: 'x-api-key',
};

@Injectable()
export class APIKeyStrategy extends PassportStrategy(Strategy, API_KEY_STRATEGY) {
  constructor(private apiKeyService: APIKeyService) {
    super(options);
  }

  async validate(token: string): Promise<AuthUserDto> {
    const user = await this.apiKeyService.validate(token);

    const authUser = new AuthUserDto();
    authUser.id = user.id;
    authUser.email = user.email;
    authUser.isAdmin = user.isAdmin;
    authUser.isPublicUser = false;
    authUser.isAllowUpload = true;

    return authUser;
  }
}
