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
import { AuthDto } from 'src/dtos/auth.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { ActivityService } from 'src/services/activity.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Activity')
@Controller('activity')
export class ActivityController {
  constructor(private service: ActivityService) {}

  @Get()
  @Authenticated()
  getActivities(@Auth() auth: AuthDto, @Query() dto: ActivitySearchDto): Promise<ActivityResponseDto[]> {
    return this.service.getAll(auth, dto);
  }

  @Get('statistics')
  @Authenticated()
  getActivityStatistics(@Auth() auth: AuthDto, @Query() dto: ActivityDto): Promise<ActivityStatisticsResponseDto> {
    return this.service.getStatistics(auth, dto);
  }

  @Post()
  @Authenticated()
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authenticated()
  deleteActivity(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
