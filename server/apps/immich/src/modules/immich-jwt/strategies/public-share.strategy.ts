import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ShareService } from 'apps/immich/src/api-v1/share/share.service';
import { IStrategyOptions, Strategy } from 'passport-http-header-strategy';

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

  async validate(token: string) {
    console.log('validating token');
    return await this.shareService.validateSharedLink(token);
  }
}
