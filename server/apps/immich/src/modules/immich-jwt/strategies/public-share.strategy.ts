import { UserEntity } from '@app/database';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ShareService } from '../../../api-v1/share/share.service';
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
    const validatedLink = await this.shareService.getSharedLinkByKey(key);

    if (validatedLink.expiresAt) {
      const now = new Date().getTime();
      const expiresAt = new Date(validatedLink.expiresAt).getTime();

      if (now > expiresAt) {
        throw new BadRequestException('Expired link');
      }
    }

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
