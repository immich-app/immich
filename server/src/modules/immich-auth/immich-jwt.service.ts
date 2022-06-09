import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadDto } from '../../api-v1/auth/dto/jwt-payload.dto';
import { jwtSecret } from '../../constants/jwt.constant';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../api-v1/user/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ImmichAuthService } from './immich-auth.service';
import {mapUser} from "../../api-v1/user/response-dto/user";

@Injectable()
export class ImmichJwtService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    private immichAuthService: ImmichAuthService,
  ) {}

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

  private async validateLocalUser(email: string, password: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne(
        { email: email },
        {
          select: [
            'id',
            'email',
            'password',
            'salt',
            'firstName',
            'lastName',
            'isAdmin',
            'profileImagePath',
            'isFirstLoggedIn',
            'isLocalUser',
          ],
        },
    );

    if (!user || !user.isLocalUser) throw new BadRequestException('Incorrect email or password');

    const isAuthenticated = await ImmichJwtService.validatePassword(user.password, password, user.salt);

    if (user && isAuthenticated) {
      return user;
    }

    return null;
  }

  async validate(email: string, password: string) {

    const validatedUser = await this.validateLocalUser(email, password);
    if (!validatedUser) throw new BadRequestException('Incorrect email or password');

    const payload = new JwtPayloadDto(validatedUser.id, validatedUser.email);

    return {
      accessToken: await this.generateToken(payload),
      ...mapUser(validatedUser),
    };
  }

  private static async validatePassword(hashedPassword: string, inputPassword: string, salt: string): Promise<boolean> {
    const hash = await bcrypt.hash(inputPassword, salt);
    return hash === hashedPassword;
  }

  async signUp(email: string, password: string) {
    return await this.immichAuthService.createUser(email, true, password);
  }

  async signUpAdmin(email: string, password: string, firstName: string, lastName: string) {
    return await this.immichAuthService.createAdmin(email, true, password, firstName, lastName);
  }
}