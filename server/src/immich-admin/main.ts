import { LogLevel } from '@app/infra/entities';
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

process.env.LOG_LEVEL = LogLevel.WARN;

export async function bootstrap() {
  await CommandFactory.run(AppModule);
}
