import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import {
  ActivityCreateDto,
  ActivityDto,
  ActivityResponseDto,
  ActivitySearchDto,
  ActivityStatisticsResponseDto,
} from 'src/dtos/activity.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { ActivityService } from 'src/services/activity.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Activities)
@Controller('activities')
export class ActivityController {
  constructor(private service: ActivityService) {}

  @Get()
  @Authenticated({ permission: Permission.ActivityRead })
  @Endpoint({
    summary: 'List all activities',
    description:
      'Returns a list of activities for the selected asset or album. The activities are returned in sorted order, with the oldest activities appearing first.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getActivities(@Auth() auth: AuthDto, @Query() dto: ActivitySearchDto): Promise<ActivityResponseDto[]> {
    return this.service.getAll(auth, dto);
  }

  @Post()
  @Authenticated({ permission: Permission.ActivityCreate })
  @Endpoint({
    summary: 'Create an activity',
    description: 'Create a like or a comment for an album, or an asset in an album.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
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

  @Get('statistics')
  @Authenticated({ permission: Permission.ActivityStatistics })
  @Endpoint({
    summary: 'Retrieve activity statistics',
    description: 'Returns the number of likes and comments for a given album or asset in an album.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  getActivityStatistics(@Auth() auth: AuthDto, @Query() dto: ActivityDto): Promise<ActivityStatisticsResponseDto> {
    return this.service.getStatistics(auth, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.ActivityDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete an activity',
    description: 'Removes a like or comment from a given album or asset in an album.',
    history: new HistoryBuilder().added('v1').beta('v1').stable('v2'),
  })
  deleteActivity(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
