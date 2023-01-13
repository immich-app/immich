import { UserEntity } from '@app/infra';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { Repository } from 'typeorm';
import { JwtPayloadDto } from '../../../api-v1/auth/dto/jwt-payload.dto';
import { jwtSecret } from '../../../constants/jwt.constant';
import { AuthUserDto } from '../../../decorators/auth-user.decorator';
import { ImmichJwtService } from '../immich-jwt.service';

export const JWT_STRATEGY = 'jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY) {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    immichJwtService: ImmichJwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        immichJwtService.extractJwtFromCookie,
        immichJwtService.extractJwtFromHeader,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    } as StrategyOptions);
  }

  async validate(payload: JwtPayloadDto): Promise<AuthUserDto> {
    const { userId } = payload;
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Failure to validate JWT payload');
    }

    const authUser = new AuthUserDto();
    authUser.id = user.id;
    authUser.email = user.email;
    authUser.isAdmin = user.isAdmin;
    authUser.isPublicUser = false;
    authUser.isAllowUpload = true;

    return authUser;
  }
}
