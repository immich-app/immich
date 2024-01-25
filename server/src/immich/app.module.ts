import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { AssetEntity, ExifEntity } from '@app/infra/entities';
import { Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetRepositoryV1, IAssetRepositoryV1 } from './api-v1/asset/asset-repository';
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
    InfraModule,
    DomainModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([AssetEntity, ExifEntity]),
  ],
  controllers: [
    ActivityController,
    AssetsController,
    AssetControllerV1,
    AssetController,
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
    { provide: IAssetRepositoryV1, useClass: AssetRepositoryV1 },
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
