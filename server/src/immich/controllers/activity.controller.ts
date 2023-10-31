import { AuthUserDto } from '@app/domain';
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';

import {
  ActivityDto,
  ActivityService,
  ActivityCommentDto as CommentDto,
  ActivityLikeDto as LikeDto,
  ActivityLikeStatusResponseDto as LikeResponseDto,
  ActivityResponseDto as ResponseDto,
  ActivityStatisticsResponseDto as StatsResponseDto,
} from '@app/domain/activity';
import { UUIDParamDto } from './dto/uuid-param.dto';

@ApiTags('Activity')
@Controller('activity')
@Authenticated()
@UseValidation()
export class ActivityController {
  constructor(private service: ActivityService) {}

  @Get('statistics')
  getActivityStatistics(@AuthUser() authUser: AuthUserDto, @Query() dto: ActivityDto): Promise<StatsResponseDto> {
    return this.service.getStatistics(authUser, dto);
  }

  @Get('')
  getActivities(@AuthUser() authUser: AuthUserDto, @Query() dto: ActivityDto): Promise<ResponseDto[]> {
    return this.service.getAll(authUser, dto);
  }

  @Get('like')
  getActivityLikeStatus(@AuthUser() authUser: AuthUserDto, @Query() dto: ActivityDto): Promise<LikeResponseDto> {
    return this.service.getLikeStatus(authUser, dto);
  }

  @Put('like')
  updateActivityLikeStatus(@AuthUser() authUser: AuthUserDto, @Body() dto: LikeDto): Promise<LikeResponseDto> {
    return this.service.updateLikeStatus(authUser, dto);
  }

  @Post('comment')
  addComment(@AuthUser() authUser: AuthUserDto, @Body() dto: CommentDto): Promise<ResponseDto> {
    return this.service.addComment(authUser, dto);
  }

  @Delete('comment/:id')
  deleteComment(@AuthUser() authUser: AuthUserDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.deleteComment(authUser, id);
  }
}
