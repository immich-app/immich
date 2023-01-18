import { APIKeyService, AuthUserDto } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { IStrategyOptions, Strategy } from 'passport-http-header-strategy';

export const API_KEY_STRATEGY = 'api-key';

const options: IStrategyOptions = {
  header: 'x-api-key',
};

@Injectable()
export class APIKeyStrategy extends PassportStrategy(Strategy, API_KEY_STRATEGY) {
  constructor(private apiKeyService: APIKeyService) {
    super(options);
  }

  validate(token: string): Promise<AuthUserDto> {
    return this.apiKeyService.validate(token);
  }
}
