import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  NotificationDeleteAllDto,
  NotificationDto,
  NotificationSearchDto,
  NotificationUpdateAllDto,
  NotificationUpdateDto,
} from 'src/dtos/notification.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { NotificationService } from 'src/services/notification.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Notifications)
@Controller('notifications')
export class NotificationController {
  constructor(private service: NotificationService) {}

  @Get()
  @Authenticated({ permission: Permission.NotificationRead })
  @Endpoint({
    summary: 'Retrieve notifications',
    description: 'Retrieve a list of notifications.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getNotifications(@Auth() auth: AuthDto, @Query() dto: NotificationSearchDto): Promise<NotificationDto[]> {
    return this.service.search(auth, dto);
  }

  @Put()
  @Authenticated({ permission: Permission.NotificationUpdate })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Update notifications',
    description: 'Update a list of notifications. Allows to bulk-set the read status of notifications.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateNotifications(@Auth() auth: AuthDto, @Body() dto: NotificationUpdateAllDto): Promise<void> {
    return this.service.updateAll(auth, dto);
  }

  @Delete()
  @Authenticated({ permission: Permission.NotificationDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete notifications',
    description: 'Delete a list of notifications at once.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteNotifications(@Auth() auth: AuthDto, @Body() dto: NotificationDeleteAllDto): Promise<void> {
    return this.service.deleteAll(auth, dto);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.NotificationRead })
  @Endpoint({
    summary: 'Get a notification',
    description: 'Retrieve a specific notification identified by id.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getNotification(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<NotificationDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.NotificationUpdate })
  @Endpoint({
    summary: 'Update a notification',
    description: 'Update a specific notification to set its read status.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  updateNotification(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: NotificationUpdateDto,
  ): Promise<NotificationDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.NotificationDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a notification',
    description: 'Delete a specific notification.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteNotification(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
