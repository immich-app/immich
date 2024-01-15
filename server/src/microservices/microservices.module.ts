import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { Module, OnModuleInit } from '@nestjs/common';
import { AppService } from './app.service';

@Module({
  imports: [InfraModule, DomainModule],
  providers: [AppService],
})
export class MicroservicesModule implements OnModuleInit {
  constructor(private appService: AppService) {}

  async onModuleInit() {
    await this.appService.init();
    // This is split up to make e2e testing possible
    await this.appService.postInit();
  }
}
