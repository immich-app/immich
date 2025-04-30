import { Body, Controller, Delete, Get, Param, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  NotificationDeleteAllDto,
  NotificationDto,
  NotificationSearchDto,
  NotificationUpdateAllDto,
  NotificationUpdateDto,
} from 'src/dtos/notification.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { NotificationService } from 'src/services/notification.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private service: NotificationService) {}

  @Get()
  @Authenticated({ permission: Permission.NOTIFICATION_READ })
  getNotifications(@Auth() auth: AuthDto, @Query() dto: NotificationSearchDto): Promise<NotificationDto[]> {
    return this.service.search(auth, dto);
  }

  @Put()
  @Authenticated({ permission: Permission.NOTIFICATION_UPDATE })
  updateNotifications(@Auth() auth: AuthDto, @Body() dto: NotificationUpdateAllDto): Promise<void> {
    return this.service.updateAll(auth, dto);
  }

  @Delete()
  @Authenticated({ permission: Permission.NOTIFICATION_DELETE })
  deleteNotifications(@Auth() auth: AuthDto, @Body() dto: NotificationDeleteAllDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.NOTIFICATION_READ })
  getNotification(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<NotificationDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.NOTIFICATION_UPDATE })
  updateNotification(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: NotificationUpdateDto,
  ): Promise<NotificationDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.NOTIFICATION_DELETE })
  deleteNotification(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
