import { SystemConfigEntity } from '@app/database';
import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImmichConfigService } from './immich-config.service';

export const INITIAL_SYSTEM_CONFIG = 'INITIAL_SYSTEM_CONFIG';

const providers: Provider[] = [
  ImmichConfigService,
  {
    provide: INITIAL_SYSTEM_CONFIG,
    inject: [ImmichConfigService],
    useFactory: async (configService: ImmichConfigService) => {
      return configService.getConfig();
    },
  },
];

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfigEntity])],
  providers: [...providers],
  exports: [...providers],
})
export class ImmichConfigModule {}
