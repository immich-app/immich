import { SystemConfig } from '@app/infra/db/entities';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AuthType, AuthUserDto, ICryptoRepository, LoginResponseDto } from '../auth';
import { AuthCore } from '../auth/auth.core';
import { INITIAL_SYSTEM_CONFIG, ISystemConfigRepository } from '../system-config';
import { IUserRepository, UserCore, UserResponseDto } from '../user';
import { OAuthCallbackDto, OAuthConfigDto } from './dto';
import { OAuthCore } from './oauth.core';
import { OAuthConfigResponseDto } from './response-dto';
import { IUserTokenRepository } from '@app/domain/user-token';

@Injectable()
export class OAuthService {
  private authCore: AuthCore;
  private oauthCore: OAuthCore;
  private userCore: UserCore;

  private readonly logger = new Logger(OAuthService.name);

  constructor(
    @Inject(ICryptoRepository) cryptoRepository: ICryptoRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IUserRepository) userRepository: IUserRepository,
    @Inject(IUserTokenRepository) userTokenRepository: IUserTokenRepository,
    @Inject(INITIAL_SYSTEM_CONFIG) initialConfig: SystemConfig,
  ) {
    this.authCore = new AuthCore(cryptoRepository, configRepository, userTokenRepository, initialConfig);
    this.userCore = new UserCore(userRepository);
    this.oauthCore = new OAuthCore(configRepository, initialConfig);
  }

  generateConfig(dto: OAuthConfigDto): Promise<OAuthConfigResponseDto> {
    return this.oauthCore.generateConfig(dto);
  }

  async login(dto: OAuthCallbackDto, isSecure: boolean): Promise<{ response: LoginResponseDto; cookie: string[] }> {
    const profile = await this.oauthCore.callback(dto.url);

    this.logger.debug(`Logging in with OAuth: ${JSON.stringify(profile)}`);
    let user = await this.userCore.getByOAuthId(profile.sub);

    // link existing user
    if (!user) {
      const emailUser = await this.userCore.getByEmail(profile.email);
      if (emailUser) {
        user = await this.userCore.updateUser(emailUser, emailUser.id, { oauthId: profile.sub });
      }
    }

    // register new user
    if (!user) {
      if (!this.oauthCore.isAutoRegisterEnabled()) {
        this.logger.warn(
          `Unable to register ${profile.email}. To enable set OAuth Auto Register to true in admin settings.`,
        );
        throw new BadRequestException(`User does not exist and auto registering is disabled.`);
      }

      this.logger.log(`Registering new user: ${profile.email}/${profile.sub}`);
      user = await this.userCore.createUser(this.oauthCore.asUser(profile));
    }

    return this.authCore.createLoginResponse(user, AuthType.OAUTH, isSecure);
  }

  public async link(user: AuthUserDto, dto: OAuthCallbackDto): Promise<UserResponseDto> {
    const { sub: oauthId } = await this.oauthCore.callback(dto.url);
    const duplicate = await this.userCore.getByOAuthId(oauthId);
    if (duplicate && duplicate.id !== user.id) {
      this.logger.warn(`OAuth link account failed: sub is already linked to another user (${duplicate.email}).`);
      throw new BadRequestException('This OAuth account has already been linked to another user.');
    }
    return this.userCore.updateUser(user, user.id, { oauthId });
  }

  public async unlink(user: AuthUserDto): Promise<UserResponseDto> {
    return this.userCore.updateUser(user, user.id, { oauthId: '' });
  }

  public async getLogoutEndpoint(): Promise<string | null> {
    return this.oauthCore.getLogoutEndpoint();
  }
}
