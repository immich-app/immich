import { Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class AuthAdminService extends BaseService {
  async unlinkAll(_auth: AuthDto) {
    // TODO replace '' with null
    await this.userRepository.updateAll({ oauthId: '' });
  }
}
