import { Metrics, MetricsService, SystemConfigMetricsDto } from '@app/domain';
import { Body, Controller, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('Metrics')
@Controller('metrics')
@Authenticated()
@UseValidation()
export class MetricsController {
  constructor(private service: MetricsService) {}

  @Put()
  getMetrics(@Body() dto: SystemConfigMetricsDto): Promise<Partial<Metrics>> {
    return this.service.getMetrics(dto);
  }
}
