import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { JwtPayloadDto } from '../../../api-v1/auth/dto/jwt-payload.dto';
import { UserEntity } from '@app/database/entities/user.entity';
import { jwtSecret } from '../../../constants/jwt.constant';
import { ImmichJwtService } from '../immich-jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,

    private immichJwtService: ImmichJwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        immichJwtService.extractJwtFromCookie,
        immichJwtService.extractJwtFromHeader,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayloadDto) {
    const { userId } = payload;
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Failure to validate JWT payload');
    }

    return user;
  }
}
