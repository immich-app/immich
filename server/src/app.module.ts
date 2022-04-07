import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { UserModule } from './api-v1/user/user.module';
import { AssetModule } from './api-v1/asset/asset.module';
import { AuthModule } from './api-v1/auth/auth.module';
import { ImmichJwtModule } from './modules/immich-jwt/immich-jwt.module';
import { DeviceInfoModule } from './api-v1/device-info/device-info.module';
import { AppLoggerMiddleware } from './middlewares/app-logger.middleware';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { immichAppConfig } from './config/app.config';
import { BullModule } from '@nestjs/bull';
import { ImageOptimizeModule } from './modules/image-optimize/image-optimize.module';
import { ServerInfoModule } from './api-v1/server-info/server-info.module';
import { BackgroundTaskModule } from './modules/background-task/background-task.module';
import { CommunicationModule } from './api-v1/communication/communication.module';
import { SharingModule } from './api-v1/sharing/sharing.module';

@Module({
  imports: [
    ConfigModule.forRoot(immichAppConfig),
    TypeOrmModule.forRoot(databaseConfig),
    UserModule,
    AssetModule,
    AuthModule,
    ImmichJwtModule,
    DeviceInfoModule,
    BullModule.forRootAsync({
      useFactory: async () => ({
        redis: {
          host: 'immich_redis',
          port: 6379,
        },
      }),
    }),

    ImageOptimizeModule,

    ServerInfoModule,

    BackgroundTaskModule,

    CommunicationModule,

    SharingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    if (process.env.NODE_ENV == 'development') {
      consumer.apply(AppLoggerMiddleware).forRoutes('*');
    }
  }
}
