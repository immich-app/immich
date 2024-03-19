import { Module, OnModuleInit, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainModule } from 'src/domain/domain.module';
import { AssetRepositoryV1, IAssetRepositoryV1 } from 'src/immich/api-v1/asset/asset-repository';
import { AssetController as AssetControllerV1 } from 'src/immich/api-v1/asset/asset.controller';
import { AssetService as AssetServiceV1 } from 'src/immich/api-v1/asset/asset.service';
import { AppGuard } from 'src/immich/app.guard';
import { AppService } from 'src/immich/app.service';
import { ActivityController } from 'src/immich/controllers/activity.controller';
import { AlbumController } from 'src/immich/controllers/album.controller';
import { APIKeyController } from 'src/immich/controllers/api-key.controller';
import { AppController } from 'src/immich/controllers/app.controller';
import { AssetController, AssetsController } from 'src/immich/controllers/asset.controller';
import { AuditController } from 'src/immich/controllers/audit.controller';
import { AuthController } from 'src/immich/controllers/auth.controller';
import { DownloadController } from 'src/immich/controllers/download.controller';
import { FaceController } from 'src/immich/controllers/face.controller';
import { JobController } from 'src/immich/controllers/job.controller';
import { LibraryController } from 'src/immich/controllers/library.controller';
import { OAuthController } from 'src/immich/controllers/oauth.controller';
import { PartnerController } from 'src/immich/controllers/partner.controller';
import { PersonController } from 'src/immich/controllers/person.controller';
import { SearchController } from 'src/immich/controllers/search.controller';
import { ServerInfoController } from 'src/immich/controllers/server-info.controller';
import { SharedLinkController } from 'src/immich/controllers/shared-link.controller';
import { SystemConfigController } from 'src/immich/controllers/system-config.controller';
import { TagController } from 'src/immich/controllers/tag.controller';
import { TrashController } from 'src/immich/controllers/trash.controller';
import { UserController } from 'src/immich/controllers/user.controller';
import { ErrorInterceptor } from 'src/immich/interceptors/error.interceptor';
import { FileUploadInterceptor } from 'src/immich/interceptors/file-upload.interceptor';
import { AssetEntity } from 'src/infra/entities/asset.entity';
import { ExifEntity } from 'src/infra/entities/exif.entity';
import { InfraModule } from 'src/infra/infra.module';

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
    DownloadController,
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
    TrashController,
    UserController,
    PersonController,
  ],
  providers: [
    { provide: APP_PIPE, useValue: new ValidationPipe({ transform: true, whitelist: true }) },
    { provide: APP_INTERCEPTOR, useClass: ErrorInterceptor },
    { provide: APP_GUARD, useClass: AppGuard },
    { provide: IAssetRepositoryV1, useClass: AssetRepositoryV1 },
    AppService,
    AssetServiceV1,
    FileUploadInterceptor,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private appService: AppService) {}

  async onModuleInit() {
    await this.appService.init();
  }
}
