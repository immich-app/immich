import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module.js';

export async function bootstrap() {
  await CommandFactory.run(AppModule, ['warn', 'error']);
}
