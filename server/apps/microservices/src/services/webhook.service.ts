import { AssetEntity } from '@app/database/entities/asset.entity';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export enum EventTypes {
  AssetCreationEvent = 'AssetCreationEvent',
}

@Injectable()
export class WebhookService {
  private webhookUrl: string | undefined = process.env.WEBHOOK_URL;

  constructor(
    private readonly httpCli: HttpService
  ) {}

  async createAssetCreationEvent(asset: AssetEntity) {
    if (!this.webhookUrl) return;

    try {
      const payload = this.buildWebhookPayload(EventTypes.AssetCreationEvent, asset);
      await firstValueFrom(this.httpCli.post(this.webhookUrl, payload, {
        headers: {
          'User-Agent': 'immich/webhook'
        }
      }));
    } catch (err) {
      Logger.error(`Request error ${err}`, `Webhook`);
    }
  }

  private buildWebhookPayload(eventType: EventTypes, asset: AssetEntity) {
    let payload: any = {
      type: eventType,
      asset: this.mapAsset(asset)
    };

    return payload;
  }

  private mapAsset(entity: AssetEntity): any {
    return {
      id: entity.id,
      deviceAssetId: entity.deviceAssetId,
      ownerId: entity.userId,
      deviceId: entity.deviceId,
      type: entity.type,
      originalPath: entity.originalPath,
      resizePath: entity.resizePath,
      createdAt: entity.createdAt,
      modifiedAt: entity.modifiedAt,
      isFavorite: entity.isFavorite,
      mimeType: entity.mimeType,
      webpPath: entity.webpPath,
      encodedVideoPath: entity.encodedVideoPath,
      duration: entity.duration ?? '0:00:00.00000',
    };
  }
}
