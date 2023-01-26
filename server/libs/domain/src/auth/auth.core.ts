import { SystemConfig, UserEntity } from '@app/infra/db/entities';
import { IncomingHttpHeaders } from 'http';
import { ISystemConfigRepository } from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import { AuthType, IMMICH_ACCESS_COOKIE, IMMICH_AUTH_TYPE_COOKIE } from './auth.constant';
import { ICryptoRepository } from './crypto.repository';
import { LoginResponseDto, mapLoginResponse } from './response-dto';
import { IUserTokenRepository, UserTokenCore } from '@app/domain';
import cookieParser from 'cookie';

export type JwtValidationResult = {
  status: boolean;
  userId: string | null;
};

export class AuthCore {
  private userTokenCore: UserTokenCore;
  constructor(
    private cryptoRepository: ICryptoRepository,
    configRepository: ISystemConfigRepository,
    userTokenRepository: IUserTokenRepository,
    private config: SystemConfig,
  ) {
    this.userTokenCore = new UserTokenCore(cryptoRepository, userTokenRepository);
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

  public async createLoginResponse(user: UserEntity, authType: AuthType, isSecure: boolean) {
    const accessToken = await this.userTokenCore.createToken(user);
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

  extractTokenFromHeader(headers: IncomingHttpHeaders) {
    if (!headers.authorization) {
      return this.extractTokenFromCookie(cookieParser.parse(headers.cookie || ''));
    }

    const [type, accessToken] = headers.authorization.split(' ');
    if (type.toLowerCase() !== 'bearer') {
      return null;
    }

    return accessToken;
  }

  extractTokenFromCookie(cookies: Record<string, string>) {
    return cookies?.[IMMICH_ACCESS_COOKIE] || null;
  }
}
