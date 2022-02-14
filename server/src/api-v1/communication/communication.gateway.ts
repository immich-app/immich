import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { CommunicationService } from './communication.service';
import { Socket, Server } from 'socket.io';

@WebSocketGateway()
export class CommunicationGateway implements OnGatewayConnection {
  constructor(private readonly communicationService: CommunicationService) {}
  @WebSocketServer() server: Server;
  handleConnection(client: Socket, ...args: any[]) {
    console.log('Socket IO - New connetrion ', client.id);

    this.server.emit(
      'on_connected',
      `Connection Success - hi ${client.id} - you are connecting to chat room ${client.nsp.name}`,
    );
  }
}
