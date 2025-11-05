import { BullModule } from '@nestjs/bullmq';
import { Inject, Module, OnModuleDestroy, OnModuleInit, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { ClsModule } from 'nestjs-cls';
import { KyselyModule } from 'nestjs-kysely';
import { OpenTelemetryModule } from 'nestjs-otel';
import { commandsAndQuestions } from 'src/commands';
import { IWorker } from 'src/constants';
import { controllers } from 'src/controllers';
import { MaintenanceWorkerController } from 'src/controllers/maintenance-worker.controller';
import { ImmichWorker } from 'src/enum';
import { AuthGuard } from 'src/middleware/auth.guard';
import { ErrorInterceptor } from 'src/middleware/error.interceptor';
import { FileUploadInterceptor } from 'src/middleware/file-upload.interceptor';
import { GlobalExceptionFilter } from 'src/middleware/global-exception.filter';
import { LoggingInterceptor } from 'src/middleware/logging.interceptor';
import { repositories } from 'src/repositories';
import { ConfigRepository } from 'src/repositories/config.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MaintenanceWorkerRepository } from 'src/repositories/maintenance-worker.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { teardownTelemetry, TelemetryRepository } from 'src/repositories/telemetry.repository';
import { WebsocketRepository } from 'src/repositories/websocket.repository';
import { services } from 'src/services';
import { AuthService } from 'src/services/auth.service';
import { CliService } from 'src/services/cli.service';
import { JobService } from 'src/services/job.service';
import { MaintenanceWorkerService } from 'src/services/maintenance-worker.service';
import { getKyselyConfig } from 'src/utils/database';

const common = [...repositories, ...services, GlobalExceptionFilter];

const commonMiddleware = [
  { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  { provide: APP_PIPE, useValue: new ValidationPipe({ transform: true, whitelist: true }) },
  { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
];

const apiMiddleware = [
  FileUploadInterceptor,
  ...commonMiddleware,
  { provide: APP_GUARD, useClass: AuthGuard },
  // -> guard for all req. (auth)
  // uses meta from @Authenticated()
];

const configRepository = new ConfigRepository();
const { bull, cls, database, otel } = configRepository.getEnv();

const commonImports = [
  ClsModule.forRoot(cls.config),
  KyselyModule.forRoot(getKyselyConfig(database.config)),
  OpenTelemetryModule.forRoot(otel),
];

const bullImports = [BullModule.forRoot(bull.config), BullModule.registerQueue(...bull.queues)];

export class BaseModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(IWorker) private worker: ImmichWorker,
    logger: LoggingRepository,
    private eventRepository: EventRepository,
    private websocketRepository: WebsocketRepository,
    private jobService: JobService,
    private telemetryRepository: TelemetryRepository,
    private authService: AuthService,
  ) {
    logger.setAppName(this.worker);
  }

  async onModuleInit() {
    this.telemetryRepository.setup({ repositories });

    this.jobService.setServices(services);

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
    SystemMetadataRepository,
    MaintenanceWorkerRepository,
    MaintenanceWorkerService,
    ...commonMiddleware,
    { provide: IWorker, useValue: ImmichWorker.Maintenance },
  ],
})
export class MaintenanceModule {
  constructor(
    @Inject(IWorker) private worker: ImmichWorker,
    logger: LoggingRepository,
  ) {
    logger.setAppName(this.worker);
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
