import { Module } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigEntity } from '@app/database/entities/system-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfigEntity])],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
