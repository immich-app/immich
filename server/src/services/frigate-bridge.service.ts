import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

export interface FrigateEvent {
  id: string;
  camera: string;
  label: string;
  score: number;
  startTime: number;
  endTime?: number;
  thumbnail?: string;
  hasClip: boolean;
  hasSnapshot: boolean;
  zones: string[];
  currentZones: string[];
  type: 'new' | 'update' | 'end';
}

export interface FrigateBridgeConfig {
  enabled: boolean;
  frigateUrl: string;
  mqttBroker?: string;
  mqttTopic: string;
  importClips: boolean;
  importSnapshots: boolean;
  labelFilter: string[];
  minScore: number;
  targetAlbumId?: string;
  autoCreateAlbums: boolean;
}

const DEFAULT_CONFIG: FrigateBridgeConfig = {
  enabled: false,
  frigateUrl: 'http://localhost:5000',
  mqttTopic: 'frigate/events',
  importClips: true,
  importSnapshots: true,
  labelFilter: ['person', 'car', 'dog', 'cat'],
  minScore: 0.7,
  autoCreateAlbums: true,
};

@Injectable()
export class FrigateBridgeService extends BaseService {
  private config: FrigateBridgeConfig = DEFAULT_CONFIG;

  @OnJob({ name: JobName.FrigateEventImport, queue: QueueName.BackgroundTask })
  async handleEventImport({ event }: JobOf<JobName.FrigateEventImport>): Promise<JobStatus> {
    if (!this.config.enabled) {
      return JobStatus.Skipped;
    }

    const frigateEvent = event as unknown as FrigateEvent;

    try {
      // Filter by label
      if (this.config.labelFilter.length && !this.config.labelFilter.includes(frigateEvent.label)) {
        return JobStatus.Skipped;
      }

      // Filter by score
      if (frigateEvent.score < this.config.minScore) {
        return JobStatus.Skipped;
      }

      this.logger.verbose(
        `Processing Frigate event: ${frigateEvent.label} on ${frigateEvent.camera} ` +
        `(score: ${frigateEvent.score.toFixed(2)})`,
      );

      // Import snapshot if available
      if (this.config.importSnapshots && frigateEvent.hasSnapshot) {
        await this.importFrigateMedia(frigateEvent, 'snapshot');
      }

      // Import clip if available and event has ended
      if (this.config.importClips && frigateEvent.hasClip && frigateEvent.endTime) {
        await this.importFrigateMedia(frigateEvent, 'clip');
      }

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Failed to import Frigate event ${frigateEvent.id}: ${error}`);
      return JobStatus.Failed;
    }
  }

  @OnJob({ name: JobName.FrigateSyncEvents, queue: QueueName.BackgroundTask })
  async handleSyncEvents(_job: JobOf<JobName.FrigateSyncEvents>): Promise<JobStatus> {
    if (!this.config.enabled) {
      return JobStatus.Skipped;
    }

    try {
      this.logger.log('Syncing Frigate events...');

      // In full implementation:
      // 1. GET /api/events from Frigate
      // 2. Compare with already-imported events in our DB
      // 3. Import any missing events
      // const response = await fetch(`${this.config.frigateUrl}/api/events?limit=100`);
      // const events = await response.json();

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Failed to sync Frigate events: ${error}`);
      return JobStatus.Failed;
    }
  }

  private async importFrigateMedia(event: FrigateEvent, type: 'snapshot' | 'clip'): Promise<void> {
    const mediaUrl = `${this.config.frigateUrl}/api/events/${event.id}/${type}.jpg`;
    this.logger.verbose(`Importing Frigate ${type} from ${mediaUrl}`);

    // In full implementation:
    // 1. Fetch the media from Frigate API
    // 2. Create an asset in Immich via AssetService
    // 3. Tag with camera name, label, zones
    // 4. Optionally add to auto-created album per camera
  }
}
