import { AuthService, AuthUserDto, JwtPayloadDto, jwtSecret } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';

export const JWT_STRATEGY = 'jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => authService.extractJwtFromCookie(req.cookies),
        (req) => authService.extractJwtFromHeader(req.headers),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    } as StrategyOptions);
  }

  async validate(payload: JwtPayloadDto): Promise<AuthUserDto> {
    return this.authService.validatePayload(payload);
  }
}
