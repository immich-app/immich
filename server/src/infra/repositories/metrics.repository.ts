import { MetricsDto } from '@app/domain/metrics';
import { IMetricsRepository } from '@app/domain/repositories/metrics.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import os from 'os';
import { Repository } from 'typeorm';
import { AssetEntity, AssetType } from '../entities';

@Injectable()
export class MetricsRepository implements IMetricsRepository {
  constructor(@InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>) {}
  async sendMetrics(payload: Partial<MetricsDto>): Promise<void> {
    await axios.post('IMMICH-DATA-DOMAIN', payload);
  }

  getAssetCount() {
    return this.assetRepository.count();
  }

  getCpuCount() {
    return os.cpus().length;
  }

  getCpuModel() {
    return os.cpus()[0].model;
  }

  getMemory() {
    return os.totalmem();
  }

  getImageCount() {
    return this.assetRepository.count({ where: { isVisible: true, type: AssetType.IMAGE } });
  }

  getVideoCount() {
    return this.assetRepository.count({ where: { isVisible: true, type: AssetType.VIDEO } });
  }
}
