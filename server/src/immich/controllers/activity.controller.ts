import { AuthDto } from '@app/domain';
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
import { Auth, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Activity')
@Controller('activity')
@Authenticated()
@UseValidation()
export class ActivityController {
  constructor(private service: ActivityService) {}

  @Get()
  getActivities(@Auth() auth: AuthDto, @Query() dto: ActivitySearchDto): Promise<ResponseDto[]> {
    return this.service.getAll(auth, dto);
  }

  @Get('statistics')
  getActivityStatistics(@Auth() auth: AuthDto, @Query() dto: ActivityDto): Promise<StatsResponseDto> {
    return this.service.getStatistics(auth, dto);
  }

  @Post()
  async createActivity(
    @Auth() auth: AuthDto,
    @Body() dto: CreateDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ResponseDto> {
    const { duplicate, value } = await this.service.create(auth, dto);
    if (duplicate) {
      res.status(HttpStatus.OK);
    }
    return value;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteActivity(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
