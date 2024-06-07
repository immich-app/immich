import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { SmtpVerificationDto } from 'src/dtos/notification.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { NotificationService } from 'src/services/notification.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private service: NotificationService) {}

  @Post('test-email')
  @Authenticated()
  testEmailNotification(@Auth() auth: AuthDto, @Body() dto: SmtpVerificationDto) {
    return this.service.handleTestEmailSetup(auth.user.id, dto);
  }
}
