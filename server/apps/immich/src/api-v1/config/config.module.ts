import { SystemConfigEntity } from '@app/database/entities/system-config.entity';
import { SystemConfigModule } from '@app/system-config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';

@Module({
  imports: [ImmichJwtModule, TypeOrmModule.forFeature([SystemConfigEntity]), SystemConfigModule],
  controllers: [ConfigController],
  providers: [ConfigService],
})
export class ConfigModule {}
