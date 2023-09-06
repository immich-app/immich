import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { MetadataExtractionProcessor } from './processors/metadata-extraction.processor';

@Module({
  imports: [DomainModule.register({ imports: [InfraModule] })],
  providers: [MetadataExtractionProcessor, AppService],
})
export class MicroservicesModule {}
