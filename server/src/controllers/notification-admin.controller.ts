import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { TemplateDto, TemplateResponseDto, TestEmailResponseDto } from 'src/dtos/notification.dto';
import { SystemConfigSmtpDto } from 'src/dtos/system-config.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { EmailTemplate } from 'src/repositories/email.repository';
import { NotificationService } from 'src/services/notification.service';

@ApiTags('Notifications (Admin)')
@Controller('notifications/admin')
export class NotificationAdminController {
  constructor(private service: NotificationService) {}

  @Post('test-email')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ admin: true })
  sendTestEmailAdmin(@Auth() auth: AuthDto, @Body() dto: SystemConfigSmtpDto): Promise<TestEmailResponseDto> {
    return this.service.sendTestEmail(auth.user.id, dto);
  }

  @Post('templates/:name')
  @HttpCode(HttpStatus.OK)
  @Authenticated({ admin: true })
  getNotificationTemplateAdmin(
    @Auth() auth: AuthDto,
    @Param('name') name: EmailTemplate,
    @Body() dto: TemplateDto,
  ): Promise<TemplateResponseDto> {
    return this.service.getTemplate(name, dto.template);
  }
}
