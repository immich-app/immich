import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthDto } from 'src/dtos/auth.dto.js';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import { SystemConfigAppriseDto, SystemConfigSmtpDto } from 'src/dtos/config.dto.js';
import {
  NotificationCreateDto,
  NotificationDto,
  TemplateDto,
  TemplateResponseDto,
  TestEmailResponseDto,
} from 'src/dtos/notification.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Auth, Authenticated } from 'src/middleware/auth.guard.js';
import { EmailTemplate } from 'src/repositories/email.repository.js';
import { NotificationAdminService } from 'src/services/notification-admin.service.js';

@ApiTags(ApiTag.NotificationsAdmin)
@Controller('admin/notifications')
export class NotificationAdminController {
  constructor(private service: NotificationAdminService) {}

  @Post()
  @Authenticated({ permission: Permission.NotificationCreate, admin: true })
  @Endpoint({
    summary: 'Create a notification',
    description: 'Create a new notification for a specific user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createNotification(@Auth() auth: AuthDto, @Body() dto: NotificationCreateDto): Promise<NotificationDto> {
    return this.service.create(auth, dto);
  }

  @Post('test-email')
  @Authenticated({ permission: Permission.NotificationCreate, admin: true })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Send test email',
    description: 'Send a test email using the provided SMTP configuration.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  sendTestEmailAdmin(@Auth() auth: AuthDto, @Body() dto: SystemConfigSmtpDto): Promise<TestEmailResponseDto> {
    return this.service.sendTestEmail(auth.user.id, dto);
  }

  @Post('test-apprise')
  @Authenticated({ permission: Permission.NotificationCreate, admin: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Test Apprise connection',
    description: 'Check that the Apprise API server can be reached with the provided login, without sending anything.',
    history: new HistoryBuilder().added('v4.0.0').beta('v4.0.0'),
  })
  sendTestAppriseAdmin(@Body() dto: SystemConfigAppriseDto): Promise<void> {
    return this.service.sendTestApprise(dto);
  }

  @Post('templates/:name')
  @Authenticated({ permission: Permission.NotificationCreate, admin: true })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Render email template',
    description: 'Retrieve a preview of the provided email template.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getNotificationTemplateAdmin(
    @Auth() auth: AuthDto,
    @Param('name') name: EmailTemplate,
    @Body() dto: TemplateDto,
  ): Promise<TemplateResponseDto> {
    return this.service.getTemplate(name, dto.template);
  }
}
