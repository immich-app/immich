import { Body, Controller, Header, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiProduces, ApiTags } from '@nestjs/swagger';
import { ContentSecurityPolicy, Endpoint, HistoryBuilder } from 'src/decorators.js';
import type { AuthDto } from 'src/dtos/auth.dto.js';
import { SystemConfigSmtpDto } from 'src/dtos/config.dto.js';
import {
  EmailTemplateParamDto,
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

  @Post('templates/:name')
  @Authenticated({ permission: Permission.NotificationCreate, admin: true })
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Render email template',
    description: 'Retrieve a preview of the provided email template.',
    history: new HistoryBuilder()
      .added('v1')
      .beta('v1')
      .stable('v2')
      .deprecated('v4.0.0', { replacementId: 'previewNotificationTemplateAdmin' }),
  })
  getNotificationTemplateAdmin(
    @Auth() auth: AuthDto,
    @Param('name') name: EmailTemplate,
    @Body() dto: TemplateDto,
  ): Promise<TemplateResponseDto> {
    return this.service.getTemplate(name, dto.template);
  }

  @Post('templates/:name/preview')
  @Authenticated({ permission: Permission.NotificationCreate, admin: true })
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ContentSecurityPolicy({
    'style-src': ["'unsafe-inline'"],
    'img-src': ['https:', 'data:'],
    'font-src': ['https:'],
    'frame-ancestors': ["'self'"],
  })
  @ApiProduces('text/html')
  @Endpoint({
    summary: 'Preview email template',
    description: 'Render the provided email template as an HTML document.',
    history: HistoryBuilder.v4().internal('v4.0.0'),
  })
  async previewNotificationTemplateAdmin(
    @Auth() auth: AuthDto,
    @Param() { name }: EmailTemplateParamDto,
    @Body() dto: TemplateDto,
  ): Promise<string> {
    const { html } = await this.service.getTemplate(name, dto.template);
    return html;
  }
}
