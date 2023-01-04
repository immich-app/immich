import { UserEntity } from '@app/database';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ShareService } from 'apps/immich/src/api-v1/share/share.service';
import { Request } from 'express';
import { IStrategyOptions, Strategy } from 'passport-http-header-strategy';
import { Repository } from 'typeorm';

export const PUBLIC_SHARE_STRATEGY = 'public-share';

const options: IStrategyOptions = {
  header: 'x-immich-share-key',
  param: 'key',
};

export class PublicUser extends UserEntity {
  isPublicUser?: boolean;
}

@Injectable()
export class PublicShareStrategy extends PassportStrategy(Strategy, PUBLIC_SHARE_STRATEGY) {
  constructor(
    private shareService: ShareService,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {
    super(options);
  }

  async validate(key: string): Promise<PublicUser> {
    const validatedLink = await this.shareService.validateSharedLink(key);

    const user = await this.usersRepository.findOne({ where: { id: validatedLink.userId } });

    if (!user) {
      throw new BadRequestException('Failure to validate public share payload');
    }

    let publicUser = new PublicUser();
    publicUser = user;
    publicUser.isPublicUser = true;

    return publicUser;
  }
}
