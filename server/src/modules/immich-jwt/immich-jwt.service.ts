import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadDto } from '../../api-v1/auth/dto/jwt-payload.dto';

@Injectable()
export class ImmichJwtService {
  constructor(private jwtService: JwtService) {}

  public async generateToken(payload: JwtPayloadDto) {
    return this.jwtService.sign({
      ...payload,
    });
  }
}
