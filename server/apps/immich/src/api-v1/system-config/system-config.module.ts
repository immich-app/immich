import { SystemConfigEntity } from '@app/database/entities/system-config.entity';
import { immichSharedQueues } from '@app/job/constants/bull-queue-registration.constant';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImmichConfigModule } from 'libs/immich-config/src';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';

@Module({
  imports: [
    ImmichJwtModule,
    ImmichConfigModule,
    TypeOrmModule.forFeature([SystemConfigEntity]),
    BullModule.registerQueue(...immichSharedQueues),
  ],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
})
export class SystemConfigModule {}
