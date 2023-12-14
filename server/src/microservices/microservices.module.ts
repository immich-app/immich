import { DomainModule } from '@app/domain';
import { InfraModule } from '@app/infra';
import { Module, OnModuleInit } from '@nestjs/common';
import { AppService } from './app.service';

@Module({
  imports: [DomainModule.register({ imports: [InfraModule] })],
  providers: [AppService],
})
export class MicroservicesModule implements OnModuleInit {
  constructor(private appService: AppService) {}

  async onModuleInit() {
    await this.appService.init();
  }
}
