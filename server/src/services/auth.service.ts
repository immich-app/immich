import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { parse } from 'cookie';
import { DateTime } from 'luxon';
import { IncomingHttpHeaders } from 'node:http';
import { LOGIN_URL, SALT_ROUNDS } from 'src/constants';
import { UserAdmin } from 'src/database';
import {
  AuthDto,
  ChangePasswordDto,
  LoginCredentialDto,
  LogoutResponseDto,
  SignUpDto,
  mapLoginResponse,
} from 'src/dtos/auth.dto';
import { UserAdminResponseDto, mapUserAdmin } from 'src/dtos/user.dto';
import { AuthType, ImmichCookie, ImmichHeader, ImmichQuery, Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { isGranted } from 'src/utils/access';
import { getUserAgentDetails } from 'src/utils/request';

export interface LoginDetails {
  isSecure: boolean;
  clientIp: string;
  deviceType: string;
  deviceOS: string;
  appVersion: string | null;
}

export type ValidateRequest = {
  headers: IncomingHttpHeaders;
  queryParams: Record<string, string>;
  metadata: {
    adminRoute: boolean;
    /** `false` explicitly means no permission is required, which otherwise defaults to `all` */
    permission?: Permission | false;
    uri: string;
  };
};

@Injectable()
export class AuthService extends BaseService {
  async login(dto: LoginCredentialDto, details: LoginDetails) {
    const config = await this.getConfig({ withCache: false });
    if (!config.passwordLogin.enabled) {
      throw new UnauthorizedException('Password login has been disabled');
    }

    let user = await this.userRepository.getByEmail(dto.email, { withPassword: true });
    if (user) {
      const isAuthenticated = this.validateSecret(dto.password, user.password);
      if (!isAuthenticated) {
        user = undefined;
      }
    }

    if (!user) {
      this.logger.warn(`Failed login attempt for user ${dto.email} from ip address ${details.clientIp}`);
      throw new UnauthorizedException('Incorrect email or password');
    }

    return this.createLoginResponse(user, details);
  }

  async logout(auth: AuthDto, _authType: AuthType): Promise<LogoutResponseDto> {
    if (auth.session) {
      await this.sessionRepository.delete(auth.session.id);
      await this.eventRepository.emit('SessionDelete', { sessionId: auth.session.id });
    }

    return {
      successful: true,
      redirectUri: LOGIN_URL,
    };
  }

  async changePassword(auth: AuthDto, dto: ChangePasswordDto): Promise<UserAdminResponseDto> {
    const { password, newPassword } = dto;
    const user = await this.userRepository.getByEmail(auth.user.email, { withPassword: true });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const valid = this.validateSecret(password, user.password);
    if (!valid) {
      throw new BadRequestException('Wrong password');
    }

    const hashedPassword = await this.cryptoRepository.hashBcrypt(newPassword, SALT_ROUNDS);
    const updatedUser = await this.userRepository.update(user.id, { password: hashedPassword });

    await this.eventRepository.emit('AuthChangePassword', {
      userId: user.id,
      currentSessionId: auth.session?.id,
      invalidateSessions: dto.invalidateSessions,
    });

    return mapUserAdmin(updatedUser);
  }

  async adminSignUp(dto: SignUpDto): Promise<UserAdminResponseDto> {
    const adminUser = await this.userRepository.getAdmin();
    if (adminUser) {
      throw new BadRequestException('The server already has an admin');
    }

    const admin = await this.createUser({
      isAdmin: true,
      email: dto.email,
      name: dto.name,
      password: dto.password,
    });

    return mapUserAdmin(admin);
  }

  async authenticate({ headers, queryParams, metadata }: ValidateRequest): Promise<AuthDto> {
    const authDto = await this.validate({ headers, queryParams });
    const { adminRoute, uri } = metadata;
    const requestedPermission = metadata.permission ?? Permission.All;

    if (!authDto.user.isAdmin && adminRoute) {
      this.logger.warn(`Denied access to admin only route: ${uri}`);
      throw new ForbiddenException('Forbidden');
    }

    if (
      authDto.apiKey &&
      requestedPermission !== false &&
      !isGranted({ requested: [requestedPermission], current: authDto.apiKey.permissions })
    ) {
      throw new ForbiddenException(`Missing required permission: ${requestedPermission}`);
    }

    return authDto;
  }

  private async validate({ headers, queryParams }: Omit<ValidateRequest, 'metadata'>): Promise<AuthDto> {
    const session = (headers[ImmichHeader.UserToken] ||
      headers[ImmichHeader.SessionToken] ||
      queryParams[ImmichQuery.SessionKey] ||
      this.getBearerToken(headers) ||
      this.getCookieToken(headers)) as string;
    const apiKey = (headers[ImmichHeader.ApiKey] || queryParams[ImmichQuery.ApiKey]) as string;

    if (session) {
      return this.validateSession(session, headers);
    }

    if (apiKey) {
      return this.validateApiKey(apiKey);
    }

    throw new UnauthorizedException('Authentication required');
  }

  private async validateApiKey(key: string): Promise<AuthDto> {
    const hashedKey = this.cryptoRepository.hashSha256(key);
    const apiKey = await this.apiKeyRepository.getKey(hashedKey);
    if (apiKey?.user) {
      return {
        user: apiKey.user,
        apiKey,
      };
    }

    throw new UnauthorizedException('Invalid API key');
  }

  private validateSecret(inputSecret: string, existingHash?: string | null): boolean {
    if (!existingHash) {
      return false;
    }

    return this.cryptoRepository.compareBcrypt(inputSecret, existingHash);
  }

  private async validateSession(tokenValue: string, headers: IncomingHttpHeaders): Promise<AuthDto> {
    const hashedToken = this.cryptoRepository.hashSha256(tokenValue);
    const session = await this.sessionRepository.getByToken(hashedToken);
    if (session?.user) {
      const { appVersion, deviceOS, deviceType } = getUserAgentDetails(headers);
      const now = DateTime.now();
      const updatedAt = DateTime.fromJSDate(session.updatedAt);
      const diff = now.diff(updatedAt, ['hours']);
      if (diff.hours > 1 || appVersion != session.appVersion) {
        await this.sessionRepository.update(session.id, {
          id: session.id,
          updatedAt: new Date(),
          appVersion,
          deviceOS,
          deviceType,
        });
      }

      return {
        user: session.user,
        session: {
          id: session.id,
          hasElevatedPermission: false,
        },
      };
    }

    throw new UnauthorizedException('Invalid user token');
  }

  private getBearerToken(headers: IncomingHttpHeaders): string | null {
    const [type, token] = (headers.authorization || '').split(' ');
    if (type.toLowerCase() === 'bearer') {
      return token;
    }

    return null;
  }

  private getCookieToken(headers: IncomingHttpHeaders): string | null {
    const cookies = parse(headers.cookie || '');
    return cookies[ImmichCookie.AccessToken] || null;
  }

  private async createLoginResponse(user: UserAdmin, loginDetails: LoginDetails) {
    const token = this.cryptoRepository.randomBytesAsText(32);
    const tokenHashed = this.cryptoRepository.hashSha256(token);

    await this.sessionRepository.create({
      token: tokenHashed,
      deviceOS: loginDetails.deviceOS,
      deviceType: loginDetails.deviceType,
      appVersion: loginDetails.appVersion,
      userId: user.id,
    });

    return mapLoginResponse(user, token);
  }
}
