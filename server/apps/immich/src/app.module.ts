import { immichAppConfig } from '@app/common/config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UserModule } from './api-v1/user/user.module';
import { AssetModule } from './api-v1/asset/asset.module';
import { AuthModule } from './api-v1/auth/auth.module';
import { ImmichJwtModule } from './modules/immich-jwt/immich-jwt.module';
import { DeviceInfoModule } from './api-v1/device-info/device-info.module';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ServerInfoModule } from './api-v1/server-info/server-info.module';
import { BackgroundTaskModule } from './modules/background-task/background-task.module';
import { CommunicationModule } from './api-v1/communication/communication.module';
import { AlbumModule } from './api-v1/album/album.module';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduleTasksModule } from './modules/schedule-tasks/schedule-tasks.module';
import { DatabaseModule } from '@app/database';
import { JobModule } from './api-v1/job/job.module';
import { SystemConfigModule } from './api-v1/system-config/system-config.module';
import { OAuthModule } from './api-v1/oauth/oauth.module';
import { TagModule } from './api-v1/tag/tag.module';

@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),

    DatabaseModule,
    UserModule,

    AssetModule,

    AuthModule,
    OAuthModule,

    ImmichJwtModule,

    DeviceInfoModule,

    BullModule.forRootAsync({
      useFactory: async () => ({
        prefix: 'immich_bull',
        redis: {
          host: process.env.REDIS_HOSTNAME || 'immich_redis',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          db: parseInt(process.env.REDIS_DBINDEX || '0'),
          password: process.env.REDIS_PASSWORD || undefined,
          path: process.env.REDIS_SOCKET || undefined,
        },
      }),
    }),

    ServerInfoModule,

    BackgroundTaskModule,

    CommunicationModule,

    AlbumModule,

    ScheduleModule.forRoot(),

    ScheduleTasksModule,

    JobModule,

    SystemConfigModule,

    TagModule,
  ],
  controllers: [AppController],
  providers: [],
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
