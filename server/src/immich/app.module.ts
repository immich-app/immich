import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { AssetEntity } from '@app/infra/entities';
import { Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetRepository, IAssetRepository } from './api-v1/asset/asset-repository';
import { AssetController as AssetControllerV1 } from './api-v1/asset/asset.controller';
import { AssetService } from './api-v1/asset/asset.service';
import { AppGuard } from './app.guard';
import { AppService } from './app.service';
import {
  APIKeyController,
  ActivityController,
  AlbumController,
  AppController,
  AssetController,
  AssetsController,
  AuditController,
  AuthController,
  FaceController,
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
import { ErrorInterceptor, FileUploadInterceptor } from './interceptors';

@Module({
  imports: [
    //
    DomainModule.register({ imports: [InfraModule] }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([AssetEntity]),
  ],
  controllers: [
    ActivityController,
    AssetsController,
    AssetController,
    AssetControllerV1,
    AppController,
    AlbumController,
    APIKeyController,
    AuditController,
    AuthController,
    FaceController,
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
    { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
    { provide: APP_GUARD, useClass: AppGuard },
    { provide: IAssetRepository, useClass: AssetRepository },
    AppService,
    AssetService,
    FileUploadInterceptor,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private appService: AppService) {}

  async onModuleInit() {
    await this.appService.init();
  }
}
