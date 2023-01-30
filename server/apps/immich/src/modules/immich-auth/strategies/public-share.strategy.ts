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

  validate(key: string): Promise<AuthUserDto | null> {
    return this.shareService.validate(key);
  }
}
