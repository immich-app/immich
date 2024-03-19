import { Module, OnModuleInit } from '@nestjs/common';
import { DomainModule } from 'src/domain/domain.module';
import { InfraModule } from 'src/infra/infra.module';
import { AppService } from 'src/microservices/app.service';

@Module({
  imports: [InfraModule, DomainModule],
  providers: [AppService],
})
export class MicroservicesModule implements OnModuleInit {
  constructor(private appService: AppService) {}

  async onModuleInit() {
    await this.appService.init();
  }
}
