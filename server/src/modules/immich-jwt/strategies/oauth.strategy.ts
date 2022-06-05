import {
    ImATeapotException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException
} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {InjectRepository} from '@nestjs/typeorm';
import {Strategy} from 'passport-custom';
import {Repository} from 'typeorm';
import {AuthService} from "../../../api-v1/auth/auth.service";
import {UserEntity} from '../../../api-v1/user/entities/user.entity';
import * as util from "util";
import {validate} from "class-validator";

@Injectable()
export class Oauth2Strategy extends PassportStrategy(Strategy, 'oauth2') {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        @Inject(AuthService)
        private authService: AuthService,
    ) {
        super(async (req, callback) => {

            Logger.debug('Trying OAuth2/OIDC authentication', 'OAUTH2 STRATEGY');

            const authHeader = req.headers['authorization'];

            if (authHeader == undefined || !authHeader.startsWith("Bearer ")) {
                callback(new UnauthorizedException(), null);
                return;
            }

            const token = authHeader.substring(7, authHeader.length);

            await this.authService.validateUserOauth({
                accessToken: token,
            }).then((user) => {
                if (user && !user.isLocalUser) {
                    callback(null, user);
                } else {
                    callback(new UnauthorizedException("Cannot validate local user with OAuth2"), null);
                }
            }).catch((err) => {
                    callback(err, null);
                }
            );

        });
    }

}
