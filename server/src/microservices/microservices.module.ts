import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { Module } from '@nestjs/common';
import { AppService } from './app.service';

@Module({
  imports: [DomainModule.register({ imports: [InfraModule] })],
  providers: [AppService],
})
export class MicroservicesModule {}
