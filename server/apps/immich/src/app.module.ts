import { immichAppConfig } from '@app/common/config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AssetModule } from './api-v1/asset/asset.module';
import { DeviceInfoModule } from './api-v1/device-info/device-info.module';
import { ConfigModule } from '@nestjs/config';
import { ServerInfoModule } from './api-v1/server-info/server-info.module';
import { BackgroundTaskModule } from './modules/background-task/background-task.module';
import { CommunicationModule } from './api-v1/communication/communication.module';
import { AlbumModule } from './api-v1/album/album.module';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduleTasksModule } from './modules/schedule-tasks/schedule-tasks.module';
import { JobModule } from './api-v1/job/job.module';
import { TagModule } from './api-v1/tag/tag.module';
import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import {
  APIKeyController,
  AuthController,
  OAuthController,
  ShareController,
  SystemConfigController,
  UserController,
} from './controllers';
import { PublicShareStrategy } from './modules/immich-auth/strategies/public-share.strategy';
import { APIKeyStrategy } from './modules/immich-auth/strategies/api-key.strategy';
import { UserAuthStrategy } from './modules/immich-auth/strategies/user-auth.strategy';

@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),

    DomainModule.register({
      imports: [InfraModule],
    }),

    AssetModule,

    DeviceInfoModule,

    ServerInfoModule,

    BackgroundTaskModule,

    CommunicationModule,

    AlbumModule,

    ScheduleModule.forRoot(),

    ScheduleTasksModule,

    JobModule,

    TagModule,
  ],
  controllers: [
    //
    AppController,
    APIKeyController,
    AuthController,
    OAuthController,
    ShareController,
    SystemConfigController,
    UserController,
  ],
  providers: [UserAuthStrategy, APIKeyStrategy, PublicShareStrategy],
})
export class AppModule implements NestModule {
  // TODO: check if consumer is needed or remove
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  configure(consumer: MiddlewareConsumer): void {
    if (process.env.NODE_ENV == 'development') {
      // consumer.apply(AppLoggerMiddleware).forRoutes('*');
    }
  }
}
