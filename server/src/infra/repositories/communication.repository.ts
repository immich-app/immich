import { AuthService, Callback, CommunicationEvent, ICommunicationRepository } from '@app/domain';
import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class CommunicationRepository implements OnGatewayConnection, OnGatewayDisconnect, ICommunicationRepository {
  private logger = new Logger(CommunicationRepository.name);
  private onConnectCallbacks: Callback[] = [];

  constructor(private authService: AuthService) {}

  @WebSocketServer() server!: Server;

  addEventListener(event: 'connect', callback: Callback) {
    this.onConnectCallbacks.push(callback);
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`New websocket connection: ${client.id}`);
      const user = await this.authService.validate(client.request.headers, {});
      if (user) {
        await client.join(user.id);
        for (const callback of this.onConnectCallbacks) {
          await callback(user.id);
        }
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
    this.server.to(userId).emit(event, data);
  }

  broadcast(event: CommunicationEvent, data: any) {
    this.server.emit(event, data);
  }
}
