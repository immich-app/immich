import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { AssetEntity } from '@app/infra/entities';
import { MiddlewareConsumer, Module, NestModule, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetRepository, IAssetRepository } from './api-v1/asset/asset-repository';
import { AssetController as AssetControllerV1 } from './api-v1/asset/asset.controller';
import { AssetService } from './api-v1/asset/asset.service';
import { TusService } from './api-v1/asset/tus.service';
import { AppGuard } from './app.guard';
import { FileUploadInterceptor } from './app.interceptor';
import { AppService } from './app.service';
import {
  APIKeyController,
  AlbumController,
  AppController,
  AssetController,
  AuditController,
  AuthController,
  JobController,
  LibraryController,
  OAuthController,
  PartnerController,
  PersonController,
  SearchController,
  ServerInfoController,
  SharedLinkController,
  SystemConfigController,
  TagController,
  UserController,
} from './controllers';
import { TusMiddleware } from './middlewares/tus.middleware';

@Module({
  imports: [
    //
    DomainModule.register({ imports: [InfraModule] }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([AssetEntity]),
  ],
  controllers: [
    AssetController,
    AssetControllerV1,
    AppController,
    AlbumController,
    APIKeyController,
    AuditController,
    AuthController,
    JobController,
    LibraryController,
    OAuthController,
    PartnerController,
    SearchController,
    ServerInfoController,
    SharedLinkController,
    SystemConfigController,
    TagController,
    UserController,
    PersonController,
  ],
  providers: [
    //
    { provide: APP_GUARD, useExisting: AppGuard },
    { provide: IAssetRepository, useClass: AssetRepository },
    AppGuard,
    AppService,
    AssetService,
    TusService,
    FileUploadInterceptor,
  ],
})
export class AppModule implements NestModule, OnModuleInit, OnModuleDestroy {
  constructor(private appService: AppService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TusMiddleware).forRoutes('asset/upload-tus', 'asset/upload-tus/*');
  }

  async onModuleInit() {
    await this.appService.init();
  }

  async onModuleDestroy() {
    await this.appService.destroy();
  }
}
