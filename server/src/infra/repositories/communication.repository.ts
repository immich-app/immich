import { CommunicationEvent } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { CommunicationGateway } from '../communication.gateway';

@Injectable()
export class CommunicationRepository {
  constructor(private ws: CommunicationGateway) {}

  send(event: CommunicationEvent, userId: string, data: any) {
    this.ws.server.to(userId).emit(event, JSON.stringify(data));
  }
}
