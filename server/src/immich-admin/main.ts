import { CommandFactory } from 'nest-commander';
import { LogLevel } from 'src/infra/entities';
import { AppModule } from './app.module';

export async function bootstrap() {
  process.env.LOG_LEVEL = LogLevel.WARN;
  await CommandFactory.run(AppModule);
}
