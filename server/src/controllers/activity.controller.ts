import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  ActivityCreateDto,
  ActivityDto,
  ActivityResponseDto,
  ActivitySearchDto,
  ActivityStatisticsResponseDto,
} from 'src/dtos/activity.dto';
import { AuthDto, Permission } from 'src/dtos/auth.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { ActivityService } from 'src/services/activity.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Activity')
@Controller('activity')
export class ActivityController {
  constructor(private service: ActivityService) {}

  @Get()
  @Authenticated(Permission.ACTIVITY_READ)
  getActivities(@Auth() auth: AuthDto, @Query() dto: ActivitySearchDto): Promise<ActivityResponseDto[]> {
    return this.service.getAll(auth, dto);
  }

  @Get('statistics')
  @Authenticated(Permission.ACTIVITY_READ)
  getActivityStatistics(@Auth() auth: AuthDto, @Query() dto: ActivityDto): Promise<ActivityStatisticsResponseDto> {
    return this.service.getStatistics(auth, dto);
  }

  @Post()
  @Authenticated(Permission.ACTIVITY_CREATE)
  async createActivity(
    @Auth() auth: AuthDto,
    @Body() dto: ActivityCreateDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ActivityResponseDto> {
    const { duplicate, value } = await this.service.create(auth, dto);
    if (duplicate) {
      res.status(HttpStatus.OK);
    }
    return value;
  }

  @Delete(':id')
  @Authenticated(Permission.ACTIVITY_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteActivity(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
