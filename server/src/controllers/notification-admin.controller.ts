import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  NotificationCreateDto,
  NotificationDto,
  TemplateDto,
  TemplateResponseDto,
  TestEmailResponseDto,
} from 'src/dtos/notification.dto';
import { SystemConfigSmtpDto } from 'src/dtos/system-config.dto';
import { ApiTag } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { EmailTemplate } from 'src/repositories/email.repository';
import { NotificationAdminService } from 'src/services/notification-admin.service';

@ApiTags(ApiTag.NotificationsAdmin)
@Controller('admin/notifications')
export class NotificationAdminController {
  constructor(private service: NotificationAdminService) {}

  @Post()
  @Authenticated({ admin: true })
  @ApiBody({ description: 'Notification creation data', type: NotificationCreateDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notification created successfully', type: NotificationDto })
  @Endpoint({
    summary: 'Create a notification',
    description: 'Create a new notification for a specific user.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  createNotification(@Auth() auth: AuthDto, @Body() dto: NotificationCreateDto): Promise<NotificationDto> {
    return this.service.create(auth, dto);
  }

  @Post('test-email')
  @Authenticated({ admin: true })
  @HttpCode(HttpStatus.OK)
  @ApiBody({ description: 'SMTP configuration for test email', type: SystemConfigSmtpDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test email sent successfully', type: TestEmailResponseDto })
  @Endpoint({
    summary: 'Send test email',
    description: 'Send a test email using the provided SMTP configuration.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  sendTestEmailAdmin(@Auth() auth: AuthDto, @Body() dto: SystemConfigSmtpDto): Promise<TestEmailResponseDto> {
    return this.service.sendTestEmail(auth.user.id, dto);
  }

  @Post('templates/:name')
  @Authenticated({ admin: true })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'name', description: 'Email template name', type: String })
  @ApiBody({ description: 'Template data', type: TemplateDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully rendered email template',
    type: TemplateResponseDto,
  })
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
