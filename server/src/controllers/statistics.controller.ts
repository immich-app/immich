import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { StatisticsResponseDto } from 'src/dtos/statistics.dto';
import { ApiTag, Permission, RouteKey } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { StatisticsService } from 'src/services/statistics.service';

@ApiTags(ApiTag.Users)
@Controller(RouteKey.User)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('me/statistics')
  @Authenticated({ permission: Permission.UserRead })
  @Endpoint({
    summary: 'Get personal statistics',
    description: 'Retrieve aggregated monthly, camera, and storage statistics for the authenticated user.',
    history: new HistoryBuilder().added('v3'),
  })
  getMyStatistics(@Auth() auth: AuthDto): Promise<StatisticsResponseDto> {
    return this.statisticsService.getStatistics(auth);
  }
}
