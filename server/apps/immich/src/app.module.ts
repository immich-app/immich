import { immichAppConfig } from '@app/common/config';
import { Module } from '@nestjs/common';
import { AssetModule } from './api-v1/asset/asset.module';
import { ConfigModule } from '@nestjs/config';
import { ServerInfoModule } from './api-v1/server-info/server-info.module';
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
  DeviceInfoController,
  OAuthController,
  ShareController,
  SystemConfigController,
  UserController,
} from './controllers';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './middlewares/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),

    DomainModule.register({
      imports: [InfraModule],
    }),

    AssetModule,

    ServerInfoModule,

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
    DeviceInfoController,
    OAuthController,
    ShareController,
    SystemConfigController,
    UserController,
  ],
  providers: [{ provide: APP_GUARD, useExisting: AuthGuard }, AuthGuard],
})
export class AppModule {}
