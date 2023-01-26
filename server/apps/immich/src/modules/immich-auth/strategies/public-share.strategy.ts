import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { IStrategyOptions, Strategy } from 'passport-http-header-strategy';
import { AuthUserDto, ShareService } from '@app/domain';

export const PUBLIC_SHARE_STRATEGY = 'public-share';

const options: IStrategyOptions = {
  header: 'x-immich-share-key',
  param: 'key',
};

@Injectable()
export class PublicShareStrategy extends PassportStrategy(Strategy, PUBLIC_SHARE_STRATEGY) {
  constructor(private shareService: ShareService) {
    super(options);
  }

  async validate(key: string): Promise<AuthUserDto> {
    return this.shareService.validate(key);
  }
}
