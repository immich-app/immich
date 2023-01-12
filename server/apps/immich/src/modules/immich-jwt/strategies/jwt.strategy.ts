import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { UserService } from '@app/domain';
import { JwtPayloadDto } from '../../../api-v1/auth/dto/jwt-payload.dto';
import { jwtSecret } from '../../../constants/jwt.constant';
import { AuthUserDto } from '../../../decorators/auth-user.decorator';
import { ImmichJwtService } from '../immich-jwt.service';

export const JWT_STRATEGY = 'jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY) {
  constructor(private userService: UserService, immichJwtService: ImmichJwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => immichJwtService.extractJwtFromCookie(req.cookies),
        (req) => immichJwtService.extractJwtFromHeader(req.headers),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    } as StrategyOptions);
  }

  async validate(payload: JwtPayloadDto): Promise<AuthUserDto> {
    const { userId } = payload;
    const user = await this.userService.getUserById(userId).catch(() => null);
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
