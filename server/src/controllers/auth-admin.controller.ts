import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AuthAdminService } from 'src/services/auth-admin.service';

@ApiTags('Auth (admin)')
@Controller('admin/auth')
export class AuthAdminController {
  constructor(private service: AuthAdminService) {}
  @Post('unlink-all')
  @Authenticated({ permission: Permission.AdminAuthUnlinkAll, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkAllOAuthAccountsAdmin(@Auth() auth: AuthDto): Promise<void> {
    return this.service.unlinkAll(auth);
  }
}
