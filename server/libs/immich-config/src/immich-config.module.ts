import { SystemConfigEntity } from '@app/database/entities/system-config.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImmichConfigService } from './immich-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfigEntity])],
  providers: [ImmichConfigService],
  exports: [ImmichConfigService],
})
export class ImmichConfigModule {}
