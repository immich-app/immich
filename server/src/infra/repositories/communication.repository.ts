import { AuthService, CommunicationEvent, ICommunicationRepository, serverVersion } from '@app/domain';
import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class CommunicationRepository implements OnGatewayConnection, OnGatewayDisconnect, ICommunicationRepository {
  private logger = new Logger(CommunicationRepository.name);

  constructor(private authService: AuthService) {}

  @WebSocketServer() server!: Server;

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`New websocket connection: ${client.id}`);
      const user = await this.authService.validate(client.request.headers, {});
      if (user) {
        await client.join(user.id);
        this.send(CommunicationEvent.SERVER_VERSION, user.id, serverVersion);
      } else {
        client.emit('error', 'unauthorized');
        client.disconnect();
      }
    } catch (e) {
      client.emit('error', 'unauthorized');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    await client.leave(client.nsp.name);
    this.logger.log(`Client ${client.id} disconnected from Websocket`);
  }

  send(event: CommunicationEvent, userId: string, data: any) {
    this.server.to(userId).emit(event, JSON.stringify(data));
  }

  broadcast(event: CommunicationEvent, data: any) {
    this.server.emit(event, data);
  }
}
