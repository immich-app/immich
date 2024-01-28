import { Module, OnModuleInit } from '@nestjs/common';
import { DomainModule } from 'src/domain';
import { InfraModule } from 'src/infra';
import { AppService } from './app.service';

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
