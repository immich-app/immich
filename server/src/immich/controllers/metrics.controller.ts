import { Metrics, MetricsService } from '@app/domain';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('Metrics')
@Controller('metrics')
@Authenticated()
@UseValidation()
export class MetricsController {
  constructor(private service: MetricsService) {}

  @Get()
  getMetrics(): Promise<Partial<Metrics>> {
    return this.service.getMetrics();
  }
}
