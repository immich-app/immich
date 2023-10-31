import { AuthUserDto } from '@app/domain';
import {
  ActivityDto,
  ActivitySearchDto,
  ActivityService,
  ActivityCreateDto as CreateDto,
  ActivityResponseDto as ResponseDto,
  ActivityStatisticsResponseDto as StatsResponseDto,
} from '@app/domain/activity';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthUser, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Activity')
@Controller('activity')
@Authenticated()
@UseValidation()
export class ActivityController {
  constructor(private service: ActivityService) {}

  @Get()
  getActivities(@AuthUser() authUser: AuthUserDto, @Query() dto: ActivitySearchDto): Promise<ResponseDto[]> {
    return this.service.getAll(authUser, dto);
  }

  @Get('statistics')
  getActivityStatistics(@AuthUser() authUser: AuthUserDto, @Query() dto: ActivityDto): Promise<StatsResponseDto> {
    return this.service.getStatistics(authUser, dto);
  }

  @Post()
  async createActivity(
    @AuthUser() authUser: AuthUserDto,
    @Body() dto: CreateDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponseDto> {
    const { duplicate, value } = await this.service.create(authUser, dto);
    if (duplicate) {
      res.status(HttpStatus.OK);
    }
    return value;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteActivity(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(authUser, id);
  }
}
