import { Module, OnModuleInit } from '@nestjs/common';
import { MicroservicesService } from 'src/apps/microservices.service';
import { DomainModule } from 'src/domain/domain.module';
import { InfraModule } from 'src/infra/infra.module';

@Module({
  imports: [InfraModule, DomainModule],
  providers: [MicroservicesService],
})
export class MicroservicesModule implements OnModuleInit {
  constructor(private appService: MicroservicesService) {}

  async onModuleInit() {
    await this.appService.init();
  }
}
