import { Injectable } from '@nestjs/common';
import { ObservableCallback, ObservableResult } from '@opentelemetry/api';
import { OnEvent } from 'src/decorators';
import { ImmichWorker } from 'src/enum';
import { AppMetricsRepository, AppMetricsSnapshot } from 'src/repositories/app-metrics.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { JobRepository, QueueTelemetryMetrics } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TelemetryRepository } from 'src/repositories/telemetry.repository';

const SNAPSHOT_TTL_MS = 60_000;

@Injectable()
export class AppMetricsService {
  private appSnapshot?: AppMetricsSnapshot;
  private appSnapshotAttemptedAt?: number;
  private appRefresh?: Promise<AppMetricsSnapshot | undefined>;
  private queueSnapshot?: QueueTelemetryMetrics;
  private queueSnapshotAttemptedAt?: number;
  private queueRefresh?: Promise<QueueTelemetryMetrics | undefined>;
  private registered = false;

  constructor(
    private logger: LoggingRepository,
    private configRepository: ConfigRepository,
    private telemetryRepository: TelemetryRepository,
    private appMetricsRepository: AppMetricsRepository,
    private jobRepository: JobRepository,
  ) {
    this.logger.setContext(AppMetricsService.name);
  }

  @OnEvent({ name: 'AppBootstrap' })
  onBootstrap() {
    if (this.registered) {
      return;
    }
    this.registered = true;

    switch (this.configRepository.getWorker()) {
      case ImmichWorker.Api: {
        this.registerAppGauges();
        break;
      }
      case ImmichWorker.Microservices: {
        this.registerQueueGauges();
        break;
      }
    }
  }

  private registerAppGauges() {
    this.observeAppGauge('immich.assets.total', (snapshot, result) => {
      for (const item of snapshot.asset.assetsByType) {
        result.observe(item.count, { type: item.type.toLowerCase() });
      }
    });
    this.observeAppGauge('immich.assets.storage_bytes', (snapshot, result) => {
      for (const item of snapshot.asset.assetsByType) {
        result.observe(item.storageBytes, { type: item.type.toLowerCase() });
      }
    });
    this.observeAppGauge('immich.users.assets.total', (snapshot, result) => {
      for (const item of snapshot.asset.usersByType) {
        result.observe(item.count, { user_id: item.userId, type: item.type.toLowerCase() });
      }
    });
    this.observeAppGauge('immich.users.storage_bytes', (snapshot, result) => {
      for (const item of snapshot.asset.usersByType) {
        result.observe(item.storageBytes, { user_id: item.userId, type: item.type.toLowerCase() });
      }
    });
    this.observeAppGauge('immich.search.embedding_coverage_ratio', (snapshot, result) => {
      const { eligibleAssets, embeddedAssets } = snapshot.asset.search;
      result.observe(eligibleAssets === 0 ? 1 : embeddedAssets / eligibleAssets);
    });
    this.observeAppGauge('immich.faces.total', (snapshot, result) => result.observe(snapshot.person.faces));
    this.observeAppGauge('immich.people.total', (snapshot, result) => result.observe(snapshot.person.people));
    this.observeAppGauge('immich.assets.trash.total', (snapshot, result) =>
      result.observe(snapshot.asset.state.trashAssets),
    );
    this.observeAppGauge('immich.assets.external.total', (snapshot, result) =>
      result.observe(snapshot.asset.state.externalAssets),
    );
  }

  private registerQueueGauges() {
    this.observeQueueGauge('immich.queues.jobs', (snapshot, result) => {
      for (const item of snapshot.counts) {
        result.observe(item.count, { queue: item.queue, status: item.status });
      }
    });
    this.observeQueueGauge('immich.queues.oldest_job_age_seconds', (snapshot, result) => {
      for (const item of snapshot.oldestJobAges) {
        result.observe(item.ageSeconds, { queue: item.queue, status: item.status });
      }
    });
  }

  private observeAppGauge(
    name: string,
    observeSnapshot: (snapshot: AppMetricsSnapshot, result: ObservableResult) => void,
  ) {
    const callback: ObservableCallback = async (result) => {
      const snapshot = await this.getAppSnapshot();
      if (snapshot) {
        observeSnapshot(snapshot, result);
      }
    };
    this.telemetryRepository.app.observeGauge(name, callback);
  }

  private observeQueueGauge(
    name: string,
    observeSnapshot: (snapshot: QueueTelemetryMetrics, result: ObservableResult) => void,
  ) {
    const callback: ObservableCallback = async (result) => {
      const snapshot = await this.getQueueSnapshot();
      if (snapshot) {
        observeSnapshot(snapshot, result);
      }
    };
    this.telemetryRepository.jobs.observeGauge(name, callback);
  }

  private async getAppSnapshot(): Promise<AppMetricsSnapshot | undefined> {
    if (this.appSnapshotAttemptedAt !== undefined && Date.now() - this.appSnapshotAttemptedAt < SNAPSHOT_TTL_MS) {
      return this.appSnapshot;
    }
    this.appRefresh ??= this.refreshAppSnapshot();
    try {
      return await this.appRefresh;
    } finally {
      this.appRefresh = undefined;
    }
  }

  private async refreshAppSnapshot(): Promise<AppMetricsSnapshot | undefined> {
    try {
      this.appSnapshot = await this.appMetricsRepository.getMetrics();
    } catch (error: Error | unknown) {
      this.logger.warn(`Unable to refresh app metrics snapshot: ${error instanceof Error ? error.message : error}`);
    } finally {
      this.appSnapshotAttemptedAt = Date.now();
    }
    return this.appSnapshot;
  }

  private async getQueueSnapshot(): Promise<QueueTelemetryMetrics | undefined> {
    if (this.queueSnapshotAttemptedAt !== undefined && Date.now() - this.queueSnapshotAttemptedAt < SNAPSHOT_TTL_MS) {
      return this.queueSnapshot;
    }
    this.queueRefresh ??= this.refreshQueueSnapshot();
    try {
      return await this.queueRefresh;
    } finally {
      this.queueRefresh = undefined;
    }
  }

  private async refreshQueueSnapshot(): Promise<QueueTelemetryMetrics | undefined> {
    try {
      this.queueSnapshot = await this.jobRepository.getTelemetryMetrics();
    } catch (error: Error | unknown) {
      this.logger.warn(`Unable to refresh queue metrics snapshot: ${error instanceof Error ? error.message : error}`);
    } finally {
      this.queueSnapshotAttemptedAt = Date.now();
    }
    return this.queueSnapshot;
  }
}
