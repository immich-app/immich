import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { NotificationService } from 'src/services/notification.service';

@ApiTags('Notification')
@Controller('notification')
export class NotificationController {
  constructor(private service: NotificationService) {}

  @Post('test-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  testEmailNotification(@Auth() auth: AuthDto) {
    return this.service.handleTestEmailSetup({ id: auth.user.id });
  }
}
