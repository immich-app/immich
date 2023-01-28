import { AuthService, AuthUserDto } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';

export const AUTH_COOKIE_STRATEGY = 'auth-cookie';

@Injectable()
export class UserAuthStrategy extends PassportStrategy(Strategy, AUTH_COOKIE_STRATEGY) {
  constructor(private authService: AuthService) {
    super();
  }

  validate(request: Request): Promise<AuthUserDto | null> {
    return this.authService.validate(request.headers);
  }
}
