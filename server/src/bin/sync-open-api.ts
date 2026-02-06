import { NestFactory } from '@nestjs/core';
import { ApiModule } from 'src/app.module';
import { useSwagger } from 'src/utils/misc';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule, { logger: false });
  useSwagger(app, { write: true });
  await app.close();
  console.log('OpenAPI spec written to server-openapi-specs.json');
}

void bootstrap();
