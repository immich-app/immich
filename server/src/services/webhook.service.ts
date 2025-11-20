import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { WEBHOOK_DEFAULT_BACKOFF_MS, WEBHOOK_DEFAULT_RETRIES, WEBHOOK_DEFAULT_TIMEOUT_MS } from 'src/constants';
import { OnEvent, OnJob } from 'src/decorators';
import { WebhookConfigDto, WebhookDefinitionDto } from 'src/dtos/webhook-config.dto';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { EmitEvent, EmitHandler, EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { IWebhookJob } from 'src/types';

type WebhookTarget = {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  timeout: number;
  retries: number;
  backoffMs: number;
  includeServerEvents: boolean;
  events: EmitEvent[];
};

@Injectable()
export class WebhookService {
  private readonly logger: LoggingRepository;
  private webhooks: WebhookTarget[] = [];
  private listeners: Array<{ event: EmitEvent; handler: EmitHandler<EmitEvent> }> = [];
  private initialized = false;

  constructor(
    private eventRepository: EventRepository,
    private jobRepository: JobRepository,
    logger: LoggingRepository,
  ) {
    this.logger = logger;
    this.logger.setContext(WebhookService.name);
  }

  @OnEvent({ name: 'AppBootstrap', priority: 100 })
  async onBootstrap(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.loadConfiguration();
    this.registerListeners();
    this.initialized = true;
  }

  @OnJob({ name: JobName.WebhookDelivery, queue: QueueName.BackgroundTask })
  async handleWebhookDelivery(job: IWebhookJob): Promise<JobStatus> {
    const { webhook, eventName, payload, timestamp, deliveryId } = job;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), webhook.timeout);

    try {
      const headers = this.buildHeaders(webhook.headers, eventName, timestamp, deliveryId);
      const body = JSON.stringify({
        id: deliveryId,
        eventName,
        timestamp,
        payload,
      });

      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Webhook ${webhook.id} (${webhook.url}) responded with ${response.status}: ${text || response.statusText}`,
        );
      }

      this.logger.debug(`Delivered webhook ${webhook.id} (${eventName})`);
      return JobStatus.Success;
    } catch (error) {
      this.logger.warn(`Failed to deliver webhook ${webhook.id}: ${error instanceof Error ? error.message : error}`);
      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private buildHeaders(
    configuredHeaders: Record<string, string>,
    eventName: string,
    timestamp: string,
    deliveryId: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(configuredHeaders)) {
      headers[key] = value;
    }

    const lowerKeys = new Set(Object.keys(headers).map((key) => key.toLowerCase()));
    if (!lowerKeys.has('content-type')) {
      headers['Content-Type'] = 'application/json';
    }
    if (!lowerKeys.has('x-immich-event')) {
      headers['X-Immich-Event'] = eventName;
    }
    if (!lowerKeys.has('x-immich-delivery-id')) {
      headers['X-Immich-Delivery-Id'] = deliveryId;
    }
    if (!lowerKeys.has('x-immich-timestamp')) {
      headers['X-Immich-Timestamp'] = timestamp;
    }

    return headers;
  }

  private async loadConfiguration() {
    const configPath = this.getConfigPath();
    if (!configPath) {
      this.logger.debug('Webhook configuration path not specified, skipping setup');
      this.webhooks = [];
      return;
    }

    if (!existsSync(configPath)) {
      this.logger.log(`Webhook configuration file not found at ${configPath}, skipping setup`);
      this.webhooks = [];
      return;
    }

    try {
      const content = await readFile(configPath, 'utf8');
      const parsed = JSON.parse(content);
      const dto = plainToInstance(WebhookConfigDto, parsed, { enableImplicitConversion: false });
      const errors = validateSync(dto, { whitelist: true, forbidUnknownValues: true });
      if (errors.length > 0) {
        const messages = errors.flatMap((error: ValidationError) =>
          Object.values(error.constraints ?? {}).map((message) => `${error.property}: ${message}`),
        );
        this.logger.error(`Invalid webhook configuration: ${messages.join('; ')}`);
        this.webhooks = [];
        return;
      }

      this.webhooks = dto.webhooks
        .map((definition: WebhookDefinitionDto, index: number) => this.toWebhookTarget(definition, index))
        .filter((target: WebhookTarget | null): target is WebhookTarget => target !== null);

      if (this.webhooks.length === 0) {
        this.logger.log('Webhook service loaded with no active webhooks');
      } else {
        this.logger.log(`Webhook service loaded ${this.webhooks.length} webhook(s) from ${configPath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to load webhook configuration: ${error instanceof Error ? error.message : error}`);
      this.webhooks = [];
    }
  }

  private toWebhookTarget(definition: WebhookDefinitionDto, index: number): WebhookTarget | null {
    const method = (definition.method ?? 'POST').toUpperCase();
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      this.logger.warn(`Unsupported HTTP method "${method}" for webhook ${definition.id ?? index}, skipping`);
      return null;
    }

    if (!definition.events || definition.events.length === 0) {
      this.logger.warn(`Webhook ${definition.id ?? index} does not declare any events, skipping`);
      return null;
    }

    const events = definition.events
      .map((event) => event.trim())
      .filter(Boolean)
      .map((event) => event as EmitEvent);

    if (events.length === 0) {
      this.logger.warn(`Webhook ${definition.id ?? index} does not declare any valid events, skipping`);
      return null;
    }

    const headers = definition.headers ?? {};

    return {
      id: definition.id ?? `webhook-${index + 1}`,
      url: definition.url,
      method,
      headers,
      timeout: definition.timeoutMs ?? WEBHOOK_DEFAULT_TIMEOUT_MS,
      retries: definition.retries ?? WEBHOOK_DEFAULT_RETRIES,
      backoffMs: definition.backoffMs ?? WEBHOOK_DEFAULT_BACKOFF_MS,
      includeServerEvents: definition.includeServerEvents ?? false,
      events,
    };
  }

  private registerListeners() {
    if (this.webhooks.length === 0) {
      return;
    }

    for (const webhook of this.webhooks) {
      for (const event of webhook.events) {
        const handler: EmitHandler<EmitEvent> = async (...args: unknown[]) => {
          await this.queueDelivery(webhook, event, args);
        };
        this.eventRepository.addListener(event, handler, {
          label: `${WebhookService.name}.${webhook.id}.${event}`,
          server: webhook.includeServerEvents,
        });
        this.listeners.push({ event, handler });
        this.logger.debug(`Registered webhook listener for ${event} (${webhook.id})`);
      }
    }
  }

  private async queueDelivery(webhook: WebhookTarget, event: EmitEvent, args: unknown[]) {
    const payload = this.serializePayload(args);
    const timestamp = new Date().toISOString();
    const deliveryId = randomUUID();

    await this.jobRepository.queue({
      name: JobName.WebhookDelivery,
      data: {
        webhook: {
          id: webhook.id,
          url: webhook.url,
          method: webhook.method,
          headers: webhook.headers,
          timeout: webhook.timeout,
          retries: webhook.retries,
          backoffMs: webhook.backoffMs,
        },
        eventName: event,
        payload,
        timestamp,
        deliveryId,
      },
    });
  }

  private serializePayload(args: unknown[]) {
    if (args.length === 0) {
      return null;
    }

    const payload = args.length === 1 ? args[0] : args;

    try {
      return JSON.parse(
        JSON.stringify(payload, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)),
      );
    } catch (error) {
      this.logger.warn(`Failed to serialize payload for webhook: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  private getConfigPath(): string | null {
    return process.env.IMMICH_WEBHOOKS_CONFIG || null;
  }
}
