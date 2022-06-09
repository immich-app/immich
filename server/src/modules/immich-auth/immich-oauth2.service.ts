import {BadRequestException, Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../../api-v1/user/entities/user.entity";
import {Repository} from "typeorm";
import { ImmichAuthService } from './immich-auth.service';

@Injectable()
export class ImmichOauth2Service {

  constructor(
      @InjectRepository(UserEntity)
      private userRepository: Repository<UserEntity>,
      private immichAuthService: ImmichAuthService,
  ) {}

  public async validateUserOauth(payload: any) {
    const email = payload.email;
    if (!email || email === "") throw new BadRequestException("User email not found");

    const user = await this.userRepository.findOne({ email: email });

    if (!user) {
      Logger.log(`User with email ${email} does not exist, signing up`, "OAUTH2");

      const firstName = payload.given_name || '';
      const lastName = payload.family_name || '';

      // todo is admin is checked only when user is created
      // should update to check everytime ?
      const isAdmin = !!payload?.groups.includes('immich_admin');

      return await this.immichAuthService.createUser(email, false, null, firstName, lastName, isAdmin);
    }

    const validatedUser = await this.userRepository.findOne({ email: email });
    Logger.verbose(`Validated user with email ${email}`, "OAUTH2");
    return validatedUser;
  }

}
