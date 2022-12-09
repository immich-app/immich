import { UserService } from '@app/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadDto } from '../../../api-v1/auth/dto/jwt-payload.dto';
import { jwtSecret } from '../../../constants/jwt.constant';
import { ImmichJwtService } from '../immich-jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private userService: UserService, immichJwtService: ImmichJwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        immichJwtService.extractJwtFromCookie,
        immichJwtService.extractJwtFromHeader,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayloadDto) {
    const { userId } = payload;
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('Failure to validate JWT payload');
    }

    return user;
  }
}
