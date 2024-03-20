import { CommandFactory } from 'nest-commander';
import { LogLevel } from 'src/entities/system-config.entity';
import { AppModule } from 'src/immich-admin/app.module';

export async function bootstrap() {
  process.env.LOG_LEVEL = LogLevel.WARN;
  await CommandFactory.run(AppModule);
}
