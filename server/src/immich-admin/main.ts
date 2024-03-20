import { CommandFactory } from 'nest-commander';
import { AppModule } from 'src/immich-admin/app.module';
import { LogLevel } from 'src/infra/entities/system-config.entity';

export async function bootstrap() {
  process.env.LOG_LEVEL = LogLevel.WARN;
  await CommandFactory.run(AppModule);
}
