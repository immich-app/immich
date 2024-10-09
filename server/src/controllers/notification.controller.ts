import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { TestEmailResponseDto } from 'src/dtos/notification.dto';
import { SystemConfigSmtpDto } from 'src/dtos/system-config.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { NotificationService } from 'src/services/notification.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private service: NotificationService) {}

  @Post('test-email')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ admin: true })
  sendTestEmail(@Auth() auth: AuthDto, @Body() dto: SystemConfigSmtpDto): Promise<TestEmailResponseDto> {
    return this.service.sendTestEmail(auth.user.id, dto);
  }
}
