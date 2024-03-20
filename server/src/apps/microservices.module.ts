import { Module, OnModuleInit } from '@nestjs/common';
import { AppModule } from 'src/apps/app.module';
import { MicroservicesService } from 'src/apps/microservices.service';

@Module({
  imports: [AppModule],
  providers: [MicroservicesService],
})
export class MicroservicesModule implements OnModuleInit {
  constructor(private appService: MicroservicesService) {}

  async onModuleInit() {
    await this.appService.init();
  }
}
