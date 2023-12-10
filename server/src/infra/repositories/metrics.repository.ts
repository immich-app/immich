import { MetricsDto } from '@app/domain/metrics';
import { IMetricsRepository } from '@app/domain/repositories/metrics.repository';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MetricsRepository implements IMetricsRepository {
  async sendMetrics(payload: MetricsDto): Promise<void> {
    await axios.post('IMMICH-DATA-DOMAIN', payload);
  }
}
