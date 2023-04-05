import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { ExifEntity } from '@app/infra/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorService } from './processor.service';
import { MetadataExtractionProcessor } from './processors/metadata-extraction.processor';

@Module({
  imports: [
    //
    DomainModule.register({ imports: [InfraModule] }),
    TypeOrmModule.forFeature([ExifEntity]),
  ],
  providers: [MetadataExtractionProcessor, ProcessorService],
})
export class MicroservicesModule {}
