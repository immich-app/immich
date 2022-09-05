import { AssetEntity } from '@app/database/entities/asset.entity';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WebhookService {
  private webhookUrl: string | undefined = process.env.WEBHOOK_URL;

  constructor(
    private readonly httpCli: HttpService
  ) {}

  async createAssetCreationEvent(asset: AssetEntity) {
    if (!this.webhookUrl) return;

    try {
      await firstValueFrom(this.httpCli.post(this.webhookUrl))
    } catch (err) {
      Logger.error(`Request error ${err}`, `Webhook`);
    }
  };
}
