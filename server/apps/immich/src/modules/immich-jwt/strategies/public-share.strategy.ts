import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ShareService } from 'apps/immich/src/api-v1/share/share.service';
import { Request } from 'express';
import { IStrategyOptions, Strategy } from 'passport-http-header-strategy';

export const PUBLIC_SHARE_STRATEGY = 'public-share';

const options: IStrategyOptions = {
  header: 'x-immich-share-key',
  param: 'key',
  passReqToCallback: true,
};

@Injectable()
export class PublicShareStrategy extends PassportStrategy(Strategy, PUBLIC_SHARE_STRATEGY) {
  constructor(private shareService: ShareService) {
    super(options);
  }

  async validate(req: Request, token: string) {
    console.log(token, req.originalUrl);
    return await this.shareService.validateSharedLink(token);
  }
}
