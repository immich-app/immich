import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

export interface WebhookConfig {
  id: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  enabled: boolean;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookEvent =
  | 'asset.upload'
  | 'asset.delete'
  | 'asset.update'
  | 'album.create'
  | 'album.update'
  | 'album.delete'
  | 'album.share'
  | 'person.merge'
  | 'person.create'
  | 'ai.description.complete'
  | 'ai.scene_tag.complete'
  | 'library.scan.complete'
  | 'job.complete'
  | 'job.failed';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookDelivery {
  webhookId: string;
  payload: WebhookPayload;
  attempt: number;
}

@Injectable()
export class WebhookService extends BaseService {
  @OnJob({ name: JobName.WebhookDeliver, queue: QueueName.Notification })
  async handleWebhookDeliver({ webhookId, payload, attempt }: JobOf<JobName.WebhookDeliver>): Promise<JobStatus> {
    try {
      // In a full implementation, this would:
      // 1. Look up webhook config from database
      // 2. Sign the payload with HMAC-SHA256 using the webhook secret
      // 3. POST to the webhook URL with proper headers
      // 4. Handle retries with exponential backoff
      this.logger.verbose(`Delivering webhook ${webhookId}: ${payload.event} (attempt ${attempt})`);

      // Placeholder: actual HTTP delivery would go here
      // const config = await this.webhookRepository.getById(webhookId);
      // const signature = crypto.createHmac('sha256', config.secret).update(JSON.stringify(payload)).digest('hex');
      // await fetch(config.url, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'X-Immich-Signature': signature },
      //   body: JSON.stringify(payload),
      // });

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Webhook delivery failed for ${webhookId}: ${error}`);
      if (attempt < 3) {
        // Re-queue with incremented attempt
        await this.jobRepository.queue({
          name: JobName.WebhookDeliver,
          data: { webhookId, payload, attempt: attempt + 1 },
        });
      }
      return JobStatus.Failed;
    }
  }

  async dispatchWebhooks(event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // In full implementation: query all enabled webhooks subscribed to this event
    // For now, log the dispatch
    this.logger.verbose(`Webhook event: ${event}`);

    // Example: await this.jobRepository.queue({ name: JobName.WebhookDeliver, data: { webhookId, payload, attempt: 1 } });
    void payload;
  }
}
