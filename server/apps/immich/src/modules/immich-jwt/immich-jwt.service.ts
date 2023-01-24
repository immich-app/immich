import { UserEntity } from '@app/infra';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IncomingHttpHeaders } from 'http';
import { JwtPayloadDto } from '../../api-v1/auth/dto/jwt-payload.dto';
import { LoginResponseDto, mapLoginResponse } from '../../api-v1/auth/response-dto/login-response.dto';
import { AuthType, IMMICH_ACCESS_COOKIE, IMMICH_AUTH_TYPE_COOKIE, jwtSecret } from '../../constants/jwt.constant';
import { Socket } from 'socket.io';
import cookieParser from 'cookie';
import { UserResponseDto, UserService } from '@app/domain';

export type JwtValidationResult = {
  status: boolean;
  userId: string | null;
};

@Injectable()
export class ImmichJwtService {
  constructor(private jwtService: JwtService, private userService: UserService) {}

  public getCookieNames() {
    return [IMMICH_ACCESS_COOKIE, IMMICH_AUTH_TYPE_COOKIE];
  }

  public getCookies(loginResponse: LoginResponseDto, authType: AuthType, isSecure: boolean) {
    const maxAge = 7 * 24 * 3600; // 7 days

    let accessTokenCookie = '';
    let authTypeCookie = '';

    if (isSecure) {
      accessTokenCookie = `${IMMICH_ACCESS_COOKIE}=${loginResponse.accessToken}; Secure; Path=/; Max-Age=${maxAge}; SameSite=Strict;`;
      authTypeCookie = `${IMMICH_AUTH_TYPE_COOKIE}=${authType}; Secure; Path=/; Max-Age=${maxAge}; SameSite=Strict;`;
    } else {
      accessTokenCookie = `${IMMICH_ACCESS_COOKIE}=${loginResponse.accessToken}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict;`;
      authTypeCookie = `${IMMICH_AUTH_TYPE_COOKIE}=${authType}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict;`;
    }

    return [accessTokenCookie, authTypeCookie];
  }

  public async createLoginResponse(user: UserEntity): Promise<LoginResponseDto> {
    const payload = new JwtPayloadDto(user.id, user.email);
    const accessToken = await this.generateToken(payload);

    return mapLoginResponse(user, accessToken);
  }

  public async validateToken(accessToken: string): Promise<JwtValidationResult> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayloadDto>(accessToken, { secret: jwtSecret });
      return {
        userId: payload.userId,
        status: true,
      };
    } catch (e) {
      Logger.error('Error validating token from websocket request', 'ValidateWebsocketToken');
      return {
        userId: null,
        status: false,
      };
    }
  }

  public extractJwtFromHeader(headers: IncomingHttpHeaders) {
    if (!headers.authorization) {
      return null;
    }
    const [type, accessToken] = headers.authorization.split(' ');
    if (type.toLowerCase() !== 'bearer') {
      return null;
    }

    return accessToken;
  }

  public extractJwtFromCookie(cookies: Record<string, string>) {
    return cookies?.[IMMICH_ACCESS_COOKIE] || null;
  }

  public async validateSocket(client: Socket): Promise<UserResponseDto | null> {
    const headers = client.handshake.headers;
    const accessToken =
      this.extractJwtFromCookie(cookieParser.parse(headers.cookie || '')) || this.extractJwtFromHeader(headers);

    if (accessToken) {
      const { userId, status } = await this.validateToken(accessToken);
      if (userId && status) {
        const user = await this.userService.getUserById(userId).catch(() => null);
        if (user) {
          return user;
        }
      }
    }

    return null;
  }

  private async generateToken(payload: JwtPayloadDto) {
    return this.jwtService.sign({
      ...payload,
    });
  }
}
