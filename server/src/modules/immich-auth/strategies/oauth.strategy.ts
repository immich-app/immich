import {
    BadRequestException,
    Injectable, Logger, UnauthorizedException,
} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {InjectRepository} from '@nestjs/typeorm';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {Repository} from 'typeorm';
import {UserEntity} from '../../../api-v1/user/entities/user.entity';
import {JwtPayloadDto} from "../../../api-v1/auth/dto/jwt-payload.dto";
import * as util from "util";
import {ImmichOauth2Service} from "../immich-oauth2.service";

@Injectable()
export class Oauth2Strategy extends PassportStrategy(Strategy, 'oauth2') {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        private immichOauth2Service: ImmichOauth2Service,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: Buffer.from(process.env.OAUTH2_CERTIFICATE, 'base64').toString('ascii'),
            audience: process.env.OAUTH2_CLIENT_ID,
        });
    }

    async validate(payload: any) {
        Logger.verbose('Trying to validate OIDC id_token', 'OAUTH2 STRATEGY');
        return await this.immichOauth2Service.validateUserOauth(payload);
    }

}