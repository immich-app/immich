import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AlbumModule } from './api-v1/album/album.module.js';
import { AssetModule } from './api-v1/asset/asset.module.js';
import { AppService } from './app.service.js';
import {
  AlbumController,
  APIKeyController,
  AppController,
  AssetController,
  AuthController,
  JobController,
  OAuthController,
  PartnerController,
  PersonController,
  SearchController,
  ServerInfoController,
  SharedLinkController,
  SystemConfigController,
  TagController,
  UserController,
} from './controllers/index.js';
import { AuthGuard } from './middlewares/auth.guard.js';

@Module({
  imports: [
    //
    DomainModule.register({ imports: [InfraModule] }),
    AssetModule,
    AlbumModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    AppController,
    AlbumController,
    APIKeyController,
    AssetController,
    AuthController,
    JobController,
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
    { provide: APP_GUARD, useExisting: AuthGuard },
    AuthGuard,
    AppService,
  ],
})
export class AppModule {}
