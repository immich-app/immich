import { UserEntity } from '@app/database';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayloadDto } from '../../api-v1/auth/dto/jwt-payload.dto';
import { LoginResponseDto, mapLoginResponse } from '../../api-v1/auth/response-dto/login-response.dto';
import { AuthType, IMMICH_ACCESS_COOKIE, IMMICH_AUTH_TYPE_COOKIE, jwtSecret } from '../../constants/jwt.constant';

export type JwtValidationResult = {
  status: boolean;
  userId: string | null;
};

@Injectable()
export class ImmichJwtService {
  constructor(private jwtService: JwtService) {}

  public getCookieNames() {
    return [IMMICH_ACCESS_COOKIE, IMMICH_AUTH_TYPE_COOKIE];
  }

  public getCookies(loginResponse: LoginResponseDto, authType: AuthType) {
    const maxAge = 7 * 24 * 3600; // 7 days

    const accessTokenCookie = `${IMMICH_ACCESS_COOKIE}=${loginResponse.accessToken}; HttpOnly; Path=/; Max-Age=${maxAge}`;
    const authTypeCookie = `${IMMICH_AUTH_TYPE_COOKIE}=${authType}; Path=/; Max-Age=${maxAge}`;

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

  public extractJwtFromHeader(req: Request) {
    if (
      req.headers.authorization &&
      (req.headers.authorization.split(' ')[0] === 'Bearer' || req.headers.authorization.split(' ')[0] === 'bearer')
    ) {
      const accessToken = req.headers.authorization.split(' ')[1];
      return accessToken;
    }

    return null;
  }

  public extractJwtFromCookie(req: Request) {
    return req.cookies?.[IMMICH_ACCESS_COOKIE] || null;
  }

  private async generateToken(payload: JwtPayloadDto) {
    return this.jwtService.sign({
      ...payload,
    });
  }
}
