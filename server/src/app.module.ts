import { BullModule } from '@nestjs/bullmq';
import { Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { ClsModule } from 'nestjs-cls';
import { KyselyModule } from 'nestjs-kysely';
import { OpenTelemetryModule } from 'nestjs-otel';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { commandsAndQuestions } from 'src/commands/index.js';
import { IWorker } from 'src/constants.js';
import { controllers } from 'src/controllers/index.js';
import { ImmichWorker } from 'src/enum.js';
import { MaintenanceAuthGuard } from 'src/maintenance/maintenance-auth.guard.js';
import { MaintenanceHealthRepository } from 'src/maintenance/maintenance-health.repository.js';
import { MaintenanceWebsocketRepository } from 'src/maintenance/maintenance-websocket.repository.js';
import { MaintenanceWorkerController } from 'src/maintenance/maintenance-worker.controller.js';
import { MaintenanceWorkerService } from 'src/maintenance/maintenance-worker.service.js';
import { AuthGuard } from 'src/middleware/auth.guard.js';
import { ErrorInterceptor } from 'src/middleware/error.interceptor.js';
import { FileUploadInterceptor } from 'src/middleware/file-upload.interceptor.js';
import { GlobalExceptionFilter } from 'src/middleware/global-exception.filter.js';
import { LoggingInterceptor } from 'src/middleware/logging.interceptor.js';
import { AppRepository } from 'src/repositories/app.repository.js';
import { ConfigRepository } from 'src/repositories/config.repository.js';
import { DatabaseRepository } from 'src/repositories/database.repository.js';
import { EventRepository } from 'src/repositories/event.repository.js';
import { repositories } from 'src/repositories/index.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { ProcessRepository } from 'src/repositories/process.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
import { teardownTelemetry, TelemetryRepository } from 'src/repositories/telemetry.repository.js';
import { UserRepository } from 'src/repositories/user.repository.js';
import { WebsocketRepository } from 'src/repositories/websocket.repository.js';
import { AuthService } from 'src/services/auth.service.js';
import { CliService } from 'src/services/cli.service.js';
import { DatabaseBackupService } from 'src/services/database-backup.service.js';
import { services } from 'src/services/index.js';
import { QueueService } from 'src/services/queue.service.js';
import { getKyselyConfig } from 'src/utils/database.js';
import { configureUserAgent } from 'src/utils/fetch.js';

const common = [...repositories, ...services, GlobalExceptionFilter];

const commonMiddleware = [
  { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  { provide: APP_PIPE, useClass: ZodValidationPipe },
  { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
];

const apiMiddleware = [FileUploadInterceptor, ...commonMiddleware, { provide: APP_GUARD, useClass: AuthGuard }];

const configRepository = new ConfigRepository();
const { bull, cls, database, otel } = configRepository.getEnv();

const commonImports = [
  ClsModule.forRoot(cls.config),
  KyselyModule.forRoot(getKyselyConfig(database.config)),
  OpenTelemetryModule.forRoot(otel),
];

const bullImports = [BullModule.forRoot(bull.config), BullModule.registerQueue(...bull.queues)];

// eslint-disable-next-line unicorn/no-top-level-side-effects
configureUserAgent();

export class BaseModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(IWorker) private worker: ImmichWorker,
    logger: LoggingRepository,
    private authService: AuthService,
    private eventRepository: EventRepository,
    private queueService: QueueService,
    private telemetryRepository: TelemetryRepository,
    private websocketRepository: WebsocketRepository,
  ) {
    logger.setAppName(this.worker);
  }

  async onModuleInit() {
    this.telemetryRepository.setup({ repositories });

    this.queueService.setServices(services);

    this.websocketRepository.setAuthFn(async (client) =>
      this.authService.authenticate({
        headers: client.request.headers,
        queryParams: {},
        metadata: { adminRoute: false, sharedLinkRoute: false, uri: '/api/socket.io' },
      }),
    );

    this.eventRepository.setup({ services });
    await this.eventRepository.emit('AppBootstrap');
  }

  async onModuleDestroy() {
    await this.eventRepository.emit('AppShutdown');
    await teardownTelemetry();
  }
}

@Module({
  imports: [...bullImports, ...commonImports, ScheduleModule.forRoot()],
  controllers: [...controllers],
  providers: [...common, ...apiMiddleware, { provide: IWorker, useValue: ImmichWorker.Api }],
})
export class ApiModule extends BaseModule {}

@Module({
  imports: [...commonImports],
  controllers: [MaintenanceWorkerController],
  providers: [
    ConfigRepository,
    LoggingRepository,
    StorageRepository,
    ProcessRepository,
    DatabaseRepository,
    UserRepository,
    SystemMetadataRepository,
    AppRepository,
    MaintenanceHealthRepository,
    MaintenanceWebsocketRepository,
    DatabaseBackupService,
    MaintenanceWorkerService,
    ...commonMiddleware,
    { provide: APP_GUARD, useClass: MaintenanceAuthGuard },
    { provide: IWorker, useValue: ImmichWorker.Maintenance },
  ],
})
export class MaintenanceModule {
  constructor(
    @Inject(IWorker) private worker: ImmichWorker,
    logger: LoggingRepository,
    private maintenanceWorkerService: MaintenanceWorkerService,
  ) {
    logger.setAppName(this.worker);
  }

  async onModuleInit() {
    await this.maintenanceWorkerService.init();
  }
}

@Module({
  imports: [...bullImports, ...commonImports],
  providers: [...common, { provide: IWorker, useValue: ImmichWorker.Microservices }, SchedulerRegistry],
})
export class MicroservicesModule extends BaseModule {}

@Module({
  imports: [...bullImports, ...commonImports],
  providers: [...common, ...commandsAndQuestions, SchedulerRegistry],
})
export class ImmichAdminModule implements OnModuleDestroy {
  constructor(private service: CliService) {}

  async onModuleDestroy() {
    await this.service.cleanup();
  }
}
