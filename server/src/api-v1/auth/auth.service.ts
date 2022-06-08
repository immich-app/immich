import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {UserEntity} from '../user/entities/user.entity';
import {LoginCredentialDto} from './dto/login-credential.dto';
import {ImmichJwtService} from '../../modules/immich-auth/immich-jwt.service';
import {SignUpDto} from './dto/sign-up.dto';
import {OAuthAccessTokenDto} from "./dto/o-auth-access-token.dto";
import { ImmichOauth2Service } from '../../modules/immich-auth/immich-oauth2.service';
import { mapUser, User } from '../user/response-dto/user';
import {AuthUserDto} from "../../decorators/auth-user.decorator";


@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        private immichJwtService: ImmichJwtService,
        private immichOauth2Service: ImmichOauth2Service,
    ) {}

    public async loginParams() {

        const params = {
            localAuth: true,
            oauth2: false,
            discoveryUrl: null,
            clientId: null,
        };

        if (process.env.OAUTH2_ENABLE === 'true') {
            params.oauth2 = true;
            params.discoveryUrl = process.env.OAUTH2_DISCOVERY_URL;
            params.clientId = process.env.OAUTH2_CLIENT_ID;
        }

        if (process.env.LOCAL_USERS_DISABLE === 'true') {
            params.localAuth = false;
        }

        return params;

    }

    async validateToken(authUser: AuthUserDto) {
        const user = await this.userRepository.findOne({ where: { email: authUser.email } });

        return {
            authStatus: true,
            user: mapUser(user),
        };
    }

    public async adminSignUp(signUpCredential: SignUpDto): Promise<User> {
        if (process.env.LOCAL_USERS_DISABLE === 'true') throw new BadRequestException("Local users not allowed!");

        try {
            const adminUser = await this.immichJwtService.signUpAdmin(signUpCredential.email, signUpCredential.password, signUpCredential.firstName, signUpCredential.lastName);
            return mapUser(adminUser);
        } catch (e) {
            Logger.error(`Failed to register new admin user: ${e}`, 'AUTH');
            throw new InternalServerErrorException('Failed to register new admin user');
        }
    }

    public async login(loginCredential: LoginCredentialDto) {
        if (process.env.LOCAL_USERS_DISABLE === 'true') throw new BadRequestException("Local users not allowed!");

        return this.immichJwtService.validate(loginCredential.email, loginCredential.password);
    }

}
