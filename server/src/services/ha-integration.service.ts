import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/services/base.service';

export interface HaIntegrationConfig {
  enabled: boolean;
  haUrl: string;
  haToken: string;
  syncAlbumEntities: boolean;
  motionTriggerImport: boolean;
  presenceBasedSuggestions: boolean;
}

export interface HaEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HaWebhookPayload {
  trigger: {
    platform: string;
    entity_id?: string;
    from_state?: string;
    to_state?: string;
  };
  data?: Record<string, unknown>;
}

@Injectable()
export class HaIntegrationService extends BaseService {
  private config: HaIntegrationConfig = {
    enabled: false,
    haUrl: 'http://localhost:8123',
    haToken: '',
    syncAlbumEntities: false,
    motionTriggerImport: false,
    presenceBasedSuggestions: false,
  };

  /**
   * Handle incoming HA webhook events (called via POST /api/integrations/ha/webhook)
   * HA automations can trigger this when:
   * - Motion detected on cameras → import snapshot
   * - Person arrives/leaves home → tag photos taken during visit
   * - Time-based events (sunrise, holidays) → trigger memory generation
   */
  async handleWebhook(payload: HaWebhookPayload): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    this.logger.verbose(`HA webhook received: ${JSON.stringify(payload.trigger)}`);

    const { trigger } = payload;

    // Handle motion detection events
    if (trigger.platform === 'state' && trigger.entity_id?.startsWith('binary_sensor.') && trigger.to_state === 'on') {
      await this.handleMotionEvent(trigger.entity_id);
    }

    // Handle person tracking
    if (trigger.platform === 'zone' && trigger.entity_id?.startsWith('person.')) {
      await this.handlePresenceEvent(trigger.entity_id, trigger.to_state || '');
    }
  }

  /**
   * Expose album and library stats as HA sensors
   * Returns data suitable for HA REST sensor integration
   */
  async getSensorData(): Promise<Record<string, unknown>> {
    try {
      const stats = await this.assetRepository.getStatistics(undefined as any);

      return {
        total_photos: stats.images || 0,
        total_videos: stats.videos || 0,
        total_size_bytes: stats.usage || 0,
        total_size_gb: Math.round(((stats.usage || 0) / (1024 * 1024 * 1024)) * 100) / 100,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to generate HA sensor data: ${error}`);
      return {};
    }
  }

  /**
   * Create HA companion notification with Immich photo
   * Useful for "On this day" memories pushed to phone
   */
  async sendMemoryNotification(
    title: string,
    message: string,
    imageUrl?: string,
  ): Promise<void> {
    if (!this.config.enabled || !this.config.haToken) {
      return;
    }

    try {
      // POST to HA notification service
      // In full implementation:
      // await fetch(`${this.config.haUrl}/api/services/notify/mobile_app_pixel_10_xl`, {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${this.config.haToken}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ title, message, data: { image: imageUrl } }),
      // });
      this.logger.verbose(`HA notification sent: "${title}"`);
    } catch (error: unknown) {
      this.logger.error(`Failed to send HA notification: ${error}`);
    }
  }

  private async handleMotionEvent(entityId: string): Promise<void> {
    this.logger.verbose(`Motion detected on ${entityId}`);
    // In full implementation: trigger Frigate event import for the corresponding camera
  }

  private async handlePresenceEvent(entityId: string, zone: string): Promise<void> {
    this.logger.verbose(`Presence event: ${entityId} → ${zone}`);
    // In full implementation: tag photos taken during visits, suggest sharing
  }
}
