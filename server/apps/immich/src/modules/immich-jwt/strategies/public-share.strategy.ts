import { UserEntity } from '@app/infra';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { IStrategyOptions, Strategy } from 'passport-http-header-strategy';
import { Repository } from 'typeorm';
import { ShareService } from '../../../api-v1/share/share.service';
import { AuthUserDto } from '../../../decorators/auth-user.decorator';

export const PUBLIC_SHARE_STRATEGY = 'public-share';

const options: IStrategyOptions = {
  header: 'x-immich-share-key',
  param: 'key',
};

@Injectable()
export class PublicShareStrategy extends PassportStrategy(Strategy, PUBLIC_SHARE_STRATEGY) {
  constructor(
    private shareService: ShareService,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {
    super(options);
  }

  async validate(key: string): Promise<AuthUserDto> {
    const validatedLink = await this.shareService.getByKey(key);

    if (validatedLink.expiresAt) {
      const now = new Date().getTime();
      const expiresAt = new Date(validatedLink.expiresAt).getTime();

      if (now > expiresAt) {
        throw new UnauthorizedException('Expired link');
      }
    }

    const user = await this.usersRepository.findOne({ where: { id: validatedLink.userId } });

    if (!user) {
      throw new UnauthorizedException('Failure to validate public share payload');
    }

    let publicUser = new AuthUserDto();
    publicUser = user;
    publicUser.isPublicUser = true;
    publicUser.sharedLinkId = validatedLink.id;
    publicUser.isAllowUpload = validatedLink.allowUpload;

    return publicUser;
  }
}
