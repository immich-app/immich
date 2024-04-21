import { BullModule } from '@nestjs/bullmq';
import { Module, OnModuleInit, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { OpenTelemetryModule } from 'nestjs-otel';
import { commands } from 'src/commands';
import { bullConfig, bullQueues, clsConfig, immichAppConfig } from 'src/config';
import { controllers } from 'src/controllers';
import { databaseConfig } from 'src/database.config';
import { entities } from 'src/entities';
import { AuthGuard } from 'src/middleware/auth.guard';
import { ErrorInterceptor } from 'src/middleware/error.interceptor';
import { FileUploadInterceptor } from 'src/middleware/file-upload.interceptor';
import { LoggingInterceptor } from 'src/middleware/logging.interceptor';
import { repositories } from 'src/repositories';
import { services } from 'src/services';
import { ApiService } from 'src/services/api.service';
import { MicroservicesService } from 'src/services/microservices.service';
import { otelConfig } from 'src/utils/instrumentation';

const common = [...services, ...repositories];

const middleware = [
  FileUploadInterceptor,
  { provide: APP_PIPE, useValue: new ValidationPipe({ transform: true, whitelist: true }) },
  { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
  { provide: APP_GUARD, useClass: AuthGuard },
];

const imports = [
  BullModule.forRoot(bullConfig),
  BullModule.registerQueue(...bullQueues),
  ClsModule.forRoot(clsConfig),
  ConfigModule.forRoot(immichAppConfig),
  EventEmitterModule.forRoot(),
  OpenTelemetryModule.forRoot(otelConfig),
  TypeOrmModule.forRoot(databaseConfig),
  TypeOrmModule.forFeature(entities),
];

@Module({
  imports: [...imports, ScheduleModule.forRoot()],
  controllers: [...controllers],
  providers: [...common, ...middleware],
})
export class ApiModule implements OnModuleInit {
  constructor(private service: ApiService) {}

  async onModuleInit() {
    await this.service.init();
  }
}

@Module({
  imports: [...imports],
  providers: [...common, SchedulerRegistry],
})
export class MicroservicesModule implements OnModuleInit {
  constructor(private service: MicroservicesService) {}

  async onModuleInit() {
    await this.service.init();
  }
}

@Module({
  imports: [...imports],
  providers: [...common, ...commands, SchedulerRegistry],
})
export class ImmichAdminModule {}

@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature(entities),
    OpenTelemetryModule.forRoot(otelConfig),
  ],
  controllers: [...controllers],
  providers: [...common, ...middleware, SchedulerRegistry],
})
export class AppTestModule {}
