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
import { mapUser, User } from '../user/response-dto/user';
import {AuthUserDto} from "../../decorators/auth-user.decorator";
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        private immichJwtService: ImmichJwtService,
        private configService: ConfigService,
    ) {}

    public async loginParams() {
        const params = {
            localAuth: true,
            oauth2: false,
            discoveryUrl: null,
            clientId: null,
        };

        if (this.configService.get<boolean>('OAUTH2_ENABLE') === true) {
            params.oauth2 = true;
            params.discoveryUrl =  this.configService.get<string>('OAUTH2_DISCOVERY_URL');
            params.clientId = this.configService.get<string>('OAUTH2_CLIENT_ID');
        }

        if (this.configService.get<boolean>('LOCAL_USERS_DISABLE') === true) {
            params.localAuth = false;
        }

        return params;

    }

    async validateToken(authUser: AuthUserDto) {
        const user = await this.userRepository.findOne({ where: { email: authUser.email } });

        return {
            authStatus: true,
            ...mapUser(user),
        };
    }

    public async adminSignUp(signUpCredential: SignUpDto): Promise<User> {
        if (this.configService.get<boolean>('LOCAL_USERS_DISABLE') === true) throw new BadRequestException("Local users not allowed!");

        try {
            const adminUser = await this.immichJwtService.signUpAdmin(signUpCredential.email, signUpCredential.password, signUpCredential.firstName, signUpCredential.lastName);
            return mapUser(adminUser);
        } catch (e) {
            Logger.error(`Failed to register new admin user: ${e}`, 'AUTH');
            throw new InternalServerErrorException('Failed to register new admin user');
        }
    }

    public async login(loginCredential: LoginCredentialDto) {
        if (this.configService.get<boolean>('LOCAL_USERS_DISABLE') === true) throw new BadRequestException("Local users not allowed!");

        return this.immichJwtService.validate(loginCredential.email, loginCredential.password);
    }

}
