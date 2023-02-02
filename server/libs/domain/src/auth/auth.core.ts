import { SystemConfig, UserEntity } from '@app/infra/db/entities';
import { ISystemConfigRepository } from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import { AuthType, IMMICH_ACCESS_COOKIE, IMMICH_AUTH_TYPE_COOKIE } from './auth.constant';
import { ICryptoRepository } from '../crypto/crypto.repository';
import { LoginResponseDto, mapLoginResponse } from './response-dto';
import { IUserTokenRepository, UserTokenCore } from '../user-token';

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
      accessTokenCookie = `${IMMICH_ACCESS_COOKIE}=${loginResponse.accessToken}; HttpOnly; Secure; Path=/; Max-Age=${maxAge}; SameSite=Lax;`;
      authTypeCookie = `${IMMICH_AUTH_TYPE_COOKIE}=${authType}; HttpOnly; Secure; Path=/; Max-Age=${maxAge}; SameSite=Lax;`;
    } else {
      accessTokenCookie = `${IMMICH_ACCESS_COOKIE}=${loginResponse.accessToken}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax;`;
      authTypeCookie = `${IMMICH_AUTH_TYPE_COOKIE}=${authType}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax;`;
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
    return this.cryptoRepository.compareBcrypt(inputPassword, user.password);
  }
}
