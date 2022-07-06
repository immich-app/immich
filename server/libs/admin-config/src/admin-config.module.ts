import { Module } from '@nestjs/common';
import { AdminConfigService } from './admin-config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminConfigEntity } from '@app/database/entities/admin-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminConfigEntity])],
  providers: [AdminConfigService],
  exports: [AdminConfigService],
})
export class AdminConfigModule {}
