import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { TemplateResponseDto, TestEmailResponseDto } from 'src/dtos/notification.dto';
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

  @Get('templates/:name')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ admin: true })
  getNotificationTemplate(@Auth() auth: AuthDto, @Param('name') name: string): Promise<TemplateResponseDto> {
    return this.service.getTemplate(name);
  }
}
