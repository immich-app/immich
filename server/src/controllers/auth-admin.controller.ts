import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Unlink all OAuth accounts',
    description: 'Unlinks all OAuth accounts associated with user accounts in the system.',
  })
  unlinkAllOAuthAccountsAdmin(@Auth() auth: AuthDto): Promise<void> {
    return this.service.unlinkAll(auth);
  }
}
