import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadDto } from '../../api-v1/auth/dto/jwt-payload.dto';
import { jwtSecret } from '../../constants/jwt.constant';

@Injectable()
export class ImmichJwtService {
  constructor(private jwtService: JwtService) {}

  public async generateToken(payload: JwtPayloadDto) {
    return this.jwtService.sign({
      ...payload,
    });
  }

  public async validateToken(accessToken: string) {
    try {
      const payload = await this.jwtService.verify(accessToken, { secret: jwtSecret });
      return {
        userId: payload['userId'],
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
}
