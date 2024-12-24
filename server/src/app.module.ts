import { BullModule } from '@nestjs/bullmq';
import { Inject, Module, OnModuleDestroy, OnModuleInit, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, ModuleRef } from '@nestjs/core';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { OpenTelemetryModule } from 'nestjs-otel';
import { commands } from 'src/commands';
import { IWorker } from 'src/constants';
import { controllers } from 'src/controllers';
import { entities } from 'src/entities';
import { ImmichWorker } from 'src/enum';
import { IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ITelemetryRepository } from 'src/interfaces/telemetry.interface';
import { AuthGuard } from 'src/middleware/auth.guard';
import { ErrorInterceptor } from 'src/middleware/error.interceptor';
import { FileUploadInterceptor } from 'src/middleware/file-upload.interceptor';
import { GlobalExceptionFilter } from 'src/middleware/global-exception.filter';
import { LoggingInterceptor } from 'src/middleware/logging.interceptor';
import { repositories } from 'src/repositories';
import { ConfigRepository } from 'src/repositories/config.repository';
import { teardownTelemetry } from 'src/repositories/telemetry.repository';
import { services } from 'src/services';
import { DatabaseService } from 'src/services/database.service';

const common = [...services, ...repositories];

const middleware = [
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
  TypeOrmModule.forRootAsync({
    inject: [ModuleRef],
    useFactory: (moduleRef: ModuleRef) => {
      return {
        ...database.config,
        poolErrorHandler: (error) => {
          moduleRef.get(DatabaseService, { strict: false }).handleConnectionError(error);
        },
      };
    },
  }),
  TypeOrmModule.forFeature(entities),
];

class BaseModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(IWorker) private worker: ImmichWorker,
    @Inject(ILoggerRepository) logger: ILoggerRepository,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ITelemetryRepository) private telemetryRepository: ITelemetryRepository,
  ) {
    logger.setAppName(this.worker);
  }

  async onModuleInit() {
    this.telemetryRepository.setup({ repositories: repositories.map(({ useClass }) => useClass) });

    this.jobRepository.setup({ services });
    if (this.worker === ImmichWorker.MICROSERVICES) {
      this.jobRepository.startWorkers();
    }

    this.eventRepository.setup({ services });
    await this.eventRepository.emit('app.bootstrap');
  }

  async onModuleDestroy() {
    await this.eventRepository.emit('app.shutdown');
    await teardownTelemetry();
  }
}

@Module({
  imports: [...imports, ScheduleModule.forRoot()],
  controllers: [...controllers],
  providers: [...common, ...middleware, { provide: IWorker, useValue: ImmichWorker.API }],
})
export class ApiModule extends BaseModule {}

@Module({
  imports: [...imports],
  providers: [...common, { provide: IWorker, useValue: ImmichWorker.MICROSERVICES }, SchedulerRegistry],
})
export class MicroservicesModule extends BaseModule {}

@Module({
  imports: [...imports],
  providers: [...common, ...commands, SchedulerRegistry],
})
export class ImmichAdminModule {}
