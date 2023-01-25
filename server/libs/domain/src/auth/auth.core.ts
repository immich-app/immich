import { SystemConfig, UserEntity } from '@app/infra/db/entities';
import { IncomingHttpHeaders } from 'http';
import { ISystemConfigRepository } from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import { AuthType, IMMICH_ACCESS_COOKIE, IMMICH_AUTH_TYPE_COOKIE } from './auth.constant';
import { ICryptoRepository } from './crypto.repository';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { LoginResponseDto, mapLoginResponse } from './response-dto';

export type JwtValidationResult = {
  status: boolean;
  userId: string | null;
};

export class AuthCore {
  constructor(
    private cryptoRepository: ICryptoRepository,
    configRepository: ISystemConfigRepository,
    private config: SystemConfig,
  ) {
    const configCore = new SystemConfigCore(configRepository);
    configCore.config$.subscribe((config) => (this.config = config));
  }

  isPasswordLoginEnabled() {
    return this.config.passwordLogin.enabled;
  }

  public getCookies(loginResponse: LoginResponseDto, authType: AuthType, isSecure: boolean) {
    const maxAge = 7 * 24 * 3600; // 7 days

    let authTypeCookie = '';
    let accessTokenCookie = '';

    if (isSecure) {
      accessTokenCookie = `${IMMICH_ACCESS_COOKIE}=${loginResponse.accessToken}; Secure; Path=/; Max-Age=${maxAge}; SameSite=Strict;`;
      authTypeCookie = `${IMMICH_AUTH_TYPE_COOKIE}=${authType}; Secure; Path=/; Max-Age=${maxAge}; SameSite=Strict;`;
    } else {
      accessTokenCookie = `${IMMICH_ACCESS_COOKIE}=${loginResponse.accessToken}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict;`;
      authTypeCookie = `${IMMICH_AUTH_TYPE_COOKIE}=${authType}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict;`;
    }
    return [accessTokenCookie, authTypeCookie];
  }

  public createLoginResponse(user: UserEntity, authType: AuthType, isSecure: boolean) {
    const payload: JwtPayloadDto = { userId: user.id, email: user.email };
    const accessToken = this.generateToken(payload);
    const response = mapLoginResponse(user, accessToken);
    const cookie = this.getCookies(response, authType, isSecure);
    return { response, cookie };
  }

  validatePassword(inputPassword: string, user: UserEntity): boolean {
    if (!user || !user.password) {
      return false;
    }
    return this.cryptoRepository.compareSync(inputPassword, user.password);
  }

  extractJwtFromHeader(headers: IncomingHttpHeaders) {
    if (!headers.authorization) {
      return null;
    }

    const [type, accessToken] = headers.authorization.split(' ');
    if (type.toLowerCase() !== 'bearer') {
      return null;
    }

    return accessToken;
  }

  extractJwtFromCookie(cookies: Record<string, string>) {
    return cookies?.[IMMICH_ACCESS_COOKIE] || null;
  }

  private generateToken(payload: JwtPayloadDto) {
    return this.cryptoRepository.signJwt({ ...payload });
  }
}
