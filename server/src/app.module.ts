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
import { teardownTelemetry, TelemetryRepository } from 'src/repositories/telemetry.repository';
import { WebsocketRepository } from 'src/repositories/websocket.repository';
import { services } from 'src/services';
import { AuthService } from 'src/services/auth.service';
import { CliService } from 'src/services/cli.service';
import { QueueService } from 'src/services/queue.service';
import { getKyselyConfig } from 'src/utils/database';

const common = [...repositories, ...services, GlobalExceptionFilter];

export const middleware = [
  FileUploadInterceptor,
  { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  { provide: APP_PIPE, useValue: new ValidationPipe({ transform: true, whitelist: true }) },
  { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
  { provide: APP_GUARD, useClass: AuthGuard },
];

const configRepository = new ConfigRepository();
const { bull, cls, database, otel } = configRepository.getEnv();

const imports = [
  BullModule.forRoot(bull.config),
  BullModule.registerQueue(...bull.queues),
  ClsModule.forRoot(cls.config),
  OpenTelemetryModule.forRoot(otel),
  KyselyModule.forRoot(getKyselyConfig(database.config)),
];

class BaseModule implements OnModuleInit, OnModuleDestroy {
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
  imports: [...imports, ScheduleModule.forRoot()],
  controllers: [...controllers],
  providers: [...common, ...middleware, { provide: IWorker, useValue: ImmichWorker.Api }],
})
export class ApiModule extends BaseModule {}

@Module({
  imports: [...imports],
  providers: [...common, { provide: IWorker, useValue: ImmichWorker.Microservices }, SchedulerRegistry],
})
export class MicroservicesModule extends BaseModule {}

@Module({
  imports: [...imports],
  providers: [...common, ...commandsAndQuestions, SchedulerRegistry],
})
export class ImmichAdminModule implements OnModuleDestroy {
  constructor(private service: CliService) {}

  async onModuleDestroy() {
    await this.service.cleanup();
  }
}
