import { CommandFactory } from 'nest-commander';
import { ImmichAdminModule } from 'src/apps/immich-admin.module';
import { LogLevel } from 'src/entities/system-config.entity';

export async function bootstrapImmichAdmin() {
  process.env.LOG_LEVEL = LogLevel.WARN;
  await CommandFactory.run(ImmichAdminModule);
}
