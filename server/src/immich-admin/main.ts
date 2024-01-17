import { LogLevel } from '@app/infra/entities';
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

export async function bootstrap() {
  process.env.LOG_LEVEL = LogLevel.WARN;
  await CommandFactory.run(AppModule);
}
