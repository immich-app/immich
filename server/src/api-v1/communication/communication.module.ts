import { Module } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { CommunicationGateway } from './communication.gateway';

@Module({
  providers: [CommunicationGateway, CommunicationService]
})
export class CommunicationModule {}
