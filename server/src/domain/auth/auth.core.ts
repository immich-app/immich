import { SystemConfig, UserEntity } from '@app/infra/entities';
import { ICryptoRepository } from '../crypto/crypto.repository';
import { ISystemConfigRepository } from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import { IUserTokenRepository, UserTokenCore } from '../user-token';
import { AuthType, IMMICH_ACCESS_COOKIE, IMMICH_AUTH_TYPE_COOKIE } from './auth.constant';
import { LoginResponseDto, mapLoginResponse } from './response-dto';

export interface LoginDetails {
  isSecure: boolean;
  clientIp: string;
  deviceType: string;
  deviceOS: string;
}

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

  getCookies(loginResponse: LoginResponseDto, authType: AuthType, { isSecure }: LoginDetails) {
    const maxAge = 400 * 24 * 3600; // 400 days

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

  async createLoginResponse(user: UserEntity, authType: AuthType, loginDetails: LoginDetails) {
    const accessToken = await this.userTokenCore.create(user, loginDetails);
    const response = mapLoginResponse(user, accessToken);
    const cookie = this.getCookies(response, authType, loginDetails);
    return { response, cookie };
  }

  validatePassword(inputPassword: string, user: UserEntity): boolean {
    if (!user || !user.password) {
      return false;
    }
    return this.cryptoRepository.compareBcrypt(inputPassword, user.password);
  }
}
