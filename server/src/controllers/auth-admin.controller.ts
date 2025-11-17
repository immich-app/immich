import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AuthAdminService } from 'src/services/auth-admin.service';

@ApiTags(ApiTag.AuthenticationAdmin)
@Controller('admin/auth')
export class AuthAdminController {
  constructor(private service: AuthAdminService) {}
  @Post('unlink-all')
  @Authenticated({ permission: Permission.AdminAuthUnlinkAll, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Unlink all OAuth accounts',
    description: 'Unlinks all OAuth accounts associated with user accounts in the system.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  unlinkAllOAuthAccountsAdmin(@Auth() auth: AuthDto): Promise<void> {
    return this.service.unlinkAll(auth);
  }
}
